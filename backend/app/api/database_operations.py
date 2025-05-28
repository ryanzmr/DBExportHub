import pandas as pd # Keep pandas for type hinting or specific cases if needed
from typing import List, Dict, Any, Optional # Keep for type hinting

from ..config import settings # Keep settings
from ..database import get_db_connection # Keep for connection management if needed by service layer
from ..logger import export_logger as logger # Use specific logger
from .generic_db_operations import (
    generic_execute_procedure,
    generic_get_preview_data,
    generic_get_first_row_hs_code,
    generic_get_column_headers,
    generic_get_total_row_count,
    generic_fetch_data_in_chunks,
    _get_param_value # Helper for param mapping
)
from ..utils import mask_sensitive_data # For logging if needed here, though generic might handle it
from .operation_tracker import is_operation_cancelled # If direct cancellation checks are needed here

# Specific configuration for Export operations
VIEW_NAME = settings.EXPORT_VIEW
PROCEDURE_NAME = settings.EXPORT_STORED_PROCEDURE
HS_CODE_COLUMN = "Hs_Code" # As per current database_operations.py
# EXPORT_ORDER_BY_COLUMN is (SELECT NULL) which is how SQL Server allows OFFSET without explicit sort.
# This is passed directly to generic_fetch_data_in_chunks.
EXPORT_ORDER_BY_COLUMN_FOR_CHUNKING = "(SELECT NULL)"


# Define the parameter mapping for the export stored procedure
# Using a list of tuples to maintain order.
EXPORT_PARAM_MAPPING = [
    ("fromMonth", lambda p: _get_param_value(p, "fromMonth")),
    ("ToMonth", lambda p: _get_param_value(p, "toMonth")), # Corrected: was "ToMonth" in original, params has "toMonth"
    ("hs", lambda p: _get_param_value(p, "hs")),
    ("prod", lambda p: _get_param_value(p, "prod")),
    ("Iec", lambda p: _get_param_value(p, "iec")),
    ("ExpCmp", lambda p: _get_param_value(p, "expCmp")),
    ("forcount", lambda p: _get_param_value(p, "forcount")),
    ("forname", lambda p: _get_param_value(p, "forname")),
    ("port", lambda p: _get_param_value(p, "port"))
]

def execute_export_procedure(conn, params, operation_id):
    """Execute the export stored procedure using the generic handler."""
    if is_operation_cancelled(operation_id):
        logger.info(f"[{operation_id}] Export operation cancelled before executing generic procedure.")
        raise Exception("Operation cancelled by user")
        
    logger.info(f"[{operation_id}] Calling generic_execute_procedure for EXPORT with view: {VIEW_NAME} and proc: {PROCEDURE_NAME}")
    return generic_execute_procedure(
        conn=conn, 
        params=params, 
        operation_id=operation_id, 
        procedure_name=PROCEDURE_NAME, 
        view_name=VIEW_NAME, 
        logger=logger, 
        param_mapping=EXPORT_PARAM_MAPPING
    )

def get_preview_data(conn, params, operation_id):
    """Get preview data for export using the generic handler."""
    if is_operation_cancelled(operation_id):
        logger.info(f"[{operation_id}] Export preview cancelled.")
        raise Exception("Operation cancelled by user")

    max_records = getattr(params, 'max_records', 100) 
    
    logger.info(f"[{operation_id}] Calling generic_get_preview_data for EXPORT. Max records: {max_records}, view: {VIEW_NAME}")
    return generic_get_preview_data(
        conn=conn, 
        operation_id=operation_id, 
        view_name=VIEW_NAME, 
        logger=logger,
        max_records=max_records # Pass max_records to the generic function
    )

def get_first_row_hs_code(conn, operation_id=None):
    """Get the first row's HS code for export using the generic handler."""
    if operation_id and is_operation_cancelled(operation_id): 
        logger.info(f"[{operation_id}] Get first row HS code for EXPORT cancelled.")
        raise Exception("Operation cancelled by user")
        
    logger.info(f"[{operation_id or 'N/A'}] Calling generic_get_first_row_hs_code for EXPORT. View: {VIEW_NAME}, Column: {HS_CODE_COLUMN}")
    return generic_get_first_row_hs_code(
        conn=conn, 
        operation_id=operation_id, 
        view_name=VIEW_NAME, 
        logger=logger, 
        hs_code_column_name=HS_CODE_COLUMN
    )

def get_column_headers(conn, operation_id=None):
    """Get column headers for export using the generic handler."""
    if operation_id and is_operation_cancelled(operation_id):
        logger.info(f"[{operation_id}] Get column headers for EXPORT cancelled.")
        raise Exception("Operation cancelled by user")
        
    logger.info(f"[{operation_id or 'N/A'}] Calling generic_get_column_headers for EXPORT. View: {VIEW_NAME}")
    return generic_get_column_headers(
        conn=conn, 
        operation_id=operation_id, 
        view_name=VIEW_NAME, 
        logger=logger
    )

def get_total_row_count(conn, operation_id=None):
    """Get the total row count for export using the generic handler."""
    if operation_id and is_operation_cancelled(operation_id):
        logger.info(f"[{operation_id}] Get total row count for EXPORT cancelled.")
        raise Exception("Operation cancelled by user")
        
    logger.info(f"[{operation_id or 'N/A'}] Calling generic_get_total_row_count for EXPORT. View: {VIEW_NAME}")
    return generic_get_total_row_count(
        conn=conn, 
        operation_id=operation_id, 
        view_name=VIEW_NAME, 
        logger=logger
    )

def fetch_data_in_chunks(conn, chunk_size, offset, operation_id):
    """
    Fetch data in chunks for export using the generic handler.
    The generic function returns a generator of DataFrames.
    This replaces the old behavior of returning a cursor.
    The calling service (export_service.py) will need to be adapted.
    """
    if is_operation_cancelled(operation_id):
        logger.info(f"[{operation_id}] Fetch data in chunks for EXPORT cancelled at offset {offset}.")
        raise Exception("Operation cancelled by user")

    logger.info(f"[{operation_id}] Calling generic_fetch_data_in_chunks for EXPORT. View: {VIEW_NAME}, Chunk: {chunk_size}, Offset: {offset}, OrderBy: {EXPORT_ORDER_BY_COLUMN_FOR_CHUNKING}")
    
    return generic_fetch_data_in_chunks(
        conn=conn,
        operation_id=operation_id,
        view_name=VIEW_NAME,
        logger=logger,
        chunk_size=chunk_size,
        offset_val=offset, 
        order_by_column=EXPORT_ORDER_BY_COLUMN_FOR_CHUNKING
    )

# Reminder: The change in `fetch_data_in_chunks` return type (from cursor to generator of DataFrames)
# will require changes in `backend/app/api/export_service.py`.