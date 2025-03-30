import os
import pandas as pd
import numpy as np
import json
from datetime import datetime
import tempfile
import uuid
import pathlib
import gc
from typing import List, Dict, Any, Optional
import xlsxwriter

from ..config import settings
from ..logger import export_logger, log_execution_time
from .logging_utils import log_excel_completion

def create_filename(params, first_row_hs):
    """Create a filename for the Excel export based on the parameters"""
    # Extract month and year for filename
    from_month_str = str(params.fromMonth)
    to_month_str = str(params.toMonth)
    
    # Convert month number to month name
    month_names = {
        "01": "JAN", "02": "FEB", "03": "MAR", "04": "APR", 
        "05": "MAY", "06": "JUN", "07": "JUL", "08": "AUG", 
        "09": "SEP", "10": "OCT", "11": "NOV", "12": "DEC"
    }
    
    # Get month and year parts
    from_month = from_month_str[-2:]
    from_year = from_month_str[2:4]  # Get the last 2 digits of year (YYYY format)
    to_month = to_month_str[-2:]
    to_year = to_month_str[2:4]  # Get the last 2 digits of year (YYYY format)
    
    # Create month-year strings
    mon1 = month_names.get(from_month, "") + from_year
    mon2 = month_names.get(to_month, "") + to_year
    
    # Determine if we need to show a range or single month
    if mon1 == mon2:
        month_year = mon1
    else:
        month_year = mon1 + "-" + mon2
    
    # Build filename with all search parameters
    filename1 = ""
    
    # Add HS code if provided
    if params.hs and params.hs != "%":
        hs_code = params.hs.strip().replace(" ", "").split(",")[0]
        filename1 = filename1 + hs_code
    
    # Add product if provided
    if params.prod and params.prod != "%":
        filename1 = filename1 + "_" + params.prod.replace(" ", "_")
    
    # Add IEC if provided
    if params.iec and params.iec != "%":
        filename1 = filename1 + "_" + params.iec
    
    # Add exporter company if provided
    if params.expCmp and params.expCmp != "%":
        filename1 = filename1 + "_" + params.expCmp.replace(" ", "_")
    
    # Add foreign country if provided
    if params.forcount and params.forcount != "%":
        filename1 = filename1 + "_" + params.forcount.replace(" ", "_")
    
    # Add foreign importer name if provided
    if params.forname and params.forname != "%":
        filename1 = filename1 + "_" + params.forname.replace(" ", "_")
    
    # Add port if provided
    if params.port and params.port != "%":
        filename1 = filename1 + "_" + params.port.replace(" ", "_")
    
    # Remove leading underscore if present
    if filename1 and filename1[0] == "_":
        filename1 = filename1[1:]
    
    # If no parameters were provided, use default name
    if not filename1:
        if first_row_hs and first_row_hs[0]:
            # Extract the HS code from first row
            hs_code = str(first_row_hs[0]).strip()
            filename1 = hs_code[:8] if len(hs_code) > 8 else hs_code
        else:
            filename1 = "Export"
    
    # Final filename format: Parameters_MMMYYEXP.xlsx
    filename = f"{filename1}_{month_year}EXP.xlsx"
    return filename

def setup_excel_workbook(file_path):
    """Set up an Excel workbook with optimized settings for large datasets"""
    # Create a workbook with highly optimized settings for large datasets
    workbook_options = {
        'constant_memory': True,  # Use constant memory mode for reduced memory usage
        'use_zip64': True,       # Enable ZIP64 extensions for files > 4GB
        'default_date_format': 'dd-mmm-yy',  # Set default date format
        'tmpdir': settings.TEMP_DIR,  # Use temp directory for temporary files
        'in_memory': False,      # Don't store everything in memory
        'strings_to_numbers': True,  # Convert string numbers to numeric values
        'strings_to_formulas': False,  # Don't convert strings to formulas (faster)
        'strings_to_urls': False,  # Don't convert strings to URLs (faster)
        'nan_inf_to_errors': True  # Convert NaN/Inf to Excel errors
    }
    
    # Create workbook with optimized settings
    workbook = xlsxwriter.Workbook(file_path, workbook_options)
    return workbook

def create_excel_formats(workbook):
    """Create formats for Excel workbook"""
    # Define formats
    header_format = workbook.add_format({
        'bold': True,
        'font_name': 'Times New Roman',
        'font_size': 10,
        'border': 1,
        'bg_color': '#4F81BD',
        'font_color': 'black',
        'align': 'center',
        'valign': 'vcenter'
    })
    
    data_format = workbook.add_format({
        'font_name': 'Times New Roman',
        'font_size': 10,
        'border': 1
    })
    
    date_format = workbook.add_format({
        'font_name': 'Times New Roman',
        'font_size': 10,
        'border': 1,
        'num_format': 'dd-mmm-yy'
    })
    
    return header_format, data_format, date_format

def get_column_widths():
    """Get column width mappings for Excel export"""
    return {
        # Numeric fields - narrower
        'SB_NO': 12,
        'HS4': 8,
        'Hs_Code': 12,
        'QTY': 10,
        'Unit': 8,
        'Value IN FC': 15,
        'Total SB Value in INR in Lacs': 15,
        'iec': 12,
        'Item_no': 8,
        'Invoice_no': 12,
        
        # Date fields
        'sb_Date': 12,
        
        # Short text fields
        'Unit Rate Currency': 12,
        'Port of Destination': 18,
        'Ctry of Destination': 18,
        'port of origin': 18,
        'Exporter City': 15,
        
        # Long text fields - wider
        'Product': 40,
        'Unit Rate in Foreign Currency - FC not specified, Very Imp : Som': 25,
        'Indian Exporter Name': 35,
        'Exporter Add1': 35,
        'Exporter Add2': 35,
        'Foreign Importer Name': 35,
        'FOR_Add1': 35
    }

def write_excel_headers(worksheet, columns, header_format):
    """Write headers to Excel worksheet"""
    # Write headers
    for col_idx, column in enumerate(columns):
        worksheet.write(0, col_idx, column, header_format)
    
    # Set row height for header
    worksheet.set_row(0, 20)  # Set header row height to 20

def set_column_widths(worksheet, columns, column_widths):
    """Set column widths in Excel worksheet"""
    # Apply column widths
    for col_idx, column in enumerate(columns):
        # Get width from mapping or use default width of 20 for unknown columns
        width = column_widths.get(column, 20)
        worksheet.set_column(col_idx, col_idx, width)

def autofit_columns(worksheet, data_rows, columns):
    """Automatically adjust column widths based on content
    
    This function calculates the appropriate width for each column based on:
    1. The length of the column header
    2. The maximum length of data in each column
    3. Content type (dates, numbers, text)
    4. A buffer for better readability
    
    Similar to Excel's AutoFit functionality in the reference VB code:
    wks.Range("A1", Selection.Cells(record, 31)).Columns.AutoFit
    """
    # Initialize dictionary to track max width for each column
    max_widths = {}
    
    # Column type mapping to help with width calculations
    column_types = {
        'SB_NO': 'numeric',
        'sb_Date': 'date',
        'HS4': 'numeric',
        'Hs_Code': 'numeric',
        'QTY': 'numeric',
        'Unit': 'short_text',
        'Value IN FC': 'numeric',
        'Total SB Value in INR in Lacs': 'numeric',
        'iec': 'numeric',
        'Item_no': 'numeric',
        'Invoice_no': 'numeric',
        'Unit Rate Currency': 'short_text',
        'Port of Destination': 'medium_text',
        'Ctry of Destination': 'medium_text',
        'port of origin': 'medium_text',
        'Exporter City': 'medium_text',
        'Product': 'long_text',
        'Unit Rate in Foreign Currency - FC not specified, Very Imp : Som': 'long_text',
        'Indian Exporter Name': 'long_text',
        'Exporter Add1': 'long_text',
        'Exporter Add2': 'long_text',
        'Foreign Importer Name': 'long_text',
        'FOR_Add1': 'long_text'
    }
    
    # Enhanced width calculation factors for Times New Roman font
    # These factors are recalibrated based on Excel's actual display characteristics
    width_factors = {
        'numeric': 1.2,        # Increased from 1.0 for better visibility
        'date': 1.3,           # Increased from 1.1 for better visibility
        'short_text': 1.3,     # Increased from 1.1 for better visibility
        'medium_text': 1.35,   # Increased from 1.15 for better visibility
        'long_text': 1.4,      # Increased from 1.2 for better visibility
        'default': 1.35        # Increased from 1.15 for better visibility
    }
    
    # Increased minimum widths by column type
    min_widths = {
        'numeric': 14,         # Increased from 12
        'date': 16,            # Increased from 14
        'short_text': 14,      # Increased from 12
        'medium_text': 22,     # Increased from 18
        'long_text': 35,       # Increased from 25
        'default': 15          # Increased from 12
    }
    
    # Increased maximum widths by column type for better readability
    max_width_caps = {
        'numeric': 30,         # Increased from 25
        'date': 22,            # Increased from 18
        'short_text': 30,      # Increased from 25
        'medium_text': 55,     # Increased from 45
        'long_text': 120,      # Increased from 85
        'default': 60          # Increased from 50
    }
    
    # Special column overrides for known problematic columns
    special_column_overrides = {
        'Product': {'min_width': 50, 'max_width': 130},            # Increased from 40/100
        'Indian Exporter Name': {'min_width': 45, 'max_width': 110}, # Increased from 35/90
        'Foreign Importer Name': {'min_width': 45, 'max_width': 110}, # Increased from 35/90
        'Exporter Add1': {'min_width': 45, 'max_width': 100},       # Increased from 35/80
        'Exporter Add2': {'min_width': 45, 'max_width': 100},       # Increased from 35/80
        'FOR_Add1': {'min_width': 45, 'max_width': 100}             # Increased from 35/80
    }
    
    # Log the number of rows being processed for autofit
    export_logger.info(f"Autofitting columns based on {len(data_rows)} rows of data")
    
    # First, consider the header width
    for col_idx, column in enumerate(columns):
        column_name = str(column)
        column_type = column_types.get(column_name, 'default')
        factor = width_factors.get(column_type, width_factors['default'])
        
        # Calculate header width with appropriate factor and buffer
        header_width = len(column_name) * factor + 6  # Increased buffer from 4 to 6
        
        # Get minimum width, checking special overrides first
        if column_name in special_column_overrides:
            min_width = special_column_overrides[column_name]['min_width']
        else:
            min_width = min_widths.get(column_type, min_widths['default'])
        
        # Initialize with the larger of header width or minimum width
        max_widths[col_idx] = max(header_width, min_width)
    
    # Then check all data rows to find the maximum content length
    for row_idx, row in enumerate(data_rows):
        # Log progress for large datasets
        if len(data_rows) > 1000 and row_idx % 1000 == 0:
            export_logger.debug(f"Autofit processing row {row_idx}/{len(data_rows)}")
            
        for col_idx, cell_value in enumerate(row):
            if cell_value is None or cell_value == '':
                continue
                
            # Get column name and type
            column_name = columns[col_idx] if col_idx < len(columns) else ''
            column_type = column_types.get(column_name, 'default')
            
            # Convert to string and calculate length
            cell_str = str(cell_value)
            
            # Skip empty strings
            if not cell_str.strip():
                continue
                
            # Get appropriate width factor and caps for this column type
            factor = width_factors.get(column_type, width_factors['default'])
            
            # Get min/max width, checking special overrides first
            if column_name in special_column_overrides:
                min_width = special_column_overrides[column_name]['min_width']
                max_cap = special_column_overrides[column_name]['max_width']
            else:
                min_width = min_widths.get(column_type, min_widths['default'])
                max_cap = max_width_caps.get(column_type, max_width_caps['default'])
            
            # Calculate content width with appropriate buffer based on content type
            if column_type == 'date' or (col_idx == 2 and cell_value):  # SB_Date column
                content_width = min_widths['date']  # Fixed width for dates
            elif column_type == 'numeric':
                # For numeric values, use a buffer based on length
                buffer = 5 if len(cell_str) < 10 else 7  # Increased buffers
                content_width = min(len(cell_str) * factor + buffer, max_cap)
            elif column_type == 'long_text':
                # For long text, use a more generous calculation with larger buffers
                text_len = len(cell_str)
                
                # Progressive buffer based on text length - increased all buffers
                if text_len < 20:
                    buffer = 8   # Increased from 6
                elif text_len < 50:
                    buffer = 12  # Increased from 8
                elif text_len < 100:
                    buffer = 15  # Increased from 10
                else:
                    buffer = 20  # Increased from 12
                    
                # Enhanced progressive factor for longer text
                # This provides more space for very long product descriptions
                # More aggressive adjustment for longer text
                adjusted_factor = factor * (1.0 + (text_len / 100))  # Changed from 150 to 100
                
                # Calculate width with enhanced factor and buffer
                content_width = min(text_len * adjusted_factor + buffer, max_cap)
                
                # For extremely long text (over 200 chars), ensure minimum percentage of text is visible
                if text_len > 200:
                    min_visible_width = min(text_len * 0.5, max_cap)  # Show at least 50% of text width (increased from 40%)
                    content_width = max(content_width, min_visible_width)
            else:
                # Default handling with increased buffer
                buffer = 8  # Increased from 5
                content_width = min(len(cell_str) * factor + buffer, max_cap)
            
            # Update max width if this content is wider
            content_width = max(content_width, min_width)
            if content_width > max_widths.get(col_idx, 0):
                max_widths[col_idx] = content_width
    
    # Apply the calculated widths to the worksheet
    for col_idx, width in max_widths.items():
        # Round width to nearest 0.5 for better Excel display
        # Add a small additional buffer to ensure text isn't cut off
        adjusted_width = (round(width * 2) / 2) + 1.5  # Added 1.5 extra buffer to all columns
        
        # Apply minimum width constraints based on column type
        if col_idx < len(columns):
            column_name = columns[col_idx]
            column_type = column_types.get(column_name, 'default')
            
            # Ensure long text columns have sufficient width
            if column_type == 'long_text':
                adjusted_width = max(adjusted_width, min_widths['long_text'] + 10)  # Ensure long text has extra space
            
            # Log column width being set
            export_logger.debug(f"Setting column {col_idx} ({column_name}) width to {adjusted_width}")
        
        # Apply the width to the column
        worksheet.set_column(col_idx, col_idx, adjusted_width)
    
    export_logger.info(f"Autofit completed for {len(columns)} columns with enhanced width calculations")

def write_data_to_excel(worksheet, cursor, data_format, date_format, operation_id, total_count):
    """Write data to Excel worksheet in batches"""
    # Import here to avoid circular imports
    from .operation_tracker import is_operation_cancelled
    
    # Process data in chunks with optimized approach for large datasets
    batch_size = 100000  # Increased batch size for better performance
    row_idx = 1  # Start from row 1 (after header)
    total_rows = 0
    
    # Check cancellation frequency - check every N rows for better performance
    cancellation_check_frequency = 1000
    rows_since_last_check = 0
    
    while True:
        # Check if operation has been cancelled before fetching and processing each batch
        if is_operation_cancelled(operation_id):
            export_logger.info(f"[{operation_id}] Operation cancelled during Excel data writing at row {total_rows}/{total_count}")
            raise Exception("Operation cancelled by user")
            
        chunk_start = datetime.now()
        rows = cursor.fetchmany(batch_size)
        if not rows:
            break
        
        # Write data to Excel
        for row in rows:
            # Check for cancellation periodically during row processing
            # This makes cancellation more responsive without checking on every single row
            rows_since_last_check += 1
            if rows_since_last_check >= cancellation_check_frequency:
                if is_operation_cancelled(operation_id):
                    export_logger.info(f"[{operation_id}] Operation cancelled during Excel data writing at row {total_rows}/{total_count}")
                    raise Exception("Operation cancelled by user")
                rows_since_last_check = 0
                
            # Only set row height for every 10th row to improve performance
            if row_idx % 10 == 0:
                worksheet.set_row(row_idx, 15)
            
            for col_idx, value in enumerate(row):
                # Use date format for column 3 (index 2)
                if col_idx == 2 and value:  # SB_Date column
                    worksheet.write(row_idx, col_idx, value, date_format)
                else:
                    worksheet.write(row_idx, col_idx, value, data_format)
            row_idx += 1
        
        rows_processed = len(rows)
        total_rows += rows_processed
    
    # Return the total number of rows processed
    return total_rows