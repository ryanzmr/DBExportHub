import os
import pandas as pd
# import numpy as np # No longer explicitly used
# import json # No longer explicitly used
from datetime import datetime
# import tempfile # No longer explicitly used
# import uuid # No longer explicitly used
import pathlib
import gc
# import threading # No longer explicitly used
from typing import List, Dict, Any, Optional, Tuple # Added Tuple

from ..config import settings
from ..database import get_db_connection
from ..logger import import_logger # Specific logger for import operations
# from .logging_utils import log_excel_completion, log_excel_error # These are now part of logging_utils module

# Import base service helpers
from .base_file_service import (
    cleanup_excel_resources,
    handle_preview_data,
    initiate_excel_generation,
    EXCEL_ROW_LIMIT # Constant from base service
)

# Import and alias modules as per instructions
from . import database_operations_import as import_db_ops
from . import excel_utils as import_excel_utils # excel_utils is now import_excel_utils for import context
from . import data_processing
from . import logging_utils
from . import operation_tracker # _operations_lock, get_operation_details are used from here

# Month names mapping for dynamic month code generation - still used by get_month_code
month_names = {
    "01": "JAN", "02": "FEB", "03": "MAR", "04": "APR", 
    "05": "MAY", "06": "JUN", "07": "JUL", "08": "AUG", 
    "09": "SEP", "10": "OCT", "11": "NOV", "12": "DEC"
}

def get_month_code(year_month: int) -> str: # Type hint added
    """
    Dynamically generate a month code (e.g., 'JAN24') from a year_month integer (e.g., 202401).
    """
    year_month_str = str(year_month)
    if len(year_month_str) >= 6:
        month = year_month_str[-2:]
        year = year_month_str[2:4]
        month_name = month_names.get(month, "UNK")
        return f"{month_name}{year}"
    return f"UNK{year_month_str[-2:] if len(year_month_str) >= 2 else '??'}"

# Specific helper for import preview to fetch additional data
def _get_additional_import_preview_info(conn: Any, operation_id: str, db_module: Any) -> Dict[str, Any]:
    """Fetches headers and first_row_hs specific to import preview."""
    headers = db_module.get_column_headers_import(conn, operation_id)
    first_row_hs_list = db_module.get_first_row_hs_code_import(conn, operation_id)
    return {
        "headers": headers,
        "first_row_hs": first_row_hs_list[0] if first_row_hs_list else None
    }

# @log_execution_time # Decorator remains
def preview_data(params: Any) -> Dict[str, Any]:
    """
    Generate a preview of the data based on the import parameters.
    Delegates most logic to handle_preview_data from base_file_service.
    """
    operation_id = logging_utils.generate_operation_id()
    operation_tracker.register_operation(operation_id)
    
    try:
        # Call the common preview handler
        preview_result = handle_preview_data(
            params=params,
            operation_id=operation_id,
            logger=import_logger,
            db_ops_module=import_db_ops, # Pass aliased import_db_ops
            data_processing_module=data_processing,
            logging_utils_module=logging_utils,
            operation_tracker_module=operation_tracker,
            db_connection_func=get_db_connection, # Pass the actual DB conneciton function
            get_additional_preview_info_func=_get_additional_import_preview_info # Pass the import-specific helper
        )
        # The original import preview also called update_operation_progress(operation_id, 100, 100)
        # This should be part of handle_preview_data or called consistently.
        # For now, assuming handle_preview_data or operation_tracker.mark_operation_completed covers it.
        # The original also directly fetched total_count using get_total_row_count_import for logging.
        # handle_preview_data now uses record_count from execute_procedure for this log.
        return preview_result
    except Exception as e:
        # Error logging is handled by handle_preview_data.
        # Re-raise to be caught by higher-level handlers.
        raise Exception(f"[{operation_id}] Error generating import preview: {str(e)}")


# @log_execution_time # Decorator remains
def generate_excel(params: Any) -> Tuple[Optional[str], Optional[Any]]: # Return type can be (str, str) or (None, dict)
    """
    Generate an Excel file based on the import parameters.
    Uses helper functions from base_file_service for common steps.
    """
    operation_id = logging_utils.generate_operation_id()
    operation_tracker.register_operation(operation_id)

    conn = None
    workbook = None
    file_path = None
    start_time = datetime.now()

    try:
        # Initial steps using base helper
        # The `initiate_excel_generation` in base_file_service.py expects `db_ops_module.execute_procedure`.
        # So `database_operations_import.py` should have `execute_procedure` as standardized name.
        # We assume import_db_ops (i.e. database_operations_import.py) has `execute_procedure`.
        conn, record_count, _, effective_total_rows_for_excel, limit_exceeded_response = \
            initiate_excel_generation(
                params=params,
                operation_id=operation_id,
                logger=import_logger,
                db_ops_module=import_db_ops, # Pass aliased import_db_ops
                logging_utils_module=logging_utils,
                operation_tracker_module=operation_tracker,
                db_connection_func=get_db_connection
            )

        if limit_exceeded_response:
            # If limit exceeded and not forced, update operation_details specific to import service
            operation_details = operation_tracker.get_operation_details(operation_id)
            if operation_details:
                with operation_tracker._operations_lock: # Accessing _operations_lock directly
                    operation_details["status"] = "limit_exceeded"
                    operation_details["paused_at"] = datetime.now()
            if conn: conn.close() # Close connection as we are returning early
            conn = None
            return None, limit_exceeded_response # Matches original return structure

        # --- If proceeding with Excel generation ---
        # Cache total_count in operation_details (specific to import service)
        # record_count from initiate_excel_generation is the full count from DB procedure
        operation_details = operation_tracker.get_operation_details(operation_id)
        if operation_details:
            with operation_tracker._operations_lock:
                operation_details["total_count"] = record_count # Full count
                if effective_total_rows_for_excel < record_count : # if limit was applied and forced
                    operation_details["max_rows"] = effective_total_rows_for_excel

        first_row_hs = import_db_ops.get_first_row_hs_code_import(conn, operation_id)
        filename = import_excel_utils.create_filename(params, first_row_hs, operation_type='import')
        
        temp_dir = pathlib.Path(settings.TEMP_DIR)
        os.makedirs(temp_dir, exist_ok=True)
        file_path = str(temp_dir / filename)
        file_path = os.path.abspath(file_path)

        import_logger.info(f"🚀 [{operation_id}] Starting Excel file writing at {datetime.now()}, filename: {filename}")
        import_logger.info(f"📊 [{operation_id}] Total rows to write to Excel: {effective_total_rows_for_excel}")


        if operation_tracker.is_operation_cancelled(operation_id):
            raise Exception("Operation cancelled by user before workbook creation")

        workbook = import_excel_utils.setup_excel_workbook(file_path) # Use aliased module
        worksheet = workbook.add_worksheet("Import Data")
        header_format, data_format, date_format = import_excel_utils.create_excel_formats(workbook)
        headers = import_db_ops.get_column_headers_import(conn, operation_id)
        import_excel_utils.write_excel_headers(worksheet, headers, header_format)
        
        max_widths = [len(str(h)) if h else 0 for h in headers]
        min_width = 8
        padding = 2

        # Data writing loop (adapted for DataFrame generator)
        total_rows_written = 0
        excel_row_idx = 1 # Excel rows are 1-based after header

        # fetch_data_in_chunks_import from import_db_ops now returns a generator of DataFrames
        # The original import service already used a similar loop structure for its generator.
        # The chunk_size is passed to fetch_data_in_chunks_import.
        data_chunk_generator = import_db_ops.fetch_data_in_chunks_import(conn, operation_id, settings.DB_FETCH_CHUNK_SIZE_IMPORT)

        for chunk_idx, df_chunk in enumerate(data_chunk_generator, 1):
            if operation_tracker.is_operation_cancelled(operation_id):
                raise Exception("Operation cancelled during Excel data writing")

            chunk_start_time = datetime.now()
            
            if df_chunk.empty:
                break

            rows_to_write_this_chunk = len(df_chunk)
            if total_rows_written + rows_to_write_this_chunk > effective_total_rows_for_excel:
                rows_to_write_this_chunk = effective_total_rows_for_excel - total_rows_written
                df_chunk = df_chunk.head(rows_to_write_this_chunk)

            if rows_to_write_this_chunk == 0:
                break
            
            # Optimized data writing from original import_service
            values_to_write = df_chunk.values # Using .values for speed
            date_cols = [1] # Example, adjust if different
            numeric_cols = [16, 17, 19, 20, 21, 23, 28] # Example, adjust

            for row_values in values_to_write:
                if operation_tracker.is_operation_cancelled(operation_id): # Check inside inner loop
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
                        if total_rows_written < 1000 and col_idx < len(max_widths): # Track width for first 1000 rows
                             max_widths[col_idx] = max(max_widths[col_idx], len(str_value))
                excel_row_idx +=1
            
            total_rows_written += rows_to_write_this_chunk
            
            chunk_time_taken = (datetime.now() - chunk_start_time).total_seconds()
            operation_tracker.update_operation_progress(operation_id, total_rows_written, effective_total_rows_for_excel)
            # Original import service logged progress slightly differently, using import_logger directly.
            # logging_utils.log_excel_progress can be used if its format is acceptable, or keep direct logging.
            # For consistency, let's try to use log_excel_progress if it fits well.
            # The original import_service log was:
            # import_logger.info(f"[{oid}] Processed chunk {c_idx} of {c_size_actual} rows in {c_time:.2f}s. Total: {total_r}/{total_c} ({prog_pct}%)")
            # log_excel_progress takes (logger, oid, rows_processed_in_chunk, chunk_time, total_rows_overall, total_rows_to_process)
            logging_utils.log_excel_progress(import_logger, operation_id, rows_to_write_this_chunk, chunk_time_taken, total_rows_written, effective_total_rows_for_excel)

            if total_rows_written >= effective_total_rows_for_excel:
                break
            
            gc.collect()

        import_logger.info(f"[{operation_id}] Applying column formats and auto-fitting columns...")
        for col_idx, width in enumerate(max_widths):
            # Column width logic from original import_service
            if col_idx == 1: col_w = 12
            elif col_idx in [16, 17, 19, 20, 21, 23, 28]: col_w = max(width + padding, 12)
            elif col_idx in [0,2,3,4,5,6,7,8,9,10,11,12,13,14,15,22,24,25,26,27,29,30,31]: col_w = min(max(width + padding, 12), 50)
            else: col_w = max(width + padding, 10)
            worksheet.set_column(col_idx, col_idx, col_w)
        import_logger.info(f"[{operation_id}] Column formatting and auto-fitting complete.")

        worksheet.freeze_panes(1, 0)
        
        # Workbook closed by cleanup_excel_resources in finally block
        
        total_execution_time = (datetime.now() - start_time).total_seconds()
        logging_utils.log_excel_completion(import_logger, operation_id, file_path, total_rows_written, total_execution_time)
        
        operation_details = operation_tracker.get_operation_details(operation_id)
        if operation_details:
            with operation_tracker._operations_lock:
                operation_details["file_path"] = file_path
        
        operation_tracker.mark_operation_completed(operation_id)
        
        return file_path, operation_id

    except Exception as e:
        logging_utils.log_excel_error(import_logger, operation_id, e)
        raise Exception(f"[{operation_id}] Error generating import Excel file: {str(e)}")
    finally:
        # Cleanup resources: workbook, and connection
        if workbook:
             cleanup_excel_resources(workbook, file_path, import_logger, operation_id)
        elif file_path and os.path.exists(file_path): # If workbook creation failed but file was created
             cleanup_excel_resources(None, file_path, import_logger, operation_id)

        if conn:
            try:
                conn.close()
                import_logger.info(f"[{operation_id}] Database connection closed in finally block.")
            except Exception as db_close_err:
                import_logger.error(f"[{operation_id}] Error closing database connection in finally block: {db_close_err}")