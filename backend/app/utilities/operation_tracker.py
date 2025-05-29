import threading
import time
from typing import Dict, Any, Optional
from datetime import datetime

from ..logging_operation.loggers import logger # Updated import

# Dictionary to store active operations
# Key: operation_id, Value: dict with status and other metadata
_active_operations: Dict[str, Dict[str, Any]] = {}

# Lock for thread-safe access to the operations dictionary
_operations_lock = threading.Lock()


def register_operation(operation_id: str) -> None:
    """Register a new operation in the tracker"""
    with _operations_lock:
        _active_operations[operation_id] = {
            "status": "running", # More descriptive initial status
            "start_time": datetime.now(),
            "last_updated_time": datetime.now(), # For tracking staleness
            "cancelled": False,
            "completed": False,
            "progress": { # Nested progress dict for clarity
                "current": 0,
                "total": 0,
                "percentage": 0,
            },
            "metadata": {} # For any other service-specific data
        }
        logger.info(
            f"[{operation_id}] Operation registered and started.",
            extra={
                "operation_id": operation_id,
                "status": "running"
            }
        )


def mark_operation_completed(operation_id: str) -> None:
    """Mark an operation as completed"""
    with _operations_lock:
        if operation_id in _active_operations:
            operation = _active_operations[operation_id]
            if operation["status"] == "completed": # Avoid re-marking
                logger.info(f"[{operation_id}] Operation already marked as completed.", extra={"operation_id": operation_id})
                return

            operation["completed"] = True
            operation["status"] = "completed"
            operation["end_time"] = datetime.now()
            operation["last_updated_time"] = datetime.now()
            
            start_time = operation["start_time"]
            duration = (operation["end_time"] - start_time).total_seconds()
            
            logger.info(
                f"[{operation_id}] Operation marked as completed after {duration:.2f} seconds.",
                extra={
                    "operation_id": operation_id,
                    "status": "completed",
                    "duration_seconds": duration
                }
            )
        else:
            logger.warning(f"[{operation_id}] Attempted to mark non-existent operation as completed.", extra={"operation_id": operation_id})


def cancel_operation(operation_id: str) -> bool:
    """Cancel an operation if it's still running"""
    with _operations_lock:
        if operation_id in _active_operations:
            operation = _active_operations[operation_id]
            if operation["completed"]:
                logger.info(
                    f"[{operation_id}] Cannot cancel: operation already completed.",
                    extra={"operation_id": operation_id, "current_status": operation["status"]}
                )
                return False
            if operation["cancelled"]:
                logger.info(
                    f"[{operation_id}] Operation already marked as cancelled.",
                    extra={"operation_id": operation_id, "current_status": operation["status"]}
                )
                return True # Already cancelled, so effectively successful cancellation

            operation["cancelled"] = True
            operation["status"] = "cancelled"
            operation["cancel_time"] = datetime.now()
            operation["last_updated_time"] = datetime.now()
            
            start_time = operation["start_time"]
            duration = (operation["cancel_time"] - start_time).total_seconds()
            
            logger.info(
                f"[{operation_id}] Operation cancelled after {duration:.2f} seconds.",
                extra={
                    "operation_id": operation_id,
                    "status": "cancelled",
                    "duration_seconds": duration
                }
            )
            return True
        else:
            logger.warning(
                f"[{operation_id}] Cannot cancel: operation not found.",
                extra={"operation_id": operation_id}
            )
            return False


def is_operation_cancelled(operation_id: str) -> bool:
    """Check if an operation has been cancelled"""
    with _operations_lock:
        operation = _active_operations.get(operation_id)
        return operation["cancelled"] if operation else False


def get_operation_status(operation_id: str) -> Optional[Dict[str, Any]]: # Kept for potential direct status check
    """Get the current status and basic progress of an operation."""
    with _operations_lock:
        operation = _active_operations.get(operation_id)
        if operation:
            return {
                "status": operation["status"],
                "cancelled": operation["cancelled"],
                "completed": operation["completed"],
                "progress": operation["progress"],
                "last_updated_time": operation["last_updated_time"].isoformat()
            }
        return None


def get_operation_details(operation_id: str) -> Optional[Dict[str, Any]]:
    """Get all details of an operation, including any custom metadata."""
    with _operations_lock:
        operation = _active_operations.get(operation_id)
        if operation:
            # Return a copy to prevent external modification of the internal state
            return operation.copy() 
        return None

def update_operation_progress(operation_id: str, current: int, total: int) -> None:
    """Update the progress of an operation"""
    with _operations_lock:
        if operation_id in _active_operations:
            operation = _active_operations[operation_id]
            if operation["completed"] or operation["cancelled"]:
                logger.debug(f"[{operation_id}] Progress update ignored; operation is already {operation['status']}.", extra={"operation_id": operation_id})
                return

            percentage = min(100, int((current / max(1, total)) * 100)) if total > 0 else 0
            
            operation["progress"] = {
                "current": current,
                "total": total,
                "percentage": percentage,
            }
            operation["last_updated_time"] = datetime.now()
            # Optionally log progress, but can be very verbose.
            # logger.debug(f"[{operation_id}] Progress: {percentage}% ({current}/{total})", extra={"operation_id":operation_id, "progress":percentage})
        else:
            logger.warning(f"[{operation_id}] Attempted to update progress for non-existent operation.", extra={"operation_id": operation_id})

def add_operation_metadata(operation_id: str, key: str, value: Any) -> None:
    """Add or update a custom metadata field for an operation."""
    with _operations_lock:
        if operation_id in _active_operations:
            _active_operations[operation_id]["metadata"][key] = value
            _active_operations[operation_id]["last_updated_time"] = datetime.now()
        else:
            logger.warning(f"[{operation_id}] Attempted to add metadata for non-existent operation.", extra={"operation_id": operation_id})


def cleanup_completed_operations(max_age_seconds: int = 3600) -> int: # Default: 1 hour
    """Remove completed or cancelled operations older than max_age_seconds"""
    current_time = datetime.now()
    operations_removed_count = 0
    
    with _operations_lock:
        # Iterate over a copy of keys if modifying the dict during iteration
        operation_ids_to_remove = []
        for op_id, operation in _active_operations.items():
            is_terminal = operation["completed"] or operation["cancelled"]
            # Use last_updated_time to determine age, or end_time/cancel_time if available
            reference_time = operation.get("end_time", operation.get("cancel_time", operation["last_updated_time"]))
            
            if is_terminal and (current_time - reference_time).total_seconds() > max_age_seconds:
                operation_ids_to_remove.append(op_id)
        
        for op_id in operation_ids_to_remove:
            del _active_operations[op_id]
            operations_removed_count += 1
    
    if operations_removed_count > 0:
        logger.info(f"Cleaned up {operations_removed_count} completed/cancelled operations older than {max_age_seconds}s.")
    
    return operations_removed_count


def get_active_operations_count() -> int:
    """Get the count of operations not yet marked completed or cancelled."""
    with _operations_lock:
        return sum(1 for op in _active_operations.values() 
                  if not op["completed"] and not op["cancelled"])


# Start a background thread to periodically clean up completed operations
def _start_cleanup_thread(interval_seconds: int = 3600): # Default: 1 hour
    def cleanup_task():
        while True:
            try:
                cleanup_completed_operations() # Uses default max_age_seconds
            except Exception as e:
                logger.error(f"Error in operation cleanup thread: {str(e)}", exc_info=True)
            finally:
                time.sleep(interval_seconds) 
    
    cleanup_thread = threading.Thread(target=cleanup_task, daemon=True, name="OperationCleanupThread")
    cleanup_thread.start()
    logger.info("Operation cleanup thread started.")

# Initialize and start the cleanup thread when the module is loaded.
# Consider making this configurable or controllable by the application lifecycle.
_start_cleanup_thread()
