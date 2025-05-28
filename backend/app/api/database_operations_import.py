# Import-specific database operations
from ..config import settings
from ..logger import import_logger as logger # Use specific logger for import operations
from .generic_db_operations import (
    generic_execute_procedure,
    generic_get_preview_data,
    generic_get_first_row_hs_code,
    generic_get_column_headers,
    generic_get_total_row_count,
    generic_fetch_data_in_chunks,
    _get_param_value # Helper for param mapping
)
from .operation_tracker import is_operation_cancelled, get_operation_details, _operations_lock # For direct cancellation checks and operation details

# Specific configuration for Import operations
VIEW_NAME = settings.IMPORT_VIEW
PROCEDURE_NAME = settings.IMPORT_STORED_PROCEDURE
HS_CODE_COLUMN = "hs_code" # As per current database_operations_import.py
IMPORT_PREVIEW_SAMPLE_SIZE = 100
IMPORT_ORDER_BY_COLUMN_FOR_CHUNKING = "[DATE]" # As per current database_operations_import.py

# Define the parameter mapping for the import stored procedure
# Using a list of tuples to maintain order.
IMPORT_PARAM_MAPPING = [
    ("fromMonth", lambda p: _get_param_value(p, "fromMonth")),
    ("ToMonth", lambda p: _get_param_value(p, "toMonth")),
    ("hs", lambda p: _get_param_value(p, "hs")),
    ("prod", lambda p: _get_param_value(p, "prod")),
    ("Iec", lambda p: _get_param_value(p, "iec")),
    ("ImpCmp", lambda p: _get_param_value(p, "impCmp")), # Changed from ExpCmp
    ("forcount", lambda p: _get_param_value(p, "forcount")),
    ("forname", lambda p: _get_param_value(p, "forname")),
    ("port", lambda p: _get_param_value(p, "port"))
]

def execute_import_procedure(conn, params, operation_id):
    """Execute the import stored procedure using the generic handler."""
    if is_operation_cancelled(operation_id):
        logger.info(f"[{operation_id}] Import operation cancelled before executing generic procedure.")
        raise Exception("Operation cancelled by user")
        
    logger.info(f"[{operation_id}] Calling generic_execute_procedure for IMPORT with view: {VIEW_NAME} and proc: {PROCEDURE_NAME}")
    return generic_execute_procedure(
        conn=conn,
        params=params,
        operation_id=operation_id,
        procedure_name=PROCEDURE_NAME,
        view_name=VIEW_NAME,
        logger=logger,
        param_mapping=IMPORT_PARAM_MAPPING
    )

def get_preview_data_import(conn, operation_id, sample_size=IMPORT_PREVIEW_SAMPLE_SIZE): # Default to specific sample size
    """Get preview data for import using the generic handler."""
    if is_operation_cancelled(operation_id):
        logger.info(f"[{operation_id}] Import preview cancelled.")
        raise Exception("Operation cancelled by user")
    
    # The original get_preview_data_import also had update_operation_progress calls.
    # These should ideally be in the service layer or handled consistently.
    # For now, focusing on refactoring the DB call.
    # from .operation_tracker import update_operation_progress
    # update_operation_progress(operation_id, 0, 100) # Example, might need adjustment

    logger.info(f"[{operation_id}] Calling generic_get_preview_data for IMPORT. Max records: {sample_size}, view: {VIEW_NAME}")
    df = generic_get_preview_data(
        conn=conn,
        operation_id=operation_id,
        view_name=VIEW_NAME,
        logger=logger,
        max_records=sample_size 
    )
    # update_operation_progress(operation_id, 100, 100) # Example
    return df

def get_total_row_count_import(conn, operation_id):
    """Get the total row count for import using the generic handler."""
    if is_operation_cancelled(operation_id): # Added cancellation check
        logger.info(f"[{operation_id}] Get total row count for IMPORT cancelled.")
        raise Exception("Operation cancelled by user")

    logger.info(f"[{operation_id}] Calling generic_get_total_row_count for IMPORT. View: {VIEW_NAME}")
    return generic_get_total_row_count(
        conn=conn,
        operation_id=operation_id,
        view_name=VIEW_NAME,
        logger=logger
    )

def get_column_headers_import(conn, operation_id):
    """Get column headers for import using the generic handler."""
    if is_operation_cancelled(operation_id): # Added cancellation check
        logger.info(f"[{operation_id}] Get column headers for IMPORT cancelled.")
        raise Exception("Operation cancelled by user")

    logger.info(f"[{operation_id}] Calling generic_get_column_headers for IMPORT. View: {VIEW_NAME}")
    return generic_get_column_headers(
        conn=conn,
        operation_id=operation_id,
        view_name=VIEW_NAME,
        logger=logger
    )

def get_first_row_hs_code_import(conn, operation_id):
    """Get the first row's HS code for import using the generic handler."""
    if is_operation_cancelled(operation_id): # Added cancellation check
        logger.info(f"[{operation_id}] Get first HS code for IMPORT cancelled.")
        raise Exception("Operation cancelled by user")

    logger.info(f"[{operation_id}] Calling generic_get_first_row_hs_code for IMPORT. View: {VIEW_NAME}, Column: {HS_CODE_COLUMN}")
    return generic_get_first_row_hs_code(
        conn=conn,
        operation_id=operation_id,
        view_name=VIEW_NAME,
        logger=logger,
        hs_code_column_name=HS_CODE_COLUMN
    )

def fetch_data_in_chunks_import(conn, operation_id, batch_size=None):
    """
    Fetch data in chunks for import using the generic handler.
    The generic function returns a generator of DataFrames.
    This replaces the old behavior of complex batching with cursor.fetchmany().
    The calling service (import_service.py) will need to be adapted.
    """
    if is_operation_cancelled(operation_id):
        logger.info(f"[{operation_id}] Fetch data in chunks for IMPORT cancelled.")
        raise Exception("Operation cancelled by user")

    # Determine chunk_size: use provided batch_size or default from settings
    chunk_size_to_use = batch_size if batch_size is not None else settings.DB_FETCH_BATCH_SIZE
    
    # The original fetch_data_in_chunks_import had complex logic to limit rows based on 'max_rows'
    # from operation_details and then iterated with cursor.fetchmany().
    # The generic_fetch_data_in_chunks uses OFFSET/FETCH which is simpler for pagination
    # but doesn't inherently limit total rows fetched other than by exhausting the source.
    # If 'max_rows' limiting is critical, the service layer calling this might need to stop iterating
    # the generator after a certain number of rows.

    logger.info(f"[{operation_id}] Calling generic_fetch_data_in_chunks for IMPORT. View: {VIEW_NAME}, Chunk: {chunk_size_to_use}, OrderBy: {IMPORT_ORDER_BY_COLUMN_FOR_CHUNKING}")
    
    # The generic_fetch_data_in_chunks does not use an 'offset' parameter directly in its signature for the initial call,
    # it manages offset internally when order_by_column is provided.
    # The original import function did not take an 'offset' parameter either, it was a generator itself.
    return generic_fetch_data_in_chunks(
        conn=conn,
        operation_id=operation_id,
        view_name=VIEW_NAME,
        logger=logger,
        chunk_size=chunk_size_to_use,
        # offset_val is not applicable for the first call here, generic function handles it.
        order_by_column=IMPORT_ORDER_BY_COLUMN_FOR_CHUNKING
    )

# Reminder: The change in `fetch_data_in_chunks_import` return type (from a custom generator
# yielding DataFrames from cursor.fetchmany to a generator of DataFrames from OFFSET/FETCH)
# will require changes in `backend/app/api/import_service.py`.
# The import_service.py currently iterates like:
# `for chunk_idx, chunk_df in enumerate(fetch_data_in_chunks_import(conn, operation_id, chunk_size), 1):`
# This loop structure should still be compatible. However, the underlying mechanism of how
# `fetch_data_in_chunks_import` produces those DataFrames has changed.
# The original also had logic for `max_rows` from `operation_details`. This limiting logic
# might need to be reimplemented in the service layer if still required with the new generic chunking.