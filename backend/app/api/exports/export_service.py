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

from ..core.config import settings
from ..core.database import get_db_connection
from ..core.logger import export_logger, log_execution_time

# Import modularized components
from ..database_operations.export_database import (
    execute_export_procedure,
    get_preview_data,
    get_first_row_hs_code,
    get_column_headers,
    get_total_row_count,
    fetch_data_in_chunks
)
from ..core.logging_utils import (
    generate_operation_id,
    log_preview_start,
    log_preview_completion,
    log_preview_error,
    log_excel_start,
    log_excel_completion,
    log_excel_error
)
from ..core.data_processing import (
    CustomJSONEncoder,
    process_dataframe_for_json
)
from .excel_utils import (
    create_filename,
    setup_excel_workbook,
    create_excel_formats,
    write_excel_headers
)
from ..core.operation_tracker import (
    register_operation,
    update_operation_progress,
    mark_operation_completed,
    is_operation_cancelled
)

# Constants
EXCEL_ROW_LIMIT = 1048576  # Maximum number of rows in modern Excel

def cleanup_on_error(workbook, file_path):
    """Clean up resources when an error occurs during Excel generation"""
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
            export_logger.info(f"Removed partial Excel file after operation failure or cancellation")
        except Exception as cleanup_err:
            export_logger.warning(f"Failed to remove partial file: {str(cleanup_err)}")

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
            
            # Return the result, operation ID, and total record count
            return {
                "data": result,
                "operation_id": operation_id,
                "total_records": record_count
            }
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
            
            # Check if the record count exceeds Excel's row limit
            if record_count > EXCEL_ROW_LIMIT:
                export_logger.warning(
                    f"[{operation_id}] Record count ({record_count}) exceeds Excel row limit ({EXCEL_ROW_LIMIT}). "
                    f"Only first {EXCEL_ROW_LIMIT} rows will be exported."
                )
                
                # If user hasn't explicitly confirmed to continue with limited data,
                # we'll check for a flag in params
                if not params.force_continue_despite_limit:
                    # Check if the client explicitly instructed to continue despite the limit
                    if not getattr(params, 'ignore_excel_limit', False):
                        export_logger.info(f"[{operation_id}] Export operation paused waiting for user confirmation")
                        # Return information about the limit being reached
                        return {
                            "status": "limit_exceeded",
                            "message": f"Total records ({record_count}) exceeds Excel row limit ({EXCEL_ROW_LIMIT})",
                            "operation_id": operation_id,
                            "total_records": record_count,
                            "limit": EXCEL_ROW_LIMIT
                        }, operation_id
            
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
            
            # Initialize max column widths with header lengths
            max_widths = [len(str(h)) if h else 0 for h in columns]
            min_width = 8 # Ensure a minimum width
            padding = 1 # Padding for autofit
            
            # Get total row count for progress tracking
            total_count = get_total_row_count(conn, operation_id)
            export_logger.info(f"[{operation_id}] Total rows to export: {total_count}")
            
            # If total count exceeds Excel limit, we'll only process up to the limit
            if total_count > EXCEL_ROW_LIMIT:
                export_logger.warning(
                    f"[{operation_id}] Limiting export to {EXCEL_ROW_LIMIT} rows out of {total_count} total records."
                )
                total_count = EXCEL_ROW_LIMIT
            
            # Optimize memory usage by using server-side cursor
            conn.execute("SET NOCOUNT ON")
            
            # Variables to track total rows processed
            total_rows = 0
            offset = 0

            # Loop until all data is processed or Excel limit is reached
            while total_rows < total_count:
                # Check if operation has been cancelled before processing each chunk
                if is_operation_cancelled(operation_id):
                    export_logger.info(f"[{operation_id}] Operation cancelled during Excel generation at row {total_rows}/{total_count}")
                    cleanup_on_error(workbook, file_path)
                    raise Exception("Operation cancelled by user")
            
                chunk_start = datetime.now()
                
                # Fetch data in chunks using configured size
                batch_size = settings.DB_FETCH_BATCH_SIZE
                cursor = fetch_data_in_chunks(conn, batch_size, offset, operation_id)
                
                # Process all rows from this chunk's cursor
                rows = cursor.fetchall()
                cursor.close()
                
                if not rows:
                    break
                    
                # Process this chunk of data
                chunk_size_actual = len(rows)
                row_idx = total_rows + 1  # Start from after the last processed row (1-based for Excel)
                
                # Write the chunk data to Excel
                for row in rows:
                    # Check if we've reached Excel's row limit
                    if total_rows >= EXCEL_ROW_LIMIT:
                        export_logger.warning(f"[{operation_id}] Reached Excel row limit. Stopping at {EXCEL_ROW_LIMIT} rows.")
                        break
                        
                    # Check for cancellation periodically 
                    if row_idx % 1000 == 0 and is_operation_cancelled(operation_id):
                        export_logger.info(f"[{operation_id}] Operation cancelled during Excel data writing at row {row_idx}/{total_count}")
                        cleanup_on_error(workbook, file_path)
                        raise Exception("Operation cancelled by user")
                        
                    for col_idx, value in enumerate(row):
                        # Apply format during writing
                        cell_format_to_use = date_format if col_idx == 2 and value else data_format
                        worksheet.write(row_idx, col_idx, value, cell_format_to_use)
                        
                        # Update max width for the column
                        # Handle None values and ensure comparison is based on string length
                        cell_content_length = len(str(value)) if value is not None else 0
                        max_widths[col_idx] = max(max_widths[col_idx], cell_content_length)
                        
                    row_idx += 1
                    total_rows += 1
                
                # Update counters for the next chunk using configured size
                offset += batch_size
                
                # Calculate chunk processing time
                chunk_time = (datetime.now() - chunk_start).total_seconds()
                
                # Update operation progress in the tracker directly with accumulated total
                update_operation_progress(operation_id, total_rows, total_count)
                
                # Check if we've reached Excel's row limit
                if total_rows >= EXCEL_ROW_LIMIT:
                    break
                
                # Log the current chunk progress with accumulated totals
                export_logger.info(
                    f"[{operation_id}] Processed chunk of {chunk_size_actual} rows in {chunk_time:.6f} seconds. Total: {total_rows}/{total_count} ({min(100, int((total_rows / total_count) * 100))}%)",
                    extra={
                        "operation_id": operation_id,
                        "rows_processed": chunk_size_actual,
                        "chunk_time": chunk_time,
                        "total_rows": total_rows,
                        "total_count": total_count,
                        "progress_pct": min(100, int((total_rows / total_count) * 100))
                    }
                )
            
            # --- Formatting applied AFTER data writing ---
            export_logger.info(f"[{operation_id}] Applying column formats and auto-fitting columns...")
            for col_idx, width in enumerate(max_widths):
                # Determine the correct format for the column
                # Use date format for column 3 (index 2)
                cell_format = date_format if col_idx == 2 else data_format
                
                # Calculate final width with padding and minimum width
                final_width = max(min_width, width + padding)
                
                # Apply column width ONLY (format applied during write)
                worksheet.set_column(col_idx, col_idx, final_width)
            export_logger.info(f"[{operation_id}] Column formatting and auto-fitting complete.")
            # --- End Formatting ---
            
            # Freeze the header row
            worksheet.freeze_panes(1, 0)
            
            # Finalize the workbook after all data is written
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