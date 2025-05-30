# This file is now a wrapper around the modularized export functionality
# Import the actual implementation from export_service.py

import uuid
import os
import pathlib
import gc
import numpy as np
from datetime import datetime

from ..core.config import settings
from ..core.database import get_db_connection, query_to_dataframe
from ..core.logger import export_logger, log_execution_time, mask_sensitive_data

from .export_service import preview_data as preview_data_service
from .export_service import generate_excel as generate_excel_service
# Import CustomJSONEncoder from data_processing to maintain backward compatibility
from ..core.data_processing import CustomJSONEncoder

# Re-export the functions with the same names to maintain backward compatibility
@log_execution_time
def preview_data(params):
    """
    Generate a preview of the data based on the export parameters.
    Returns a limited number of records for preview in the UI.
    """
    # Call the refactored implementation from export_service.py
    # This will return a dictionary with data, operation_id, and total_records
    result = preview_data_service(params)
    
    # Return the result directly to the frontend
    return result


@log_execution_time
def generate_excel(params):
    """
    Generate an Excel file based on the export parameters.
    Returns the path to the generated Excel file and the operation ID.
    """
    # Call the refactored implementation from export_service.py
    # This will return both the file path and the operation ID
    file_path, operation_id = generate_excel_service(params)
    
    # Return the file path (for streaming) and add the operation ID to the response headers
    return file_path, operation_id