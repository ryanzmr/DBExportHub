import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime
import threading

from ..core.config import settings
from ..core.database import get_db_connection, execute_query, query_to_dataframe
from ..core.logger import db_logger, log_execution_time, mask_sensitive_data

# Cache to store the last executed query parameters and timestamp
_query_cache = {
    "params": None,
    "timestamp": None,
    "record_count": 0
}

# Lock for thread-safe operations
_operations_lock = threading.Lock()

def _params_match(cached_params, new_params):
    """Compare two sets of parameters to determine if they match"""
    if not cached_params:
        return False
        
    # Compare essential filter parameters
    key_params = [
        "fromMonth", "ToMonth", "hs", "prod", "Iec",
        "ExpCmp", "forcount", "forname", "port"
    ]
    
    for key in key_params:
        if getattr(cached_params, key, None) != getattr(new_params, key, None):
            return False
    
    return True

def _check_temp_table_exists(conn, view_name=None):
    """Check if the temporary table exists and has data"""
    view_to_check = view_name or settings.EXPORT_VIEW
    try:
        cursor = conn.cursor()
        cursor.execute(f"SELECT TOP 1 * FROM {view_to_check}")
        has_data = cursor.fetchone() is not None
        cursor.close()
        return has_data
    except Exception:
        return False

@log_execution_time
def execute_export_procedure(conn, params, operation_id):
    """Execute the export stored procedure with the given parameters"""
    # Import here to avoid circular imports
    from ..core.operation_tracker import is_operation_cancelled
    
    # Check if operation has been cancelled before executing procedure
    if is_operation_cancelled(operation_id):
        db_logger.info(f"[{operation_id}] Operation cancelled before executing stored procedure")
        raise Exception("Operation cancelled by user")
    
    # Determine which view to use based on selectedView parameter
    selected_view_key = params.selectedView or "EXPORT_VIEW_1"
    selected_view = settings.EXPORT_VIEWS.get(selected_view_key, {}).get("value", settings.EXPORT_VIEW)
    
    db_logger.info(
        f"[{operation_id}] Using view: {selected_view}",
        extra={"operation_id": operation_id, "selected_view": selected_view}
    )
      # Build the query parameters for the stored procedure
    sp_params = {
        "fromMonth": params.fromMonth,
        "ToMonth": params.toMonth,
        "hs": params.hs or "",
        "prod": params.prod or "",
        "Iec": params.iec or "",
        "ExpCmp": params.expCmp or "",
        "forcount": params.forcount or "",
        "forname": params.forname or "",
        "port": params.port or ""
    }
    
    # Determine which view to use
    selected_view_key = params.selectedView or "EXPORT_VIEW_1"
    selected_view = settings.EXPORT_VIEWS.get(selected_view_key, {}).get("value", settings.EXPORT_VIEW)
    
    # Check if we need to re-execute the stored procedure
    cache_valid = _params_match(_query_cache["params"], params) and _check_temp_table_exists(conn, selected_view)
    
    if not cache_valid:
        db_logger.info(
            f"[{operation_id}] Cache miss or invalid, executing stored procedure",
            extra={
                "operation_id": operation_id,
                "cached": False,
                "sp_params": mask_sensitive_data(sp_params)
            }
        )
        
        sp_start_time = datetime.now()
        
        # Execute the stored procedure to populate the temp table
        param_list = list(sp_params.values())
        sp_call = f"EXEC {settings.EXPORT_STORED_PROCEDURE} ?, ?, ?, ?, ?, ?, ?, ?, ?"
        
        db_logger.debug(f"[{operation_id}] Executing stored procedure: {sp_call}", extra={"operation_id": operation_id})
        
        # Use cursor directly for executing stored procedure
        cursor = conn.cursor()
        cursor.execute(sp_call, param_list)
        conn.commit()
        cursor.close()
        
        sp_execution_time = (datetime.now() - sp_start_time).total_seconds()
        db_logger.info(
            f"[{operation_id}] Stored procedure executed in {sp_execution_time:.2f} seconds",
            extra={
                "operation_id": operation_id,
                "execution_time": sp_execution_time,
                "procedure": settings.EXPORT_STORED_PROCEDURE
            }
        )
        
        # Update the cache
        _query_cache["params"] = params
        _query_cache["timestamp"] = datetime.now()
        
        # Get the total record count for the cache
        count_cursor = conn.cursor()
        count_cursor.execute(f"SELECT COUNT(*) FROM {settings.EXPORT_VIEW}")
        record_count = count_cursor.fetchone()[0]
        _query_cache["record_count"] = record_count
        count_cursor.close()
        
        db_logger.info(
            f"[{operation_id}] Total records found: {record_count}",
            extra={
                "operation_id": operation_id,
                "record_count": record_count
            }
        )
        
        return record_count, False  # Return record count and cache status
    else:
        db_logger.info(
            f"[{operation_id}] Using cached data. Last query timestamp: {_query_cache['timestamp']}",
            extra={
                "operation_id": operation_id,
                "cached": True,
                "cache_timestamp": _query_cache['timestamp'].isoformat() if isinstance(_query_cache['timestamp'], datetime) else str(_query_cache['timestamp']),
                "record_count": _query_cache["record_count"]
            }
        )
        return _query_cache["record_count"], True  # Return cached record count and cache status

@log_execution_time
def get_preview_data(conn, params, operation_id):
    """Query the temp table for preview data"""
    # Import here to avoid circular imports
    from ..core.operation_tracker import is_operation_cancelled
    
    # Check if operation has been cancelled before executing query
    if is_operation_cancelled(operation_id):
        db_logger.info(f"[{operation_id}] Preview operation cancelled before query execution")
        raise Exception("Operation cancelled by user")
    
    # Determine which view to use
    selected_view_key = params.selectedView or "EXPORT_VIEW_1"
    selected_view = settings.EXPORT_VIEWS.get(selected_view_key, {}).get("value", settings.EXPORT_VIEW)
    
    preview_query = f"SELECT TOP {settings.PREVIEW_SAMPLE_SIZE} * FROM {selected_view}"
    db_logger.debug(
        f"[{operation_id}] Executing preview query on view {selected_view}: {preview_query}", 
        extra={"operation_id": operation_id, "selected_view": selected_view}
    )
    
    query_start_time = datetime.now()
    
    # Execute the query and get the data as a DataFrame
    df = query_to_dataframe(conn, preview_query)
    
    # Check if operation has been cancelled after executing query
    if is_operation_cancelled(operation_id):
        db_logger.info(f"[{operation_id}] Preview operation cancelled after query execution")
        raise Exception("Operation cancelled by user")
    
    query_execution_time = (datetime.now() - query_start_time).total_seconds()
    db_logger.info(
        f"[{operation_id}] Preview query executed in {query_execution_time:.2f} seconds",
        extra={
            "operation_id": operation_id,
            "execution_time": query_execution_time,
            "rows_returned": len(df)
        }
    )
    
    return df

def get_first_row_hs_code(conn, operation_id=None, view_name=None):
    """Get the first row's HS code for the filename"""
    # Check for cancellation if operation_id is provided
    if operation_id:
        # Import here to avoid circular imports
        from ..core.operation_tracker import is_operation_cancelled
        if is_operation_cancelled(operation_id):
            db_logger.info(f"[{operation_id}] Operation cancelled before getting HS code")
            raise Exception("Operation cancelled by user")
    
    view_to_query = view_name or settings.EXPORT_VIEW
    hs_code_query = f"SELECT TOP 1 [Hs_Code] FROM {view_to_query}"
    cursor = conn.cursor()
    cursor.execute(hs_code_query)
    first_row_hs = cursor.fetchone()
    cursor.close()
    return first_row_hs

def get_column_headers(conn, operation_id=None):
    """Get column headers from the export view"""
    # Check for cancellation if operation_id is provided
    if operation_id:
        # Import here to avoid circular imports
        from ..core.operation_tracker import is_operation_cancelled
        if is_operation_cancelled(operation_id):
            db_logger.info(f"[{operation_id}] Operation cancelled before getting column headers")
            raise Exception("Operation cancelled by user")
    
    cursor = conn.cursor()
    cursor.execute(f"SELECT TOP 1 * FROM {settings.EXPORT_VIEW}")
    columns = [column[0] for column in cursor.description]
    cursor.close()
    return columns

def get_total_row_count(conn, operation_id=None, view_name=None):
    """Get the total row count from the export view"""
    # Check for cancellation if operation_id is provided
    if operation_id:
        # Import here to avoid circular imports
        from ..core.operation_tracker import is_operation_cancelled
        if is_operation_cancelled(operation_id):
            db_logger.info(f"[{operation_id}] Operation cancelled before getting row count")
            raise Exception("Operation cancelled by user")
    
    view_to_query = view_name or settings.EXPORT_VIEW
    count_cursor = conn.cursor()
    count_cursor.execute(f"SELECT COUNT(*) FROM {view_to_query}")
    total_count = count_cursor.fetchone()[0]
    count_cursor.close()
    return total_count

def fetch_data_in_chunks(conn, chunk_size, offset, operation_id):
    """
    DEPRECATED: Old offset-based method - use fetch_data_in_chunks_export instead
    Kept for backward compatibility only
    """
    # Import here to avoid circular imports
    from ..core.operation_tracker import is_operation_cancelled
    
    # Check if operation has been cancelled before executing query
    if is_operation_cancelled(operation_id):
        db_logger.info(f"[{operation_id}] Operation cancelled before fetching chunk at offset {offset}")
        raise Exception("Operation cancelled by user")
        
    query = f"SELECT * FROM {settings.EXPORT_VIEW} ORDER BY (SELECT NULL) OFFSET {offset} ROWS FETCH NEXT {chunk_size} ROWS ONLY"
    
    # Use cursor with optimized fetch size
    cursor = conn.cursor()
    cursor.execute(query)
    # Set cursor options for better performance - now configurable
    cursor.arraysize = settings.DB_CURSOR_ARRAY_SIZE  # Configurable batch size for better performance
    cursor.fast_executemany = True
    
    return cursor

@log_execution_time
def fetch_data_in_chunks_export(conn, operation_id, batch_size=None, params=None):
    """Fetch data in chunks to avoid memory issues - using optimized cursor-based approach like the import system"""
    # Import here to avoid circular imports
    from ..core.operation_tracker import is_operation_cancelled, get_operation_details
    
    if batch_size is None:
        batch_size = settings.get_batch_size('export')
    
    # Determine which view to use
    selected_view = settings.EXPORT_VIEW
    if params and hasattr(params, 'selectedView'):
        selected_view_key = params.selectedView or "EXPORT_VIEW_1"
        selected_view = settings.EXPORT_VIEWS.get(selected_view_key, {}).get("value", settings.EXPORT_VIEW)
    
    # Get operation details which should already have total_count cached
    operation_details = get_operation_details(operation_id)
    
    # Use cached total count if available, otherwise fetch it (fallback)
    total_count = operation_details.get('total_count') if operation_details else None
    if total_count is None:
        total_count = get_total_row_count(conn, operation_id, selected_view)
        # Cache it if we had to look it up
        if operation_details:
            with _operations_lock:
                operation_details['total_count'] = total_count
    
    # Check if we need to limit the number of rows due to Excel row limit
    excel_row_limit = settings.get_excel_row_limit()
    
    # Check operation details for max_rows override (e.g., user confirmed Excel limit)
    max_rows = operation_details.get('max_rows', excel_row_limit) if operation_details else excel_row_limit
    
    # Use the smaller of total_count, max_rows, and Excel row limit
    rows_to_fetch = min(total_count, max_rows, excel_row_limit)
    
    # Calculate number of batches based on the limited row count
    num_batches = (rows_to_fetch + batch_size - 1) // batch_size
    
    # Log message about how many rows we're actually fetching
    if rows_to_fetch < total_count:
        db_logger.info(
            f"[{operation_id}] Limiting to {rows_to_fetch} rows (of {total_count} total) in {num_batches} batches of {batch_size}",
            extra={
                "operation_id": operation_id,
                "total_count": total_count,
                "rows_to_fetch": rows_to_fetch,
                "num_batches": num_batches,
                "batch_size": batch_size
            }
        )
    else:
        db_logger.info(
            f"[{operation_id}] Fetching {total_count} rows in {num_batches} batches of {batch_size}",
            extra={
                "operation_id": operation_id,
                "total_count": total_count,
                "num_batches": num_batches,
                "batch_size": batch_size
            }
        )
    
    # Execute one query to get all the data and use a cursor-based approach like the import system
    # Build the main query once
    query = f"SELECT * FROM {selected_view}"
    
    db_logger.debug(
        f"[{operation_id}] Executing main query on view {selected_view} and setting up cursor",
        extra={
            "operation_id": operation_id,
            "rows_to_fetch": rows_to_fetch,
            "selected_view": selected_view
        }
    )
    
    # Set up cursor with optimized fetch settings
    cursor = conn.cursor()
    cursor.execute(query)
    # Set cursor options for better performance - now configurable
    cursor.arraysize = settings.DB_CURSOR_ARRAY_SIZE  # Configurable batch size for better performance
    
    try:
        # Process data in batches using cursor-based approach
        rows_processed = 0
        batch_num = 0
        
        while rows_processed < rows_to_fetch:
            # Check if operation has been cancelled
            if is_operation_cancelled(operation_id):
                db_logger.info(f"[{operation_id}] Data fetch cancelled during batch {batch_num + 1}/{num_batches}")
                raise Exception("Operation cancelled by user")
            
            # Calculate how many rows we should fetch in this batch
            current_batch_size = min(batch_size, rows_to_fetch - rows_processed)
            if current_batch_size <= 0:
                break
            
            batch_num += 1
            
            db_logger.debug(
                f"[{operation_id}] Fetching batch {batch_num}/{num_batches}",
                extra={
                    "operation_id": operation_id,
                    "batch_num": batch_num,
                    "rows_processed": rows_processed
                }
            )
            
            # Fetch the batch from cursor
            start_time = datetime.now()
            rows = cursor.fetchmany(current_batch_size)
            
            # If no rows returned, we're done
            if not rows:
                break
                
            # Convert to DataFrame
            columns = [column[0] for column in cursor.description]
            df = pd.DataFrame.from_records(rows, columns=columns)
            
            execution_time = (datetime.now() - start_time).total_seconds()
            rows_processed += len(df)
            
            # Log batch fetch
            db_logger.info(
                f"[{operation_id}] Batch {batch_num}/{num_batches} fetched in {execution_time:.2f} seconds, returned {len(df)} rows",
                extra={
                    "operation_id": operation_id,
                    "batch_num": batch_num,
                    "execution_time": execution_time,
                    "row_count": len(df)
                }
            )
            
            yield df
    finally:
        # Always close the cursor
        cursor.close()