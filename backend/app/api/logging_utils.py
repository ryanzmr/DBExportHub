import json
from datetime import datetime
import uuid
from typing import Dict, Any, Optional, TYPE_CHECKING

from ..logger import mask_sensitive_data # Removed export_logger, log_execution_time

if TYPE_CHECKING:
    from logging import Logger # For type hinting logger_instance

def generate_operation_id():
    """Generate a unique operation ID for tracking export operations"""
    return str(uuid.uuid4())[:8]

def log_preview_start(logger_instance: 'Logger', operation_id: str, params: Any):
    """Log the start of a preview data generation operation"""
    # Mask sensitive parameters for logging
    masked_params = mask_sensitive_data(params.__dict__) if hasattr(params, '__dict__') else {}
    
    logger_instance.info(
        f"[{operation_id}] Starting preview data generation",
        extra={
            "operation_id": operation_id,
            "operation": "preview_data",
            "from_month": params.fromMonth,
            "to_month": params.toMonth,
            "timestamp": datetime.now().isoformat()
        }
    )
    
    logger_instance.debug(f"[{operation_id}] Preview parameters: {masked_params}", extra={"operation_id": operation_id})

def log_preview_query_execution(logger_instance: 'Logger', operation_id: str, execution_time: float, row_count: int):
    """Log the execution of a preview query"""
    logger_instance.info(
        f"[{operation_id}] Preview query executed in {execution_time:.2f} seconds",
        extra={
            "operation_id": operation_id,
            "execution_time": execution_time,
            "rows_returned": row_count
        }
    )

def log_preview_completion(logger_instance: 'Logger', operation_id: str, start_time: datetime, preview_count: int, total_count: int):
    """Log the completion of a preview data generation operation"""
    logger_instance.info(
        f"[{operation_id}] Preview records returned: {preview_count} of {total_count} total records",
        extra={
            "operation_id": operation_id,
            "preview_count": preview_count,
            "total_count": total_count
        }
    )
    
    total_execution_time = (datetime.now() - start_time).total_seconds()
    logger_instance.info(
        f"[{operation_id}] Total preview generation completed in {total_execution_time:.2f} seconds",
        extra={
            "operation_id": operation_id,
            "total_execution_time": total_execution_time,
            "timestamp": datetime.now().isoformat()
        }
    )

def log_preview_error(logger_instance: 'Logger', operation_id: str, error: Exception):
    """Log an error that occurred during preview data generation"""
    logger_instance.error(
        f"[{operation_id}] Preview data error: {str(error)}",
        extra={
            "operation_id": operation_id,
            "operation": "preview_data",
            "error": str(error)
        },
        exc_info=True
    )

def log_excel_start(logger_instance: 'Logger', operation_id: str, params: Any):
    """Log the start of an Excel generation operation"""
    # Mask sensitive parameters for logging
    masked_params = mask_sensitive_data(params.__dict__) if hasattr(params, '__dict__') else {}
    
    logger_instance.info(
        f"[{operation_id}] Starting Excel generation",
        extra={
            "operation_id": operation_id,
            "operation": "generate_excel",
            "from_month": params.fromMonth,
            "to_month": params.toMonth,
            "params": masked_params
        }
    )

def log_excel_progress(logger_instance: 'Logger', operation_id: str, rows_processed: int, chunk_time: float, total_rows: int, total_count: int):
    """Log the progress of an Excel generation operation"""
    # Calculate progress percentage
    progress_pct = min(100, int((total_rows / total_count) * 100))
    logger_instance.info(
        f"[{operation_id}] Processed {rows_processed} rows in {chunk_time:.6f} seconds. Total: {total_rows}/{total_count} ({progress_pct}%)",
        extra={
            "operation_id": operation_id,
            "rows_processed": rows_processed,
            "chunk_time": chunk_time,
            "total_rows": total_rows,
            "total_count": total_count,
            "progress_pct": progress_pct
        }
    )
    
    # Update operation progress in the tracker
    from .operation_tracker import update_operation_progress # This import is fine
    update_operation_progress(operation_id, total_rows, total_count)

def log_excel_completion(logger_instance: 'Logger', operation_id: str, file_path: str, total_rows: int, execution_time: float):
    """Log the completion of an Excel generation operation"""
    logger_instance.info(
        f"[{operation_id}] Excel file generated at: {file_path} with {total_rows} rows in {execution_time:.2f} seconds",
        extra={
            "operation_id": operation_id,
            "total_execution_time": execution_time,
            "file_path": file_path,
            "total_rows": total_rows
        }
    )

def log_excel_error(logger_instance: 'Logger', operation_id: str, error: Exception):
    """Log an error that occurred during Excel generation"""
    logger_instance.error(
        f"[{operation_id}] Error generating Excel file: {str(error)}",
        extra={
            "operation_id": operation_id,
            "operation": "generate_excel",
            "error": str(error)
        },
        exc_info=True
    )