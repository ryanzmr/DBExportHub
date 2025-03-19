#!/usr/bin/env python3
"""
Simple script to test the DBExportHub logging system.
This will initialize the logger and perform a few test operations.
"""

import os
import sys
import time
from pathlib import Path

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.logger import logger, db_logger, export_logger, log_execution_time
from app.config import settings

@log_execution_time
def test_function():
    """Test function with the log_execution_time decorator"""
    logger.info("Starting test function")
    time.sleep(1)  # Simulate work
    logger.info("Test function completed")
    return "Test result"

@log_execution_time
def test_exception():
    """Test function that raises an exception"""
    logger.info("Starting function that will raise an exception")
    time.sleep(0.5)  # Simulate work
    raise ValueError("This is a test exception")

def main():
    """Main test function"""
    # Print the log directory location
    log_dir = Path(settings.LOG_DIR)
    print(f"Log files will be stored in: {log_dir}")
    
    # Test basic logging
    logger.debug("This is a debug message")
    logger.info("This is an info message")
    logger.warning("This is a warning message")
    logger.error("This is an error message")
    
    # Test component-specific loggers
    db_logger.info("This is a database-related message")
    export_logger.info("This is an export-related message")
    
    # Test with extra information
    logger.info(
        "Message with extra information", 
        extra={
            "custom_field": "custom value",
            "user_id": 12345,
            "action": "login"
        }
    )
    
    # Test the decorator
    result = test_function()
    print(f"Test function returned: {result}")
    
    # Test exception handling
    try:
        test_exception()
    except ValueError as e:
        print(f"Caught expected exception: {str(e)}")
    
    print("\nLogging test completed. Check the log files in the logs directory.")
    print("Log files that should exist:")
    print(f"  - {log_dir / 'application.log'}")
    print(f"  - {log_dir / 'error.log'}")
    print(f"  - {log_dir / 'access.log'}")

if __name__ == "__main__":
    main() 