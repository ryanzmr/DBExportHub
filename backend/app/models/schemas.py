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
    ignore_excel_limit: bool = Field(False, description="Alternative flag for forcing continuation despite Excel limit") # Added to match export_service logic

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
    download_only: bool = Field(False, description="If true, indicates a request to download an already generated file") # Added from import_service logic
    operation_id: Optional[str] = Field(None, description="Operation ID, used for download_only requests") # Added from import_service logic


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

class ExportRequest(BaseModel): # This seems like a duplicate/alternative to ExportParameters, keeping as is for now
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
    count: int # This was 'total_records' in export_service and 'total_count' in import_service. Standardizing to 'count'.
    headers: Optional[List[str]] = None # Added from import_service preview response
    first_row_hs: Optional[str] = None  # Added from import_service preview response
    excel_format: Optional[ExcelFormat] = None
    operation_id: Optional[str] = None # Added as it's part of the response dict in services
    total_records: Optional[int] = None # Keeping this for now if `count` is different contextually
                                        # In export_service, total_records was record_count from execute_export_procedure
                                        # In import_service, total_records was total_count from get_total_row_count_import
                                        # This needs careful alignment in the service layer refactoring.

# For operation progress response
class OperationProgressResponse(BaseModel):
    operation_id: str
    status: str
    current: int
    total: int
    percentage: int

# For cancel operation response
class CancelResponse(BaseModel):
    message: str
    operation_id: str
    status: str

# For test connection response
class TestConnectionResponse(BaseModel):
    success: bool
    message: str

# For /api/cleanup response
class CleanupResponse(BaseModel):
    success: bool
    message: str

# For root endpoint response
class HealthCheckResponse(BaseModel):
    status: str
    message: str
    version: str

# For login response
class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
