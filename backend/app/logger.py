import logging
import logging.handlers
import os
import json
import traceback
from datetime import datetime
from pathlib import Path
from functools import wraps
import time
import uuid
import sys
from typing import Optional, Dict, Any, Callable

# Import settings
from .config import settings


class CustomJsonFormatter(logging.Formatter):
    """
    Custom formatter to output logs as JSON for easier parsing
    """
    def format(self, record):
        log_record = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add exception info if available
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields from the record
        if hasattr(record, "extra"):
            log_record.update(record.extra)
        
        # Remove sensitive information
        if "password" in log_record:
            log_record["password"] = "[REDACTED]"
        
        return json.dumps(log_record)


def setup_logging():
    """
    Set up logging with both console and file handlers
    """
    # Create logs directory if it doesn't exist
    logs_dir = Path(settings.LOG_DIR)
    os.makedirs(logs_dir, exist_ok=True)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Clear existing handlers (in case setup_logging is called multiple times)
    if root_logger.handlers:
        for handler in root_logger.handlers:
            root_logger.removeHandler(handler)
    
    # Create console handler with a higher log level
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(console_formatter)
    root_logger.addHandler(console_handler)
    
    # Create rotating file handler for all logs
    file_handler = logging.handlers.RotatingFileHandler(
        filename=logs_dir / "application.log",
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=10  # Keep 10 backup files
    )
    file_handler.setLevel(logging.INFO)
    file_formatter = CustomJsonFormatter()
    file_handler.setFormatter(file_formatter)
    root_logger.addHandler(file_handler)
    
    # Create error log file handler (errors only)
    error_file_handler = logging.handlers.RotatingFileHandler(
        filename=logs_dir / "error.log",
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=10  # Keep 10 backup files
    )
    error_file_handler.setLevel(logging.ERROR)
    error_file_handler.setFormatter(file_formatter)
    root_logger.addHandler(error_file_handler)
    
    # Create access log file handler (for API requests)
    access_logger = logging.getLogger("access")
    access_logger.setLevel(logging.INFO)
    access_file_handler = logging.handlers.RotatingFileHandler(
        filename=logs_dir / "access.log",
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=10  # Keep 10 backup files
    )
    access_file_handler.setFormatter(file_formatter)
    access_logger.addHandler(access_file_handler)
    
    # Return the configured logger
    return root_logger


# Create and configure the logger
logger = setup_logging()

# Create specific loggers for different components
access_logger = logging.getLogger("access")
db_logger = logging.getLogger("database")
export_logger = logging.getLogger("export")


def mask_sensitive_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Mask sensitive information in the data dictionary"""
    masked_data = data.copy()
    sensitive_fields = ["password", "pwd", "secret", "token"]
    
    for key in masked_data:
        if isinstance(masked_data[key], dict):
            masked_data[key] = mask_sensitive_data(masked_data[key])
        elif any(sensitive in key.lower() for sensitive in sensitive_fields):
            masked_data[key] = "[REDACTED]"
    
    return masked_data


def log_execution_time(func: Callable) -> Callable:
    """Decorator to log function execution time"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        # Generate a unique ID for this function call
        exec_id = str(uuid.uuid4())[:8]
        
        # Log the start of the function execution
        start_time = time.time()
        logger.info(f"[{exec_id}] Starting {func.__name__}", 
                  extra={"exec_id": exec_id, "function": func.__name__})
        
        try:
            result = func(*args, **kwargs)
            execution_time = time.time() - start_time
            logger.info(
                f"[{exec_id}] Completed {func.__name__} in {execution_time:.2f}s",
                extra={
                    "exec_id": exec_id,
                    "function": func.__name__,
                    "execution_time": execution_time
                }
            )
            return result
        except Exception as e:
            execution_time = time.time() - start_time
            logger.exception(
                f"[{exec_id}] Error in {func.__name__} after {execution_time:.2f}s: {str(e)}",
                extra={
                    "exec_id": exec_id,
                    "function": func.__name__,
                    "execution_time": execution_time,
                    "error": str(e),
                    "traceback": traceback.format_exc()
                }
            )
            raise
    
    return wrapper


def log_api_request(request_data: Optional[Dict[str, Any]] = None) -> Callable:
    """Decorator to log API requests"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate a unique request ID
            request_id = str(uuid.uuid4())
            
            # Extract request data if available
            log_data = {"request_id": request_id}
            
            if request_data:
                masked_data = mask_sensitive_data(request_data)
                log_data["request_data"] = masked_data
            
            # Log the start of the request
            start_time = time.time()
            access_logger.info(
                f"API Request [{request_id}] to {func.__name__}",
                extra=log_data
            )
            
            try:
                # Execute the API endpoint function
                result = await func(*args, **kwargs)
                
                # Log successful completion
                execution_time = time.time() - start_time
                access_logger.info(
                    f"API Request [{request_id}] to {func.__name__} completed successfully in {execution_time:.2f}s",
                    extra={
                        "request_id": request_id,
                        "execution_time": execution_time,
                        "status": "success"
                    }
                )
                return result
            except Exception as e:
                # Log error details
                execution_time = time.time() - start_time
                access_logger.exception(
                    f"API Request [{request_id}] to {func.__name__} failed after {execution_time:.2f}s: {str(e)}",
                    extra={
                        "request_id": request_id,
                        "execution_time": execution_time,
                        "status": "error",
                        "error": str(e),
                        "traceback": traceback.format_exc()
                    }
                )
                raise
        
        return wrapper
    
    return decorator 