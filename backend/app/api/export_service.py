import os
import pandas as pd
import numpy as np
import json
from datetime import datetime
import tempfile
import uuid
import pathlib
import gc
from typing import List, Dict, Any, Optional

from ..config import settings
from ..database import get_db_connection
from ..logger import export_logger, log_execution_time

# Import modularized components
from .database_operations import (
    execute_export_procedure,
    get_preview_data,
    get_first_row_hs_code,
    get_column_headers,
    get_total_row_count,
    fetch_data_in_chunks
)
from .logging_utils import (
    generate_operation_id,
    log_preview_start,
    log_preview_completion,
    log_preview_error,
    log_excel_start,
    log_excel_completion,
    log_excel_error
)
from .data_processing import (
    CustomJSONEncoder,
    process_dataframe_for_json
)
from .excel_utils import (
    create_filename,
    setup_excel_workbook,
    create_excel_formats,
    get_column_widths,
    write_excel_headers,
    set_column_widths,
    write_data_to_excel
)
from .operation_tracker import (
    register_operation,
    mark_operation_completed,
    is_operation_cancelled
)

@log_execution_time
def preview_data(params):
    """
    Generate a preview of the data based on the export parameters.
    Returns a limited number of records for preview in the UI.
    """
    operation_id = generate_operation_id()
    
    # Register the operation in the tracker
    register_operation(operation_id)
    
    try:
        start_time = datetime.now()
        
        # Log the start of the preview operation
        log_preview_start(operation_id, params)
        
        # Connect to the database
        with get_db_connection(
            params.server, params.database, params.username, params.password
        ) as conn:
            # Check for cancellation before executing procedure
            if is_operation_cancelled(operation_id):
                export_logger.info(f"[{operation_id}] Preview operation cancelled before execution")
                raise Exception("Operation cancelled by user")
                
            # Execute the export procedure and get record count
            record_count, cache_used = execute_export_procedure(conn, params, operation_id)
            
            # Check for cancellation after procedure execution
            if is_operation_cancelled(operation_id):
                export_logger.info(f"[{operation_id}] Preview operation cancelled after procedure execution")
                raise Exception("Operation cancelled by user")
            
            # Query the temp table for preview data
            df = get_preview_data(conn, params, operation_id)
            
            # Log the completion of the preview operation
            log_preview_completion(operation_id, start_time, len(df), record_count)
            
            # Process the DataFrame for JSON serialization
            result = process_dataframe_for_json(df)
            
            # Mark the operation as completed
            mark_operation_completed(operation_id)
            
            # Return both the result and the operation ID
            return result, operation_id
    except Exception as e:
        log_preview_error(operation_id, e)
        # Don't mark as completed if there was an error
        # The cleanup thread will handle it after the timeout
        raise Exception(f"Error generating preview: {str(e)}")

@log_execution_time
def generate_excel(params):
    """
    Generate an Excel file based on the export parameters.
    Returns the path to the generated Excel file.
    """
    operation_id = generate_operation_id()
    
    # Register the operation in the tracker
    register_operation(operation_id)
    
    # Variable to track if we need to clean up a partial file
    file_path = None
    workbook = None
    
    try:
        # Log the start of the Excel generation operation
        log_excel_start(operation_id, params)
        
        # Connect to the database
        with get_db_connection(
            params.server, params.database, params.username, params.password
        ) as conn:
            # Check for cancellation before executing procedure
            if is_operation_cancelled(operation_id):
                export_logger.info(f"[{operation_id}] Export operation cancelled before execution")
                raise Exception("Operation cancelled by user")
                
            # Execute the export procedure and get record count
            start_time = datetime.now()
            record_count, cache_used = execute_export_procedure(conn, params, operation_id)
            
            # Check for cancellation after procedure execution
            if is_operation_cancelled(operation_id):
                export_logger.info(f"[{operation_id}] Export operation cancelled after procedure execution")
                raise Exception("Operation cancelled by user")
            
            # Get the first row's HS code for the filename
            first_row_hs = get_first_row_hs_code(conn, operation_id)
            
            # Create filename based on parameters
            filename = create_filename(params, first_row_hs)
            
            # Ensure temp directory exists
            temp_dir = pathlib.Path(settings.TEMP_DIR)
            os.makedirs(temp_dir, exist_ok=True)
            file_path = str(temp_dir / filename)
            file_path = os.path.abspath(file_path)
            
            export_logger.info(f"[{operation_id}] Starting Excel generation at {datetime.now()}, filename: {filename}")
            
            # Check for cancellation before creating workbook
            if is_operation_cancelled(operation_id):
                export_logger.info(f"[{operation_id}] Export operation cancelled before workbook creation")
                raise Exception("Operation cancelled by user")
            
            # Create workbook with optimized settings
            workbook = setup_excel_workbook(file_path)
            worksheet = workbook.add_worksheet('Export Data')
            
            # Create Excel formats
            header_format, data_format, date_format = create_excel_formats(workbook)
            
            # Get column headers
            columns = get_column_headers(conn, operation_id)
            
            # Write headers to Excel
            write_excel_headers(worksheet, columns, header_format)
            
            # Set column widths
            column_widths = get_column_widths()
            set_column_widths(worksheet, columns, column_widths)
            
            # Get total row count for progress tracking
            total_count = get_total_row_count(conn, operation_id)
            export_logger.info(f"[{operation_id}] Total rows to export: {total_count}")
            
            # Optimize memory usage by using server-side cursor
            conn.execute("SET NOCOUNT ON")
            
            # Process data in chunks with optimized approach for large datasets
            chunk_size = 100000  # Further increased chunk size for better performance with large datasets
            offset = 0
            total_rows = 0
            
            while True:
                # Check for cancellation before processing each chunk
                if is_operation_cancelled(operation_id):
                    export_logger.info(f"[{operation_id}] Export operation cancelled during data processing at row {total_rows}/{total_count}")
                    # Close workbook to release file handles
                    if workbook:
                        try:
                            workbook.close()
                        except Exception:
                            pass
                    # Clean up partial file
                    if file_path and os.path.exists(file_path):
                        try:
                            os.remove(file_path)
                            export_logger.info(f"[{operation_id}] Removed partial Excel file after cancellation")
                        except Exception as cleanup_err:
                            export_logger.warning(f"[{operation_id}] Failed to remove partial file: {str(cleanup_err)}")
                    raise Exception("Operation cancelled by user")
                
                chunk_start = datetime.now()
                
                # Fetch data in chunks
                cursor = fetch_data_in_chunks(conn, chunk_size, offset, operation_id)
                
                # Write data to Excel
                rows_processed = write_data_to_excel(worksheet, cursor, data_format, date_format, operation_id, total_count)
                
                total_rows += rows_processed
                offset += chunk_size
                cursor.close()
                
                # Force garbage collection after each chunk to free memory
                gc.collect()
                
                # Break if we've processed all rows or no rows were returned
                if rows_processed == 0 or total_rows >= total_count:
                    break
            
            # Freeze the header row
            worksheet.freeze_panes(1, 0)
            
            # Close the workbook
            workbook.close()
            
            # Log the completion of the Excel generation operation
            execution_time = (datetime.now() - start_time).total_seconds()
            log_excel_completion(operation_id, file_path, total_rows, execution_time)
            
            # Mark the operation as completed
            mark_operation_completed(operation_id)
            
            # Return both the file path and the operation ID
            return file_path, operation_id
    except Exception as e:
        log_excel_error(operation_id, e)
        import traceback
        print(traceback.format_exc())
        
        # Clean up partial file if it exists
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
                export_logger.info(f"[{operation_id}] Removed partial Excel file after error")
            except Exception as cleanup_err:
                export_logger.warning(f"[{operation_id}] Failed to remove partial file: {str(cleanup_err)}")
        
        # Don't mark as completed if there was an error
        # The cleanup thread will handle it after the timeout
        raise Exception(f"Error generating Excel file: {str(e)}")