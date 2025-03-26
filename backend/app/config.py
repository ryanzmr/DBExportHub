from pydantic import BaseModel
from typing import Optional, List
import os
from dotenv import load_dotenv
import pathlib
from pathlib import Path

# Load environment variables
load_dotenv()

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Create a settings class to hold configuration
class Settings:
    # Authentication settings
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))

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

    # CORS settings
    BACKEND_CORS_ORIGINS = os.getenv("BACKEND_CORS_ORIGINS", "http://localhost,http://localhost:3000,http://localhost:5173")
    CORS_ORIGINS_LIST = [origin.strip() for origin in BACKEND_CORS_ORIGINS.split(",") if origin.strip()]

# Create an instance of the settings class
settings = Settings()

# Ensure temp directory exists
os.makedirs(settings.TEMP_DIR, exist_ok=True)

# Ensure logs directory exists
os.makedirs(settings.LOG_DIR, exist_ok=True)