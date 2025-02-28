from pydantic_settings import BaseSettings
from typing import Optional, ClassVar
import os
from dotenv import load_dotenv
import pathlib

# Load environment variables from .env file
load_dotenv()

# Get the absolute path of the project root directory
BASE_DIR = pathlib.Path(__file__).parent.parent.absolute()

class Settings(BaseSettings):
    # API settings
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "DBExportHub"
    
    # CORS settings
    BACKEND_CORS_ORIGINS: list = ["http://localhost", "http://localhost:3000"]
    
    # Database settings (defaults, will be overridden by user input)
    DB_SERVER: Optional[str] = os.getenv("DB_SERVER", "localhost")
    DB_NAME: Optional[str] = os.getenv("DB_NAME", "RAW_PROCESS")
    DB_USER: Optional[str] = os.getenv("DB_USER", "")
    DB_PASSWORD: Optional[str] = os.getenv("DB_PASSWORD", "")
    DB_DRIVER: str = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")
    
    # SQL Query settings
    EXPORT_STORED_PROCEDURE: str = os.getenv("EXPORT_STORED_PROCEDURE", "ExportData_New1")
    EXPORT_TEMP_TABLE: str = os.getenv("EXPORT_TEMP_TABLE", "EXPTEMP")
    
    # File storage settings - using absolute paths to handle spaces in directory names
    TEMP_DIR: str = os.getenv("TEMP_DIR", str(BASE_DIR / "temp"))
    
    # Excel template path
    EXCEL_TEMPLATE_PATH: str = ""
    
    # Security settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-for-jwt-here")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Create settings instance
settings = Settings()

# Fix the template path to correctly point to the template file
template_path_env = os.getenv("EXCEL_TEMPLATE_PATH")

# First check if the template exists in the project root directory
root_template_path = str(BASE_DIR.parent / "EXDPORT_Tamplate_JNPT.xlsx")
if os.path.exists(root_template_path):
    settings.EXCEL_TEMPLATE_PATH = root_template_path
else:
    # Handle the path from environment variable
    if template_path_env and not os.path.isabs(template_path_env):
        # If it's a relative path, make it absolute relative to BASE_DIR
        if template_path_env.startswith('../'):
            # Handle the case where path starts with '../'
            parent_dir = BASE_DIR.parent
            rel_path = template_path_env[3:]
            settings.EXCEL_TEMPLATE_PATH = str(parent_dir / rel_path)
        else:
            # Regular relative path
            settings.EXCEL_TEMPLATE_PATH = str(BASE_DIR / template_path_env)
    else:
        # Use the environment variable or default
        settings.EXCEL_TEMPLATE_PATH = template_path_env or str(BASE_DIR / "templates" / "EXDPORT_Tamplate_JNPT.xlsx")

# Ensure temp directory exists - using pathlib to handle paths with spaces
os.makedirs(settings.TEMP_DIR, exist_ok=True)