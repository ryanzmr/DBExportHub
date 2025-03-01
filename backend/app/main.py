from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from typing import List, Optional
import os

from .config import settings
from .models import LoginRequest, ExportParameters, PreviewResponse
from .database import get_db_connection, test_connection
from .api.export import generate_excel, preview_data

# Initialize FastAPI app
app = FastAPI(
    title="DBExportHub",
    description="A web-based application for exporting SQL Server data to Excel",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to DBExportHub API"}

# Login endpoint
@app.post("/api/login")
async def login(request: LoginRequest):
    try:
        # Test the connection with provided credentials
        connection_string = f"DRIVER={{{settings.DB_DRIVER}}};SERVER={request.server};DATABASE={request.database};UID={request.username};PWD={request.password}"
        test_connection(connection_string)
        
        # Return success response with connection details
        return {
            "status": "success",
            "message": "Connection successful",
            "connection_details": {
                "server": request.server,
                "database": request.database,
                "username": request.username
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Connection failed: {str(e)}"
        )

# Preview data endpoint
@app.post("/api/preview")
async def get_preview(params: ExportParameters):
    try:
        # Get preview data (first 100 records)
        data = preview_data(params)
        return PreviewResponse(data=data, count=len(data))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating preview: {str(e)}"
        )

# Export data endpoint
@app.post("/api/export")
async def export_data(params: ExportParameters):
    try:
        # Generate Excel file
        file_path = generate_excel(params)
        
        # Verify file exists
        if not os.path.exists(file_path):
            raise Exception(f"Generated file not found at {file_path}")
            
        # Get file size for logging
        file_size = os.path.getsize(file_path)
        print(f"Serving file: {file_path}, Size: {file_size} bytes")
        
        # Return the file for download with explicit headers
        filename = os.path.basename(file_path)
        headers = {
            'Content-Disposition': f'attachment; filename="{filename}"',
            'Access-Control-Expose-Headers': 'Content-Disposition'
        }
        
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers=headers
        )
    except Exception as e:
        # Log the full error for debugging
        import traceback
        error_details = traceback.format_exc()
        print(f"Export error: {str(e)}\n{error_details}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error exporting data: {str(e)}"
        )

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}