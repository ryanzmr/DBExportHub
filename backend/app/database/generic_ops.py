import pandas as pd
# import numpy as np # Not explicitly used in the provided generic_db_operations.py
from datetime import datetime, timedelta
import gc
from typing import List, Dict, Any, Optional, Callable # Added Callable for param_mapping

from ..config.settings import settings # Updated import
from .connection import execute_query, query_to_dataframe # Updated import (get_db_connection is not used directly here)
from ..utilities.operation_tracker import is_operation_cancelled, update_operation_progress # Updated import (anticipating move)
from ..logging_operation.loggers import mask_sensitive_data # Updated import (mask_sensitive_data is in loggers.py)
# log_execution_time is a decorator, not directly called in generic_ops. db_logger is also not directly used here, specific loggers are passed in.

# --- Query Caching Mechanism ---
_query_cache: Dict[str, Dict[str, Any]] = {} # Type hint for cache
# CACHE_EXPIRY_MINUTES is already available from settings.CACHE_EXPIRY_MINUTES

def _params_match(cached_params: Optional[Dict[str, Any]], current_params_dict: Dict[str, Any]) -> bool:
    """Check if current parameters match cached parameters, excluding 'operation_id'."""
    if cached_params is None:
        return False
    
    # Create copies to avoid modifying original dicts and exclude operation_id
    # Note: operation_id is not typically part of params dict for cache matching, 
    # but if it were, this correctly excludes it.
    cached_params_copy = {k: v for k, v in cached_params.items() if k != 'operation_id'}
    current_params_copy = {k: v for k, v in current_params_dict.items() if k != 'operation_id'}
    
    return cached_params_copy == current_params_copy

def _check_temp_table_exists(conn: Any, view_name: str, logger: Any) -> bool: # logger type can be logging.Logger
    """Check if the temporary table (view_name) exists in the database."""
    try:
        # Use a simpler query that doesn't fetch data, just checks existence.
        # For SQL Server, checking sys.objects or similar might be more direct if permissions allow.
        # Using TOP 0 is also an option. For now, TOP 1 is kept from original.
        query = f"SELECT TOP 1 * FROM {view_name};"
        # execute_query returns a list of dicts or raises an exception.
        # If it doesn't raise, the table exists.
        execute_query(conn, query) 
        logger.info(f"Temporary table {view_name} exists.")
        return True
    except Exception as e:
        logger.info(f"Temporary table {view_name} does not exist or is not accessible: {e}")
        return False

# --- Generic Database Functions ---

def generic_execute_procedure(conn: Any, 
                              params: Any, # This should be a Pydantic model or similar
                              operation_id: str, 
                              procedure_name: str, 
                              view_name: str, # Name of the temp table/view created by the procedure
                              logger: Any, # Actual logger instance
                              param_mapping: List[Tuple[str, Callable[[Any], Any]]], # List of (sp_param_name, getter_func_from_params_obj)
                              ): # Return type: Tuple[int, bool]
    """
    Generically executes a stored procedure and manages caching.
    param_mapping: A list of tuples: (stored_procedure_param_name, function_to_get_value_from_params_object).
                   Ensures correct order and extraction of parameters.
    """
    logger.info(f"[{operation_id}] Executing generic procedure: {procedure_name} for view: {view_name}")
    
    # Prepare current parameters for caching and procedure execution using the mapping
    current_params_dict = {sp_param_name: getter(params) for sp_param_name, getter in param_mapping}
    
    view_cache = _query_cache.get(view_name, {
        "params": None, "timestamp": None, "record_count": 0, "cache_used": False
    })

    cache_is_valid = False
    if view_cache["params"] and view_cache["timestamp"]:
        if _params_match(view_cache["params"], current_params_dict):
            if (datetime.now() - view_cache["timestamp"]) < timedelta(minutes=settings.CACHE_EXPIRY_MINUTES):
                if _check_temp_table_exists(conn, view_name, logger):
                    cache_is_valid = True
                    logger.info(f"[{operation_id}] Valid cache found for {view_name} with params: {mask_sensitive_data(current_params_dict)}")
                else:
                    logger.info(f"[{operation_id}] Cache found for {view_name} but temp table/view '{view_name}' is missing. Invalidating cache.")
            else:
                logger.info(f"[{operation_id}] Cache expired for {view_name}. Invalidating cache.")
        else:
            logger.info(f"[{operation_id}] Parameters mismatch for {view_name}. Invalidating cache.")
    else:
        logger.info(f"[{operation_id}] No existing cache or timestamp for {view_name}.")

    if cache_is_valid:
        view_cache["cache_used"] = True
        _query_cache[view_name] = view_cache
        logger.info(f"[{operation_id}] Using cached results for {procedure_name} (view {view_name}). Record count: {view_cache['record_count']}")
        return view_cache["record_count"], True

    logger.info(f"[{operation_id}] Cache not used or invalid for {procedure_name} (view {view_name}). Executing stored procedure.")
    
    param_values = [getter(params) for _, getter in param_mapping] # Extract values in order
    placeholders = ", ".join(["?" for _ in param_values])
    sql_query = f"EXEC {procedure_name} {placeholders}"
    
    # Mask sensitive data in param_values if they are passed as a list of dicts/objects
    # For now, assuming param_values are mostly simple types or will be handled by logger's mask_sensitive_data if passed as dict
    logger.info(f"[{operation_id}] Executing SQL: {sql_query} with params (types): {[type(p) for p in param_values]}")


    try:
        cursor = conn.cursor()
        cursor.execute(sql_query, tuple(param_values))
        if procedure_name.lower().startswith("exec ") or procedure_name.lower().startswith("execute "): # EXEC calls might not need commit for SELECTs
             pass # Typically SELECTs or table-populating SPs don't need explicit commit unless they modify persistent state
        else:
             conn.commit() 
        logger.info(f"[{operation_id}] Stored procedure {procedure_name} executed successfully.")
        
        count_query = f"SELECT COUNT_BIG(*) FROM {view_name}" # COUNT_BIG for potentially large tables
        # Pass operation_id and logger to query_to_dataframe
        count_df = query_to_dataframe(conn, count_query, operation_id=operation_id, logger=logger)
        record_count = count_df.iloc[0, 0] if not count_df.empty else 0
        
        _query_cache[view_name] = {
            "params": current_params_dict, "timestamp": datetime.now(),
            "record_count": record_count, "cache_used": False
        }
        logger.info(f"[{operation_id}] Cache updated for {view_name}. Record count: {record_count}")
        
        return record_count, False

    except Exception as e:
        logger.error(f"[{operation_id}] Error executing stored procedure {procedure_name}: {e}", exc_info=True)
        try:
            # Attempt to drop the temporary table/view on error.
            # Be cautious with dynamically formed SQL like this. Ensure view_name is controlled.
            drop_query = f"IF OBJECT_ID('{view_name}', 'U') IS NOT NULL DROP TABLE {view_name}; IF OBJECT_ID('{view_name}', 'V') IS NOT NULL DROP VIEW {view_name};"
            execute_query(conn, drop_query) # This is a function from connection.py
            logger.info(f"[{operation_id}] Attempted to drop temporary table/view {view_name} after error.")
        except Exception as drop_e:
            logger.error(f"[{operation_id}] Failed to drop temporary table/view {view_name} after error: {drop_e}")
        raise

def generic_get_preview_data(conn: Any, operation_id: str, view_name: str, logger: Any, max_records: int = 100) -> pd.DataFrame:
    """Fetches a limited number of records for preview from the specified view_name."""
    logger.info(f"[{operation_id}] Fetching preview data from {view_name} (max {max_records} records).")
    query = f"SELECT TOP {max_records} * FROM {view_name};"
    preview_df = query_to_dataframe(conn, query, operation_id=operation_id, logger=logger)
    logger.info(f"[{operation_id}] Preview data fetched. Shape: {preview_df.shape}")
    return preview_df

def generic_get_first_row_hs_code(conn: Any, operation_id: str, view_name: str, logger: Any, hs_code_column_name: str = "Hs_Code") -> List[Optional[str]]:
    """Fetches the HS code from the first row of the specified view_name."""
    logger.info(f"[{operation_id}] Fetching first row HS code from {view_name}, column '{hs_code_column_name}'.")
    # Ensure hs_code_column_name is properly escaped if it can contain special characters, though unlikely for a column name.
    query = f"SELECT TOP 1 [{hs_code_column_name}] FROM {view_name};" # Added brackets for safety
    hs_code_df = query_to_dataframe(conn, query, operation_id=operation_id, logger=logger)
    if not hs_code_df.empty and hs_code_column_name in hs_code_df.columns:
        hs_code = hs_code_df.iloc[0, 0]
        logger.info(f"[{operation_id}] First row HS code: {hs_code}")
        return [hs_code] 
    logger.warning(f"[{operation_id}] Could not fetch first row HS code from {view_name} (column: {hs_code_column_name}).")
    return [None]

def generic_get_column_headers(conn: Any, operation_id: str, view_name: str, logger: Any) -> List[str]:
    """Retrieves column headers from the specified view_name."""
    logger.info(f"[{operation_id}] Fetching column headers from {view_name}.")
    
    # Sanitize view_name for use in query, especially if it could come from less trusted sources.
    # Basic sanitization: remove typical SQL comment characters and brackets if they are not part of the name itself.
    # This is a simplified example; proper sanitization depends on expected view_name format.
    # Assuming view_name is trusted or comes from a controlled source like settings.
    table_name_for_schema_query = view_name.split('.')[-1].replace('[','').replace(']','').replace('#','')

    query_info_schema = f"""
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = ? 
    ORDER BY ORDINAL_POSITION;
    """
    try:
        # Using query_to_dataframe which expects params as a list
        headers_df = query_to_dataframe(conn, query_info_schema, params=[table_name_for_schema_query], operation_id=operation_id, logger=logger)
        if not headers_df.empty:
            headers = headers_df['COLUMN_NAME'].tolist()
            logger.info(f"[{operation_id}] Column headers from INFORMATION_SCHEMA: {headers}")
            return headers
    except Exception as e:
        logger.warning(f"[{operation_id}] Failed to get headers using INFORMATION_SCHEMA for {view_name} (table name used: '{table_name_for_schema_query}'): {e}. Trying TOP 0 method.")

    try:
        query_top_0 = f"SELECT TOP 0 * FROM {view_name};"
        # query_to_dataframe with fetch_data=False is not a feature of the current query_to_dataframe.
        # It will fetch 0 rows, and columns can be derived from the empty DataFrame.
        top_0_df = query_to_dataframe(conn, query_top_0, operation_id=operation_id, logger=logger)
        headers = top_0_df.columns.tolist()
        logger.info(f"[{operation_id}] Column headers (using TOP 0): {headers}")
        return headers
    except Exception as e_top_0:
        logger.error(f"[{operation_id}] Error fetching column headers for {view_name} using TOP 0: {e_top_0}", exc_info=True)
        raise

def generic_get_total_row_count(conn: Any, operation_id: str, view_name: str, logger: Any) -> int:
    """Gets the total number of rows in the specified view_name."""
    logger.info(f"[{operation_id}] Getting total row count from {view_name}.")
    query = f"SELECT COUNT_BIG(*) FROM {view_name};" # Use COUNT_BIG
    count_df = query_to_dataframe(conn, query, operation_id=operation_id, logger=logger)
    total_count = count_df.iloc[0, 0] if not count_df.empty else 0
    logger.info(f"[{operation_id}] Total row count for {view_name}: {total_count}")
    return int(total_count) # Ensure it's an int

def generic_fetch_data_in_chunks(conn: Any, operation_id: str, view_name: str, logger: Any, 
                                 chunk_size: int, order_by_column: Optional[str] = None, offset_val: int = 0): # Added type for offset_val
    """
    Fetches data in chunks from view_name using OFFSET/FETCH if order_by_column is provided.
    Yields DataFrames.
    """
    logger.info(f"[{operation_id}] Fetching data in chunks from {view_name}. Chunk size: {chunk_size}, Order by: {order_by_column}, Initial Offset: {offset_val}")

    if order_by_column:
        current_offset = offset_val
        while True:
            if is_operation_cancelled(operation_id):
                logger.info(f"[{operation_id}] Data fetching cancelled for {view_name}.")
                break
            
            query = f"SELECT * FROM {view_name} ORDER BY {order_by_column} OFFSET {current_offset} ROWS FETCH NEXT {chunk_size} ROWS ONLY;"
            logger.debug(f"[{operation_id}] Executing chunk query: {query}")
            chunk_df = query_to_dataframe(conn, query, operation_id=operation_id, logger=logger)
            
            if chunk_df.empty:
                logger.info(f"[{operation_id}] No more data to fetch from {view_name} at offset {current_offset}.")
                break
            
            yield chunk_df
            current_offset += len(chunk_df) # Increment offset by rows actually fetched
            gc.collect()
    else:
        logger.warning(f"[{operation_id}] No order_by_column specified for chunking {view_name}. Fetching all data first. This may be inefficient for large datasets.")
        query = f"SELECT * FROM {view_name};"
        full_df = query_to_dataframe(conn, query, operation_id=operation_id, logger=logger)
        
        for i in range(0, len(full_df), chunk_size):
            if is_operation_cancelled(operation_id):
                logger.info(f"[{operation_id}] Data fetching cancelled during in-memory chunking for {view_name}.")
                break
            yield full_df.iloc[i:i + chunk_size]
            gc.collect()

def _get_param_value(params: Any, attr_name: str, default: Any = "") -> Any:
    """Safely gets a parameter value from params object, returning default if not found or None."""
    val = getattr(params, attr_name, default)
    return val if val is not None else default
