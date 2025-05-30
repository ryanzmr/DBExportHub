# Import-specific Excel utilities
import os
from datetime import datetime

from ..core.config import settings
from ..core.logger import import_logger

def create_filename_import(params, first_row_hs):
    """Create a filename for the Excel import based on the parameters"""
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
    
    # Add importer company if provided (changed from expCmp to impCmp)
    if params.impCmp and params.impCmp != "%":
        filename1 = filename1 + "_" + params.impCmp.replace(" ", "_")
    
    # Add foreign country if provided
    if params.forcount and params.forcount != "%":
        filename1 = filename1 + "_" + params.forcount.replace(" ", "_")
    
    # Add foreign exporter name if provided
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
            filename1 = "Import"
    
    # Final filename format: Parameters_MMMYYIMP.xlsx
    filename = f"{filename1}_{month_year}IMP.xlsx"
    return filename