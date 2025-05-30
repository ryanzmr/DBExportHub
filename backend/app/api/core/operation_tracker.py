import threading
import time
from typing import Dict, Any, Optional
from datetime import datetime

from .logger import logger

# Dictionary to store active operations
# Key: operation_id, Value: dict with status and other metadata
_active_operations: Dict[str, Dict[str, Any]] = {}

# Lock for thread-safe access to the operations dictionary
_operations_lock = threading.Lock()


def register_operation(operation_id: str) -> None:
    """Register a new operation in the tracker"""
    with _operations_lock:
        _active_operations[operation_id] = {
            "status": "running",
            "start_time": datetime.now(),
            "cancelled": False,
            "completed": False,
            "progress": {
                "current": 0,
                "total": 0,
                "percentage": 0,
                "last_update": datetime.now()
            }
        }
        logger.info(
            f"[{operation_id}] Operation registered",
            extra={
                "operation_id": operation_id,
                "status": "running"
            }
        )


def mark_operation_completed(operation_id: str) -> None:
    """Mark an operation as completed"""
    with _operations_lock:
        if operation_id in _active_operations:
            _active_operations[operation_id]["completed"] = True
            _active_operations[operation_id]["status"] = "completed"
            _active_operations[operation_id]["end_time"] = datetime.now()
            
            # Calculate duration
            start_time = _active_operations[operation_id]["start_time"]
            duration = (_active_operations[operation_id]["end_time"] - start_time).total_seconds()
            
            logger.info(
                f"[{operation_id}] Operation marked as completed after {duration:.2f} seconds",
                extra={
                    "operation_id": operation_id,
                    "status": "completed",
                    "duration": duration
                }
            )


def cancel_operation(operation_id: str) -> bool:
    """Cancel an operation if it's still running"""
    with _operations_lock:
        if operation_id in _active_operations:
            if _active_operations[operation_id]["completed"]:
                logger.info(
                    f"[{operation_id}] Cannot cancel: operation already completed",
                    extra={
                        "operation_id": operation_id,
                        "status": "completed"
                    }
                )
                return False
            
            _active_operations[operation_id]["cancelled"] = True
            _active_operations[operation_id]["status"] = "cancelled"
            _active_operations[operation_id]["cancel_time"] = datetime.now()
            
            # Calculate duration until cancellation
            start_time = _active_operations[operation_id]["start_time"]
            duration = (_active_operations[operation_id]["cancel_time"] - start_time).total_seconds()
            
            logger.info(
                f"[{operation_id}] Operation cancelled after {duration:.2f} seconds",
                extra={
                    "operation_id": operation_id,
                    "status": "cancelled",
                    "duration": duration
                }
            )
            return True
        else:
            logger.warning(
                f"[{operation_id}] Cannot cancel: operation not found",
                extra={
                    "operation_id": operation_id,
                    "status": "not_found"
                }
            )
            return False


def is_operation_cancelled(operation_id: str) -> bool:
    """Check if an operation has been cancelled"""
    with _operations_lock:
        if operation_id in _active_operations:
            return _active_operations[operation_id]["cancelled"]
        return False


def get_operation_status(operation_id: str) -> Optional[Dict[str, Any]]:
    """Get the current status of an operation"""
    with _operations_lock:
        if operation_id in _active_operations:
            return _active_operations[operation_id]
        return None


def get_operation_details(operation_id: str) -> Optional[Dict[str, Any]]:
    """Get all details of an operation, including any custom metadata"""
    with _operations_lock:
        if operation_id in _active_operations:
            return _active_operations[operation_id]
        return None


def update_operation_progress(operation_id: str, current: int, total: int) -> None:
    """Update the progress of an operation"""
    with _operations_lock:
        if operation_id in _active_operations:
            # Calculate percentage
            percentage = min(100, int((current / max(1, total)) * 100))
            
            # Update progress information
            _active_operations[operation_id]["progress"] = {
                "current": current,
                "total": total,
                "percentage": percentage,
                "last_update": datetime.now()
            }


def cleanup_completed_operations(max_age_seconds: int = 3600) -> int:
    """Remove completed operations older than max_age_seconds"""
    current_time = datetime.now()
    operations_removed = 0
    
    with _operations_lock:
        operation_ids = list(_active_operations.keys())
        
        for op_id in operation_ids:
            operation = _active_operations[op_id]
            
            # Check if operation is completed or cancelled
            if operation["completed"] or operation["cancelled"]:
                end_time = operation.get("end_time", operation.get("cancel_time"))
                
                if end_time and (current_time - end_time).total_seconds() > max_age_seconds:
                    del _active_operations[op_id]
                    operations_removed += 1
    
    if operations_removed > 0:
        logger.info(f"Cleaned up {operations_removed} completed operations")
    
    return operations_removed


def get_active_operations_count() -> int:
    """Get the count of currently active operations"""
    with _operations_lock:
        return sum(1 for op in _active_operations.values() 
                  if not op["completed"] and not op["cancelled"])


# Start a background thread to periodically clean up completed operations
def _start_cleanup_thread():
    def cleanup_thread():
        while True:
            try:
                cleanup_completed_operations()
                time.sleep(3600)  # Run cleanup every hour
            except Exception as e:
                logger.error(f"Error in cleanup thread: {str(e)}")
                time.sleep(3600)  # Sleep and retry
    
    thread = threading.Thread(target=cleanup_thread, daemon=True)
    thread.start()


# Initialize the cleanup thread
_start_cleanup_thread()