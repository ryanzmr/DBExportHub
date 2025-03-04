from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
import re

# Login request model
class LoginRequest(BaseModel):
    server: str = Field(..., description="SQL Server name")
    database: str = Field(..., description="Database name")
    username: str = Field(..., description="Database username")
    password: str = Field(..., description="Database password")

# Export parameters model based on the stored procedure parameters
class ExportParameters(BaseModel):
    # Connection details (from login)
    server: str = Field(..., description="SQL Server name or IP address")
    database: str = Field(..., description="Database name")
    username: str = Field(..., description="Database username")
    password: str = Field(..., description="Database password")
    
    # Export parameters (matching the stored procedure parameters)
    fromMonth: int = Field(..., description="Start month in format YYYYMM (e.g., 202101)")
    toMonth: int = Field(..., description="End month in format YYYYMM (e.g., 202112)")
    hs: Optional[str] = Field("", description="HS Code filter (comma-separated values)")
    prod: Optional[str] = Field("", description="Product description filter (use % for wildcard)")
    iec: Optional[str] = Field("", description="IEC filter (comma-separated values)")
    expCmp: Optional[str] = Field("", description="Exporter company filter (use % for wildcard)")
    forcount: Optional[str] = Field("", description="Foreign country filter (comma-separated values)")
    forname: Optional[str] = Field("", description="Foreign importer name filter (use % for wildcard)")
    port: Optional[str] = Field("", description="Port filter (comma-separated values)")
    
    # Additional options
    preview_only: bool = Field(True, description="If true, only return preview data")
    max_records: int = Field(100, description="Maximum number of records to return for preview")
    
    @validator('fromMonth', 'toMonth')
    def validate_month_format(cls, v):
        # Ensure month is in YYYYMM format
        if not re.match(r'^\d{6}$', str(v)):
            raise ValueError('Month must be in YYYYMM format (e.g., 202101)')
        return v
    
    @validator('toMonth')
    def validate_date_range(cls, v, values):
        # Ensure toMonth is greater than or equal to fromMonth
        if 'fromMonth' in values and v < values['fromMonth']:
            raise ValueError('End month must be greater than or equal to start month')
        return v
    
    @validator('max_records')
    def validate_max_records(cls, v):
        # Ensure max_records is within a reasonable range
        if v < 1:
            raise ValueError('max_records must be at least 1')
        if v > 1000:
            raise ValueError('max_records cannot exceed 1000 for performance reasons')
        return v

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

class HeaderStyle(BaseModel):
    backgroundColor: str = "82b1ff"  # Default blue
    fontColor: str = "000000"        # Default white

class ExcelFormat(BaseModel):
    fontName: str = "Times New Roman"
    fontSize: int = 10
    headerStyle: HeaderStyle = HeaderStyle()

class ExportRequest(BaseModel):
    server: str
    database: str
    username: str
    password: str
    query: str
    parameters: Dict[str, Any] = {}
    filename: Optional[str] = None
    preview_only: bool = False
    max_records: int = 100
    fromMonth: Optional[int] = None
    toMonth: Optional[int] = None
    hs: Optional[str] = None
    prod: Optional[str] = None
    iec: Optional[str] = None
    expCmp: Optional[str] = None
    forcount: Optional[str] = None
    forname: Optional[str] = None
    port: Optional[str] = None
    preview_only: bool = True
    max_records: int = 100

class PreviewResponse(BaseModel):
    data: List[Dict[str, Any]]
    count: int
    excel_format: Optional[ExcelFormat] = None