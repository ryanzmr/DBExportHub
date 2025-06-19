"""
View validation utilities for DBExportHub.

This module provides functions to validate the existence of database views
before executing queries against them, preventing runtime errors when views
don't exist.
"""

import pyodbc
from datetime import datetime
from typing import Dict, Any, Optional, Tuple

from .logger import db_logger, log_execution_time
from .database import get_db_connection
from .config import settings

@log_execution_time
def validate_view_exists(
    server: str,
    database: str, 
    username: str,
    password: str,
    view_name: str
) -> Tuple[bool, Optional[str]]:
    """
    Check if a specific view exists in the database.
    
    Args:
        server: SQL Server name/address
        database: Database name
        username: Database username
        password: Database password
        view_name: The name of the view to validate
        
    Returns:
        Tuple of (success, error_message)
        - success: True if view exists, False otherwise
        - error_message: None if successful, error message otherwise
    """
    operation_id = f"view_val_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    db_logger.info(
        f"[{operation_id}] Validating existence of view: {view_name}",
        extra={
            "operation_id": operation_id,
            "server": server,
            "database": database,
            "view_name": view_name
        }
    )
    
    try:
        with get_db_connection(server, database, username, password) as conn:
            # Query to check if view exists in the database
            # This is a safe way to check for view existence that works across SQL Server versions
            cursor = conn.cursor()
            
            # Check for view existence using INFORMATION_SCHEMA
            query = """
            SELECT COUNT(*) 
            FROM INFORMATION_SCHEMA.VIEWS 
            WHERE TABLE_NAME = ?
            """
            
            cursor.execute(query, [view_name])
            result = cursor.fetchone()
            view_exists = result[0] > 0
            
            # If the view doesn't exist in INFORMATION_SCHEMA.VIEWS, 
            # try alternate methods to handle system views or special cases
            if not view_exists:
                # Try to query the view directly to see if it exists
                # This is wrapped in a try/except because if the view doesn't exist,
                # this will raise an exception
                try:
                    # Use SET ROWCOUNT to limit query impact and just check existence
                    query = f"SET ROWCOUNT 1; SELECT * FROM {view_name}; SET ROWCOUNT 0;"
                    cursor.execute(query)
                    # If we get here, the view exists
                    cursor.fetchone()  # Consume the result
                    view_exists = True
                except Exception as e:
                    # If exception contains specific text about invalid object name, the view doesn't exist
                    if "Invalid object name" in str(e):
                        view_exists = False
                    else:
                        # For other errors, log but don't say view doesn't exist (could be permission issue, etc.)
                        db_logger.warning(
                            f"[{operation_id}] Error testing view existence directly: {str(e)}",
                            extra={"operation_id": operation_id, "error": str(e)}
                        )
                        # Default to returning that view doesn't exist for safety
                        view_exists = False
            
            cursor.close()
            
            db_logger.info(
                f"[{operation_id}] View '{view_name}' {'exists' if view_exists else 'does not exist'}",
                extra={"operation_id": operation_id, "view_exists": view_exists}
            )
            
            if not view_exists:
                error_message = f"The selected view '{view_name}' does not exist in the database. Please check with your DBA or select a different view."
                return False, error_message
            
            return True, None
            
    except Exception as e:
        error_message = f"Error validating view existence: {str(e)}"
        db_logger.error(
            f"[{operation_id}] {error_message}",
            extra={"operation_id": operation_id, "error": str(e)},
            exc_info=True
        )
        return False, error_message
