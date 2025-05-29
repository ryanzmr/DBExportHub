import pandas as pd # Keep pandas for type hinting or specific cases if needed
from typing import List, Dict, Any, Optional # Keep for type hinting

# Updated imports based on new location:
from ..config.settings import settings 
# from ..database.connection import get_db_connection # Not directly used here, but path is ..database.connection
from ..logging_operation.loggers import export_logger as logger 
from ..database.generic_ops import ( 
    generic_execute_procedure,
    generic_get_preview_data,
    generic_get_first_row_hs_code,
    generic_get_column_headers,
    generic_get_total_row_count,
    generic_fetch_data_in_chunks,
    _get_param_value 
)
from ..logging_operation.loggers import mask_sensitive_data 
from ..utilities.operation_tracker import is_operation_cancelled 

# Specific configuration for Export operations
VIEW_NAME = settings.EXPORT_VIEW
PROCEDURE_NAME = settings.EXPORT_STORED_PROCEDURE
HS_CODE_COLUMN = "Hs_Code" 
EXPORT_ORDER_BY_COLUMN_FOR_CHUNKING = "(SELECT NULL)"


# Define the parameter mapping for the export stored procedure
# Using a list of tuples to maintain order.
EXPORT_PARAM_MAPPING = [
    ("fromMonth", lambda p: _get_param_value(p, "fromMonth")),
    ("ToMonth", lambda p: _get_param_value(p, "toMonth")), 
    ("hs", lambda p: _get_param_value(p, "hs")),
    ("prod", lambda p: _get_param_value(p, "prod")),
    ("Iec", lambda p: _get_param_value(p, "iec")),
    ("ExpCmp", lambda p: _get_param_value(p, "expCmp")),
    ("forcount", lambda p: _get_param_value(p, "forcount")),
    ("forname", lambda p: _get_param_value(p, "forname")),
    ("port", lambda p: _get_param_value(p, "port"))
]

# Renaming execute_export_procedure to execute_procedure to match base_file_service expectation
def execute_procedure(conn: Any, params: Any, operation_id: str) -> tuple[int, bool]:
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

# get_preview_data already matches the expected signature in base_file_service for db_ops_module
def get_preview_data(conn: Any, params: Any, operation_id: str) -> pd.DataFrame:
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
        max_records=max_records 
    )

def get_first_row_hs_code(conn: Any, operation_id: Optional[str] = None) -> List[Optional[str]]:
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

def get_column_headers(conn: Any, operation_id: Optional[str] = None) -> List[str]:
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

def get_total_row_count(conn: Any, operation_id: Optional[str] = None) -> int:
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

# fetch_data_in_chunks signature matches what export_service.py (soon to be service.py) expects
def fetch_data_in_chunks(conn: Any, chunk_size: int, offset: int, operation_id: str) -> pd.DataFrame: # Actually a generator
    """
    Fetch data in chunks for export using the generic handler.
    The generic function returns a generator of DataFrames.
    """
    if is_operation_cancelled(operation_id):
        logger.info(f"[{operation_id}] Fetch data in chunks for EXPORT cancelled at offset {offset}.")
        raise Exception("Operation cancelled by user")

    logger.info(f"[{operation_id}] Calling generic_fetch_data_in_chunks for EXPORT. View: {VIEW_NAME}, Chunk: {chunk_size}, Offset: {offset}, OrderBy: {EXPORT_ORDER_BY_COLUMN_FOR_CHUNKING}")
    
    # This returns a generator
    return generic_fetch_data_in_chunks(
        conn=conn,
        operation_id=operation_id,
        view_name=VIEW_NAME,
        logger=logger,
        chunk_size=chunk_size,
        offset_val=offset, 
        order_by_column=EXPORT_ORDER_BY_COLUMN_FOR_CHUNKING
    )

# Reminder for future refactoring of service layer:
# The change in `fetch_data_in_chunks` return type (from cursor to generator of DataFrames)
# requires changes in the calling service (currently `backend/app/api/export_service.py`).
