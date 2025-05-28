import os
import pandas as pd
# import numpy as np # No longer explicitly used in this file after refactor
# import json # No longer explicitly used
from datetime import datetime
# import tempfile # No longer explicitly used
# import uuid # No longer explicitly used
import pathlib
import gc # Still used for garbage collection
from typing import List, Dict, Any, Optional # Still used for type hints

from ..config import settings
from ..database import get_db_connection
from ..logger import export_logger # Specific logger for export operations
# Removed log_execution_time as it's applied by decorator, not directly called

# Import base service helpers
from .base_file_service import (
    cleanup_excel_resources,
    handle_preview_data,
    initiate_excel_generation,
    EXCEL_ROW_LIMIT # Constant from base service
)

# Import and alias modules as per instructions
from . import database_operations as export_db_ops
from . import excel_utils as export_excel_utils
from . import data_processing
from . import logging_utils
from . import operation_tracker

# generate_operation_id is now part of logging_utils, so it's accessed via logging_utils.generate_operation_id
# CustomJSONEncoder was part of data_processing, assumed still available there if needed elsewhere.

# @log_execution_time # This decorator is on the function, so it remains.
def preview_data(params: Any) -> Dict[str, Any]:
    """
    Generate a preview of the data based on the export parameters.
    Delegates most logic to handle_preview_data from base_file_service.
    """
    operation_id = logging_utils.generate_operation_id()
    operation_tracker.register_operation(operation_id)
    
    try:
        # No specific additional info function needed for export preview beyond common fields
        return handle_preview_data(
            params=params,
            operation_id=operation_id,
            logger=export_logger,
            db_ops_module=export_db_ops,
            data_processing_module=data_processing,
            logging_utils_module=logging_utils,
            operation_tracker_module=operation_tracker,
            db_connection_func=get_db_connection # Pass the actual DB connection function
        )
    except Exception as e:
        # Error logging is handled by handle_preview_data.
        # This service should re-raise to be caught by higher-level handlers or return error response.
        # The original service re-raised with a specific message.
        raise Exception(f"[{operation_id}] Error generating export preview: {str(e)}")


# @log_execution_time # This decorator is on the function, so it remains.
def generate_excel(params: Any) -> Tuple[Optional[str], Optional[str]]: # Return type changed slightly based on potential early exit
    """
    Generate an Excel file based on the export parameters.
    Uses helper functions from base_file_service for common steps.
    """
    operation_id = logging_utils.generate_operation_id()
    operation_tracker.register_operation(operation_id)

    conn = None
    workbook = None
    file_path = None
    start_time = datetime.now() # For overall execution time logging

    try:
        # Initial steps: logging, DB connection, procedure execution, limit checks
        # db_ops_module.execute_procedure is called inside initiate_excel_generation
        # The specific execute_export_procedure will be called via export_db_ops.execute_procedure
        # (assuming execute_procedure is the common method name in the refactored db_ops modules)
        # For now, let's assume export_db_ops.execute_export_procedure is directly used by initiate_excel_generation
        # if we pass export_db_ops to it.
        # The `initiate_excel_generation` in base_file_service.py expects `db_ops_module.execute_procedure`.
        # So `database_operations.py` should have `execute_procedure` as an alias or the main function.
        # For this refactoring, we assume that `export_db_ops` (i.e., `database_operations.py`)
        # now has `execute_procedure` as the standardized name for what was `execute_export_procedure`.
        
        conn, record_count, _, effective_total_rows_for_excel, limit_exceeded_response = \
            initiate_excel_generation(
                params=params,
                operation_id=operation_id,
                logger=export_logger,
                db_ops_module=export_db_ops, # Pass the aliased export_db_ops
                logging_utils_module=logging_utils,
                operation_tracker_module=operation_tracker,
                db_connection_func=get_db_connection
            )

        if limit_exceeded_response:
            # If limit is exceeded and not forced, return the response from helper
            # The connection would have been closed by initiate_excel_generation in this case.
            conn = None # Ensure conn is None as it's closed by helper
            return limit_exceeded_response, operation_id # Matches original return structure for this case

        # --- If proceeding with Excel generation ---
        first_row_hs = export_db_ops.get_first_row_hs_code(conn, operation_id)
        
        # Use aliased export_excel_utils for create_filename
        # Pass operation_type='export' as per instruction for future-proofing if create_filename becomes generic
        filename = export_excel_utils.create_filename(params, first_row_hs, operation_type='export') 
        
        temp_dir = pathlib.Path(settings.TEMP_DIR)
        os.makedirs(temp_dir, exist_ok=True)
        file_path = str(temp_dir / filename)
        file_path = os.path.abspath(file_path)
        
        export_logger.info(f"[{operation_id}] Starting Excel file writing at {datetime.now()}, filename: {filename}")

        if operation_tracker.is_operation_cancelled(operation_id):
            raise Exception("Operation cancelled by user before workbook creation")

        workbook = export_excel_utils.setup_excel_workbook(file_path)
        worksheet = workbook.add_worksheet('Export Data')
        header_format, data_format, date_format = export_excel_utils.create_excel_formats(workbook)
        columns = export_db_ops.get_column_headers(conn, operation_id)
        export_excel_utils.write_excel_headers(worksheet, columns, header_format)

        max_widths = [len(str(h)) if h else 0 for h in columns]
        min_width = 8
        padding = 1
        
        # total_count_for_progress is effective_total_rows_for_excel
        export_logger.info(f"[{operation_id}] Total rows to write to Excel: {effective_total_rows_for_excel}")

        if hasattr(conn, 'execute') and callable(getattr(conn, 'execute')) : # Check if conn is not None and has execute
            conn.execute("SET NOCOUNT ON") # SQL Server specific optimization

        total_rows_written = 0
        
        # fetch_data_in_chunks from export_db_ops now returns a generator of DataFrames
        # The old code used offset and batch_size for cursor.fetchall().
        # The new generic_fetch_data_in_chunks (used by export_db_ops.fetch_data_in_chunks)
        # handles pagination internally. The `offset` parameter for the initial call is usually 0 or None.
        # The `chunk_size` is passed to `fetch_data_in_chunks`.
        
        # The loop needs to iterate while total_rows_written < effective_total_rows_for_excel
        # and the generator yields data.
        
        # The `offset` parameter for `fetch_data_in_chunks` in `database_operations.py` is the
        # `offset_val` for `generic_fetch_data_in_chunks`.
        # We need to manage the offset for multiple calls if `fetch_data_in_chunks` itself isn't
        # a generator that handles all data.
        # Ah, `generic_fetch_data_in_chunks` IS a generator. So we just iterate over it once.
        # The `offset` and `batch_size` are handled by it.
        
        # The `fetch_data_in_chunks` in `export_db_ops` takes `chunk_size`, `offset`, `operation_id`.
        # The generic one takes `chunk_size`, `offset_val`, `order_by_column`.
        # The refactored `export_db_ops.fetch_data_in_chunks` should now be a generator.

        # The old loop: `while total_rows < total_count:`
        # Inside, it called `fetch_data_in_chunks` to get a cursor, then `rows = cursor.fetchall()`.
        # The new `export_db_ops.fetch_data_in_chunks` is ALREADY A GENERATOR of DataFrames.
        # So, we just need one loop over this generator.
        
        excel_row_idx = 1 # Excel rows are 1-based after header
        for df_chunk in export_db_ops.fetch_data_in_chunks(conn, settings.DB_FETCH_BATCH_SIZE, 0, operation_id): # Initial offset 0
            if operation_tracker.is_operation_cancelled(operation_id):
                raise Exception("Operation cancelled during Excel data writing")

            chunk_start_time = datetime.now()
            
            if df_chunk.empty:
                break # No more data from generator

            # Limit rows from this chunk if we are about to exceed effective_total_rows_for_excel
            rows_to_write_this_chunk = len(df_chunk)
            if total_rows_written + rows_to_write_this_chunk > effective_total_rows_for_excel:
                rows_to_write_this_chunk = effective_total_rows_for_excel - total_rows_written
                df_chunk = df_chunk.head(rows_to_write_this_chunk) # Slice the DataFrame

            if rows_to_write_this_chunk == 0: # Should not happen if effective_total_rows_for_excel is managed correctly
                break

            for _, row_data in df_chunk.iterrows(): # Iterate over DataFrame rows
                if operation_tracker.is_operation_cancelled(operation_id): # Check inside inner loop too
                     raise Exception("Operation cancelled during Excel data writing")

                for col_idx, value in enumerate(row_data):
                    cell_format_to_use = date_format if col_idx == 2 and value else data_format # Assuming Date is col 2
                    worksheet.write(excel_row_idx, col_idx, value, cell_format_to_use)
                    cell_content_length = len(str(value)) if value is not None else 0
                    if col_idx < len(max_widths): # Ensure col_idx is within bounds
                        max_widths[col_idx] = max(max_widths[col_idx], cell_content_length)
                excel_row_idx += 1
            
            total_rows_written += rows_to_write_this_chunk
            
            chunk_time_taken = (datetime.now() - chunk_start_time).total_seconds()
            operation_tracker.update_operation_progress(operation_id, total_rows_written, effective_total_rows_for_excel)
            
            logging_utils.log_excel_progress(export_logger, operation_id, rows_to_write_this_chunk, chunk_time_taken, total_rows_written, effective_total_rows_for_excel)

            if total_rows_written >= effective_total_rows_for_excel:
                break # Reached the limit
            
            gc.collect() # Garbage collect after processing a chunk

        export_logger.info(f"[{operation_id}] Applying column formats and auto-fitting columns...")
        for col_idx, width in enumerate(max_widths):
            final_width = max(min_width, width + padding)
            worksheet.set_column(col_idx, col_idx, final_width)
        export_logger.info(f"[{operation_id}] Column formatting and auto-fitting complete.")
        
        worksheet.freeze_panes(1, 0)
        
        # Workbook is closed in the finally block by cleanup_excel_resources

        total_execution_time = (datetime.now() - start_time).total_seconds()
        logging_utils.log_excel_completion(export_logger, operation_id, file_path, total_rows_written, total_execution_time)
        operation_tracker.mark_operation_completed(operation_id)
        
        return file_path, operation_id

    except Exception as e:
        logging_utils.log_excel_error(export_logger, operation_id, e)
        # No need for explicit traceback print here, logger should handle it.
        # Ensure conn is closed if it was opened by initiate_excel_generation and not passed to finally block
        # The finally block below will handle cleanup including workbook and conn if it's set.
        raise Exception(f"[{operation_id}] Error generating export Excel file: {str(e)}")
    finally:
        # Cleanup resources: workbook, and connection if it's still open
        if workbook: # Workbook is created in the try block
             cleanup_excel_resources(workbook, file_path, export_logger, operation_id) # file_path might be None if error before its creation
        elif file_path and os.path.exists(file_path): # If workbook creation failed but file was created
             cleanup_excel_resources(None, file_path, export_logger, operation_id)

        if conn: # conn is from initiate_excel_generation or the with block for preview
            try:
                conn.close()
                export_logger.info(f"[{operation_id}] Database connection closed in finally block.")
            except Exception as db_close_err:
                export_logger.error(f"[{operation_id}] Error closing database connection in finally block: {db_close_err}")