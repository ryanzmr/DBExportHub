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
from ..logger import import_logger, log_execution_time

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
                
            # Get the total row count
            total_count = get_total_row_count_import(conn, operation_id)
            
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
            row_num = 1  # Start from row 1 (after headers)
            total_rows_processed = 0
            
            # Process data in chunks to avoid memory issues
            for chunk_df in fetch_data_in_chunks_import(conn, operation_id):
                # Check for cancellation during processing
                if is_operation_cancelled(operation_id):
                    import_logger.info(f"[{operation_id}] Excel generation cancelled during data processing")
                    cleanup_on_error(workbook, file_path)
                    raise Exception("Operation cancelled by user")
                
                chunk_start_time = datetime.now()
                chunk_size = len(chunk_df)
                
                # Write data to Excel
                for _, row in chunk_df.iterrows():
                    for col_num, value in enumerate(row):
                        # Apply appropriate formatting based on data type and column
                        if pd.isna(value):
                            # Handle NaN/None values
                            worksheet.write_string(row_num, col_num, "", data_format)
                            
                        # Special case: Column B (index 1) is always DATE
                        elif col_num == 1 and isinstance(value, (datetime, np.datetime64)):
                            # Handle date values
                            date_value = pd.Timestamp(value).to_pydatetime() if isinstance(value, np.datetime64) else value
                            worksheet.write_datetime(row_num, col_num, date_value, date_format)
                            
                        # Numeric columns that need special formatting (VALUE, QTY, UNIT RATE, etc.)
                        elif isinstance(value, (int, float, np.integer, np.floating)) and col_num in [16, 17, 19, 20, 21, 23, 28]:
                            # These are columns with numeric values that need numeric formatting
                            # Columns with indices matching: VALUE, QTY, UNIT RATE(IND RS), VALUE(US$), UNIT RATE(USD), DUTY
                            worksheet.write_number(row_num, col_num, value, data_format)
                            
                        # General numeric values
                        elif isinstance(value, (int, float, np.integer, np.floating)):
                            # Preserve numeric type but don't apply special formatting
                            worksheet.write_number(row_num, col_num, value, data_format)
                            
                        # All other columns should be treated as strings to avoid incorrect data type conversion
                        else:
                            # Handle string values
                            worksheet.write_string(row_num, col_num, str(value), data_format)
                    
                    row_num += 1
                    total_rows_processed += 1
                    
                    # Update progress every 1000 rows
                    if total_rows_processed % 1000 == 0:
                        # Calculate progress as current/total - the function will handle percentage
                        update_operation_progress(operation_id, total_rows_processed, total_count)
                
                # Calculate and log chunk processing time
                chunk_time = (datetime.now() - chunk_start_time).total_seconds()
                import_logger.info(
                    f"[{operation_id}] Processed {chunk_size} rows in {chunk_time:.2f} seconds",
                    extra={
                        "operation_id": operation_id,
                        "chunk_size": chunk_size,
                        "chunk_time": chunk_time
                    }
                )
            
            # Apply date format to the entire DATE column (column B, index 1)
            # This matches the VBA approach: wks.Range("b2", Selection.Cells(record + 1, 2)).NumberFormat = "dd-mmm-yy"
            worksheet.set_column(1, 1, None, date_format)
            
            # Use a balanced approach - analyze first 10 rows of data for better text fitting
            # while maintaining good performance
            import_logger.info(f"[{operation_id}] Analyzing first 10 rows to determine optimal column widths")
            
            # Define a function to calculate maximum width of first N rows for a column
            def get_max_width_from_first_rows(df, col_idx, num_rows=10):
                max_width = 0
                # Only process up to available rows and columns
                if col_idx < len(df.columns) and len(df) > 0:
                    # Get a small sample (first num_rows)
                    sample = df.iloc[:min(num_rows, len(df)), col_idx]
                    # Find the maximum string length in the sample
                    for val in sample:
                        if pd.notna(val):
                            max_width = max(max_width, len(str(val)))
                return max_width
            
            # Get the first 10 rows of data to analyze column widths
            # Use the data we already have in chunk_df instead of querying the database again
            first_rows_df = None
            if len(chunk_df) > 0:
                first_rows_df = chunk_df.iloc[:min(10, len(chunk_df))]
            
            # Apply column widths based on both header and content
            for col_num, header in enumerate(headers):
                # Start with header width
                header_width = len(str(header))
                
                # Get content width from first 10 rows if available
                content_width = 0
                if first_rows_df is not None:
                    content_width = get_max_width_from_first_rows(first_rows_df, col_num)
                
                # For typical text columns that may have long values
                if col_num in [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 22, 24, 25, 26, 27, 29, 30, 31]:
                    # Text columns - use max of header, content, or min width of 12
                    # Cap at 50 chars to prevent excessively wide columns
                    col_width = min(max(header_width, content_width, 12), 50)
                # For numeric/value columns
                elif col_num in [16, 17, 19, 20, 21, 23, 28]:
                    # Numeric columns - use consistent width but check if content is wider
                    col_width = max(content_width, 12)
                # For date column
                elif col_num == 1:
                    # Date column - fixed width for date format
                    col_width = 12
                else:
                    # Default for any other columns
                    col_width = max(header_width, content_width, 10)
                
                # Apply a small scaling factor for better readability
                col_width = min(int(col_width * 1.1), 50)  # Add 10% padding, cap at 50
                
                # Set column width
                worksheet.set_column(col_num, col_num, col_width)
            
            import_logger.info(f"[{operation_id}] Applied standard column widths for better performance")
            
            # Close the workbook
            workbook.close()
            workbook = None
            
            # Mark operation as completed
            mark_operation_completed(operation_id)
            
            # Log completion
            execution_time = (datetime.now() - start_time).total_seconds()
            log_excel_completion(operation_id, file_path, total_rows_processed, execution_time)
            
            # Return the file path and operation ID
            return file_path, operation_id
    except Exception as e:
        # Log the error
        log_excel_error(operation_id, e)
        
        # Clean up resources
        cleanup_on_error(workbook, file_path)
        
        # Re-raise the exception
        raise