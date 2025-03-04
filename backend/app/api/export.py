import os
import pandas as pd
import numpy as np
import json
from datetime import datetime
import tempfile
import uuid
import pathlib
import pyodbc
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
                "hs": params.hs if params.hs else None,
                "prod": params.prod if params.prod else None,
                "Iec": params.iec if params.iec else None,
                "ExpCmp": params.expCmp if params.expCmp else None,
                "forcount": params.forcount if params.forcount else None,
                "forname": params.forname if params.forname else None,
                "port": params.port if params.port else None
            }
            
            print(f"Executing stored procedure with params: {sp_params}")
            
            # Execute the stored procedure
            # First, execute the stored procedure to populate the temp table
            param_list = list(sp_params.values())
            sp_call = f"EXEC {settings.EXPORT_STORED_PROCEDURE} ?, ?, ?, ?, ?, ?, ?, ?, ?"
            
            try:
                # Use cursor directly for executing stored procedure
                cursor = conn.cursor()
                cursor.execute(sp_call, param_list)
                conn.commit()
                cursor.close()
                
                # Then query the temp table for preview data
                preview_query = f"SELECT TOP {params.max_records} * FROM {settings.EXPORT_TEMP_TABLE}"
                
                # Use pandas to read the data
                df = pd.read_sql(preview_query, conn)
                
                # Convert DataFrame to dictionary with date handling
                # Convert all timestamps to strings in ISO format
                for col in df.select_dtypes(include=['datetime64']).columns:
                    df[col] = df[col].dt.strftime('%Y-%m-%dT%H:%M:%S')
                
                # Replace NaN values with None for JSON serialization
                df = df.replace({np.nan: None})
                
                # Convert to records
                result = df.to_dict('records')
                
                return result
            except pyodbc.Error as e:
                print(f"Database error during preview: {str(e)}")
                raise Exception(f"Database error: {str(e)}")
            except pd.io.sql.DatabaseError as e:
                print(f"Pandas SQL error during preview: {str(e)}")
                raise Exception(f"Data processing error: {str(e)}")
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
            
            # Create month-year string for filename (format: MMMYY)
            month_year = month_names.get(from_month, "") + from_year
            
            # Create base filename using HS code from first row
            base_filename = ""
            if first_row_hs and first_row_hs[0]:
                # Extract the first 8 characters of the HS code (or all if shorter)
                hs_code = str(first_row_hs[0]).strip()
                base_filename = hs_code[:8] if len(hs_code) > 8 else hs_code
            else:
                # Fallback to parameter if no data found
                if params.hs and params.hs != "%":
                    base_filename = params.hs.strip().replace(" ", "").split(",")[0]
                else:
                    base_filename = "Export"
            
            # Final filename format: HSCode_MMMYYEXP.xlsx (e.g., 12024210_NOV24EXP.xlsx)
            filename = f"{base_filename}_{month_year}EXP.xlsx"
            
            # Ensure temp directory exists
            temp_dir = pathlib.Path(settings.TEMP_DIR)
            os.makedirs(temp_dir, exist_ok=True)
            file_path = str(temp_dir / filename)
            file_path = os.path.abspath(file_path)
            
            print(f"Starting Excel generation at {datetime.now()}, filename: {filename}")
            
            # Skip template and use xlsxwriter directly for better performance
            import xlsxwriter
            
            # Create a workbook with optimized settings
            workbook = xlsxwriter.Workbook(file_path, {'constant_memory': True})
            worksheet = workbook.add_worksheet('Export Data')
            
            # Define formats
            header_format = workbook.add_format({
                'bold': True,
                'font_name': 'Times New Roman',
                'font_size': 10,
                'border': 1,
                'bg_color': '#366092',
                'font_color': 'white',
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
            
            # Process data in chunks
            chunk_size = 10000  # Increased chunk size
            offset = 0
            row_idx = 1  # Start from row 1 (after header)
            total_rows = 0
            
            print(f"Starting data export in chunks of {chunk_size}")
            
            while True:
                chunk_start = datetime.now()
                query = f"SELECT * FROM {settings.EXPORT_TEMP_TABLE} ORDER BY (SELECT NULL) OFFSET {offset} ROWS FETCH NEXT {chunk_size} ROWS ONLY"
                
                # Use cursor to fetch data
                cursor = conn.cursor()
                cursor.execute(query)
                
                rows = cursor.fetchall()
                if not rows:
                    break
                
                # Write data to Excel
                for row in rows:
                    # Set data row height
                    worksheet.set_row(row_idx, 15)  # Set data row height to 15
                    
                    for col_idx, value in enumerate(row):
                        # Use date format for column 3 (index 2)
                        if col_idx == 2 and value:  # SB_Date column
                            worksheet.write(row_idx, col_idx, value, date_format)
                        else:
                            worksheet.write(row_idx, col_idx, value, data_format)
                    row_idx += 1
                
                total_rows += len(rows)
                offset += chunk_size
                cursor.close()
                
                print(f"Processed {len(rows)} rows in {(datetime.now() - chunk_start).total_seconds()} seconds. Total: {total_rows}")
            
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