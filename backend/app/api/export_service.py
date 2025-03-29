import os
import pandas as pd
import numpy as np
import json
from datetime import datetime, date
import tempfile
import uuid
import pathlib
import gc
from typing import List, Dict, Any, Optional
from decimal import Decimal

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
    autofit_columns
)
from .operation_tracker import (
    register_operation,
    update_operation_progress,
    mark_operation_completed,
    is_operation_cancelled
)
from .excel_row_limit import check_row_limit, process_exceeding_limit_response, EXCEL_MAX_ROWS

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

def _legacy_fetch_data_in_chunks(conn, chunk_size, offset, operation_id, max_rows=None):
    """
    DEPRECATED: Use fetch_data_in_chunks from database_operations.py instead.
    This function is kept for reference only.
    
    Args:
        conn: Database connection
        chunk_size: Number of rows to fetch per chunk
        offset: Starting offset
        operation_id: Unique ID for the operation
        max_rows: Maximum number of rows to fetch (for Excel row limit)
    
    Returns:
        Cursor object with the fetched data
    """
    export_logger.debug(f"[{operation_id}] Fetching chunk of data with offset {offset}")
    
    # If max_rows is set, use it to limit the query
    if max_rows is not None:
        # Calculate the actual chunk size to fetch based on max_rows
        remaining_rows = max_rows - offset
        if remaining_rows <= 0:
            # No more rows to fetch
            export_logger.debug(f"[{operation_id}] Max rows limit reached, no more rows to fetch")
            # Return empty cursor
            return conn.cursor()
            
        # Adjust chunk size if needed
        actual_chunk_size = min(chunk_size, remaining_rows)
        export_logger.debug(f"[{operation_id}] Adjusted chunk size to {actual_chunk_size} due to max_rows limit")
    else:
        actual_chunk_size = chunk_size
    
    # Execute query with TOP to limit the number of rows
    cursor = conn.cursor()
    
    # Build the query with proper TOP clause
    query = f"""
    SELECT TOP {actual_chunk_size} * 
    FROM (
        SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS RowNum, *
        FROM {settings.EXPORT_VIEW}
    ) AS RowConstrainedResult
    WHERE RowNum > {offset}
    ORDER BY RowNum
    """
    
    cursor.execute(query)
    return cursor

@log_execution_time
def generate_excel(params):
    """
    Generate an Excel file based on export parameters.
    
    Args:
        params: Dictionary containing export parameters
    
    Returns:
        Tuple of (file_path, operation_id)
    
    Raises:
        Exception: If there's an error during Excel generation
    """
    operation_id = str(uuid.uuid4())
    register_operation(operation_id)
    
    # Initialize file_path to prevent UnboundLocalError
    file_path = None
    workbook = None
    
    # Initialize start_time for tracking execution time
    start_time = datetime.now()
    
    try:
        # Extract the database connection parameters using attribute access
        # ExportParameters is a Pydantic model, not a dictionary
        server = params.server
        database = params.database
        username = params.username
        password = params.password
        
        # Connect to the database with the correct parameters using with statement
        # get_db_connection is a context manager and needs to be used with 'with'
        with get_db_connection(server, database, username, password) as conn:
            # Get actual attribute names from params to figure out what fields are available
            available_attrs = dir(params)
            export_logger.debug(f"[{operation_id}] Available attributes in params: {available_attrs}")
            
            # Step A: Get query parameters - use proper attribute access based on actual field names
            query_params = {
                # Use the correct field names from the ExportParameters model
                'year': '',  # Not used in the model
                'month_from': int(params.fromMonth),
                'month_to': int(params.toMonth),
                'hs_code': params.hs if hasattr(params, 'hs') else '',
                'country': params.forcount if hasattr(params, 'forcount') else '',
                'port': params.port if hasattr(params, 'port') else '',
                'exporter': params.expCmp if hasattr(params, 'expCmp') else '',
                'max_rows': getattr(params, 'max_rows', None)
            }
            
            # Step B: Create filename
            first_row_hs = get_first_row_hs_code(conn, operation_id)

            # Look at the actual structure of params to ensure we're using correct access
            # Convert params to a dict if it's a Pydantic model - create_filename expects a dict
            params_dict = params
            if hasattr(params, 'dict'):
                # Convert Pydantic model to dictionary
                params_dict = params.dict()
            
            # Create filename based on parameters
            filename = create_filename(params_dict, first_row_hs)
            
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
            
            # Set initial column widths
            column_widths = get_column_widths()
            set_column_widths(worksheet, columns, column_widths)
            
            # Get total row count for progress tracking
            total_count = get_total_row_count(conn, operation_id)
            export_logger.info(f"[{operation_id}] Total rows to export: {total_count}")
            
            # Check if the total count exceeds Excel's maximum row limit
            # Skip the check if we're already limiting the rows
            max_rows = getattr(params, 'max_rows', None)
            if max_rows is None:
                row_limit_result = check_row_limit(total_count, operation_id)
                
                # If limit exceeded, we need to return this information so frontend can confirm with user
                if row_limit_result["exceeds_limit"]:
                    # We'll add a special header to our response to indicate row limit exceeded
                    cleanup_on_error(workbook, file_path)
                    
                    # Return a dictionary with row limit information
                    # The caller will handle returning this to the frontend
                    # The structure matches what the frontend expects
                    return {
                        "excel_limit_exceeded": True,
                        "operation_id": operation_id,
                        "total_rows": row_limit_result["total_rows"],
                        "max_rows": row_limit_result["max_rows"],
                        "message": row_limit_result["message"]
                    }
            else:
                # Log that we're using a limited number of rows
                export_logger.info(f"[{operation_id}] Limiting export to {max_rows} rows (out of {total_count} total)")
                # Update total_count to the max_rows for progress tracking
                total_count = min(total_count, max_rows)
            
            # Optimize memory usage by using server-side cursor
            conn.execute("SET NOCOUNT ON")
            
            # Variables to track total rows processed
            total_rows = 0
            offset = 0

            # Loop until all data is processed
            while total_rows < total_count:
                # Check if operation has been cancelled before processing each chunk
                if is_operation_cancelled(operation_id):
                    export_logger.info(f"[{operation_id}] Operation cancelled during Excel generation at row {total_rows}/{total_count}")
                    cleanup_on_error(workbook, file_path)
                    raise Exception("Operation cancelled by user")
            
                chunk_start = datetime.now()
                
                # Fetch data in chunks
                cursor = fetch_data_in_chunks(conn, 100000, offset, operation_id, max_rows)
                
                # Process all rows from this chunk's cursor
                rows = cursor.fetchall()
                cursor.close()
                
                if not rows:
                    break
                    
                # Process this chunk of data
                chunk_size_actual = len(rows)
                row_idx = total_rows + 1  # Start from after the last processed row (1-based for Excel)
                
                # Write the chunk data to Excel
                # Create a text format for fields that need to preserve leading zeros
                text_format = workbook.add_format({
                    'font_name': 'Times New Roman',
                    'font_size': 10,
                    'border': 1,
                    'num_format': '@'  # Set as text format to preserve leading zeros
                })
                
                # Identify columns that need to preserve leading zeros or specific formatting
                # This is critical for ensuring data integrity similar to CopyFromRecordset in VBA
                special_format_columns = {
                    # HS Code related columns - commonly have leading zeros
                    'HS_Code': text_format,
                    'HS4': text_format,
                    'Hs_Code': text_format,  # Different case variations
                    # Identification numbers and codes - need exact preservation
                    'iec': text_format,
                    'SB_NO': text_format,
                    'Invoice_no': text_format,
                    'Item_no': text_format,
                    # Additional columns that might contain codes with leading zeros
                    'Port Code': text_format,
                    'Exporter Code': text_format,
                    'Importer Code': text_format,
                    'PIN Code': text_format,
                    'Zip Code': text_format,
                    'Postal Code': text_format,
                    # Any column with 'code' in the name might need text formatting
                    'code': text_format
                }
                
                # Map column names to their indices
                column_indices = {col_name: idx for idx, col_name in enumerate(columns)}
                
                for row in rows:
                    # Check for cancellation periodically 
                    if row_idx % 1000 == 0 and is_operation_cancelled(operation_id):
                        export_logger.info(f"[{operation_id}] Operation cancelled during Excel data writing at row {row_idx}/{total_count}")
                        cleanup_on_error(workbook, file_path)
                        raise Exception("Operation cancelled by user")
                        
                    # Only set row height for every 10th row to improve performance
                    if row_idx % 10 == 0:
                        worksheet.set_row(row_idx, 15)
                    
                    for col_idx, value in enumerate(row):
                        # Get column name for current column
                        col_name = columns[col_idx] if col_idx < len(columns) else f"Column_{col_idx}"
                        
                        # Skip this cell if the value is None to avoid unintended data conversion
                        if value is None:
                            worksheet.write_blank(row_idx, col_idx, None, data_format)
                            continue
                            
                        # Handle special case for SB_Date column
                        if col_idx == 2 and value:  # SB_Date column
                            # Ensure it's actually a date before using date_format
                            if isinstance(value, (datetime, date)):
                                worksheet.write_datetime(row_idx, col_idx, value, date_format)
                            else:
                                # Try to convert string date to datetime
                                try:
                                    if isinstance(value, str) and len(value) >= 8:
                                        # Try to parse as date
                                        dt_value = pd.to_datetime(value)
                                        worksheet.write_datetime(row_idx, col_idx, dt_value, date_format)
                                    else:
                                        worksheet.write(row_idx, col_idx, value, data_format)
                                except:
                                    # If conversion fails, write as is
                                    worksheet.write(row_idx, col_idx, value, data_format)
                        # Use text format for columns that need to preserve leading zeros or exact formatting
                        elif col_idx < len(columns) and (
                            # Check if column is in our predefined special format list
                            col_name in special_format_columns or
                            # Or if column name contains 'code' (case insensitive)
                            'code' in col_name.lower() or
                            # Or if column name contains identifiers that should be preserved exactly
                            any(id_term in col_name.lower() for id_term in ['id', '_no', 'number', 'iec', 'sb_no'])
                        ):
                            # Ensure value is treated as text to preserve exact format
                            str_value = str(value)
                            # Force Excel to treat the value as text
                            worksheet.write_string(row_idx, col_idx, str_value, text_format)
                        # Handle numeric values appropriately
                        elif isinstance(value, (int, float, Decimal)):
                            worksheet.write_number(row_idx, col_idx, value, data_format)
                        # Handle boolean values
                        elif isinstance(value, bool):
                            worksheet.write_boolean(row_idx, col_idx, value, data_format)
                        # Handle string values - ensure proper encoding/escaping
                        elif isinstance(value, str):
                            # Clean/escape any problematic characters
                            clean_value = value.replace('\x00', '').replace('\r\n', '\n').strip()
                            worksheet.write_string(row_idx, col_idx, clean_value, data_format)
                        # Default fallback for any other types
                        else:
                            worksheet.write(row_idx, col_idx, value, data_format)
                    row_idx += 1
                
                # Update counters for the next chunk
                rows_processed = len(rows)
                total_rows += rows_processed
                offset += 100000
                
                # Calculate chunk processing time
                chunk_time = (datetime.now() - chunk_start).total_seconds()
                
                # Update operation progress in the tracker directly with accumulated total
                update_operation_progress(operation_id, total_rows, total_count)
                
                # Log the current chunk progress with accumulated totals
                export_logger.info(
                    f"[{operation_id}] Processed chunk of {rows_processed} rows in {chunk_time:.6f} seconds. Total: {total_rows}/{total_count} ({min(100, int((total_rows / total_count) * 100))}%)",
                    extra={
                        "operation_id": operation_id,
                        "rows_processed": rows_processed,
                        "chunk_time": chunk_time,
                        "total_rows": total_rows,
                        "total_count": total_count,
                        "progress_pct": min(100, int((total_rows / total_count) * 100))
                    }
                )
            
            # Freeze the header row
            worksheet.freeze_panes(1, 0)
            
            # Enhanced sampling for column auto-fitting
            # We'll take larger samples from beginning, middle, and end of the dataset
            # and also specifically sample rows with potentially long content
            sample_rows = []
            sample_size = 3000  # Further increased sample size for better representation
            
            # Only sample if we have data
            if total_rows > 0:
                export_logger.info(f"[{operation_id}] Collecting samples for column auto-fitting from {total_rows} total rows")
                
                # For small datasets, use all rows
                if total_rows <= 3000:
                    conn.execute("SET NOCOUNT ON")
                    sample_cursor = fetch_data_in_chunks(conn, total_rows, 0, operation_id)
                    sample_rows = sample_cursor.fetchall()
                    sample_cursor.close()
                else:
                    # For large datasets, sample strategically from beginning, middle and end
                    # This gives better representation of data variations throughout the dataset
                    
                    # Beginning sample
                    conn.execute("SET NOCOUNT ON")
                    begin_cursor = fetch_data_in_chunks(conn, sample_size, 0, operation_id)
                    begin_rows = begin_cursor.fetchall()
                    begin_cursor.close()
                    sample_rows.extend(begin_rows)
                    
                    # Middle sample (if dataset is large enough)
                    if total_rows > sample_size * 2:
                        middle_offset = max(0, (total_rows // 2) - (sample_size // 2))
                        conn.execute("SET NOCOUNT ON")
                        middle_cursor = fetch_data_in_chunks(conn, sample_size, middle_offset, operation_id)
                        middle_rows = middle_cursor.fetchall()
                        middle_cursor.close()
                        sample_rows.extend(middle_rows)
                    
                    # End sample (if dataset is large enough)
                    if total_rows > sample_size:
                        end_offset = max(0, total_rows - sample_size)
                        conn.execute("SET NOCOUNT ON")
                        end_cursor = fetch_data_in_chunks(conn, sample_size, end_offset, operation_id)
                        end_rows = end_cursor.fetchall()
                        end_cursor.close()
                        sample_rows.extend(end_rows)
                
                # Additional targeted sampling for specific columns with potentially long content
                # This helps ensure we capture rows with the longest content for proper sizing
                long_text_columns = ['Product', 'Indian Exporter Name', 'Foreign Importer Name', 
                                    'Exporter Add1', 'Exporter Add2', 'FOR_Add1']
                
                # Find column indices for long text columns
                long_text_indices = []
                for col_name in long_text_columns:
                    if col_name in columns:
                        long_text_indices.append(columns.index(col_name))
                
                if long_text_indices:
                    export_logger.info(f"[{operation_id}] Performing enhanced targeted sampling for long text columns")
                    
                    # For each long text column, try to find rows with long content
                    for col_idx in long_text_indices:
                        col_name = columns[col_idx]
                        # Query to find rows with long content in this column
                        # Increased sample size and lowered threshold to capture more varied content
                        try:
                            # First get the longest content rows
                            query = f"SELECT TOP 150 * FROM {settings.EXPORT_VIEW} WHERE LEN(CONVERT(NVARCHAR(MAX), [{col_name}])) > 40 ORDER BY LEN(CONVERT(NVARCHAR(MAX), [{col_name}])) DESC"
                            conn.execute("SET NOCOUNT ON")
                            cursor = conn.cursor()
                            cursor.execute(query)
                            long_content_rows = cursor.fetchall()
                            cursor.close()
                            
                            if long_content_rows:
                                export_logger.info(f"[{operation_id}] Found {len(long_content_rows)} rows with long content in column '{col_name}'")
                                sample_rows.extend(long_content_rows)
                                
                            # Also get rows with medium-length content for better representation
                            query = f"SELECT TOP 50 * FROM {settings.EXPORT_VIEW} WHERE LEN(CONVERT(NVARCHAR(MAX), [{col_name}])) BETWEEN 20 AND 40 ORDER BY LEN(CONVERT(NVARCHAR(MAX), [{col_name}])) DESC"
                            conn.execute("SET NOCOUNT ON")
                            cursor = conn.cursor()
                            cursor.execute(query)
                            medium_content_rows = cursor.fetchall()
                            cursor.close()
                            
                            if medium_content_rows:
                                export_logger.info(f"[{operation_id}] Found {len(medium_content_rows)} rows with medium content in column '{col_name}'")
                                sample_rows.extend(medium_content_rows)
                        except Exception as e:
                            # If the targeted query fails, log and continue with regular samples
                            export_logger.warning(f"[{operation_id}] Error during targeted sampling for column '{col_name}': {str(e)}")
        
            # Apply auto-fit based on the enhanced sampled data
            export_logger.info(f"[{operation_id}] Applying auto-fit to columns based on {len(sample_rows)} sampled rows")
            autofit_columns(worksheet, sample_rows, columns)
            
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
        cleanup_on_error(workbook, file_path)
        
        # Don't mark as completed if there was an error
        # The cleanup thread will handle it after the timeout
        raise Exception(f"Error generating Excel file: {str(e)}")