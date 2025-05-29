# Import-specific database operations
from typing import List, Dict, Any, Optional # Keep for type hinting
import pandas as pd # For type hint in get_preview_data_import

# Updated imports based on new location:
from ..config.settings import settings 
from ..logging_operation.loggers import import_logger as logger 
from ..database.generic_ops import ( 
    generic_execute_procedure,
    generic_get_preview_data,
    generic_get_first_row_hs_code,
    generic_get_column_headers,
    generic_get_total_row_count,
    generic_fetch_data_in_chunks,
    _get_param_value 
)
from ..utilities.operation_tracker import is_operation_cancelled, get_operation_details, _operations_lock 

# Specific configuration for Import operations
VIEW_NAME = settings.IMPORT_VIEW
PROCEDURE_NAME = settings.IMPORT_STORED_PROCEDURE
HS_CODE_COLUMN = "hs_code" 
IMPORT_PREVIEW_SAMPLE_SIZE = 100
IMPORT_ORDER_BY_COLUMN_FOR_CHUNKING = "[DATE]" 

# Define the parameter mapping for the import stored procedure
IMPORT_PARAM_MAPPING = [
    ("fromMonth", lambda p: _get_param_value(p, "fromMonth")),
    ("ToMonth", lambda p: _get_param_value(p, "toMonth")),
    ("hs", lambda p: _get_param_value(p, "hs")),
    ("prod", lambda p: _get_param_value(p, "prod")),
    ("Iec", lambda p: _get_param_value(p, "iec")),
    ("ImpCmp", lambda p: _get_param_value(p, "impCmp")), 
    ("forcount", lambda p: _get_param_value(p, "forcount")),
    ("forname", lambda p: _get_param_value(p, "forname")),
    ("port", lambda p: _get_param_value(p, "port"))
]

# Renaming execute_import_procedure to execute_procedure for consistency
def execute_procedure(conn: Any, params: Any, operation_id: str) -> tuple[int, bool]:
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

# Renaming get_preview_data_import to get_preview_data for consistency
def get_preview_data(conn: Any, params: Any, operation_id: str) -> pd.DataFrame: # params is used by generic_get_preview_data for max_records if available
    """Get preview data for import using the generic handler."""
    if is_operation_cancelled(operation_id):
        logger.info(f"[{operation_id}] Import preview cancelled.")
        raise Exception("Operation cancelled by user")
    
    # Original import service used fixed sample_size=100, not from params.max_records
    # generic_get_preview_data takes max_records. We use IMPORT_PREVIEW_SAMPLE_SIZE.
    sample_size = IMPORT_PREVIEW_SAMPLE_SIZE
    # The `params` object itself is not strictly needed by `generic_get_preview_data` if `max_records` is fixed.
    # However, `generic_get_preview_data` expects it. We pass it along.

    logger.info(f"[{operation_id}] Calling generic_get_preview_data for IMPORT. Max records: {sample_size}, view: {VIEW_NAME}")
    df = generic_get_preview_data(
        conn=conn,
        operation_id=operation_id,
        view_name=VIEW_NAME,
        logger=logger,
        max_records=sample_size 
    )
    return df

# Renaming get_total_row_count_import to get_total_row_count
def get_total_row_count(conn: Any, operation_id: str) -> int:
    """Get the total row count for import using the generic handler."""
    if is_operation_cancelled(operation_id): 
        logger.info(f"[{operation_id}] Get total row count for IMPORT cancelled.")
        raise Exception("Operation cancelled by user")

    logger.info(f"[{operation_id}] Calling generic_get_total_row_count for IMPORT. View: {VIEW_NAME}")
    return generic_get_total_row_count(
        conn=conn,
        operation_id=operation_id,
        view_name=VIEW_NAME,
        logger=logger
    )

# Renaming get_column_headers_import to get_column_headers
def get_column_headers(conn: Any, operation_id: str) -> List[str]:
    """Get column headers for import using the generic handler."""
    if is_operation_cancelled(operation_id):
        logger.info(f"[{operation_id}] Get column headers for IMPORT cancelled.")
        raise Exception("Operation cancelled by user")

    logger.info(f"[{operation_id}] Calling generic_get_column_headers for IMPORT. View: {VIEW_NAME}")
    return generic_get_column_headers(
        conn=conn,
        operation_id=operation_id,
        view_name=VIEW_NAME,
        logger=logger
    )

# Renaming get_first_row_hs_code_import to get_first_row_hs_code
def get_first_row_hs_code(conn: Any, operation_id: str) -> List[Optional[str]]:
    """Get the first row's HS code for import using the generic handler."""
    if is_operation_cancelled(operation_id): 
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

# Renaming fetch_data_in_chunks_import to fetch_data_in_chunks
def fetch_data_in_chunks(conn: Any, operation_id: str, batch_size: Optional[int] = None) -> pd.DataFrame: # Actually a generator
    """
    Fetch data in chunks for import using the generic handler.
    """
    if is_operation_cancelled(operation_id):
        logger.info(f"[{operation_id}] Fetch data in chunks for IMPORT cancelled.")
        raise Exception("Operation cancelled by user")

    chunk_size_to_use = batch_size if batch_size is not None else settings.DB_FETCH_BATCH_SIZE
    
    logger.info(f"[{operation_id}] Calling generic_fetch_data_in_chunks for IMPORT. View: {VIEW_NAME}, Chunk: {chunk_size_to_use}, OrderBy: {IMPORT_ORDER_BY_COLUMN_FOR_CHUNKING}")
    
    return generic_fetch_data_in_chunks(
        conn=conn,
        operation_id=operation_id,
        view_name=VIEW_NAME,
        logger=logger,
        chunk_size=chunk_size_to_use,
        order_by_column=IMPORT_ORDER_BY_COLUMN_FOR_CHUNKING
        # offset_val is managed by the generic_fetch_data_in_chunks generator itself for this usage pattern
    )

# Reminder comments about service layer adaptation can be removed if addressed there.
