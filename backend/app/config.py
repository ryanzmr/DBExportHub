from pydantic import BaseModel
from typing import Optional, List
import os
from dotenv import load_dotenv
import pathlib
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Create a settings class to hold configuration
class Settings:
    # Database settings
    DB_DRIVER = "ODBC Driver 17 for SQL Server"

    # Export settings
    EXPORT_STORED_PROCEDURE = "ExportData_New1"
    EXPORT_TEMP_TABLE = "EXPDATA"

    # File storage settings
    TEMP_DIR = os.path.join(BASE_DIR, "temp")
    
    # Excel template path
    EXCEL_TEMPLATE_PATH = os.path.join(BASE_DIR, "templates", "EXDPORT_Tamplate_JNPT.xlsx")

# Create an instance of the settings class
settings = Settings()

# Ensure temp directory exists
os.makedirs(settings.TEMP_DIR, exist_ok=True)