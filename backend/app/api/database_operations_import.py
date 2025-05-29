# Import-specific database operations
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime

from ..config import settings
from ..database import get_db_connection, execute_query, query_to_dataframe
from ..logger import import_logger, log_execution_time, mask_sensitive_data

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
        "impCmp", "forcount", "forname", "port"
    ]
    
    for key in key_params:
        if getattr(cached_params, key, None) != getattr(new_params, key, None):
            return False
    
    return True

def _check_temp_table_exists(conn):
    """Check if the temporary table exists and has data"""
    try:
        cursor = conn.cursor()
        cursor.execute(f"SELECT TOP 1 * FROM {settings.IMPORT_VIEW}")
        has_data = cursor.fetchone() is not None
        cursor.close()
        return has_data
    except Exception:
        return False

@log_execution_time
def execute_import_procedure(conn, params, operation_id):
    """Execute the import stored procedure with the given parameters"""
    # Import here to avoid circular imports
    from .operation_tracker import is_operation_cancelled
    
    # Check if operation has been cancelled before executing procedure
    if is_operation_cancelled(operation_id):
        import_logger.info(f"[{operation_id}] Operation cancelled before executing stored procedure")
        raise Exception("Operation cancelled by user")
    
    # Build the query parameters for the stored procedure
    sp_params = {
        "fromMonth": params.fromMonth,
        "ToMonth": params.toMonth,
        "hs": params.hs or "",
        "prod": params.prod or "",
        "Iec": params.iec or "",
        "ImpCmp": params.impCmp or "",  # Changed from ExpCmp to ImpCmp
        "forcount": params.forcount or "",
        "forname": params.forname or "",
        "port": params.port or ""
    }
    
    # Check if we need to re-execute the stored procedure
    cache_valid = _params_match(_query_cache["params"], params) and _check_temp_table_exists(conn)
    
    if not cache_valid:
        import_logger.info(
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
        sp_call = f"EXEC {settings.IMPORT_STORED_PROCEDURE} ?, ?, ?, ?, ?, ?, ?, ?, ?"
        
        import_logger.debug(f"[{operation_id}] Executing stored procedure: {sp_call}", extra={"operation_id": operation_id})
        
        # Use cursor directly for executing stored procedure
        cursor = conn.cursor()
        cursor.execute(sp_call, param_list)
        conn.commit()
        cursor.close()
        
        sp_execution_time = (datetime.now() - sp_start_time).total_seconds()
        import_logger.info(
            f"[{operation_id}] Stored procedure executed in {sp_execution_time:.2f} seconds",
            extra={
                "operation_id": operation_id,
                "execution_time": sp_execution_time
            }
        )
        
        # Update cache
        _query_cache["params"] = params
        _query_cache["timestamp"] = datetime.now()
        
        # Get record count
        record_count = get_total_row_count_import(conn, operation_id)
        _query_cache["record_count"] = record_count
        
        return record_count, False
    else:
        # Use cached results
        import_logger.info(
            f"[{operation_id}] Using cached results from previous query",
            extra={
                "operation_id": operation_id,
                "cached": True,
                "cache_age": (datetime.now() - _query_cache["timestamp"]).total_seconds()
            }
        )
        
        return _query_cache["record_count"], True

@log_execution_time
def get_preview_data_import(conn, operation_id, sample_size=100):
    """Get a limited number of rows for preview
    
    Args:
        conn: Database connection
        operation_id: Operation ID for tracking
        sample_size: Number of rows to fetch (default 100)
    
    Returns:
        DataFrame with preview data
    """
    # Import here to avoid circular imports
    from .operation_tracker import is_operation_cancelled, update_operation_progress
    
    # Check if operation has been cancelled
    if is_operation_cancelled(operation_id):
        import_logger.info(f"[{operation_id}] Preview data fetch cancelled")
        raise Exception("Operation cancelled by user")
    
    # Update progress
    update_operation_progress(operation_id, 0, 100)
    
    # Get preview data with configurable row limit
    query = f"SELECT TOP {sample_size} * FROM {settings.IMPORT_VIEW} ORDER BY [DATE]"
    
    import_logger.debug(f"[{operation_id}] Executing preview query: {query}", extra={"operation_id": operation_id})
    
    # Execute query and convert to DataFrame
    start_time = datetime.now()
    df = query_to_dataframe(conn, query)
    execution_time = (datetime.now() - start_time).total_seconds()
    
    # Log query execution
    import_logger.info(
        f"[{operation_id}] Preview query executed in {execution_time:.2f} seconds, returned {len(df)} rows",
        extra={
            "operation_id": operation_id,
            "execution_time": execution_time,
            "row_count": len(df)
        }
    )
    
    # Update progress
    update_operation_progress(operation_id, 100, 100)
    
    return df

@log_execution_time
def get_total_row_count_import(conn, operation_id):
    """Get the total number of rows in the result set"""
    query = f"SELECT COUNT(*) FROM {settings.IMPORT_VIEW}"
    
    import_logger.debug(f"[{operation_id}] Executing count query: {query}", extra={"operation_id": operation_id})
    
    # Execute query
    cursor = conn.cursor()
    cursor.execute(query)
    count = cursor.fetchone()[0]
    cursor.close()
    
    import_logger.info(f"[{operation_id}] Total row count: {count}", extra={"operation_id": operation_id, "row_count": count})
    
    return count

@log_execution_time
def get_column_headers_import(conn, operation_id):
    """Get the column headers from the result set"""
    query = f"SELECT TOP 0 * FROM {settings.IMPORT_VIEW}"
    
    import_logger.debug(f"[{operation_id}] Executing headers query: {query}", extra={"operation_id": operation_id})
    
    # Execute query
    cursor = conn.cursor()
    cursor.execute(query)
    headers = [column[0] for column in cursor.description]
    cursor.close()
    
    import_logger.debug(f"[{operation_id}] Column headers: {headers}", extra={"operation_id": operation_id})
    
    return headers

@log_execution_time
def get_first_row_hs_code_import(conn, operation_id):
    """Get the HS code from the first row for filename generation"""
    query = f"SELECT TOP 1 hs_code FROM {settings.IMPORT_VIEW}"
    
    import_logger.debug(f"[{operation_id}] Executing HS code query: {query}", extra={"operation_id": operation_id})
    
    # Execute query
    cursor = conn.cursor()
    cursor.execute(query)
    row = cursor.fetchone()
    cursor.close()
    
    hs_code = row[0] if row else None
    import_logger.debug(f"[{operation_id}] First row HS code: {hs_code}", extra={"operation_id": operation_id})
    
    return [hs_code] if hs_code else [None]

@log_execution_time
def fetch_data_in_chunks_import(conn, operation_id, batch_size=None):
    """Fetch data in chunks to avoid memory issues - using cursor-based approach like the export system"""
    # Import here to avoid circular imports
    from .operation_tracker import is_operation_cancelled, get_operation_details
    
    if batch_size is None:
        batch_size = settings.DB_FETCH_BATCH_SIZE
    
    # Get operation details which should already have total_count cached
    operation_details = get_operation_details(operation_id)
    
    # Use cached total count if available, otherwise fetch it (fallback)
    total_count = operation_details.get('total_count') if operation_details else None
    if total_count is None:
        total_count = get_total_row_count_import(conn, operation_id)
        # Cache it if we had to look it up
        if operation_details:
            with _operations_lock:
                operation_details['total_count'] = total_count
    
    # Check if we need to limit the number of rows due to Excel row limit
    max_rows = operation_details.get('max_rows', total_count) if operation_details else total_count
    
    # Use the smaller of total_count or max_rows
    rows_to_fetch = min(total_count, max_rows)
    
    # Calculate number of batches based on the limited row count
    num_batches = (rows_to_fetch + batch_size - 1) // batch_size
    
    # Log message about how many rows we're actually fetching
    if rows_to_fetch < total_count:
        import_logger.info(
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
        import_logger.info(
            f"[{operation_id}] Fetching {total_count} rows in {num_batches} batches of {batch_size}",
            extra={
                "operation_id": operation_id,
                "total_count": total_count,
                "num_batches": num_batches,
                "batch_size": batch_size
            }
        )
    
    # Execute one query to get all the data and use a cursor-based approach like the export system
    # Build the main query once
    query = f"SELECT * FROM {settings.IMPORT_VIEW} ORDER BY [DATE]"
    
    import_logger.debug(
        f"[{operation_id}] Executing main query and setting up cursor",
        extra={
            "operation_id": operation_id,
            "rows_to_fetch": rows_to_fetch
        }
    )
    
    # Set up cursor with optimized fetch settings
    cursor = conn.cursor()
    cursor.execute(query)
    
    # Set cursor options for better performance
    cursor.arraysize = 10000  # Increased batch size for better performance
    
    try:
        # Process data in batches using cursor-based approach
        rows_processed = 0
        batch_num = 0
        
        while rows_processed < rows_to_fetch:
            # Check if operation has been cancelled
            if is_operation_cancelled(operation_id):
                import_logger.info(f"[{operation_id}] Data fetch cancelled during batch {batch_num + 1}/{num_batches}")
                raise Exception("Operation cancelled by user")
            
            # Calculate how many rows we should fetch in this batch
            current_batch_size = min(batch_size, rows_to_fetch - rows_processed)
            if current_batch_size <= 0:
                break
            
            batch_num += 1
            
            import_logger.debug(
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
            import_logger.info(
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