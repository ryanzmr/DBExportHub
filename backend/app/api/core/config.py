from pydantic import BaseModel
from typing import Optional, List
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv()

class Settings:
    def __init__(self):
        """Initialize settings with environment variables"""
        # Server settings
        self.HOST = os.getenv("HOST", "0.0.0.0")
        self.PORT = int(os.getenv("PORT", "8000"))

        # Authentication settings
        self.SECRET_KEY = os.getenv("SECRET_KEY", "your-secure-secret-key-please-change-in-production")
        self.JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
        self.ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

        # Database settings
        self.DB_DRIVER = os.getenv("DB_DRIVER")
        if not self.DB_DRIVER:
            raise ValueError("DB_DRIVER environment variable must be set")

        # Export/Import settings
        self.EXPORT_STORED_PROCEDURE = os.getenv("EXPORT_STORED_PROCEDURE", "ExportData_New1")
        self.EXPORT_VIEW = os.getenv("EXPORT_VIEW", "EXPDATA")
        self.IMPORT_STORED_PROCEDURE = os.getenv("IMPORT_STORED_PROCEDURE", "ImportJNPTData_New1")
        self.IMPORT_VIEW = os.getenv("IMPORT_VIEW", "IMPDATA")
        self.DB_FETCH_BATCH_SIZE = int(os.getenv("DB_FETCH_BATCH_SIZE", "150000"))  # Optimized universal batch size
        
        # Performance tuning settings
        self.DB_CURSOR_ARRAY_SIZE = int(os.getenv("DB_CURSOR_ARRAY_SIZE", "10000"))
        self.EXCEL_ROW_LIMIT = int(os.getenv("EXCEL_ROW_LIMIT", "1048576"))
        self.PREVIEW_SAMPLE_SIZE = int(os.getenv("PREVIEW_SAMPLE_SIZE", "100"))
        
        # Module-specific batch size overrides (optional)
        self.DB_BATCH_SIZE_IMPORT = int(os.getenv("DB_BATCH_SIZE_IMPORT", self.DB_FETCH_BATCH_SIZE))
        self.DB_BATCH_SIZE_EXPORT = int(os.getenv("DB_BATCH_SIZE_EXPORT", self.DB_FETCH_BATCH_SIZE))

        # File paths (relative to backend directory)
        self._base_dir = Path(__file__).resolve().parent.parent.parent.parent
        self.TEMP_DIR = self._resolve_path(os.getenv("TEMP_DIR", "./temp"))
        self.TEMPLATES_DIR = self._resolve_path(os.getenv("TEMPLATES_DIR", "./templates"))
        self.LOGS_DIR = self._resolve_path(os.getenv("LOGS_DIR", "./logs"))
        
        # Excel template settings
        self.EXCEL_TEMPLATE_PATH = self._resolve_path(
            os.getenv("EXCEL_TEMPLATE_PATH", 
            os.path.join(self.TEMPLATES_DIR, "EXDPORT_Tamplate_JNPT.xlsx"))
        )

        # Logging settings
        self.LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

        # CORS settings
        self.BACKEND_CORS_ORIGINS = os.getenv("BACKEND_CORS_ORIGINS", "http://localhost")
        self.CORS_ORIGINS_LIST = [
            origin.strip() 
            for origin in self.BACKEND_CORS_ORIGINS.split(",") 
            if origin.strip()
        ]        # Ensure required directories exist
        self._create_required_dirs()

    def get_batch_size(self, module_type: str = 'default') -> int:
        """
        Get batch size for specific module with fallback hierarchy.
        
        Args:
            module_type: 'import', 'export', or 'default'
            
        Returns:
            int: Appropriate batch size for the module
        """
        if module_type.lower() == 'import':
            return self.DB_BATCH_SIZE_IMPORT
        elif module_type.lower() == 'export':
            return self.DB_BATCH_SIZE_EXPORT
        else:
            return self.DB_FETCH_BATCH_SIZE

    def _resolve_path(self, path: str) -> str:
        """Convert relative paths to absolute paths relative to backend directory"""
        if path.startswith("./") or path.startswith(".\\"):
            return os.path.normpath(os.path.join(self._base_dir, path[2:]))
        return path

    def _create_required_dirs(self):
        """Create required directories if they don't exist"""
        os.makedirs(self.TEMP_DIR, exist_ok=True)
        os.makedirs(self.TEMPLATES_DIR, exist_ok=True)
        os.makedirs(self.LOGS_DIR, exist_ok=True)

# Create an instance of the settings class
settings = Settings()