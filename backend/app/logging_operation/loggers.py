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
from ..config.settings import settings # Updated import


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
        # Ensure 'extra' is treated carefully if it's not a dict or might be missing
        if hasattr(record, 'extra_fields') and isinstance(record.extra_fields, dict):
            log_record.update(record.extra_fields) # Changed from record.extra to record.extra_fields to avoid conflicts
        elif hasattr(record, 'extra') and isinstance(record.extra, dict): # Fallback for other uses of extra
             log_record.update(record.extra)


        # Remove sensitive information
        if "password" in log_record: # This check might be too simplistic
            log_record["password"] = "[REDACTED]"
        
        # Mask sensitive data in a more structured way if 'extra' contains dicts
        # This part is tricky because 'extra' can be anything.
        # Assuming sensitive info might be in top-level of log_record or nested if extra was a dict.
        # The mask_sensitive_data function should ideally be used here if log_record is prepared first.

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
    root_logger.setLevel(settings.LOG_LEVEL.upper() if settings.LOG_LEVEL else "INFO") # Use level from settings
    
    # Clear existing handlers (in case setup_logging is called multiple times)
    if root_logger.handlers:
        for handler in root_logger.handlers[:]: # Iterate over a copy
            root_logger.removeHandler(handler)
            handler.close() # Close handler before removing
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    # Console level can be more verbose if needed, e.g., logging.DEBUG
    console_handler.setLevel(settings.LOG_LEVEL.upper() if settings.LOG_LEVEL else "INFO") 
    
    class ColorEmojiFormatter(logging.Formatter):
        """
        Custom formatter to add emojis and colors to console logs
        """
        COLORS = {
            'DEBUG': '\033[94m',  # Blue
            'INFO': '\033[92m',   # Green
            'WARNING': '\033[93m', # Yellow
            'ERROR': '\033[91m',  # Red
            'CRITICAL': '\033[1;91m', # Bold Red
            'RESET': '\033[0m'    # Reset color
        }
        
        EMOJIS = {
            'DEBUG': '🔍', 'INFO': 'ℹ️', 'WARNING': '⚠️', 
            'ERROR': '❌', 'CRITICAL': '🚨', 'STARTING': '🚀',
            'COMPLETED': '✅', 'DATABASE': '🔄', 'CONNECTION': '🔌',
            'API': '🌐', 'REQUEST': '📤', 'RESPONSE': '📥',
            'EXPORT': '📊', 'PREVIEW': '👁️', 'FILE': '📄',
            'CACHE': '💾'
        }
        
        def format(self, record):
            levelname = record.levelname
            
            log_fmt = f"%(asctime)s {self.EMOJIS.get(levelname, '')} "
            log_fmt += f"{self.COLORS.get(levelname, '')}{levelname}{self.COLORS.get('RESET', '')} - "
            log_fmt += "%(name)s - "
            
            message = record.getMessage()
            msg_lower = message.lower()
            
            has_specific_emoji = False
            for key, emoji in self.EMOJIS.items():
                if key.lower() in msg_lower and key not in ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']:
                    log_fmt += f"{emoji} "
                    has_specific_emoji = True
                    break
            
            log_fmt += "%(message)s"
            
            formatter = logging.Formatter(log_fmt, datefmt='%Y-%m-%d %H:%M:%S')
            return formatter.format(record)
    
    console_handler.setFormatter(ColorEmojiFormatter())
    root_logger.addHandler(console_handler)
    
    # Create rotating file handler for all logs (application.log)
    app_file_handler = logging.handlers.RotatingFileHandler(
        filename=logs_dir / "application.log",
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=10,  # Keep 10 backup files
        encoding='utf-8' # Specify encoding
    )
    app_file_handler.setLevel(settings.LOG_LEVEL.upper() if settings.LOG_LEVEL else "INFO")
    app_file_formatter = CustomJsonFormatter() # Use JSON formatter
    app_file_handler.setFormatter(app_file_formatter)
    root_logger.addHandler(app_file_handler)
    
    # Create error log file handler (error.log)
    error_file_handler = logging.handlers.RotatingFileHandler(
        filename=logs_dir / "error.log",
        maxBytes=10 * 1024 * 1024,
        backupCount=10,
        encoding='utf-8'
    )
    error_file_handler.setLevel(logging.ERROR)
    error_file_handler.setFormatter(app_file_formatter) # JSON for errors too
    root_logger.addHandler(error_file_handler)
    
    # Setup specific loggers (access, db, export, import)
    loggers_to_setup = {
        "access": logs_dir / "access.log",
        "database": logs_dir / "database.log", # Dedicated DB log
        "export": logs_dir / "export.log",     # Dedicated export log
        "import": logs_dir / "import.log"      # Dedicated import log
    }

    for name, log_file in loggers_to_setup.items():
        specific_logger = logging.getLogger(name)
        specific_logger.setLevel(settings.LOG_LEVEL.upper() if settings.LOG_LEVEL else "INFO")
        
        # Prevent duplicate messages if root already has handlers
        specific_logger.propagate = False 
        
        # Add console handler (already configured on root, but can add if specific level needed)
        # specific_logger.addHandler(console_handler) # If specific console formatting/level needed

        # File handler for this specific logger
        file_handler = logging.handlers.RotatingFileHandler(
            filename=log_file,
            maxBytes=10 * 1024 * 1024,
            backupCount=10,
            encoding='utf-8'
        )
        file_handler.setFormatter(app_file_formatter) # JSON for specific logs too
        specific_logger.addHandler(file_handler)

    return root_logger


# Create and configure the logger (this will be the root logger)
logger = setup_logging()

# Specific loggers - ensure they are fetched after setup_logging
access_logger = logging.getLogger("access")
db_logger = logging.getLogger("database")
export_logger = logging.getLogger("export")
import_logger = logging.getLogger("import")


def mask_sensitive_data(data: Dict[str, Any], parent_key: str = "") -> Dict[str, Any]:
    """Mask sensitive information in a dictionary, recursively."""
    masked_data = {}
    sensitive_keywords = ["password", "pwd", "secret", "token", "authorization", "apikey", "access_key"]

    for key, value in data.items():
        # Normalize key to lowercase for case-insensitive matching
        lower_key = key.lower()
        
        if isinstance(value, dict):
            masked_data[key] = mask_sensitive_data(value, parent_key=lower_key)
        elif any(keyword in lower_key for keyword in sensitive_keywords):
            masked_data[key] = "[REDACTED]"
        else:
            masked_data[key] = value
    return masked_data


def log_execution_time(func: Callable) -> Callable:
    """Decorator to log function execution time with context."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        exec_id = str(uuid.uuid4())[:8]
        func_name = func.__name__
        
        # Prepare log extras, including masking sensitive args/kwargs
        log_extra = {"exec_id": exec_id, "function": func_name, "status": "started"}
        
        # Simple masking for args (if they are dicts) and kwargs
        # More sophisticated arg parsing might be needed for complex signatures
        masked_args = []
        for arg in args:
            if isinstance(arg, dict):
                masked_args.append(mask_sensitive_data(arg))
            # Could add handling for objects with __dict__ or Pydantic models
            else:
                masked_args.append(str(type(arg))) # Just log type for non-dict args for now
        
        if masked_args: log_extra["args"] = masked_args
        if kwargs: log_extra["kwargs"] = mask_sensitive_data(kwargs)

        logger.info(f"🚀 [{exec_id}] Starting {func_name}", extra=log_extra)
        start_time = time.time()
        
        try:
            result = func(*args, **kwargs)
            execution_time = time.time() - start_time
            log_extra["status"] = "completed"
            log_extra["execution_time_seconds"] = round(execution_time, 4)
            
            time_emoji = "⚡" if execution_time < 1 else "⏱️" if execution_time < 5 else "⏳"
            logger.info(
                f"✅ [{exec_id}] Completed {func_name} in {time_emoji} {execution_time:.4f}s",
                extra=log_extra
            )
            return result
        except Exception as e:
            execution_time = time.time() - start_time
            log_extra["status"] = "failed"
            log_extra["execution_time_seconds"] = round(execution_time, 4)
            log_extra["error"] = str(e)
            # log_extra["traceback"] = traceback.format_exc() # Consider if full traceback is always needed here
            
            logger.error(
                f"💥 [{exec_id}] Error in {func_name} after {execution_time:.4f}s: {str(e)}",
                extra=log_extra,
                exc_info=True # This will add traceback to the log record if formatter handles it
            )
            raise
    return wrapper


def log_api_request(func: Callable) -> Callable: # Removed request_data param, get from request context
    """Decorator to log API requests, assuming FastAPI Request context."""
    @wraps(func)
    async def wrapper(*args, **kwargs): # args typically include 'request: Request' or 'params: PydanticModel'
        request_id = str(uuid.uuid4())
        
        # Try to find FastAPI Request object in args or kwargs to get path and method
        request_obj = None
        if 'request' in kwargs and hasattr(kwargs['request'], 'method') and hasattr(kwargs['request'], 'url'):
            request_obj = kwargs['request']
        else:
            for arg in args:
                if hasattr(arg, 'method') and hasattr(arg, 'url'): # Basic check for FastAPI Request
                    request_obj = arg
                    break
        
        path_info = func.__name__ # Fallback if request object not found
        method_info = "UNKNOWN_METHOD"
        if request_obj:
            path_info = str(request_obj.url.path)
            method_info = request_obj.method

        log_extra = {"request_id": request_id, "api_endpoint": func.__name__, "path": path_info, "method": method_info, "status": "received"}

        # Mask parameters (assuming params is often a Pydantic model in kwargs or args)
        # This is a simplified approach; more robust parsing might be needed.
        if 'params' in kwargs and hasattr(kwargs['params'], 'dict'):
            log_extra["params"] = mask_sensitive_data(kwargs['params'].dict())
        elif args:
            for arg in args:
                if hasattr(arg, 'dict') and callable(arg.dict): # Check if it's a Pydantic model
                    log_extra["params"] = mask_sensitive_data(arg.dict()) # Takes the first Pydantic model found
                    break
        
        access_logger.info(f"🌐 API Request [{request_id}] to {path_info}", extra=log_extra)
        start_time = time.time()
        
        try:
            result = await func(*args, **kwargs)
            execution_time = time.time() - start_time
            log_extra["status"] = "success"
            log_extra["execution_time_seconds"] = round(execution_time, 4)
            
            status_code = 200 # Default success
            if hasattr(result, 'status_code'): # For FastAPI responses
                status_code = result.status_code
            elif isinstance(result, tuple) and hasattr(result[0], 'status_code'): # (response, status_code) tuple
                status_code = result[0].status_code

            log_extra["status_code"] = status_code
            time_emoji = "⚡" if execution_time < 0.5 else "⏱️" if execution_time < 2 else "⏳"
            
            access_logger.info(
                f"✅ API Request [{request_id}] to {path_info} completed with status {status_code} in {time_emoji} {execution_time:.4f}s",
                extra=log_extra
            )
            return result
        except Exception as e:
            execution_time = time.time() - start_time
            log_extra["status"] = "error"
            log_extra["execution_time_seconds"] = round(execution_time, 4)
            log_extra["error"] = str(e)
            
            status_code = 500 # Default error
            if hasattr(e, 'status_code'): # For FastAPI HTTPException
                status_code = e.status_code
            log_extra["status_code"] = status_code

            access_logger.error(
                f"❌ API Request [{request_id}] to {path_info} failed with status {status_code} after {execution_time:.4f}s: {str(e)}",
                extra=log_extra,
                exc_info=True # Add traceback
            )
            raise
    return wrapper
