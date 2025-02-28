from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Login request model
class LoginRequest(BaseModel):
    server: str = Field(..., description="SQL Server name")
    database: str = Field(..., description="Database name")
    username: str = Field(..., description="Database username")
    password: str = Field(..., description="Database password")

# Export parameters model based on the stored procedure parameters
class ExportParameters(BaseModel):
    # Connection details (from login)
    server: str
    database: str
    username: str
    password: str
    
    # Export parameters (matching the stored procedure parameters)
    fromMonth: int = Field(..., description="Start month in format YYYYMM")
    toMonth: int = Field(..., description="End month in format YYYYMM")
    hs: str = Field("", description="HS Code filter")
    prod: str = Field("", description="Product description filter")
    iec: str = Field("", description="IEC filter")
    expCmp: str = Field("", description="Exporter company filter")
    forcount: str = Field("", description="Foreign country filter")
    forname: str = Field("", description="Foreign importer name filter")
    port: str = Field("", description="Port filter")
    
    # Additional options
    preview_only: bool = Field(False, description="If true, only return preview data")
    max_records: int = Field(100, description="Maximum number of records to return for preview")

# Preview response model
class PreviewResponse(BaseModel):
    data: List[Dict[str, Any]]
    count: int

# Export response model
class ExportResponse(BaseModel):
    file_path: str
    record_count: int
    status: str = "success"
    message: str = "Export completed successfully"