import os
from datetime import datetime
from typing import TYPE_CHECKING, Any, Tuple, Dict, Optional # Added Dict, Optional

if TYPE_CHECKING:
    from logging import Logger
    import pyodbc # Assuming pyodbc is used for DB connection, adjust if not
    from ..config import Settings # For params type hint if it's a specific class
    # Define more specific types for modules if possible, e.g., types.ModuleType
    # For now, using Any for simplicity for db_ops_module etc.

# Constants (consider moving to a shared config or settings if appropriate)
EXCEL_ROW_LIMIT = 1048576  # Maximum number of rows in modern Excel


def cleanup_excel_resources(workbook: Optional[Any], # xlsxwriter.Workbook is Any for now
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
        except Exception as cleanup_err:
            logger.warning(f"{op_id_prefix}Failed to remove partial file {file_path}: {cleanup_err}")

# Placeholder for other functions to be implemented later
def handle_preview_data(params: Any, # Replace Any with actual Params type if available
                        operation_id: str,
                        logger: 'Logger',
                        db_ops_module: Any, # types.ModuleType
                        data_processing_module: Any, # types.ModuleType
                        logging_utils_module: Any, # types.ModuleType
                        operation_tracker_module: Any, # types.ModuleType
                        db_connection_func: Any, # Callable to get DB connection
                        get_additional_preview_info_func: Optional[Any] = None # Optional func for extra info
                        ) -> Dict[str, Any]:
    """
    Handles the common logic for generating preview data.
    get_additional_preview_info_func: An optional function that takes (conn, operation_id, db_ops_module)
                                      and returns a dictionary of additional info to be merged into the result.
    """
    start_time = datetime.now()
    logging_utils_module.log_preview_start(logger, operation_id, params)

    try:
        with db_connection_func(
            params.server, params.database, params.username, params.password
        ) as conn:
            if operation_tracker_module.is_operation_cancelled(operation_id):
                logger.info(f"[{operation_id}] Preview operation cancelled before execution.")
                raise Exception("Operation cancelled by user")

            record_count, cache_used = db_ops_module.execute_export_procedure(conn, params, operation_id) # Assuming execute_export_procedure is the common name

            if operation_tracker_module.is_operation_cancelled(operation_id):
                logger.info(f"[{operation_id}] Preview operation cancelled after procedure execution.")
                raise Exception("Operation cancelled by user")
            
            # For import service, total_count is fetched separately. For export, it's record_count from execute_export_procedure.
            # This needs to be harmonized or handled by the specific db_ops_module.
            # Let's assume db_ops_module.get_total_row_count exists and is relevant for preview completion logging.
            # If not, this part needs adjustment.
            # For export, record_count is total_count. For import, it's fetched.
            # Let's assume for now that record_count from execute_procedure is the effective total for preview context.
            total_records_for_preview_log = record_count 
            
            # In import_service, preview_data_df = get_preview_data_import(conn, operation_id)
            # In export_service, df = get_preview_data(conn, params, operation_id)
            # The params object for export contains max_records. Import uses a fixed 100.
            # Let's assume get_preview_data in db_ops_module handles its specific logic.
            preview_df = db_ops_module.get_preview_data(conn, params, operation_id) # Pass params for export case

            logging_utils_module.log_preview_completion(logger, operation_id, start_time, len(preview_df), total_records_for_preview_log)
            
            processed_result = data_processing_module.process_dataframe_for_json(preview_df)
            
            operation_tracker_module.mark_operation_completed(operation_id)

            result_dict = {
                "data": processed_result,
                "operation_id": operation_id,
                "total_records": total_records_for_preview_log # This was record_count
            }

            if get_additional_preview_info_func:
                additional_info = get_additional_preview_info_func(conn, operation_id, db_ops_module)
                result_dict.update(additional_info)
            
            return result_dict

    except Exception as e:
        logging_utils_module.log_preview_error(logger, operation_id, e)
        # The services re-raise, so we do the same.
        # They might have specific error messages. For now, a generic one.
        raise Exception(f"[{operation_id}] Error generating preview: {str(e)}")


def initiate_excel_generation(params: Any, # Replace Any with actual Params type
                              operation_id: str,
                              logger: 'Logger',
                              db_ops_module: Any, # types.ModuleType
                              logging_utils_module: Any, # types.ModuleType
                              operation_tracker_module: Any, # types.ModuleType
                              db_connection_func: Any # Callable to get DB connection
                              ) -> Tuple[Any, int, bool, int, Optional[Dict[str, Any]]]: # conn, record_count, cache_used, total_count_for_progress, potential_limit_response
    """
    Handles the initial common steps of Excel generation: logging, DB connection, procedure execution, and limit checks.
    Returns: (connection, record_count from procedure, cache_used, total_count_for_progress, limit_exceeded_response_dict_or_None)
    The total_count_for_progress will be min(record_count, EXCEL_ROW_LIMIT).
    """
    logging_utils_module.log_excel_start(logger, operation_id, params)
    
    conn = db_connection_func(params.server, params.database, params.username, params.password)
    
    try:
        if operation_tracker_module.is_operation_cancelled(operation_id):
            logger.info(f"[{operation_id}] Excel generation cancelled before DB procedure execution.")
            if conn: conn.close() # Ensure connection is closed
            raise Exception("Operation cancelled by user")

        # Assuming execute_export_procedure or execute_import_procedure is the common name pattern
        record_count, cache_used = db_ops_module.execute_export_procedure(conn, params, operation_id)

        if operation_tracker_module.is_operation_cancelled(operation_id):
            logger.info(f"[{operation_id}] Excel generation cancelled after DB procedure execution.")
            if conn: conn.close()
            raise Exception("Operation cancelled by user")

        # Total count for progress tracking might be different from record_count if limit is exceeded.
        # The original services fetch total_count again using get_total_row_count.
        # Let's assume record_count from the procedure is the primary source for "total records".
        # The EXCEL_ROW_LIMIT check is against this record_count.
        
        total_count_for_progress = record_count # This is the true total from the query
        
        # Check Excel row limit (common logic from both services)
        # The import service has a more detailed way of caching total_count in operation_details
        # and also max_rows if limit is hit. This generic helper simplifies it for now.
        if record_count > EXCEL_ROW_LIMIT:
            logger.warning(
                f"[{operation_id}] Record count ({record_count}) exceeds Excel row limit ({EXCEL_ROW_LIMIT}). "
            )
            if not getattr(params, 'force_continue_despite_limit', False) and not getattr(params, 'ignore_excel_limit', False) : # Matching export logic for pausing
                logger.info(f"[{operation_id}] Operation paused, waiting for user confirmation due to Excel limit.")
                # For import service, it updates operation_details status to "limit_exceeded"
                # This helper will return a specific structure that the calling service can interpret.
                if conn: conn.close() # Close connection before returning pause signal
                return None, record_count, cache_used, total_count_for_progress, {
                    "status": "limit_exceeded",
                    "message": f"Total records ({record_count}) exceed Excel row limit ({EXCEL_ROW_LIMIT}).",
                    "operation_id": operation_id,
                    "total_records": record_count,
                    "limit": EXCEL_ROW_LIMIT
                }
            else: # User confirmed to continue, so limit the rows for progress/processing
                 logger.warning(f"[{operation_id}] Processing only first {EXCEL_ROW_LIMIT} rows as per user confirmation or force_continue flag.")
                 total_count_for_progress = EXCEL_ROW_LIMIT # Actual rows to process for Excel

        return conn, record_count, cache_used, total_count_for_progress, None # No limit exceeded response

    except Exception as e:
        # If an error occurs, ensure the connection is closed if it was opened
        if conn:
            try:
                conn.close()
            except Exception as conn_close_err:
                logger.error(f"[{operation_id}] Failed to close DB connection during error handling: {conn_close_err}")
        raise # Re-throw original exception after attempting to close connection
```python
import os
from datetime import datetime
from typing import TYPE_CHECKING, Any, Tuple, Dict, Optional, Callable # Added Callable

if TYPE_CHECKING:
    from logging import Logger
    # It's better to use a Protocol for db_connection if possible,
    # but for now, pyodbc.Connection is illustrative.
    import pyodbc 
    # Replace 'Any' with more specific types like Pydantic models for 'params'
    # For modules, types.ModuleType is an option, or define Protocols for their interfaces.

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
            # Use specific exception type if known, e.g., xlsxwriter.exceptions.XlsxWriterException
            logger.warning(f"{op_id_prefix}Error closing workbook: {e}")
            
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
            logger.info(f"{op_id_prefix}Removed partial file: {file_path}")
        except OSError as cleanup_err: # More specific exception for os.remove
            logger.warning(f"{op_id_prefix}Failed to remove partial file {file_path}: {cleanup_err}")
        except Exception as cleanup_err: # Catch other potential errors
            logger.warning(f"{op_id_prefix}An unexpected error occurred while removing partial file {file_path}: {cleanup_err}")


def handle_preview_data(params: Any, 
                        operation_id: str,
                        logger: 'Logger',
                        db_ops_module: Any, 
                        data_processing_module: Any, 
                        logging_utils_module: Any, 
                        operation_tracker_module: Any, 
                        db_connection_func: Callable[..., Any], # e.g., get_db_connection
                        # Function to get additional info specific to import/export for preview result
                        get_additional_preview_info_func: Optional[Callable[[Any, str, Any], Dict[str, Any]]] = None
                        ) -> Dict[str, Any]:
    """
    Handles common logic for generating preview data.
    db_ops_module should have: execute_procedure, get_preview_data, (optionally get_total_row_count if needed by additional_info_func)
    data_processing_module should have: process_dataframe_for_json
    logging_utils_module should have: log_preview_start, log_preview_completion, log_preview_error
    operation_tracker_module should have: is_operation_cancelled, mark_operation_completed
    """
    start_time = datetime.now()
    logging_utils_module.log_preview_start(logger, operation_id, params)

    conn = None  # Initialize conn to None
    try:
        conn = db_connection_func(
            params.server, params.database, params.username, params.password
        )
        with conn: # Use context manager for the connection
            if operation_tracker_module.is_operation_cancelled(operation_id):
                logger.info(f"[{operation_id}] Preview operation cancelled before DB procedure execution.")
                raise Exception("Operation cancelled by user")

            # Assuming a unified procedure name like 'execute_procedure' in db_ops_modules
            # This was 'execute_export_procedure' and 'execute_import_procedure'
            # The db_ops_module passed in should be specific (export_db_ops or import_db_ops)
            # So, it can call its own specific execute_xxxx_procedure method.
            # Let's assume the module has a method named `execute_procedure` that abstracts this.
            # If not, this part needs the caller to pass the specific function.
            # For now, assuming db_ops_module.execute_procedure exists.
            record_count, _ = db_ops_module.execute_procedure(conn, params, operation_id)

            if operation_tracker_module.is_operation_cancelled(operation_id):
                logger.info(f"[{operation_id}] Preview operation cancelled after DB procedure execution.")
                raise Exception("Operation cancelled by user")
            
            # For import service, total_count for logging is derived from get_total_row_count_import.
            # For export, record_count from execute_export_procedure is used.
            # We should rely on the specific db_ops_module to give us the correct total count if needed for logging.
            # For now, record_count from execute_procedure is used.
            total_records_for_log = record_count
            if hasattr(db_ops_module, 'get_total_row_count'): # If module has a specific total count getter for this context
                 total_records_for_log = db_ops_module.get_total_row_count(conn, operation_id)


            # get_preview_data in export takes (conn, params, op_id)
            # get_preview_data_import in import takes (conn, op_id, sample_size=100)
            # This implies db_ops_module.get_preview_data needs to handle its signature.
            preview_df = db_ops_module.get_preview_data(conn, params, operation_id) 

            logging_utils_module.log_preview_completion(logger, operation_id, start_time, len(preview_df), total_records_for_log)
            
            processed_result = data_processing_module.process_dataframe_for_json(preview_df)
            
            operation_tracker_module.mark_operation_completed(operation_id)

            result_dict = {
                "data": processed_result,
                "operation_id": operation_id,
                "total_records": total_records_for_log 
            }

            if get_additional_preview_info_func:
                # Pass conn, operation_id, and the specific db_ops_module
                additional_info = get_additional_preview_info_func(conn, operation_id, db_ops_module)
                result_dict.update(additional_info)
            
            return result_dict

    except Exception as e:
        logging_utils_module.log_preview_error(logger, operation_id, e)
        raise Exception(f"[{operation_id}] Error generating preview: {str(e)}")
    finally:
        if conn and hasattr(conn, 'close') and not getattr(conn, '_closed', False): # Check if closeable and not already closed by context manager
             try:
                 conn.close()
             except Exception as conn_close_err:
                 logger.error(f"[{operation_id}] Failed to explicitly close DB connection in preview: {conn_close_err}")


def initiate_excel_generation(params: Any, 
                              operation_id: str,
                              logger: 'Logger',
                              db_ops_module: Any, 
                              logging_utils_module: Any, 
                              operation_tracker_module: Any, 
                              db_connection_func: Callable[..., Any]
                              ) -> Tuple[Any, int, bool, int, Optional[Dict[str, Any]]]:
    """
    Handles initial steps of Excel generation: log start, DB connection, procedure execution, limit checks.
    Returns: (connection, record_count_from_procedure, cache_used, effective_total_rows_for_excel, limit_exceeded_response_or_None)
    'effective_total_rows_for_excel' is min(record_count_from_procedure, EXCEL_ROW_LIMIT) if limit is hit and ignored, else record_count_from_procedure.
    """
    logging_utils_module.log_excel_start(logger, operation_id, params)
    
    conn = None # Initialize conn
    try:
        conn = db_connection_func(params.server, params.database, params.username, params.password)
        
        if operation_tracker_module.is_operation_cancelled(operation_id):
            logger.info(f"[{operation_id}] Excel generation cancelled before DB procedure execution.")
            raise Exception("Operation cancelled by user")

        # Similar to preview, assuming db_ops_module.execute_procedure exists
        record_count, cache_used = db_ops_module.execute_procedure(conn, params, operation_id)

        if operation_tracker_module.is_operation_cancelled(operation_id):
            logger.info(f"[{operation_id}] Excel generation cancelled after DB procedure execution.")
            raise Exception("Operation cancelled by user")

        effective_total_rows_for_excel = record_count
        
        # EXCEL_ROW_LIMIT check logic from export_service and import_service
        # params.force_continue_despite_limit is from import_service
        # params.ignore_excel_limit (equivalent) is from export_service
        force_continue = getattr(params, 'force_continue_despite_limit', False) or \
                         getattr(params, 'ignore_excel_limit', False)

        if record_count > EXCEL_ROW_LIMIT:
            logger.warning(
                f"[{operation_id}] Record count ({record_count}) exceeds Excel row limit ({EXCEL_ROW_LIMIT})."
            )
            if not force_continue:
                logger.info(f"[{operation_id}] Operation paused, waiting for user confirmation due to Excel limit.")
                # The import service updates operation_details status. This helper returns a dict.
                # The calling service will need to handle this dict and potentially update operation_details.
                return conn, record_count, cache_used, record_count, { # Return original record_count for total_records field
                    "status": "limit_exceeded",
                    "message": f"Total records ({record_count}) exceed Excel row limit ({EXCEL_ROW_LIMIT}).",
                    "operation_id": operation_id,
                    "total_records": record_count,
                    "limit": EXCEL_ROW_LIMIT
                }
            else:
                 logger.warning(f"[{operation_id}] Processing only first {EXCEL_ROW_LIMIT} rows due to user confirmation or force flag.")
                 effective_total_rows_for_excel = EXCEL_ROW_LIMIT 
        
        # If no limit exceeded response, return None for the 5th tuple element
        return conn, record_count, cache_used, effective_total_rows_for_excel, None

    except Exception as e:
        # If conn was successfully opened before the error, it should be closed.
        # The original services close conn in their main try-except-finally for generate_excel.
        # Here, if an exception occurs after conn is established, we might leak it if not closed.
        # However, the main service functions will have their own try/finally to close the conn returned by this.
        # For exceptions *within* this function *after* conn is made, it's tricky.
        # The current structure returns conn, implying the caller manages its lifecycle.
        # So, if this function errors out, the caller's finally block should handle conn.close().
        # This function should not close conn on its own error if it intends to return it on success.
        # The tuple element for conn would be problematic if error occurs after conn is made but before return.
        # Let's re-think: if this function errors, it should clean up its own connection.
        if conn and hasattr(conn, 'close'):
            try:
                conn.close()
                logger.info(f"[{operation_id}] DB connection closed due to error in initiate_excel_generation.")
            except Exception as conn_close_err:
                logger.error(f"[{operation_id}] Failed to close DB connection during error handling in initiate_excel_generation: {conn_close_err}")
        raise # Re-throw original exception
```
