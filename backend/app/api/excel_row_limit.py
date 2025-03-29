"""
Module to handle Excel row limit validation and related functionality.

This module provides functions to check if the number of records exceeds Excel's maximum limit
and to provide appropriate responses when such limits are encountered.
"""

import os
from typing import Tuple, Dict, Any
from ..logger import export_logger

# Constants
EXCEL_MAX_ROWS = 1_048_576  # Maximum number of rows in modern Excel

def check_row_limit(total_rows: int, operation_id: str) -> Dict[str, Any]:
    """
    Check if the total row count exceeds Excel's limit and return appropriate status.
    
    Args:
        total_rows: The total number of rows to be exported
        operation_id: The unique ID for the current export operation
    
    Returns:
        Dict containing status, message, and exceeds_limit flag
    """
    if total_rows <= EXCEL_MAX_ROWS:
        return {
            "exceeds_limit": False,
            "status": "within_limit",
            "message": "",
            "total_rows": total_rows,
            "max_rows": EXCEL_MAX_ROWS
        }
    
    export_logger.warning(
        f"[{operation_id}] Row count {total_rows} exceeds Excel limit of {EXCEL_MAX_ROWS}",
        extra={
            "operation_id": operation_id,
            "total_rows": total_rows,
            "max_rows": EXCEL_MAX_ROWS
        }
    )
    
    return {
        "exceeds_limit": True,
        "status": "exceeds_limit",
        "message": f"The export would generate {total_rows:,} rows, which exceeds Excel's maximum limit of {EXCEL_MAX_ROWS:,} rows.",
        "total_rows": total_rows,
        "max_rows": EXCEL_MAX_ROWS
    }

def process_exceeding_limit_response(
    should_proceed: bool, 
    total_rows: int, 
    operation_id: str
) -> Tuple[bool, int, str]:
    """
    Process user response when row limit is exceeded
    
    Args:
        should_proceed: Whether the user chose to proceed with partial export
        total_rows: The total number of rows that would be exported
        operation_id: The unique ID for the current export operation
    
    Returns:
        Tuple containing (should_continue, rows_to_export, message)
    """
    if should_proceed:
        export_logger.info(
            f"[{operation_id}] User chose to proceed with partial export of {EXCEL_MAX_ROWS} rows out of {total_rows}",
            extra={
                "operation_id": operation_id,
                "decision": "proceed_partial",
                "rows_to_export": EXCEL_MAX_ROWS,
                "total_rows": total_rows
            }
        )
        
        return (
            True, 
            EXCEL_MAX_ROWS,
            f"Proceeding with export of first {EXCEL_MAX_ROWS:,} rows out of {total_rows:,} total records."
        )
    else:
        export_logger.info(
            f"[{operation_id}] User chose to cancel export of {total_rows} rows",
            extra={
                "operation_id": operation_id,
                "decision": "cancel",
                "total_rows": total_rows
            }
        )
        
        return (
            False,
            0,
            f"Export cancelled. The data contains {total_rows:,} rows which exceeds Excel's limit of {EXCEL_MAX_ROWS:,} rows."
        ) 