# DBExportHub Logging System Guide

## Overview

The DBExportHub logging system provides comprehensive logging capabilities for tracking execution events, input parameters, and other crucial details without affecting the current workflow or execution speed. The logging system captures timestamps, input parameters, and other relevant information to aid in debugging and monitoring.

## Features

- **Structured Logging**: All logs are stored in a structured JSON format for easy parsing and analysis
- **Log Rotation**: Logs are automatically rotated to prevent excessive file growth
- **Component-specific Loggers**: Separate loggers for different components (database, export, API access)
- **Performance Tracking**: Automatic logging of execution times for key functions
- **Sensitive Data Masking**: Automatic masking of sensitive information like passwords
- **Request Tracking**: Each API request gets a unique ID for complete request lifecycle tracking
- **Error Capture**: Detailed error logging with stack traces

## Log Files

The following log files are created in the `logs` directory:

- **application.log**: Contains all application logs (INFO level and above)
- **error.log**: Contains only error logs (ERROR level and above)
- **access.log**: Contains API access logs

## Using the Logging System

### Basic Logging

```python
from app.logger import logger

# Different log levels
logger.debug("Debug message")
logger.info("Information message") 
logger.warning("Warning message")
logger.error("Error message")
logger.critical("Critical error message")

# Add extra information
logger.info("Message with context", extra={"user_id": 123, "action": "login"})
```

### Component-specific Logging

```python
from app.logger import db_logger, export_logger, access_logger

# Database-related logging
db_logger.info("Database connection established")

# Export-related logging
export_logger.info("Starting export process")

# API access logging
access_logger.info("API request received")
```

### Performance Tracking

Use the `log_execution_time` decorator to automatically log function execution times:

```python
from app.logger import log_execution_time

@log_execution_time
def my_function():
    # Your function code here
    pass
```

### API Request Logging

Use the `log_api_request` decorator for API endpoints:

```python
from app.logger import log_api_request

@app.post("/api/endpoint")
@log_api_request()
async def my_endpoint(data: RequestModel):
    # Your endpoint code here
    pass
```

## Operation Tracking and Cancellation

The system includes comprehensive logging for operation tracking and cancellation:

### Operation States
```python
from app.core.operation_tracker import register_operation, update_operation_progress

# Register a new operation
operation_id = register_operation()

# Update progress
update_operation_progress(operation_id, current=50, total=100)
```

### Cancellation Logging
```python
from app.core.operation_tracker import check_operation_cancelled, cleanup_operation

try:
    # Check for cancellation during operation
    if check_operation_cancelled(operation_id):
        logger.info(f"Operation {operation_id} was cancelled")
        
finally:
    # Always cleanup operation resources
    cleanup_operation(operation_id)
```

The system automatically logs:
- Operation registration
- Progress updates
- Cancellation requests
- Resource cleanup
- Operation completion or failure

Each operation gets a unique ID that can be used to track its entire lifecycle in the logs.

## Configuration

Logging settings can be configured through environment variables:

- **LOG_LEVEL**: Set the minimum log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- **LOG_DIR**: Set the directory where log files are stored

These can be defined in the `.env` file or set directly in the environment.

## Testing the Logging System

You can test the logging system by running the `test_logging.py` script:

```bash
python test_logging.py
```

This will generate sample logs in all log files to verify that the logging system is working correctly.

## Best Practices

1. **Use the appropriate log level**:
   - DEBUG: Detailed information, typically of interest only when diagnosing problems
   - INFO: Confirmation that things are working as expected
   - WARNING: Indication that something unexpected happened, but the application is still working
   - ERROR: Due to a more serious problem, the application may not have performed some function
   - CRITICAL: A very serious error, indicating that the application may be unable to continue running

2. **Include context in logs**:
   - Always add relevant context using the `extra` parameter
   - Include operation IDs, user IDs, or other identifiers when available

3. **Mask sensitive data**:
   - Use the `mask_sensitive_data` function for any data that might contain passwords or other sensitive information

4. **Structured format**:
   - Keep log messages concise and descriptive
   - Put detailed information in the `extra` parameter for structured parsing