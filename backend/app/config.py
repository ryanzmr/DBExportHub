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
    DB_DRIVER = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")

    # Export settings
    EXPORT_STORED_PROCEDURE = os.getenv("EXPORT_STORED_PROCEDURE", "ExportData_New1")
    EXPORT_VIEW = os.getenv("EXPORT_VIEW", "EXPDATA")

    # File storage settings
    TEMP_DIR = os.getenv("TEMP_DIR", os.path.join(BASE_DIR, "temp"))
    
    # Excel template path
    EXCEL_TEMPLATE_PATH = os.getenv("EXCEL_TEMPLATE_PATH", os.path.join(BASE_DIR, "templates", "EXDPORT_Tamplate_JNPT.xlsx"))

    # Logging settings
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_DIR = os.getenv("LOG_DIR", os.path.join(BASE_DIR, "logs"))

# Create an instance of the settings class
settings = Settings()

# Ensure temp directory exists
os.makedirs(settings.TEMP_DIR, exist_ok=True)