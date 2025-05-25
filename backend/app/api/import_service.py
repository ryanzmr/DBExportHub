import os
import pandas as pd
import numpy as np
import json
from datetime import datetime
import tempfile
import uuid
import pathlib
import gc
import os
import threading
from typing import List, Dict, Any, Optional

# Month names mapping for dynamic month code generation
month_names = {
    "01": "JAN", "02": "FEB", "03": "MAR", "04": "APR", 
    "05": "MAY", "06": "JUN", "07": "JUL", "08": "AUG", 
    "09": "SEP", "10": "OCT", "11": "NOV", "12": "DEC"
}

def get_month_code(year_month):
    """
    Dynamically generate a month code (e.g., 'JAN24') from a year_month integer (e.g., 202401).
    Works for any year, not just 2024-2025.
    
    Args:
        year_month (int): Year and month in format YYYYMM (e.g., 202401 for January 2024)
        
    Returns:
        str: Month code in format MMMYY (e.g., JAN24)
    """
    # Convert to string for easier processing
    year_month_str = str(year_month)
    
    # Extract month and year parts
    if len(year_month_str) >= 6:
        month = year_month_str[-2:]  # Last two digits are the month
        year = year_month_str[2:4]   # 3rd and 4th digits are the year (YY part of YYYY)
        
        # Get month name and combine with year
        month_name = month_names.get(month, "UNK")
        return f"{month_name}{year}"
    else:
        # Handle invalid format gracefully
        return f"UNK{year_month_str[-2:] if len(year_month_str) >= 2 else '??'}"

# Import the operations lock and operations functions
from .operation_tracker import _operations_lock, register_operation, mark_operation_completed, is_operation_cancelled, get_operation_details, update_operation_progress

from ..config import settings
from ..database import get_db_connection
from ..logger import import_logger, log_execution_time
from .logging_utils import log_excel_completion, log_excel_error

# Import modularized components
from .database_operations_import import (
    execute_import_procedure,
    get_preview_data_import,
    get_first_row_hs_code_import,
    get_column_headers_import,
    get_total_row_count_import,
    fetch_data_in_chunks_import
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
    setup_excel_workbook,
    create_excel_formats,
    write_excel_headers
)
from .excel_utils_import import create_filename_import
from .operation_tracker import (
    register_operation,
    mark_operation_completed,
    is_operation_cancelled,
    update_operation_progress,
    get_operation_details
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
            import_logger.info(f"Removed partial Excel file after operation failure or cancellation")
        except Exception as cleanup_err:
            import_logger.warning(f"Failed to remove partial file: {str(cleanup_err)}")

@log_execution_time
def preview_data(params):
    """
    Generate a preview of the data based on the import parameters.
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
                import_logger.info(f"[{operation_id}] Preview operation cancelled before execution")
                raise Exception("Operation cancelled by user")
                
            # Execute the import procedure and get record count
            record_count, cache_used = execute_import_procedure(conn, params, operation_id)
            
            # Check for cancellation after procedure execution
            if is_operation_cancelled(operation_id):
                import_logger.info(f"[{operation_id}] Preview operation cancelled after procedure execution")
                raise Exception("Operation cancelled by user")
                
            # Get the total row count
            total_count = get_total_row_count_import(conn, operation_id)
            
            # Get preview data (limited to 100 rows)
            preview_data_df = get_preview_data_import(conn, operation_id)
            
            # Get column headers
            headers = get_column_headers_import(conn, operation_id)
            
            # Get first row HS code for filename generation
            first_row_hs = get_first_row_hs_code_import(conn, operation_id)
            
            # Process the dataframe for JSON serialization
            preview_data_json = process_dataframe_for_json(preview_data_df)
            
            # Update operation progress
            update_operation_progress(operation_id, 100, 100)
            
            # Mark operation as completed
            mark_operation_completed(operation_id)
            
            # Log completion
            log_preview_completion(operation_id, start_time, len(preview_data_df), total_count)
            
            # Return the preview data, operation ID, and total record count
            return {
                "data": preview_data_json,
                "operation_id": operation_id,
                "total_records": total_count,
                "headers": headers,
                "first_row_hs": first_row_hs[0] if first_row_hs else None
            }
    except Exception as e:
        # Log the error
        log_preview_error(operation_id, e)
        
        # Re-raise the exception
        raise

@log_execution_time
def generate_excel(params):
    """
    Generate an Excel file based on the import parameters.
    Returns the path to the generated Excel file and the operation ID.
    """
    operation_id = generate_operation_id()
    workbook = None
    file_path = None
    
    # Register the operation in the tracker
    register_operation(operation_id)
    
    try:
        start_time = datetime.now()
        
        # Log the start of the Excel generation operation
        log_excel_start(operation_id, params)
        
        # Connect to the database
        with get_db_connection(
            params.server, params.database, params.username, params.password
        ) as conn:
            # Check for cancellation before executing procedure
            if is_operation_cancelled(operation_id):
                import_logger.info(f"[{operation_id}] Excel generation cancelled before execution")
                raise Exception("Operation cancelled by user")
                
            # Execute the import procedure and get record count
            record_count, cache_used = execute_import_procedure(conn, params, operation_id)
            
            # Check for cancellation after procedure execution
            if is_operation_cancelled(operation_id):
                import_logger.info(f"[{operation_id}] Excel generation cancelled after procedure execution")
                raise Exception("Operation cancelled by user")
                
            # Get total row count - store this in operation_details for reuse
            total_count = get_total_row_count_import(conn, operation_id)
            
            # Cache the total count in operation details to avoid repeated database calls
            operation_details = get_operation_details(operation_id)
            if operation_details:
                with _operations_lock:
                    operation_details["total_count"] = total_count
                    
            # Log Excel generation start with timestamp to match export system format
            filename = f"{params.hs}_{get_month_code(params.fromMonth)}IMP.xlsx" if params.hs else f"IMPORT_{params.fromMonth}_to_{params.toMonth}.xlsx"
            import_logger.info(f"🚀 [{operation_id}] Starting Excel generation at {datetime.now()}, filename: {filename}")
            import_logger.info(f"📊 [{operation_id}] Total rows to import: {total_count}")
            
            # Check if count exceeds Excel row limit and handle accordingly
            if total_count > EXCEL_ROW_LIMIT and not params.force_continue_despite_limit:
                import_logger.warning(f"📊 [{operation_id}] Record count ({total_count}) exceeds Excel row limit ({EXCEL_ROW_LIMIT}). Import operation paused waiting for user confirmation")
                
                # Mark operation as paused but not completed
                if operation_details:
                    # Use operation tracker functions to update the status
                    with _operations_lock:
                        operation_details["status"] = "limit_exceeded"
                        operation_details["paused_at"] = datetime.now()
                
                # Return a structured JSON response instead of raising an exception
                return None, {
                    "status": "limit_exceeded",
                    "message": f"Total records ({total_count}) exceed Excel row limit ({EXCEL_ROW_LIMIT}).",
                    "operation_id": operation_id,
                    "total_records": total_count,
                    "limit": EXCEL_ROW_LIMIT
                }
            else:
                # User has confirmed to continue, so we'll limit to Excel max rows
                if total_count > EXCEL_ROW_LIMIT:
                    import_logger.warning(f"📊 [{operation_id}] Record count ({total_count}) exceeds Excel row limit. Processing only first {EXCEL_ROW_LIMIT} rows as per user confirmation")
                    
                    # Store the actual row limit for use in data processing
                    if operation_details:
                        with _operations_lock:
                            operation_details["max_rows"] = EXCEL_ROW_LIMIT
            
            # Get first row HS code for filename generation
            first_row_hs = get_first_row_hs_code_import(conn, operation_id)
            
            # Create a filename based on the parameters
            filename = create_filename_import(params, first_row_hs)
            
            # Create a temporary file path
            file_path = os.path.join(settings.TEMP_DIR, filename)
            
            # Set up the Excel workbook
            workbook = setup_excel_workbook(file_path)
            
            # Create Excel formats - returns (header_format, data_format, date_format)
            header_format, data_format, date_format = create_excel_formats(workbook)
            
            # Add a worksheet
            worksheet = workbook.add_worksheet("Import Data")
            
            # Get column headers
            headers = get_column_headers_import(conn, operation_id)
            
            # Write headers to the worksheet
            write_excel_headers(worksheet, headers, header_format)
            
            # Initialize row counter
            row_idx = 0  # Tracks row position in Excel (0-based, add 1 for Excel row)
            total_rows = 0  # Counts total rows processed
            max_widths = [len(header) for header in headers]  # Track maximum width for each column
            padding = 2  # Extra padding for column width
            min_width = 8  # Minimum column width
            
            # Optimize chunk processing similar to export_service but use the existing function correctly
            chunk_size = 100000  # Use a larger batch size for even better performance
            
            # Set the batch size for the generator function
            # This will be used inside fetch_data_in_chunks_import
            total_row_count_to_process = min(total_count, EXCEL_ROW_LIMIT)
            
            # Add a counter to track rows we've processed
            processed_row_count = 0
            
            # Get data in chunks using the existing generator function
            # Note: fetch_data_in_chunks_import is a generator that yields dataframes
            for chunk_idx, chunk_df in enumerate(fetch_data_in_chunks_import(conn, operation_id, chunk_size), 1):
                # Check for cancellation before processing chunk
                if is_operation_cancelled(operation_id):
                    import_logger.warning(f"[{operation_id}] Excel generation cancelled by user during chunk processing")
                    raise Exception("Operation cancelled by user")
                
                chunk_start = datetime.now()
                chunk_size_actual = len(chunk_df)
                
                # Process each row in the chunk more efficiently, but limit to the Excel row limit
                if chunk_size_actual > 0:
                    # First check if we need to process this chunk at all
                    if processed_row_count >= EXCEL_ROW_LIMIT:
                        import_logger.warning(f"[{operation_id}] Reached Excel row limit of {EXCEL_ROW_LIMIT}. Stopping processing.")
                        break
                    
                    # Calculate how many rows we can actually process from this chunk
                    rows_left_to_process = EXCEL_ROW_LIMIT - processed_row_count
                    rows_to_process = min(chunk_size_actual, rows_left_to_process)
                    
                    # If we'll hit the limit within this chunk, log it
                    if rows_to_process < chunk_size_actual:
                        import_logger.warning(f"[{operation_id}] Will reach Excel limit during this chunk. Processing only {rows_to_process} of {chunk_size_actual} rows.")
                    
                    # Get the values as a numpy array for faster access
                    values = chunk_df.values[:rows_to_process]
                    
                    # Prepare column metadata for optimization
                    date_columns = [1]  # Indices of date columns
                    numeric_columns = [16, 17, 19, 20, 21, 23, 28]  # Indices of numeric columns
                    
                    # Pre-allocate max_widths tracking for string columns
                    # Process the data in bulk using more efficient methods
                    for idx, row in enumerate(values):
                        excel_row = row_idx + 1
                        
                        for col_idx, value in enumerate(row):
                            # Apply optimized write methods based on column type
                            if pd.isna(value) or value is None:
                                worksheet.write_blank(excel_row, col_idx, None, data_format)
                            elif col_idx in date_columns and isinstance(value, (datetime, pd.Timestamp)):
                                worksheet.write_datetime(excel_row, col_idx, value, date_format)
                            elif col_idx in numeric_columns and (isinstance(value, (int, float)) or (isinstance(value, str) and value.replace('.', '', 1).isdigit())):
                                # Use fast number writing for numeric columns
                                try:
                                    worksheet.write_number(excel_row, col_idx, float(value) if value is not None else 0, data_format)
                                except (ValueError, TypeError):
                                    # Fallback to string if conversion fails
                                    worksheet.write_string(excel_row, col_idx, str(value), data_format)
                            else:
                                # String handling
                                str_value = str(value)
                                worksheet.write_string(excel_row, col_idx, str_value, data_format)
                                # Only track width for first 1000 rows to improve performance
                                if total_rows < 1000:
                                    max_widths[col_idx] = max(max_widths[col_idx], len(str_value))
                        
                        row_idx += 1
                        total_rows += 1
                        processed_row_count += 1
                        
                    # Force cleanup for better memory usage
                    values = None
                
                # Calculate chunk processing time
                chunk_time = (datetime.now() - chunk_start).total_seconds()
                
                # Update operation progress in the tracker
                update_operation_progress(operation_id, total_rows, total_row_count_to_process)
                
                # Check if we've reached Excel's row limit - we do this at the batch level too
                if processed_row_count >= EXCEL_ROW_LIMIT:
                    import_logger.warning(f"[{operation_id}] Reached Excel row limit. Stopping at {EXCEL_ROW_LIMIT} rows.")
                    break
                
                # Log chunk progress for monitoring
                progress_pct = min(100, int((total_rows / total_count) * 100))
                import_logger.info(
                    f"[{operation_id}] Processed chunk {chunk_idx} of {chunk_size_actual} rows in {chunk_time:.2f} seconds. Total: {total_rows}/{total_count} ({progress_pct}%)"
                )
                
                # Force garbage collection after each chunk
                chunk_df = None
                gc.collect()
            
            # Set column widths more efficiently based on tracked max widths
            import_logger.info(f"[{operation_id}] Applying column formats and auto-fitting columns...")
            
            # Apply sensible column widths based on the max_widths we tracked during processing
            padding = 2  # Extra padding for better readability
            
            for col_idx, width in enumerate(max_widths):
                # Apply column-specific formatting based on column type
                # For date column
                if col_idx == 1:  # Date column
                    col_width = 12  # Fixed width for dates
                # For numeric columns 
                elif col_idx in [16, 17, 19, 20, 21, 23, 28]:
                    col_width = max(width + padding, 12)  # Minimum 12 for numeric columns
                # For text columns that typically have longer content
                elif col_idx in [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 22, 24, 25, 26, 27, 29, 30, 31]:
                    col_width = min(max(width + padding, 12), 50)  # Min 12, max 50 chars
                # Default for any other columns
                else:
                    col_width = max(width + padding, 10)  # Minimum 10 chars wide
                
                # Set the column width
                worksheet.set_column(col_idx, col_idx, col_width)
            
            # Freeze the header row for better navigation
            worksheet.freeze_panes(1, 0)
            
            import_logger.info(f"[{operation_id}] Column formatting and auto-fitting complete.")
            
            # Close the workbook
            workbook.close()
            workbook = None
            
            # Store the file path in the operation details for later retrieval
            operation_details = get_operation_details(operation_id)
            if operation_details:
                with _operations_lock:
                    operation_details["file_path"] = file_path
                    
            # Log the full path information for consistency with export system
            absolute_path = os.path.abspath(file_path)
            import_logger.info(f"[{operation_id}] Excel file generated at: {absolute_path}")
            
            # Mark operation as completed
            mark_operation_completed(operation_id)
            
            # Log completion
            execution_time = (datetime.now() - start_time).total_seconds()
            
            # Use the actual number of rows processed which is limited to Excel row limit
            final_row_count = min(processed_row_count, EXCEL_ROW_LIMIT)
            
            # IMPORTANT: Pass parameters in the correct order to prevent 500 errors
            # Correct order: (operation_id, file_path, total_rows, execution_time)
            # This was previously a source of 500 Internal Server Errors
            log_excel_completion(operation_id, file_path, final_row_count, execution_time)
            
            # Return the file path and operation ID
            return file_path, operation_id
    except Exception as e:
        # Log the error
        log_excel_error(operation_id, e)
        
        # Clean up resources
        cleanup_on_error(workbook, file_path)
        
        # Re-raise the exception
        raise