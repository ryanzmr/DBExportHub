import os
from datetime import datetime
from typing import TYPE_CHECKING, Any, Tuple, Dict, Optional, Callable 

# Updated imports:
# from ..config import settings # Settings is not directly used in this file, but passed via params.
# from ..database.connection import get_db_connection # This is passed as db_connection_func

if TYPE_CHECKING:
    from logging import Logger
    # For params, if it's a Pydantic model, it would be imported from ..models.schemas
    # from ..models.schemas import ExportParameters, ImportParameters # Example
    # For modules, using Any or more specific Protocols if defined.
    # For db_ops_module, data_processing_module, logging_utils_module, operation_tracker_module:
    # These will be imported by the calling service and passed in.

# Constants
EXCEL_ROW_LIMIT = 1048576  # Maximum number of rows in modern Excel


def cleanup_excel_resources(workbook: Optional[Any], # xlsxwriter.Workbook
                            file_path: Optional[str], 
                            logger: 'Logger', 
                            operation_id_for_log: str = ""):
    """
    Safely closes the workbook and removes the partial file if it exists.
    """
    op_id_prefix = f"[{operation_id_for_log}] " if operation_id_for_log else ""
    
    if workbook:
        try:
            workbook.close()
            logger.info(f"{op_id_prefix}Workbook closed.")
        except Exception as e:
            logger.warning(f"{op_id_prefix}Error closing workbook: {e}")
            
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
            logger.info(f"{op_id_prefix}Removed partial file: {file_path}")
        except OSError as cleanup_err: 
            logger.warning(f"{op_id_prefix}Failed to remove partial file {file_path}: {cleanup_err}")
        except Exception as cleanup_err: 
            logger.warning(f"{op_id_prefix}An unexpected error occurred while removing partial file {file_path}: {cleanup_err}")


def handle_preview_data(params: Any, 
                        operation_id: str,
                        logger: 'Logger',
                        db_ops_module: Any, 
                        # data_processing_module is now data_utils from this directory
                        data_utils_module: Any, # Renamed from data_processing_module
                        # logging_utils_module is now logging_operation.utils
                        logging_operation_utils_module: Any, # Renamed
                        # operation_tracker_module is now operation_tracker from this directory
                        operation_tracker_util_module: Any, # Renamed
                        db_connection_func: Callable[..., Any], 
                        get_additional_preview_info_func: Optional[Callable[[Any, str, Any], Dict[str, Any]]] = None
                        ) -> Dict[str, Any]:
    """
    Handles common logic for generating preview data.
    Modules are passed in for flexibility and testability.
    """
    start_time = datetime.now()
    # Use the correctly named module for logging utils
    logging_operation_utils_module.log_preview_start(logger, operation_id, params)

    conn = None 
    try:
        # The db_connection_func is expected to be a context manager or handle its own setup/teardown if not.
        # The original services used `with db_connection_func(...) as conn:`.
        # If db_connection_func itself is a context manager, this is fine.
        # If it just returns a connection, the `with` statement needs to be on the connection object.
        # Assuming db_connection_func from database.connection.get_db_connection is a context manager.
        with db_connection_func(
            params.server, params.database, params.username, params.password
        ) as conn_instance: # Renamed to avoid conflict with outer 'conn' if not using 'with' correctly
            conn = conn_instance # Assign to outer conn for use in additional_info_func

            if operation_tracker_util_module.is_operation_cancelled(operation_id):
                logger.info(f"[{operation_id}] Preview operation cancelled before DB procedure execution.")
                raise Exception("Operation cancelled by user")

            # Assuming db_ops_module has a method like 'execute_procedure'
            # The original used 'execute_export_procedure' or 'execute_import_procedure'
            # This implies the passed db_ops_module should have standardized this, or this function needs more params.
            # For now, assuming 'execute_procedure' exists on the passed db_ops_module.
            record_count, _ = db_ops_module.execute_procedure(conn, params, operation_id)

            if operation_tracker_util_module.is_operation_cancelled(operation_id):
                logger.info(f"[{operation_id}] Preview operation cancelled after DB procedure execution.")
                raise Exception("Operation cancelled by user")
            
            total_records_for_log = record_count
            # If the specific db_ops_module has a more accurate way to get total count for preview log:
            if hasattr(db_ops_module, 'get_total_row_count_for_preview'): 
                 total_records_for_log = db_ops_module.get_total_row_count_for_preview(conn, operation_id, params)
            elif hasattr(db_ops_module, 'get_total_row_count'): # Fallback to general total row count if specific not available
                 total_records_for_log = db_ops_module.get_total_row_count(conn, operation_id)


            # Assuming get_preview_data exists on db_ops_module and handles its specific signature
            preview_df = db_ops_module.get_preview_data(conn, params, operation_id) 

            logging_operation_utils_module.log_preview_completion(logger, operation_id, start_time, len(preview_df), total_records_for_log)
            
            processed_result = data_utils_module.process_dataframe_for_json(preview_df)
            
            operation_tracker_util_module.mark_operation_completed(operation_id)

            result_dict = {
                "data": processed_result,
                "operation_id": operation_id,
                "total_records": total_records_for_log 
            }

            if get_additional_preview_info_func:
                additional_info = get_additional_preview_info_func(conn, operation_id, db_ops_module)
                result_dict.update(additional_info)
            
            return result_dict

    except Exception as e:
        logging_operation_utils_module.log_preview_error(logger, operation_id, e)
        raise Exception(f"[{operation_id}] Error generating preview: {str(e)}")
    # 'finally' block for connection closing is removed as 'with conn:' handles it.


def initiate_excel_generation(params: Any, 
                              operation_id: str,
                              logger: 'Logger',
                              db_ops_module: Any, 
                              logging_operation_utils_module: Any, # Renamed
                              operation_tracker_util_module: Any, # Renamed
                              db_connection_func: Callable[..., Any]
                              ) -> Tuple[Any, int, bool, int, Optional[Dict[str, Any]]]:
    """
    Handles initial steps of Excel generation.
    Returns: (connection, record_count_from_procedure, cache_used, effective_total_rows_for_excel, limit_exceeded_response_or_None)
    """
    logging_operation_utils_module.log_excel_start(logger, operation_id, params)
    
    conn = None 
    try:
        conn = db_connection_func(params.server, params.database, params.username, params.password)
        
        if operation_tracker_util_module.is_operation_cancelled(operation_id):
            logger.info(f"[{operation_id}] Excel generation cancelled before DB procedure execution.")
            raise Exception("Operation cancelled by user")

        record_count, cache_used = db_ops_module.execute_procedure(conn, params, operation_id)

        if operation_tracker_util_module.is_operation_cancelled(operation_id):
            logger.info(f"[{operation_id}] Excel generation cancelled after DB procedure execution.")
            raise Exception("Operation cancelled by user")

        effective_total_rows_for_excel = record_count
        
        force_continue = getattr(params, 'force_continue_despite_limit', False) or \
                         getattr(params, 'ignore_excel_limit', False)

        if record_count > EXCEL_ROW_LIMIT:
            logger.warning(
                f"[{operation_id}] Record count ({record_count}) exceeds Excel row limit ({EXCEL_ROW_LIMIT})."
            )
            if not force_continue:
                logger.info(f"[{operation_id}] Operation paused, waiting for user confirmation due to Excel limit.")
                # Caller should close conn if this special dict is returned.
                return conn, record_count, cache_used, record_count, { 
                    "status": "limit_exceeded",
                    "message": f"Total records ({record_count}) exceed Excel row limit ({EXCEL_ROW_LIMIT}).",
                    "operation_id": operation_id,
                    "total_records": record_count,
                    "limit": EXCEL_ROW_LIMIT
                }
            else:
                 logger.warning(f"[{operation_id}] Processing only first {EXCEL_ROW_LIMIT} rows due to user confirmation or force flag.")
                 effective_total_rows_for_excel = EXCEL_ROW_LIMIT 
        
        return conn, record_count, cache_used, effective_total_rows_for_excel, None

    except Exception as e:
        # If conn was opened and an error occurred, it should be closed here
        # as the caller might not get the 'conn' object to close it in its 'finally'.
        if conn and hasattr(conn, 'close'):
            try:
                conn.close()
                logger.info(f"[{operation_id}] DB connection closed due to error in initiate_excel_generation.")
            except Exception as conn_close_err:
                logger.error(f"[{operation_id}] Failed to close DB connection during error handling in initiate_excel_generation: {conn_close_err}")
        raise # Re-throw original exception to be handled by the service layer.
