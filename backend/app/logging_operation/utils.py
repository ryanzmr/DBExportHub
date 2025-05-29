import json # Not explicitly used, but often useful with logging
from datetime import datetime
import uuid
from typing import Dict, Any, Optional, TYPE_CHECKING

# Updated imports:
from .loggers import mask_sensitive_data # mask_sensitive_data is in loggers.py
# log_execution_time is not directly used in logging_utils.py functions themselves.
# export_logger is passed as logger_instance, so no direct import needed here.

if TYPE_CHECKING:
    from logging import Logger # For type hinting logger_instance

def generate_operation_id() -> str:
    """Generate a unique operation ID."""
    return str(uuid.uuid4())[:8]

def log_preview_start(logger_instance: 'Logger', operation_id: str, params: Any):
    """Log the start of a preview data generation operation."""
    # Mask sensitive parameters for logging
    # Assuming params has fromMonth and toMonth, and can be converted to dict
    try:
        params_dict = params.__dict__ if hasattr(params, '__dict__') else {}
        from_month = getattr(params, 'fromMonth', 'N/A')
        to_month = getattr(params, 'toMonth', 'N/A')
    except AttributeError: # Handle cases where params might not be an object with __dict__ or these attributes
        params_dict = {}
        from_month = 'N/A'
        to_month = 'N/A'

    masked_params = mask_sensitive_data(params_dict)
    
    logger_instance.info(
        f"[{operation_id}] Starting preview data generation",
        extra={ # Use extra_fields or ensure formatter handles 'extra' correctly
            "operation_id": operation_id,
            "operation": "preview_data",
            "from_month": from_month,
            "to_month": to_month,
            "timestamp": datetime.now().isoformat(),
            "params_preview": {k: v for k, v in masked_params.items() if k not in ['server', 'database', 'username', 'password']} # Example of less sensitive params
        }
    )
    # For full debug params, ensure they are properly masked if logged
    # logger_instance.debug(f"[{operation_id}] Full preview parameters: {masked_params}", extra={"operation_id": operation_id})


def log_preview_query_execution(logger_instance: 'Logger', operation_id: str, execution_time: float, row_count: int):
    """Log the execution of a preview query."""
    logger_instance.info(
        f"[{operation_id}] Preview query executed in {execution_time:.2f} seconds",
        extra={
            "operation_id": operation_id,
            "execution_time_seconds": execution_time, # Standardize field name
            "rows_returned": row_count
        }
    )

def log_preview_completion(logger_instance: 'Logger', operation_id: str, start_time: datetime, preview_count: int, total_count: int):
    """Log the completion of a preview data generation operation."""
    total_execution_time = (datetime.now() - start_time).total_seconds()
    logger_instance.info(
        f"[{operation_id}] Preview records returned: {preview_count} of {total_count} total records. Total preview generation completed in {total_execution_time:.2f} seconds.",
        extra={
            "operation_id": operation_id,
            "preview_count": preview_count,
            "total_count": total_count,
            "total_execution_time_seconds": total_execution_time, # Standardize
            "timestamp": datetime.now().isoformat()
        }
    )

def log_preview_error(logger_instance: 'Logger', operation_id: str, error: Exception):
    """Log an error that occurred during preview data generation."""
    logger_instance.error(
        f"[{operation_id}] Preview data error: {str(error)}",
        extra={
            "operation_id": operation_id,
            "operation": "preview_data",
            "error_message": str(error) # Standardize
        },
        exc_info=True # Include stack trace
    )

def log_excel_start(logger_instance: 'Logger', operation_id: str, params: Any):
    """Log the start of an Excel generation operation."""
    try:
        params_dict = params.__dict__ if hasattr(params, '__dict__') else {}
        from_month = getattr(params, 'fromMonth', 'N/A')
        to_month = getattr(params, 'toMonth', 'N/A')
    except AttributeError:
        params_dict = {}
        from_month = 'N/A'
        to_month = 'N/A'
        
    masked_params = mask_sensitive_data(params_dict)
    
    logger_instance.info(
        f"[{operation_id}] Starting Excel generation",
        extra={
            "operation_id": operation_id,
            "operation": "generate_excel",
            "from_month": from_month,
            "to_month": to_month,
            # Be selective about params logged even if masked, e.g., remove connection details
            "params_excel_start": {k: v for k, v in masked_params.items() if k not in ['server', 'database', 'username', 'password']}
        }
    )

def log_excel_progress(logger_instance: 'Logger', operation_id: str, rows_processed_chunk: int, chunk_time_seconds: float, total_rows_processed_so_far: int, total_rows_expected: int):
    """Log the progress of an Excel generation operation."""
    progress_pct = 0
    if total_rows_expected > 0 : # Avoid division by zero
        progress_pct = min(100, int((total_rows_processed_so_far / total_rows_expected) * 100))
    
    logger_instance.info(
        f"[{operation_id}] Processed chunk of {rows_processed_chunk} rows in {chunk_time_seconds:.4f} seconds. Total processed: {total_rows_processed_so_far}/{total_rows_expected} ({progress_pct}%)",
        extra={
            "operation_id": operation_id,
            "rows_processed_chunk": rows_processed_chunk,
            "chunk_time_seconds": chunk_time_seconds,
            "total_rows_processed_so_far": total_rows_processed_so_far,
            "total_rows_expected": total_rows_expected,
            "progress_percentage": progress_pct
        }
    )
    
    # Update operation progress in the tracker
    # This import path will be correct after operation_tracker.py is moved
    from ..utilities.operation_tracker import update_operation_progress 
    update_operation_progress(operation_id, total_rows_processed_so_far, total_rows_expected)

def log_excel_completion(logger_instance: 'Logger', operation_id: str, file_path: str, total_rows_written: int, execution_time_seconds: float):
    """Log the completion of an Excel generation operation."""
    logger_instance.info(
        f"[{operation_id}] Excel file generated at: {file_path} with {total_rows_written} rows in {execution_time_seconds:.2f} seconds",
        extra={
            "operation_id": operation_id,
            "total_execution_time_seconds": execution_time_seconds,
            "file_path": file_path,
            "total_rows_written": total_rows_written
        }
    )

def log_excel_error(logger_instance: 'Logger', operation_id: str, error: Exception):
    """Log an error that occurred during Excel generation."""
    logger_instance.error(
        f"[{operation_id}] Error generating Excel file: {str(error)}",
        extra={
            "operation_id": operation_id,
            "operation": "generate_excel",
            "error_message": str(error)
        },
        exc_info=True # Include stack trace
    )
