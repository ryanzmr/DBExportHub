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
from .api.auth import LoginRequest, TokenRefreshRequest, create_access_token, get_current_connection, authenticate_user, ACCESS_TOKEN_EXPIRE_MINUTES, SECRET_KEY, ALGORITHM

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
@app.post("/api/auth/login")
async def login(connection_details: LoginRequest):
    try:
        # Log login attempt without sensitive information
        print(f"Login attempt for server: {connection_details.server}, database: {connection_details.database}, username: {connection_details.username}")
        
        # Authenticate user by testing database connection
        await authenticate_user(connection_details)
        
        print("Database connection successful")
        
        # If connection successful, create access token
        # The create_access_token function will handle redacting sensitive information
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
    except HTTPException as e:
        # Re-raise HTTP exceptions
        raise e
    except Exception as e:
        print(f"Login error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(
            status_code=401,
            detail=f"Authentication failed: {str(e)}"
        )

# Token refresh endpoint
@app.post("/api/auth/refresh")
async def refresh_token(refresh_request: TokenRefreshRequest):
    try:
        # Decode the token without verifying expiration
        try:
            payload = jwt.decode(
                refresh_request.token, 
                SECRET_KEY, 
                algorithms=[ALGORITHM],
                options={"verify_exp": False}
            )
        except jwt.PyJWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token for refresh",
                headers={"WWW-Authenticate": "Bearer"}
            )
            
        # Extract connection details
        connection = payload.get("connection")
        if not connection:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token content",
                headers={"WWW-Authenticate": "Bearer"}
            )
            
        # Create a new token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"connection": connection},
            expires_delta=access_token_expires
        )
        
        return {
            "token": access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Token refresh error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error refreshing token: {str(e)}"
        )
    except HTTPException as e:
        # Re-raise HTTP exceptions
        raise e
    except Exception as e:
        print(f"Login error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(
            status_code=401,
            detail=f"Authentication failed: {str(e)}"
        )

# Preview data endpoint
@app.post("/api/export/preview")
async def get_preview(params: ExportParameters, connection: dict = Depends(get_current_connection)):
    try:
        # Update params with connection details from token
        params.server = connection["server"]
        params.database = connection["database"]
        params.username = connection["username"]
        params.password = connection["password"]
        
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

# Export data endpoint with streaming response
@app.post("/api/export")
async def export_data(params: ExportParameters, connection: dict = Depends(get_current_connection)):
    try:
        # Update params with connection details from token
        params.server = connection["server"]
        params.database = connection["database"]
        params.username = connection["username"]
        params.password = connection["password"]
        
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
async def cleanup_connection(connection_info: dict = Depends(get_current_connection)):
    try:
        print(f"Cleaning up connection for session: {connection_info.get('server', 'unknown')}")
        # Implement any cleanup logic here if needed
        return {"status": "success", "message": "Connection cleaned up successfully"}
    except Exception as e:
        print(f"Cleanup error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cleanup error: {str(e)}"
        )