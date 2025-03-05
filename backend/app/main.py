from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from typing import List, Optional
import os
import json
from datetime import datetime, timedelta
import jwt
from pydantic import BaseModel

# Import your existing modules
from .database import get_db_connection, test_connection
from .models import ExportParameters, PreviewResponse
from .api.export import generate_excel, preview_data, CustomJSONEncoder

# Add LoginRequest model
class LoginRequest(BaseModel):
    server: str
    database: str
    username: str
    password: str

# Add these constants for JWT
SECRET_KEY = "your-secret-key-here"  # Change this to a secure secret key
ALGORITHM = "HS256"
# Change this constant
ACCESS_TOKEN_EXPIRE_MINUTES = 5  # Changed back from 30 to 5 minutes

# Initialize FastAPI app
app = FastAPI(
    title="DBExportHub",
    description="A web-based application for exporting SQL Server data to Excel",
    version="1.0.0"
)

# Configure CORS - IMPORTANT: This must be added before any routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to DBExportHub API"}

# Login endpoint
# Update the login endpoint to better handle errors and provide more debugging
@app.post("/api/auth/login")
async def login(connection_details: LoginRequest):
    try:
        print(f"Login attempt for server: {connection_details.server}, database: {connection_details.database}")
        
        # Verify database connection using test_connection
        conn = test_connection(
            connection_details.server,
            connection_details.database,
            connection_details.username,
            connection_details.password
        )
        
        print("Database connection successful")
        
        # If connection successful, create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"connection": connection_details.dict()},
            expires_delta=access_token_expires
        )
        
        print(f"Generated token with expiry: {ACCESS_TOKEN_EXPIRE_MINUTES} minutes")
        
        return {
            "token": access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
    except Exception as e:
        print(f"Login error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(
            status_code=401,
            detail=f"Authentication failed: {str(e)}"
        )

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Preview data endpoint
@app.post("/api/export/preview")
async def get_preview(params: ExportParameters):
    try:
        # Get preview data (first 100 records)
        data = preview_data(params)
        
        # Use custom JSON encoder for timestamps
        json_compatible_data = json.loads(
            json.dumps({"data": data, "count": len(data)}, cls=CustomJSONEncoder)
        )
        
        # Return a properly formatted response
        return json_compatible_data
    except Exception as e:
        import traceback
        print(f"Preview error: {str(e)}")
        print(traceback.format_exc())
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating preview: {str(e)}"
        )
        return PreviewResponse(data=data, count=len(data))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating preview: {str(e)}"
        )

# Export data endpoint with streaming response
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
        
        # Use streaming response for large files
        def iterfile():
            with open(file_path, mode="rb") as file_like:
                chunk_size = 1024 * 1024  # 1MB chunks
                while chunk := file_like.read(chunk_size):
                    yield chunk
            # Clean up the file after sending
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    print(f"Temporary file removed: {file_path}")
                except:
                    pass
        
        headers = {
            'Content-Disposition': f'attachment; filename="{filename}"',
            'Access-Control-Expose-Headers': 'Content-Disposition'
        }
        
        return StreamingResponse(
            iterfile(),
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
# Add a cleanup endpoint
@app.post("/api/cleanup")
async def cleanup_connection(connection_info: dict):
    try:
        print(f"Cleaning up connection for session: {connection_info.get('sessionId', 'unknown')}")
        # Implement any cleanup logic here if needed
        return {"status": "success", "message": "Connection cleaned up successfully"}
    except Exception as e:
        print(f"Cleanup error: {str(e)}")
        return {"status": "error", "message": str(e)}