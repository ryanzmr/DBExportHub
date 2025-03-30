import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime

from ..config import settings
from ..database import get_db_connection, execute_query, query_to_dataframe
from ..logger import db_logger, log_execution_time, mask_sensitive_data

# Cache to store the last executed query parameters and timestamp
_query_cache = {
    "params": None,
    "timestamp": None,
    "record_count": 0
}

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

def _check_temp_table_exists(conn):
    """Check if the temporary table exists and has data"""
    try:
        cursor = conn.cursor()
        cursor.execute(f"SELECT TOP 1 * FROM {settings.EXPORT_VIEW}")
        has_data = cursor.fetchone() is not None
        cursor.close()
        return has_data
    except Exception:
        return False

@log_execution_time
def execute_export_procedure(conn, params, operation_id):
    """Execute the export stored procedure with the given parameters"""
    # Import here to avoid circular imports
    from .operation_tracker import is_operation_cancelled
    
    # Check if operation has been cancelled before executing procedure
    if is_operation_cancelled(operation_id):
        db_logger.info(f"[{operation_id}] Operation cancelled before executing stored procedure")
        raise Exception("Operation cancelled by user")
    
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
    
    # Check if we need to re-execute the stored procedure
    cache_valid = _params_match(_query_cache["params"], params) and _check_temp_table_exists(conn)
    
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
    from .operation_tracker import is_operation_cancelled
    
    # Check if operation has been cancelled before executing query
    if is_operation_cancelled(operation_id):
        db_logger.info(f"[{operation_id}] Preview operation cancelled before query execution")
        raise Exception("Operation cancelled by user")
    
    preview_query = f"SELECT TOP {params.max_records} * FROM {settings.EXPORT_VIEW}"
    db_logger.debug(f"[{operation_id}] Executing preview query: {preview_query}", extra={"operation_id": operation_id})
    
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

def get_first_row_hs_code(conn, operation_id=None):
    """Get the first row's HS code for the filename"""
    # Check for cancellation if operation_id is provided
    if operation_id:
        # Import here to avoid circular imports
        from .operation_tracker import is_operation_cancelled
        if is_operation_cancelled(operation_id):
            db_logger.info(f"[{operation_id}] Operation cancelled before getting HS code")
            raise Exception("Operation cancelled by user")
    
    hs_code_query = f"SELECT TOP 1 [Hs_Code] FROM {settings.EXPORT_VIEW}"
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
        from .operation_tracker import is_operation_cancelled
        if is_operation_cancelled(operation_id):
            db_logger.info(f"[{operation_id}] Operation cancelled before getting column headers")
            raise Exception("Operation cancelled by user")
    
    cursor = conn.cursor()
    cursor.execute(f"SELECT TOP 1 * FROM {settings.EXPORT_VIEW}")
    columns = [column[0] for column in cursor.description]
    cursor.close()
    return columns

def get_total_row_count(conn, operation_id=None):
    """Get the total row count from the export view"""
    # Check for cancellation if operation_id is provided
    if operation_id:
        # Import here to avoid circular imports
        from .operation_tracker import is_operation_cancelled
        if is_operation_cancelled(operation_id):
            db_logger.info(f"[{operation_id}] Operation cancelled before getting row count")
            raise Exception("Operation cancelled by user")
    
    count_cursor = conn.cursor()
    count_cursor.execute(f"SELECT COUNT(*) FROM {settings.EXPORT_VIEW}")
    total_count = count_cursor.fetchone()[0]
    count_cursor.close()
    return total_count

def fetch_data_in_chunks(conn, chunk_size, offset, operation_id):
    """Fetch data from the export view in chunks"""
    # Import here to avoid circular imports
    from .operation_tracker import is_operation_cancelled
    
    # Check if operation has been cancelled before executing query
    if is_operation_cancelled(operation_id):
        db_logger.info(f"[{operation_id}] Operation cancelled before fetching chunk at offset {offset}")
        raise Exception("Operation cancelled by user")
        
    query = f"SELECT * FROM {settings.EXPORT_VIEW} ORDER BY (SELECT NULL) OFFSET {offset} ROWS FETCH NEXT {chunk_size} ROWS ONLY"
    
    # Use cursor with optimized fetch size
    cursor = conn.cursor()
    cursor.execute(query)
    
    # Set cursor options for better performance
    cursor.arraysize = 10000  # Increased batch size for better performance
    cursor.fast_executemany = True
    
    return cursor