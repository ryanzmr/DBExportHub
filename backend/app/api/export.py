import os
import pandas as pd
import numpy as np
import json
from datetime import datetime
import tempfile
import uuid
import pathlib
from typing import List, Dict, Any, Optional

from ..config import settings
from ..database import get_db_connection, execute_query, query_to_dataframe

# Custom JSON encoder to handle pandas Timestamp objects
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if hasattr(obj, 'isoformat'):
            return obj.isoformat()
        elif pd.isna(obj):
            return None
        return super().default(obj)

def preview_data(params):
    """
    Generate a preview of the data based on the export parameters.
    Returns a limited number of records for preview in the UI.
    """
    try:
        # Connect to the database
        with get_db_connection(
            params.server, params.database, params.username, params.password
        ) as conn:
            # Build the query parameters for the stored procedure
            sp_params = {
                "fromMonth": params.fromMonth,
                "ToMonth": params.toMonth,
                "hs": params.hs or "",
                "prod": params.prod or "",
                "Iec": params.iec or "",
                "ExpCmp": params.expCmp or "",
                "forcount": params.forcount or "",
                "forname": params.forname or "",
                "port": params.port or ""
            }
            
            print(f"Executing stored procedure with params: {sp_params}")
            
            # Execute the stored procedure
            # First, execute the stored procedure to populate the temp table
            param_list = list(sp_params.values())
            sp_call = f"EXEC {settings.EXPORT_STORED_PROCEDURE} ?, ?, ?, ?, ?, ?, ?, ?, ?"
            
            # Use cursor directly for executing stored procedure
            cursor = conn.cursor()
            # Set cursor options for better performance
            cursor.fast_executemany = True
            cursor.execute(sp_call, param_list)
            conn.commit()
            cursor.close()
            
            # Then query the temp table for preview data with optimized query
            # Add NOLOCK hint to prevent blocking and improve performance
            preview_query = f"SELECT TOP {params.max_records} * FROM {settings.EXPORT_TEMP_TABLE} WITH (NOLOCK)"
            
            # Use direct cursor for better performance instead of pandas
            cursor = conn.cursor()
            cursor.execute(preview_query)
            
            # Get column names
            columns = [column[0] for column in cursor.description]
            
            # Fetch data directly without pandas to avoid memory overhead
            result = []
            for row in cursor.fetchall():
                # Convert row to dictionary
                row_dict = {}
                for i, value in enumerate(row):
                    # Handle datetime objects
                    if hasattr(value, 'isoformat'):
                        row_dict[columns[i]] = value.isoformat()
                    # Handle None values
                    elif value is None:
                        row_dict[columns[i]] = None
                    # Handle other types
                    else:
                        row_dict[columns[i]] = value
                result.append(row_dict)
            
            cursor.close()
            return result
    except Exception as e:
        print(f"Preview data error: {str(e)}")
        raise Exception(f"Error generating preview: {str(e)}")


def generate_excel(params):
    """
    Generate an Excel file based on the export parameters.
    Returns the path to the generated Excel file.
    """
    try:
        # Connect to the database
        with get_db_connection(
            params.server, params.database, params.username, params.password
        ) as conn:
            # Build the query parameters for the stored procedure
            sp_params = {
                "fromMonth": params.fromMonth,
                "ToMonth": params.toMonth,
                "hs": params.hs or "",
                "prod": params.prod or "",
                "Iec": params.iec or "",
                "ExpCmp": params.expCmp or "",
                "forcount": params.forcount or "",
                "forname": params.forname or "",
                "port": params.port or ""
            }
            
            # Execute the stored procedure
            param_list = list(sp_params.values())
            sp_call = f"EXEC {settings.EXPORT_STORED_PROCEDURE} ?, ?, ?, ?, ?, ?, ?, ?, ?"
            
            print(f"Executing stored procedure: {sp_call}")
            start_time = datetime.now()
            
            # Use cursor directly for executing stored procedure
            cursor = conn.cursor()
            cursor.execute(sp_call, param_list)
            conn.commit()
            cursor.close()
            
            print(f"Stored procedure executed in {(datetime.now() - start_time).total_seconds()} seconds")
            
            # Get the first row's HS code for the filename
            hs_code_query = f"SELECT TOP 1 [Hs_Code] FROM {settings.EXPORT_TEMP_TABLE}"
            cursor = conn.cursor()
            cursor.execute(hs_code_query)
            first_row_hs = cursor.fetchone()
            cursor.close()
            
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
            
            # Ensure temp directory exists
            temp_dir = pathlib.Path(settings.TEMP_DIR)
            os.makedirs(temp_dir, exist_ok=True)
            file_path = str(temp_dir / filename)
            file_path = os.path.abspath(file_path)
            
            print(f"Starting Excel generation at {datetime.now()}, filename: {filename}")
            
            # Skip template and use xlsxwriter directly for better performance
            import xlsxwriter
            
            # Create a workbook with optimized settings and ZIP64 support for large files
            workbook = xlsxwriter.Workbook(file_path, {'constant_memory': True, 'use_zip64': True})
            worksheet = workbook.add_worksheet('Export Data')
            
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
            
            # Get column headers
            cursor = conn.cursor()
            cursor.execute(f"SELECT TOP 1 * FROM {settings.EXPORT_TEMP_TABLE}")
            columns = [column[0] for column in cursor.description]
            cursor.close()
            
            # Write headers
            for col_idx, column in enumerate(columns):
                worksheet.write(0, col_idx, column, header_format)
            
            # Set row height for header
            worksheet.set_row(0, 20)  # Set header row height to 20
            
            # Set appropriate column widths based on content type
            column_widths = {
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
            
            # Apply column widths
            for col_idx, column in enumerate(columns):
                # Get width from mapping or use default width of 20 for unknown columns
                width = column_widths.get(column, 20)
                worksheet.set_column(col_idx, col_idx, width)
            
            # Process data in chunks with optimized approach for large datasets
            chunk_size = 250000  # Increased chunk size for better performance with large datasets
            offset = 0
            row_idx = 1  # Start from row 1 (after header)
            total_rows = 0
            
            # Enable garbage collection to manage memory better
            import gc
            
            print(f"Starting data export in chunks of {chunk_size}")
            
            # Get total row count for progress tracking using NOLOCK hint for better performance
            count_cursor = conn.cursor()
            count_cursor.execute(f"SELECT COUNT(*) FROM {settings.EXPORT_TEMP_TABLE} WITH (NOLOCK)")
            total_count = count_cursor.fetchone()[0]
            count_cursor.close()
            print(f"Total rows to export: {total_count}")
            
            # Optimize memory usage by using server-side cursor and additional SQL optimizations
            conn.execute("SET NOCOUNT ON")
            conn.execute("SET ARITHABORT ON")  # Improves SQL Server performance
            conn.execute("SET ANSI_NULLS ON")  # Improves SQL Server performance
            conn.execute("SET ANSI_PADDING ON")  # Improves SQL Server performance
            
            # Pre-allocate memory for worksheet rows to improve performance
            # This reduces the overhead of setting row properties individually
            worksheet.set_default_row(15)  # Set default row height for all rows
            
            # Optimize column formats by creating a mapping of column indexes to formats
            # This avoids format lookups in the inner loop
            date_column_indexes = [2]  # SB_Date column index
            
            # Use write_row instead of individual cell writes where possible
            # This is much faster than writing cells individually
            
            while True:
                chunk_start = datetime.now()
                # Use NOLOCK hint to prevent blocking and improve performance
                query = f"SELECT * FROM {settings.EXPORT_TEMP_TABLE} WITH (NOLOCK) ORDER BY (SELECT NULL) OFFSET {offset} ROWS FETCH NEXT {chunk_size} ROWS ONLY"
                
                # Use cursor with optimized fetch size
                cursor = conn.cursor()
                cursor.execute(query)
                
                # Fetch rows in batches to reduce memory pressure
                batch_size = 25000  # Increased batch size for better performance
                rows_processed = 0
                
                # Set cursor options for better performance
                cursor.arraysize = batch_size
                cursor.fast_executemany = True
                
                while True:
                    rows = cursor.fetchmany(batch_size)
                    if not rows:
                        break
                    
                    # Process rows in bulk where possible
                    for row in rows:
                        # Create a formatted row with appropriate cell formats
                        formatted_row = []
                        for col_idx, value in enumerate(row):
                            # Apply date format only to date columns
                            if col_idx in date_column_indexes and value:
                                # For date columns, we need to use individual cell writes with formatting
                                worksheet.write(row_idx, col_idx, value, date_format)
                            else:
                                # For other columns, add to the row for bulk writing
                                formatted_row.append(value)
                                # Write directly to the worksheet with the data format
                                worksheet.write(row_idx, col_idx, value, data_format)
                        
                        row_idx += 1
                        
                        # Flush to disk every 100,000 rows to manage memory
                        if row_idx % 100000 == 0:
                            workbook.close_stream()  # Flush data to disk
                    
                    rows_processed += len(rows)
                    
                    # Force garbage collection after each batch to free memory
                    if rows_processed % 100000 == 0:
                        gc.collect()
                
                total_rows += rows_processed
                offset += chunk_size
                cursor.close()
                
                # Force garbage collection after each chunk to free memory
                gc.collect()
                
                # Calculate progress percentage
                progress_pct = min(100, int((total_rows / total_count) * 100))
                print(f"Processed {rows_processed} rows in {(datetime.now() - chunk_start).total_seconds()} seconds. Total: {total_rows}/{total_count} ({progress_pct}%)")
                
                # Break if we've processed all rows or no rows were returned
                if rows_processed == 0 or total_rows >= total_count:
                    break
            
            # Freeze the header row
            worksheet.freeze_panes(1, 0)
            
            # Close the workbook
            workbook.close()
            
            print(f"Excel file generated at: {file_path} with {total_rows} rows in {(datetime.now() - start_time).total_seconds()} seconds")
            return file_path
    except Exception as e:
        print(f"Error generating Excel file: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise Exception(f"Error generating Excel file: {str(e)}")