import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import gc

from ..config import settings
from ..database import get_db_connection, execute_query, query_to_dataframe
from .operation_tracker import is_operation_cancelled, update_operation_progress
from ..utils import mask_sensitive_data # Assuming utils.py contains mask_sensitive_data

# --- Query Caching Mechanism ---
# The cache will now be a dictionary of caches, keyed by view_name
_query_cache = {} 
CACHE_EXPIRY_MINUTES = settings.CACHE_EXPIRY_MINUTES # Cache expiry time in minutes

def _params_match(cached_params, current_params_dict):
    """Check if current parameters match cached parameters, excluding 'operation_id'."""
    if cached_params is None:
        return False
    
    # Create copies to avoid modifying original dicts
    cached_params_copy = {k: v for k, v in cached_params.items() if k != 'operation_id'}
    current_params_copy = {k: v for k, v in current_params_dict.items() if k != 'operation_id'}
    
    return cached_params_copy == current_params_copy

def _check_temp_table_exists(conn, view_name, logger):
    """Check if the temporary table (view_name) exists in the database."""
    try:
        query = f"SELECT TOP 1 * FROM {view_name};"
        execute_query(conn, query) # Use execute_query which handles exceptions
        logger.info(f"Temporary table {view_name} exists.")
        return True
    except Exception as e:
        # Log the specific error if needed, but for existence check, failure means it likely doesn't exist or is inaccessible
        logger.info(f"Temporary table {view_name} does not exist or is not accessible: {e}")
        return False

# --- Generic Database Functions ---

def generic_execute_procedure(conn, params, operation_id, procedure_name, view_name, logger, param_mapping):
    """
    Generically executes a stored procedure and manages caching.
    param_mapping: A dictionary where keys are procedure param names and values are attributes from 'params' object.
                   Example: {"fromMonth": params.fromMonth, "hs": params.hs or ""}
    """
    logger.info(f"[{operation_id}] Executing generic procedure: {procedure_name} for view: {view_name}")
    
    # Prepare current parameters for caching and procedure execution
    current_params_dict = {key: getter(params) for key, getter in param_mapping.items()}
    
    # Access the cache specific to this view_name
    view_cache = _query_cache.get(view_name, {
        "params": None,
        "timestamp": None,
        "record_count": 0,
        "cache_used": False 
    })

    cache_is_valid = False
    if view_cache["params"] and view_cache["timestamp"]:
        if _params_match(view_cache["params"], current_params_dict):
            if (datetime.now() - view_cache["timestamp"]) < timedelta(minutes=CACHE_EXPIRY_MINUTES):
                if _check_temp_table_exists(conn, view_name, logger):
                    cache_is_valid = True
                    logger.info(f"[{operation_id}] Valid cache found for {view_name} with params: {mask_sensitive_data(current_params_dict)}")
                else:
                    logger.info(f"[{operation_id}] Cache found for {view_name} but temp table is missing. Invalidating cache.")
            else:
                logger.info(f"[{operation_id}] Cache expired for {view_name}. Invalidating cache.")
        else:
            logger.info(f"[{operation_id}] Parameters mismatch for {view_name}. Invalidating cache.")
    else:
        logger.info(f"[{operation_id}] No existing cache or timestamp for {view_name}.")

    if cache_is_valid:
        view_cache["cache_used"] = True
        _query_cache[view_name] = view_cache # Update the view-specific cache
        logger.info(f"[{operation_id}] Using cached results for {procedure_name} and view {view_name}. Record count: {view_cache['record_count']}")
        return view_cache["record_count"], True # True indicates cache was used

    logger.info(f"[{operation_id}] Cache not used or invalid for {procedure_name} and view {view_name}. Executing stored procedure.")
    
    # Construct procedure call
    # Order of parameters for procedure call must be exact.
    # The param_mapping dictionary should ideally be an OrderedDict or ensure keys are in correct order.
    # For now, assuming param_mapping provides them in the correct order expected by the SP.
    param_values = [getter(params) for getter in param_mapping.values()]
    placeholders = ", ".join(["?" for _ in param_values])
    
    # SQL Server uses EXEC, not CALL
    sql_query = f"EXEC {procedure_name} {placeholders}"
    
    logger.info(f"[{operation_id}] Executing SQL: {sql_query} with params: {mask_sensitive_data(param_values)}")

    try:
        # Execute the stored procedure
        # Assuming execute_query can handle EXEC statements and parameter binding correctly.
        # For procedures that don't return rows but just a status or row count (via RAISERROR or PRINT),
        # execute_query might need adjustment, or use cursor.execute directly.
        # Let's assume it works for now, or we might need a specific method for SP execution.
        
        # Stored procedures might not return a direct row count in the way a SELECT does.
        # They often create a temp table (view_name) and the count is derived from that.
        # Some procedures might return a count as an output parameter or a result set.
        # This part needs to be robust.
        
        cursor = conn.cursor()
        cursor.execute(sql_query, tuple(param_values))
        # If the SP has PRINT statements with row counts, we might need to capture them.
        # For now, we'll rely on counting rows from the created view_name.
        conn.commit() # Important if the procedure modifies state or creates temp tables explicitly
        logger.info(f"[{operation_id}] Stored procedure {procedure_name} executed successfully.")
        
        # After execution, count records in the view_name
        count_query = f"SELECT COUNT(*) FROM {view_name}"
        count_df = query_to_dataframe(conn, count_query, operation_id, logger) # Use query_to_dataframe
        record_count = count_df.iloc[0, 0] if not count_df.empty else 0
        
        # Update cache
        _query_cache[view_name] = {
            "params": current_params_dict,
            "timestamp": datetime.now(),
            "record_count": record_count,
            "cache_used": False
        }
        logger.info(f"[{operation_id}] Cache updated for {view_name}. Record count: {record_count}")
        
        return record_count, False # False indicates cache was not used

    except Exception as e:
        logger.error(f"[{operation_id}] Error executing stored procedure {procedure_name}: {e}")
        # Attempt to drop the temporary table on error to prevent issues with subsequent runs
        try:
            drop_query = f"IF OBJECT_ID('{view_name}', 'U') IS NOT NULL DROP TABLE {view_name};" # Or 'V' for view
            execute_query(conn, drop_query)
            logger.info(f"[{operation_id}] Attempted to drop temporary table/view {view_name} after error.")
        except Exception as drop_e:
            logger.error(f"[{operation_id}] Failed to drop temporary table/view {view_name} after error: {drop_e}")
        raise

def generic_get_preview_data(conn, operation_id, view_name, logger, max_records=100):
    """Fetches a limited number of records for preview from the specified view_name."""
    logger.info(f"[{operation_id}] Fetching preview data from {view_name} (max {max_records} records).")
    query = f"SELECT TOP {max_records} * FROM {view_name};"
    preview_df = query_to_dataframe(conn, query, operation_id, logger)
    logger.info(f"[{operation_id}] Preview data fetched. Shape: {preview_df.shape}")
    return preview_df

def generic_get_first_row_hs_code(conn, operation_id, view_name, logger, hs_code_column_name="Hs_Code"):
    """Fetches the HS code from the first row of the specified view_name."""
    logger.info(f"[{operation_id}] Fetching first row HS code from {view_name}, column '{hs_code_column_name}'.")
    query = f"SELECT TOP 1 {hs_code_column_name} FROM {view_name};"
    hs_code_df = query_to_dataframe(conn, query, operation_id, logger)
    if not hs_code_df.empty and hs_code_column_name in hs_code_df.columns:
        hs_code = hs_code_df.iloc[0, 0]
        logger.info(f"[{operation_id}] First row HS code: {hs_code}")
        return [hs_code] # Return as a list to match existing behavior
    logger.warning(f"[{operation_id}] Could not fetch first row HS code from {view_name}.")
    return [None]

def generic_get_column_headers(conn, operation_id, view_name, logger):
    """Retrieves column headers from the specified view_name."""
    logger.info(f"[{operation_id}] Fetching column headers from {view_name}.")
    # Query to get column names for SQL Server
    query = f"""
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = '{view_name.split('.')[-1].replace('[','').replace(']','').replace('#','')}' 
    ORDER BY ORDINAL_POSITION;
    """
    # The TABLE_NAME might need adjustment if the view_name includes schema, or is a temp table like '#temp_table'
    # For temp tables, querying INFORMATION_SCHEMA might not work directly, might need to query tempdb.
    # A simpler approach for temp tables is to select TOP 0 and get columns from the dataframe.
    
    try:
        # Try with INFORMATION_SCHEMA first
        headers_df = query_to_dataframe(conn, query, operation_id, logger)
        if not headers_df.empty:
            headers = headers_df['COLUMN_NAME'].tolist()
            logger.info(f"[{operation_id}] Column headers: {headers}")
            return headers
    except Exception as e:
        logger.warning(f"[{operation_id}] Failed to get headers using INFORMATION_SCHEMA for {view_name}: {e}. Trying TOP 0 method.")

    # Fallback: Get headers by selecting TOP 0 rows (works for temp tables too)
    try:
        query_top_0 = f"SELECT TOP 0 * FROM {view_name};"
        top_0_df = query_to_dataframe(conn, query_top_0, operation_id, logger, fetch_data=False) # fetch_data=False if query_to_dataframe supports it
        headers = top_0_df.columns.tolist()
        logger.info(f"[{operation_id}] Column headers (using TOP 0): {headers}")
        return headers
    except Exception as e_top_0:
        logger.error(f"[{operation_id}] Error fetching column headers for {view_name} using TOP 0: {e_top_0}")
        raise

def generic_get_total_row_count(conn, operation_id, view_name, logger):
    """Gets the total number of rows in the specified view_name."""
    logger.info(f"[{operation_id}] Getting total row count from {view_name}.")
    query = f"SELECT COUNT(*) FROM {view_name};"
    count_df = query_to_dataframe(conn, query, operation_id, logger)
    total_count = count_df.iloc[0, 0] if not count_df.empty else 0
    logger.info(f"[{operation_id}] Total row count for {view_name}: {total_count}")
    return total_count

def generic_fetch_data_in_chunks(conn, operation_id, view_name, logger, chunk_size, offset_val=None, order_by_column=None):
    """
    Fetches data in chunks from the specified view_name.
    Uses OFFSET/FETCH for SQL Server if order_by_column is provided.
    If no order_by_column, it fetches all data and then chunks it (less ideal for large datasets).
    """
    logger.info(f"[{operation_id}] Fetching data in chunks from {view_name}. Chunk size: {chunk_size}, Order by: {order_by_column}, Offset: {offset_val}")

    if order_by_column:
        # SQL Server requires ORDER BY for OFFSET FETCH
        current_offset = offset_val if offset_val is not None else 0
        while True:
            if is_operation_cancelled(operation_id):
                logger.info(f"[{operation_id}] Data fetching cancelled.")
                break
            
            query = f"""
            SELECT * FROM {view_name}
            ORDER BY {order_by_column}
            OFFSET {current_offset} ROWS
            FETCH NEXT {chunk_size} ROWS ONLY;
            """
            logger.debug(f"[{operation_id}] Executing chunk query: {query}")
            chunk_df = query_to_dataframe(conn, query, operation_id, logger)
            
            if chunk_df.empty:
                logger.info(f"[{operation_id}] No more data to fetch from {view_name}.")
                break
            
            yield chunk_df
            current_offset += chunk_size
            gc.collect() # Explicit garbage collection after processing a chunk
    else:
        # Fallback if no order_by_column - less efficient for large tables as it loads all then chunks
        logger.warning(f"[{operation_id}] No order_by_column specified for chunking {view_name}. Fetching all data first. This may be inefficient.")
        query = f"SELECT * FROM {view_name};"
        full_df = query_to_dataframe(conn, query, operation_id, logger)
        
        for i in range(0, len(full_df), chunk_size):
            if is_operation_cancelled(operation_id):
                logger.info(f"[{operation_id}] Data fetching cancelled during in-memory chunking.")
                break
            yield full_df.iloc[i:i + chunk_size]
            gc.collect()

# Helper for param_mapping in generic_execute_procedure
def _get_param_value(params, attr_name, default=""):
    """Safely gets a parameter value from params object, returning default if not found or None."""
    val = getattr(params, attr_name, default)
    return val if val is not None else default

"""
Note on generic_execute_procedure and param_mapping:
The `param_mapping` for `generic_execute_procedure` should be an OrderedDict or a list of tuples
to ensure parameters are passed in the correct order to the stored procedure.
Example:
param_mapping_list = [
    ("param1_sp_name", lambda p: _get_param_value(p, "attr1_name")),
    ("param2_sp_name", lambda p: _get_param_value(p, "attr2_name", default_val=0)),
    # ...
]
Then in generic_execute_procedure:
current_params_dict = {key: getter(params) for key, getter in param_mapping_list}
param_values = [getter(params) for _, getter in param_mapping_list]

This ensures that the order of `param_values` matches the order defined in `param_mapping_list`,
which should correspond to the stored procedure's parameter order.
"""
