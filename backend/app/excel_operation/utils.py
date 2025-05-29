import os
import pandas as pd
# import numpy as np # Not directly used
# import json # Not directly used
from datetime import datetime
# import tempfile # Not directly used
# import uuid # Not directly used
# import pathlib # Not directly used
# import gc # Not directly used
from typing import List, Dict, Any, Optional # List, Dict, Any, Optional are used
import xlsxwriter

# Updated imports:
from ..config.settings import settings
from ..logging_operation.loggers import export_logger, import_logger, log_execution_time # import_logger was also used
from ..logging_operation.utils import log_excel_completion # log_excel_completion is in logging_operation/utils.py
from ..utilities.operation_tracker import is_operation_cancelled


def create_filename(params: Any, first_row_hs: Optional[List[str]], operation_type: str) -> str:
    """Create a filename for the Excel export/import based on the parameters"""
    from_month_str = str(params.fromMonth)
    to_month_str = str(params.toMonth)
    
    month_names = {
        "01": "JAN", "02": "FEB", "03": "MAR", "04": "APR", 
        "05": "MAY", "06": "JUN", "07": "JUL", "08": "AUG", 
        "09": "SEP", "10": "OCT", "11": "NOV", "12": "DEC"
    }
    
    from_month = from_month_str[-2:]
    from_year = from_month_str[2:4] 
    to_month = to_month_str[-2:]
    to_year = to_month_str[2:4]  
    
    mon1 = month_names.get(from_month, "") + from_year
    mon2 = month_names.get(to_month, "") + to_year
    
    month_year_str = mon1 if mon1 == mon2 else f"{mon1}-{mon2}"
    
    filename_parts = []
    
    if params.hs and params.hs != "%":
        hs_code = params.hs.strip().replace(" ", "").split(",")[0]
        filename_parts.append(hs_code)
    
    if params.prod and params.prod != "%":
        filename_parts.append(params.prod.replace(" ", "_"))
    
    if params.iec and params.iec != "%":
        filename_parts.append(params.iec)
    
    if operation_type == 'import':
        if params.impCmp and params.impCmp != "%":
            filename_parts.append(params.impCmp.replace(" ", "_"))
    elif operation_type == 'export':
        if params.expCmp and params.expCmp != "%":
            filename_parts.append(params.expCmp.replace(" ", "_"))
    
    if params.forcount and params.forcount != "%":
        filename_parts.append(params.forcount.replace(" ", "_"))
    
    # Original code used params.forname for both import and export context
    # This seems to be foreign importer name for export and foreign exporter name for import
    # Assuming params.forname is the correct field for both based on original logic.
    if params.forname and params.forname != "%":
        filename_parts.append(params.forname.replace(" ", "_"))
            
    if params.port and params.port != "%":
        filename_parts.append(params.port.replace(" ", "_"))
    
    filename_base = "_".join(filter(None, filename_parts)) # Filter out empty strings before joining
    
    if not filename_base:
        if first_row_hs and first_row_hs[0]:
            hs_code_from_row = str(first_row_hs[0]).strip()
            filename_base = hs_code_from_row[:8] if len(hs_code_from_row) > 8 else hs_code_from_row
        else:
            filename_base = "Import" if operation_type == 'import' else "Export"
    
    suffix = "IMP.xlsx" if operation_type == 'import' else "EXP.xlsx"
    final_filename = f"{filename_base}_{month_year_str}{suffix}"
    return final_filename

def setup_excel_workbook(file_path: str) -> xlsxwriter.Workbook:
    """Set up an Excel workbook with optimized settings for large datasets"""
    workbook_options = {
        'constant_memory': True,
        'use_zip64': True,      
        'default_date_format': 'dd-mmm-yy', 
        'tmpdir': settings.TEMP_DIR, 
        'in_memory': False,     
        'strings_to_numbers': False,
        'strings_to_formulas': False, 
        'strings_to_urls': False,  
        'nan_inf_to_errors': True 
    }
    
    workbook = xlsxwriter.Workbook(file_path, workbook_options)
    return workbook

def create_excel_formats(workbook: xlsxwriter.Workbook) -> Tuple[Any, Any, Any]: # xlsxwriter.format.Format
    """Create formats for Excel workbook based on requirements"""
    header_format = workbook.add_format({
        'bold': True, 'font_name': 'Times New Roman', 'font_size': 10,
        'border': 1, 'bg_color': '#4F81BD', 'font_color': 'black',
        'align': 'center', 'valign': 'vcenter'
    })
    
    data_format = workbook.add_format({
        'font_name': 'Times New Roman', 'font_size': 10,
        'border': 1, 'valign': 'vcenter', 'text_wrap': False
    })
    
    date_format = workbook.add_format({
        'font_name': 'Times New Roman', 'font_size': 10,
        'border': 1, 'num_format': 'dd-mmm-yy',
        'valign': 'vcenter', 'text_wrap': False
    })
    
    return header_format, data_format, date_format

def write_excel_headers(worksheet: Any, columns: List[str], header_format: Any): # xlsxwriter.worksheet.Worksheet, xlsxwriter.format.Format
    """Write headers to Excel worksheet"""
    for col_idx, column_name in enumerate(columns):
        worksheet.write(0, col_idx, column_name, header_format)
    worksheet.set_row(0, 20)

# write_data_to_excel function was noted as potentially unused and seems specific to a cursor-based data fetching
# which was refactored in database operations. If this function is indeed still needed,
# it would require significant rework to accept a DataFrame generator or list of dicts.
# For now, assuming it's part of the dead code that can be removed or refactored later if a use case arises.
# If it were to be kept and refactored, its `is_operation_cancelled` and `export_logger` usage would also need attention.
# Given the refactoring of data fetching in services to use DataFrame chunks, this cursor-based function is likely obsolete.
# I will comment it out for now.

# def write_data_to_excel(worksheet, cursor, data_format, date_format, operation_id, total_count):
#     """Write data to Excel worksheet in batches (NOTE: This function might be unused)"""
#     # from ..utilities.operation_tracker import is_operation_cancelled # Corrected path if used
#     # from ..logging_operation.loggers import export_logger # Corrected path if used
#     
#     batch_size = settings.DB_FETCH_BATCH_SIZE 
#     row_idx = 1 
#     total_rows = 0
#     cancellation_check_frequency = 1000
#     rows_since_last_check = 0
#     
#     while True:
#         if is_operation_cancelled(operation_id): # Needs logger for this message
#             # export_logger.info(f"[{operation_id}] Op cancelled during Excel data writing at row {total_rows}/{total_count}")
#             raise Exception("Operation cancelled by user")
#             
#         rows = cursor.fetchmany(batch_size)
#         if not rows:
#             break
#         
#         for row in rows:
#             rows_since_last_check += 1
#             if rows_since_last_check >= cancellation_check_frequency:
#                 if is_operation_cancelled(operation_id):
#                     # export_logger.info(f"[{operation_id}] Op cancelled during Excel data writing at row {total_rows}/{total_count}")
#                     raise Exception("Operation cancelled by user")
#                 rows_since_last_check = 0
#                 
#             if row_idx % 10 == 0:
#                 worksheet.set_row(row_idx, 15)
#            
#             for col_idx, value in enumerate(row):
#                 if col_idx == 2 and value: 
#                     worksheet.write(row_idx, col_idx, value, date_format)
#                 else:
#                     worksheet.write(row_idx, col_idx, value, data_format)
#             row_idx += 1
#         
#         total_rows += len(rows)
#     
#     return total_rows
