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
    hs: Optional[str] = Field("", description="HS Code filter")
    prod: Optional[str] = Field("", description="Product description filter")
    iec: Optional[str] = Field("", description="IEC filter")
    expCmp: Optional[str] = Field("", description="Exporter company filter")
    forcount: Optional[str] = Field("", description="Foreign country filter")
    forname: Optional[str] = Field("", description="Foreign importer name filter")
    port: Optional[str] = Field("", description="Port filter")
    
    # Additional options
    preview_only: bool = Field(True, description="If true, only return preview data")
    max_records: int = Field(100, description="Maximum number of records to return for preview")
    force_continue_despite_limit: bool = Field(False, description="If true, export will continue even if record count exceeds Excel limit")
    selectedView: Optional[str] = Field(None, description="Selected view for data extraction")

# Import parameters model based on the stored procedure parameters
class ImportParameters(BaseModel):
    # Connection details (from login)
    server: str
    database: str
    username: str
    password: str
    
    # Import parameters (matching the stored procedure parameters)
    fromMonth: int = Field(..., description="Start month in format YYYYMM")
    toMonth: int = Field(..., description="End month in format YYYYMM")
    hs: Optional[str] = Field("", description="HS Code filter")
    prod: Optional[str] = Field("", description="Product description filter")
    iec: Optional[str] = Field("", description="IEC filter")
    impCmp: Optional[str] = Field("", description="Importer company filter")  # Changed from expCmp to impCmp
    forcount: Optional[str] = Field("", description="Foreign country filter")
    forname: Optional[str] = Field("", description="Foreign exporter name filter")
    port: Optional[str] = Field("", description="Port filter")
    
    # Additional options
    preview_only: bool = Field(True, description="If true, only return preview data")
    max_records: int = Field(100, description="Maximum number of records to return for preview")
    force_continue_despite_limit: bool = Field(False, description="If true, export will continue even if record count exceeds Excel limit")
    selectedView: Optional[str] = Field(None, description="Selected view for data extraction")

# Export response model
class ExportResponse(BaseModel):
    file_path: str
    record_count: int
    status: str = "success"
    message: str = "Export completed successfully"

class HeaderStyle(BaseModel):
    backgroundColor: str = "82b1ff"  # Default blue
    fontColor: str = "000000"        # Default black

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
    force_continue_despite_limit: bool = False

# Preview response model
class PreviewResponse(BaseModel):
    data: List[Dict[str, Any]]
    count: int
    excel_format: Optional[ExcelFormat] = None