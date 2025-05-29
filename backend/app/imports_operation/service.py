import os
import pandas as pd
from datetime import datetime
import pathlib
import gc
from typing import Tuple, Dict, Any, Optional # List was not used directly

# Updated imports:
from ..config.settings import settings
from ..database.connection import get_db_connection
from ..logging_operation.loggers import import_logger # log_execution_time is a decorator

# Base service helpers (correctly points one level up to utilities)
from ..utilities.base_file_service import (
    cleanup_excel_resources,
    handle_preview_data,
    initiate_excel_generation,
    EXCEL_ROW_LIMIT 
)

# Aliased local modules (pointing to new locations)
from .db_access import ( # Was: from . import database_operations_import as import_db_ops
    execute_procedure as execute_import_procedure,
    get_preview_data as get_import_preview_data,
    get_first_row_hs_code as get_import_first_row_hs_code,
    get_column_headers as get_import_column_headers,
    get_total_row_count as get_import_total_row_count, # Used by _get_additional_import_preview_info
    fetch_data_in_chunks as fetch_import_data_in_chunks
)
# excel_utils functions are now imported from excel_operation.utils
from ..excel_operation.utils import ( 
    create_filename, # Consolidated create_filename
    setup_excel_workbook,
    create_excel_formats,
    write_excel_headers
)
from ..utilities.data_utils import process_dataframe_for_json # Was: from . import data_processing
from ..logging_operation.utils import ( # Was: from . import logging_utils
    generate_operation_id,
    # log_preview_start, # Handled by base_file_service
    # log_preview_completion, # Handled by base_file_service
    # log_preview_error, # Handled by base_file_service
    # log_excel_start, # Handled by base_file_service
    log_excel_completion, # Still needed here for final log
    log_excel_error, # Still needed here for final log
    log_excel_progress # Used directly
)
from ..utilities.operation_tracker import ( # Was: from . import operation_tracker
    register_operation,
    update_operation_progress,
    mark_operation_completed,
    is_operation_cancelled,
    get_operation_details, 
    _operations_lock 
)

# Month names mapping - this was in original import_service.py, keeping it here if get_month_code is still used locally
# However, get_month_code was removed from import_service.py in a previous refactoring.
# If create_filename (now in excel_operation.utils) needs it, it should have its own copy or import from a shared util.
# For now, removing it as it's not used in the refactored service logic below.
# month_names = { ... }
# def get_month_code(year_month: int) -> str: ...


# Specific helper for import preview to fetch additional data for the response
def _get_additional_import_preview_info(conn: Any, operation_id: str, db_module_passed: Any) -> Dict[str, Any]:
    """Fetches headers and first_row_hs specific to import preview."""
    # db_module_passed here is actually the dict of functions we pass to handle_preview_data.
    # We should use the imported functions directly for clarity.
    headers = get_import_column_headers(conn, operation_id) # Use renamed function
    first_row_hs_list = get_import_first_row_hs_code(conn, operation_id) # Use renamed function
    return {
        "headers": headers,
        "first_row_hs": first_row_hs_list[0] if first_row_hs_list else None
    }

# log_execution_time decorator would be applied if functions were defined with 'def', not for calls.
# It's assumed to be on the FastAPI route functions in main.py or api/imports/routes.py.

def preview_data(params: Any) -> Dict[str, Any]:
    """
    Generate a preview of the data based on the import parameters.
    """
    operation_id = generate_operation_id()
    register_operation(operation_id)
    
    # Create a dictionary of db_access functions to pass to handle_preview_data
    db_ops_functions = {
        "execute_procedure": execute_import_procedure,
        "get_preview_data": get_import_preview_data,
        "get_total_row_count": get_import_total_row_count, # For total_records_for_log in base_file_service
        # These are needed by _get_additional_import_preview_info if it were to use db_module_passed
        "get_column_headers_import": get_import_column_headers, 
        "get_first_row_hs_code_import": get_import_first_row_hs_code
    }

    try:
        return handle_preview_data(
            params=params,
            operation_id=operation_id,
            logger=import_logger,
            db_ops_module=db_ops_functions, # Pass the dict of functions
            data_utils_module=data_processing, # This is now data_utils but was imported as data_processing
            logging_operation_utils_module=logging_utils,
            operation_tracker_util_module=operation_tracker,
            db_connection_func=get_db_connection,
            get_additional_preview_info_func=_get_additional_import_preview_info
        )
    except Exception as e:
        raise Exception(f"[{operation_id}] Error generating import preview: {str(e)}")


def generate_excel(params: Any) -> Tuple[Optional[str], Optional[Any]]:
    """
    Generate an Excel file based on the import parameters.
    """
    operation_id = generate_operation_id()
    register_operation(operation_id)

    conn = None
    workbook = None
    file_path = None
    start_time = datetime.now()

    db_ops_functions_for_init = {
        "execute_procedure": execute_import_procedure,
    }

    try:
        conn, record_count, _, effective_total_rows_for_excel, limit_exceeded_response = \
            initiate_excel_generation(
                params=params,
                operation_id=operation_id,
                logger=import_logger,
                db_ops_module=db_ops_functions_for_init,
                logging_operation_utils_module=logging_utils,
                operation_tracker_util_module=operation_tracker,
                db_connection_func=get_db_connection
            )

        if limit_exceeded_response:
            operation_details = get_operation_details(operation_id)
            if operation_details:
                with _operations_lock:
                    operation_details["status"] = "limit_exceeded"
                    operation_details["paused_at"] = datetime.now()
            if conn: conn.close() 
            conn = None
            return None, limit_exceeded_response

        operation_details = get_operation_details(operation_id)
        if operation_details:
            with _operations_lock:
                operation_details["total_count"] = record_count 
                if effective_total_rows_for_excel < record_count:
                    operation_details["max_rows"] = effective_total_rows_for_excel

        first_row_hs = get_import_first_row_hs_code(conn, operation_id)
        # Use the consolidated create_filename from excel_operation.utils
        filename = create_filename(params, first_row_hs, operation_type='import') 
        
        temp_dir = pathlib.Path(settings.TEMP_DIR)
        os.makedirs(temp_dir, exist_ok=True)
        file_path = str(temp_dir / filename)
        file_path = os.path.abspath(file_path)

        import_logger.info(f"🚀 [{operation_id}] Starting Excel file writing at {datetime.now()}, filename: {filename}")
        import_logger.info(f"📊 [{operation_id}] Total rows to write to Excel: {effective_total_rows_for_excel}")

        if is_operation_cancelled(operation_id):
            raise Exception("Operation cancelled by user before workbook creation")

        workbook = setup_excel_workbook(file_path) # From excel_operation.utils
        worksheet = workbook.add_worksheet("Import Data")
        header_format, data_format, date_format = create_excel_formats(workbook) # From excel_operation.utils
        headers = get_import_column_headers(conn, operation_id)
        write_excel_headers(worksheet, headers, header_format) # From excel_operation.utils
        
        max_widths = [len(str(h)) if h else 0 for h in headers]
        min_width = 8
        padding = 2
        total_rows_written = 0
        excel_row_idx = 1 

        # Use the renamed fetch_import_data_in_chunks
        data_chunk_generator = fetch_import_data_in_chunks(conn, operation_id, settings.DB_FETCH_CHUNK_SIZE_IMPORT)

        for chunk_idx, df_chunk in enumerate(data_chunk_generator, 1):
            if is_operation_cancelled(operation_id):
                raise Exception("Operation cancelled during Excel data writing")

            chunk_start_time = datetime.now()
            if df_chunk.empty: break

            rows_to_write_this_chunk = len(df_chunk)
            if total_rows_written + rows_to_write_this_chunk > effective_total_rows_for_excel:
                rows_to_write_this_chunk = effective_total_rows_for_excel - total_rows_written
                df_chunk = df_chunk.head(rows_to_write_this_chunk)

            if rows_to_write_this_chunk == 0: break
            
            values_to_write = df_chunk.values
            date_cols = [1] 
            numeric_cols = [16, 17, 19, 20, 21, 23, 28] 

            for row_values in values_to_write:
                if is_operation_cancelled(operation_id):
                     raise Exception("Operation cancelled during Excel data writing")
                
                for col_idx, value in enumerate(row_values):
                    if pd.isna(value) or value is None:
                        worksheet.write_blank(excel_row_idx, col_idx, None, data_format)
                    elif col_idx in date_cols and isinstance(value, (datetime, pd.Timestamp)):
                        worksheet.write_datetime(excel_row_idx, col_idx, value, date_format)
                    elif col_idx in numeric_cols and (isinstance(value, (int, float)) or (isinstance(value, str) and value.replace('.', '', 1).isdigit())):
                        try:
                            worksheet.write_number(excel_row_idx, col_idx, float(value) if value is not None else 0, data_format)
                        except (ValueError, TypeError):
                            worksheet.write_string(excel_row_idx, col_idx, str(value), data_format)
                    else:
                        str_value = str(value)
                        worksheet.write_string(excel_row_idx, col_idx, str_value, data_format)
                        if total_rows_written < 1000 and col_idx < len(max_widths):
                             max_widths[col_idx] = max(max_widths[col_idx], len(str_value))
                excel_row_idx +=1
            
            total_rows_written += rows_to_write_this_chunk
            chunk_time_taken = (datetime.now() - chunk_start_time).total_seconds()
            update_operation_progress(operation_id, total_rows_written, effective_total_rows_for_excel)
            log_excel_progress(import_logger, operation_id, rows_to_write_this_chunk, chunk_time_taken, total_rows_written, effective_total_rows_for_excel)

            if total_rows_written >= effective_total_rows_for_excel: break
            gc.collect()

        import_logger.info(f"[{operation_id}] Applying column formats and auto-fitting columns...")
        for col_idx, width in enumerate(max_widths):
            if col_idx == 1: col_w = 12
            elif col_idx in numeric_cols: col_w = max(width + padding, 12) # Use identified numeric_cols
            # Simplified other columns, original had very specific list
            else: col_w = min(max(width + padding, 12), 50) 
            worksheet.set_column(col_idx, col_idx, col_w)
        import_logger.info(f"[{operation_id}] Column formatting and auto-fitting complete.")
        worksheet.freeze_panes(1, 0)
        
        total_execution_time = (datetime.now() - start_time).total_seconds()
        log_excel_completion(import_logger, operation_id, file_path, total_rows_written, total_execution_time)
        
        op_details = get_operation_details(operation_id)
        if op_details:
            with _operations_lock:
                op_details["file_path"] = file_path
        
        mark_operation_completed(operation_id)
        return file_path, operation_id

    except Exception as e:
        log_excel_error(import_logger, operation_id, e)
        raise Exception(f"[{operation_id}] Error generating import Excel file: {str(e)}")
    finally:
        if workbook:
             cleanup_excel_resources(workbook, file_path, import_logger, operation_id)
        elif file_path and os.path.exists(file_path): 
             cleanup_excel_resources(None, file_path, import_logger, operation_id)

        if conn:
            try:
                conn.close()
                import_logger.info(f"[{operation_id}] Database connection closed in finally block.")
            except Exception as db_close_err:
                import_logger.error(f"[{operation_id}] Error closing database connection in finally block: {db_close_err}")
