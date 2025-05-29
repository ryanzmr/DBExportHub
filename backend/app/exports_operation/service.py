import os
import pandas as pd
from datetime import datetime
import pathlib
import gc
from typing import Tuple, Dict, Any, Optional # List was not used directly

# Updated imports:
from ..config.settings import settings
from ..database.connection import get_db_connection
from ..logging_operation.loggers import export_logger # log_execution_time is a decorator, applied where functions are defined

# Base service helpers (already correctly pointing one level up to utilities)
from ..utilities.base_file_service import (
    cleanup_excel_resources,
    handle_preview_data,
    initiate_excel_generation,
    EXCEL_ROW_LIMIT 
)

# Aliased local modules (will point to new locations)
from .db_access import ( # Was: from . import database_operations as export_db_ops
    execute_procedure as execute_export_procedure, # Ensure execute_procedure is the standardized name in db_access
    get_preview_data as get_export_preview_data,
    get_first_row_hs_code as get_export_first_row_hs_code,
    get_column_headers as get_export_column_headers,
    # get_total_row_count is used by base_file_service, ensure it's available in db_access
    fetch_data_in_chunks as fetch_export_data_in_chunks 
)
from ..excel_operation.utils import ( # Was: from . import excel_utils as export_excel_utils
    create_filename as create_export_filename,
    setup_excel_workbook as setup_export_workbook,
    create_excel_formats as create_export_excel_formats,
    write_excel_headers as write_export_excel_headers
)
from ..utilities.data_utils import process_dataframe_for_json # Was: from . import data_processing
from ..logging_operation.utils import ( # Was: from . import logging_utils
    generate_operation_id,
    # log_preview_start, # Handled by base_file_service
    # log_preview_completion, # Handled by base_file_service
    # log_preview_error, # Handled by base_file_service
    # log_excel_start, # Handled by base_file_service
    log_excel_completion, # Still needed here for final log after workbook close
    log_excel_error, # Still needed here for final log
    log_excel_progress # Used directly in the data writing loop
)
from ..utilities.operation_tracker import ( # Was: from . import operation_tracker
    register_operation,
    update_operation_progress,
    mark_operation_completed,
    is_operation_cancelled,
    # get_operation_details, # Not directly used here, but _operations_lock might be if was used
    # _operations_lock
)

# CustomJSONEncoder was re-exported by api/export.py from data_processing.
# If it's needed by this service, it should be imported from ..utilities.data_utils
# from ..utilities.data_utils import CustomJSONEncoder # Not directly used in this service logic

# log_execution_time decorator is applied to functions in their definition place, not here.

def _get_export_specific_preview_info(conn: Any, operation_id: str, db_module: Any) -> Dict[str, Any]:
    """
    Export service doesn't add extra info to the preview dict beyond what handle_preview_data provides.
    But if it did, this is where it would go.
    """
    # Example: could fetch something specific like available export formats, etc.
    # For now, returning an empty dict as export preview response matches the base.
    return {}


def preview_data(params: Any) -> Dict[str, Any]:
    """
    Generate a preview of the data based on the export parameters.
    """
    operation_id = generate_operation_id()
    register_operation(operation_id) # Pass logger if register_operation is updated to take it
    
    # Create a dictionary for db_ops_module to pass to handle_preview_data
    # This makes it explicit which functions are being used from db_access.py
    db_ops_functions = {
        "execute_procedure": execute_export_procedure,
        "get_preview_data": get_export_preview_data,
        "get_total_row_count": export_db_ops.get_total_row_count, # Assuming this exists in db_access
    }

    try:
        return handle_preview_data(
            params=params,
            operation_id=operation_id,
            logger=export_logger,
            db_ops_module=db_ops_functions, # Pass the dict of functions
            data_utils_module=data_processing, # data_processing is already data_utils
            logging_operation_utils_module=logging_utils, # logging_utils is already logging_operation.utils
            operation_tracker_util_module=operation_tracker, # operation_tracker is already utilities.operation_tracker
            db_connection_func=get_db_connection,
            get_additional_preview_info_func=None # Export doesn't have additional info like import does
        )
    except Exception as e:
        # Error logging is handled by handle_preview_data.
        raise Exception(f"[{operation_id}] Error generating export preview: {str(e)}")


def generate_excel(params: Any) -> Tuple[Optional[str], Optional[str]]:
    """
    Generate an Excel file based on the export parameters.
    """
    operation_id = generate_operation_id()
    register_operation(operation_id)

    conn = None
    workbook = None
    file_path = None
    start_time = datetime.now()

    # Create a dictionary for db_ops_module for initiate_excel_generation
    db_ops_functions_for_init = {
        "execute_procedure": execute_export_procedure,
        # Add other functions if initiate_excel_generation starts using them from db_ops_module
    }
    
    try:
        conn, record_count, _, effective_total_rows_for_excel, limit_exceeded_response = \
            initiate_excel_generation(
                params=params,
                operation_id=operation_id,
                logger=export_logger,
                db_ops_module=db_ops_functions_for_init, 
                logging_operation_utils_module=logging_utils,
                operation_tracker_util_module=operation_tracker,
                db_connection_func=get_db_connection
            )

        if limit_exceeded_response:
            conn = None 
            return limit_exceeded_response, operation_id

        first_row_hs = get_export_first_row_hs_code(conn, operation_id)
        filename = create_export_filename(params, first_row_hs, operation_type='export') 
        
        temp_dir = pathlib.Path(settings.TEMP_DIR)
        os.makedirs(temp_dir, exist_ok=True)
        file_path = str(temp_dir / filename)
        file_path = os.path.abspath(file_path)
        
        export_logger.info(f"[{operation_id}] Starting Excel file writing at {datetime.now()}, filename: {filename}")

        if is_operation_cancelled(operation_id):
            raise Exception("Operation cancelled by user before workbook creation")

        workbook = setup_export_workbook(file_path)
        worksheet = workbook.add_worksheet('Export Data')
        header_format, data_format, date_format = create_export_excel_formats(workbook)
        columns = get_export_column_headers(conn, operation_id)
        write_export_excel_headers(worksheet, columns, header_format)

        max_widths = [len(str(h)) if h else 0 for h in columns]
        min_width = 8
        padding = 1
        
        export_logger.info(f"[{operation_id}] Total rows to write to Excel: {effective_total_rows_for_excel}")

        if hasattr(conn, 'execute') and callable(getattr(conn, 'execute')):
            conn.execute("SET NOCOUNT ON")

        total_rows_written = 0
        excel_row_idx = 1 

        # Using the renamed fetch_export_data_in_chunks
        for df_chunk in fetch_export_data_in_chunks(conn, settings.DB_FETCH_BATCH_SIZE, 0, operation_id):
            if is_operation_cancelled(operation_id):
                raise Exception("Operation cancelled during Excel data writing")

            chunk_start_time = datetime.now()
            
            if df_chunk.empty: break

            rows_to_write_this_chunk = len(df_chunk)
            if total_rows_written + rows_to_write_this_chunk > effective_total_rows_for_excel:
                rows_to_write_this_chunk = effective_total_rows_for_excel - total_rows_written
                df_chunk = df_chunk.head(rows_to_write_this_chunk)

            if rows_to_write_this_chunk == 0: break

            for _, row_data in df_chunk.iterrows():
                if is_operation_cancelled(operation_id):
                     raise Exception("Operation cancelled during Excel data writing")

                for col_idx, value in enumerate(row_data):
                    cell_format_to_use = date_format if col_idx == 2 and value else data_format # Assuming Date is col 2
                    worksheet.write(excel_row_idx, col_idx, value, cell_format_to_use)
                    cell_content_length = len(str(value)) if value is not None else 0
                    if col_idx < len(max_widths):
                        max_widths[col_idx] = max(max_widths[col_idx], cell_content_length)
                excel_row_idx += 1
            
            total_rows_written += rows_to_write_this_chunk
            chunk_time_taken = (datetime.now() - chunk_start_time).total_seconds()
            update_operation_progress(operation_id, total_rows_written, effective_total_rows_for_excel)
            log_excel_progress(export_logger, operation_id, rows_to_write_this_chunk, chunk_time_taken, total_rows_written, effective_total_rows_for_excel)

            if total_rows_written >= effective_total_rows_for_excel: break
            gc.collect()

        export_logger.info(f"[{operation_id}] Applying column formats and auto-fitting columns...")
        for col_idx, width in enumerate(max_widths):
            final_width = max(min_width, width + padding)
            worksheet.set_column(col_idx, col_idx, final_width)
        export_logger.info(f"[{operation_id}] Column formatting and auto-fitting complete.")
        worksheet.freeze_panes(1, 0)
        
        # Workbook closed by cleanup_excel_resources in finally block
        total_execution_time = (datetime.now() - start_time).total_seconds()
        # Logging completion happens AFTER workbook is closed by cleanup.
        # So, we can't log here directly if workbook needs to be passed to cleanup first.
        # The current structure logs before cleanup closes workbook.
        # Let's keep it this way for now, but ideally log_excel_completion is the very last step.
        
        # Store file_path in operation_details for potential later use (e.g. download_only in import)
        # This was not in original export_service, but good for consistency.
        op_details = operation_tracker.get_operation_details(operation_id)
        if op_details:
            with operation_tracker._operations_lock: # If direct access to lock is needed
                 op_details["file_path"] = file_path


        # Log completion before closing workbook, as cleanup_excel_resources will close it.
        log_excel_completion(export_logger, operation_id, file_path, total_rows_written, total_execution_time)
        mark_operation_completed(operation_id)
        
        return file_path, operation_id

    except Exception as e:
        # Error is logged by log_excel_error
        log_excel_error(export_logger, operation_id, e)
        raise Exception(f"[{operation_id}] Error generating export Excel file: {str(e)}")
    finally:
        if workbook:
             cleanup_excel_resources(workbook, file_path, export_logger, operation_id)
        elif file_path and os.path.exists(file_path): 
             cleanup_excel_resources(None, file_path, export_logger, operation_id)

        if conn:
            try:
                conn.close()
                export_logger.info(f"[{operation_id}] Database connection closed in finally block.")
            except Exception as db_close_err:
                export_logger.error(f"[{operation_id}] Error closing database connection in finally block: {db_close_err}")
