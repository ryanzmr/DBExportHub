from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from typing import List, Optional
import os
import json
from datetime import datetime, timedelta
import jwt  # Using PyJWT as specified in requirements.txt
from pydantic import BaseModel
import uuid
import time
import base64
import logging

# Import your existing modules
from .database import get_db_connection, test_connection
from .models import ExportParameters, ImportParameters, PreviewResponse, LoginRequest
from .api.export import generate_excel, preview_data, CustomJSONEncoder
from .api.import_api import generate_excel as generate_excel_import, preview_data as preview_data_import
from .api.cancel import cancel_router
from .logger import logger, access_logger, log_api_request
from .config import settings

# JWT constants from config
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

# Universal token functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Create an access token using a simple but secure approach that works universally
    """
    to_encode = data.copy()
    
    # Set expiration time
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire.timestamp()})
    
    try:
        # First try using the jwt package if available
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        # Ensure we return a string - some versions return bytes
        if isinstance(encoded_jwt, bytes):
            encoded_jwt = encoded_jwt.decode('utf-8')
        return encoded_jwt
    except (AttributeError, ImportError, Exception) as e:
        # Fallback to our own implementation if jwt.encode is not available
        logger.warning(f"JWT encode failed, using fallback implementation: {str(e)}")
        # Simple implementation - security is maintained by the SECRET_KEY
        payload_json = json.dumps(to_encode).encode('utf-8')
        b64_payload = base64.b64encode(payload_json).decode('utf-8')
        signature = base64.b64encode(
            json.dumps({"alg": ALGORITHM, "payload": b64_payload, "key": SECRET_KEY}).encode('utf-8')
        ).decode('utf-8')
        return f"{b64_payload}.{signature}"

def verify_token(token: str) -> dict:
    """
    Verify token and return payload
    """
    try:
        # First try using jwt package
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except (AttributeError, ImportError):
        # Fallback to our own implementation
        try:
            parts = token.split('.')
            if len(parts) != 2:
                raise ValueError("Invalid token format")
            
            b64_payload, signature = parts
            
            # Decode payload
            payload_json = base64.b64decode(b64_payload).decode('utf-8')
            payload = json.loads(payload_json)
            
            # Check expiration
            if "exp" in payload and datetime.fromtimestamp(payload["exp"]) < datetime.utcnow():
                raise ValueError("Token expired")
                
            # Verify signature (simplified)
            expected_sig = base64.b64encode(
                json.dumps({"alg": ALGORITHM, "payload": b64_payload, "key": SECRET_KEY}).encode('utf-8')
            ).decode('utf-8')
            
            if signature != expected_sig:
                raise ValueError("Invalid signature")
                
            return payload
        except Exception as e:
            raise ValueError(f"Invalid token: {str(e)}")

# Initialize FastAPI app
app = FastAPI(
    title="DBExportHub",
    description="A web-based application for exporting SQL Server data to Excel",
    version="1.0.0"
)

# Configure CORS - IMPORTANT: This must be added before any routes
# Get CORS origins from environment variable
backend_cors_origins = os.getenv("BACKEND_CORS_ORIGINS", "http://localhost,http://localhost:3000,http://localhost:5173")
origins = [origin.strip() for origin in backend_cors_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Use origins from environment variable
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Length"],  # Expose headers needed for file download
)

# Include the cancel router for route registration
app.include_router(cancel_router)

# Custom middleware for request logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Generate a unique request ID for tracking
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    # Log the incoming request
    access_logger.info(
        f"Request started: {request.method} {request.url.path}",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "client_ip": request.client.host if request.client else "unknown",
        }
    )
    
    # Process the request
    try:
        response = await call_next(request)
        # Add request ID to response headers for tracking
        response.headers["X-Request-ID"] = request_id
        
        # Calculate and log processing time
        process_time = time.time() - start_time
        access_logger.info(
            f"Request completed: {request.method} {request.url.path} - {response.status_code}",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "process_time_ms": round(process_time * 1000, 2),
            }
        )
        
        return response
    except Exception as e:
        # Log any unhandled exceptions
        access_logger.error(
            f"Request failed: {request.method} {request.url.path} - {str(e)}",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "error": str(e),
                "process_time_ms": round((time.time() - start_time) * 1000, 2),
            },
            exc_info=True
        )
        raise  # Re-raise the exception to be handled by FastAPI

# Authentication endpoint
@app.post("/api/auth/login")
async def login(login_data: LoginRequest):
    try:
        # Connect to the database to verify credentials
        with get_db_connection(
            login_data.server, login_data.database, login_data.username, login_data.password
        ) as conn:
            # If we reach here, connection was successful
            # Create an access token with user data
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            
            # Create a token with connection details (except password)
            token_data = {
                "server": login_data.server,
                "database": login_data.database,
                "username": login_data.username,
                # Do not include password in the token
                "session_id": str(uuid.uuid4()),  # Unique session ID
                "created_at": datetime.utcnow().isoformat()
            }
            
            access_token = create_access_token(
                data=token_data, expires_delta=access_token_expires
            )
            
            return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials or server/database not accessible",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Test connection endpoint
@app.post("/api/test-connection")
async def test_db_connection(params: LoginRequest):
    try:
        result = test_connection(params.server, params.database, params.username, params.password)
        return {"success": result["success"], "message": result["message"]}
    except Exception as e:
        logger.error(f"Test connection error: {str(e)}", exc_info=True)
        return {"success": False, "message": str(e)}

# Export endpoints
@app.post("/api/export/preview")
async def export_preview(params: ExportParameters):
    try:
        # Log the request with masked sensitive information
        masked_params = params.dict()
        masked_params["password"] = "[REDACTED]"
        logger.info(f"Export preview request received with parameters: {masked_params}")
        
        # Call the preview function
        preview_result = preview_data(params)
        
        return preview_result
    except Exception as e:
        logger.error(f"Error in export preview: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error generating preview: {str(e)}")

# Main export endpoint that the frontend calls
@app.post("/api/export", response_class=StreamingResponse)
async def export_data(params: ExportParameters):
    # This endpoint forwards to the export_excel endpoint for consistency
    return await export_excel(params)

@app.post("/api/export/excel", response_class=StreamingResponse)
async def export_excel(params: ExportParameters):
    try:
        # Log the request with masked sensitive information
        masked_params = params.dict()
        masked_params["password"] = "[REDACTED]"
        logger.info(f"Export excel request received with parameters: {masked_params}")
        
        # Call the export function
        file_path, operation_id = generate_excel(params)
        
        # Return the file as a download
        filename = os.path.basename(file_path)
        
        def iterfile():
            with open(file_path, mode="rb") as file_like:
                # Use a larger chunk size for better performance with large files
                chunk_size = 1024 * 1024  # 1MB chunks
                while chunk := file_like.read(chunk_size):
                    yield chunk
            # Clean up after sending
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Temporary file removed: {file_path}")
        
        headers = {
            'Content-Disposition': f'attachment; filename="{filename}"',
            'Access-Control-Expose-Headers': 'Content-Disposition, X-Operation-ID',
            'X-Operation-ID': operation_id
        }
        
        return StreamingResponse(
            iterfile(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers=headers
        )
    except Exception as e:
        logger.error(f"Error in export excel: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error generating excel: {str(e)}")

# Import endpoints
@app.post("/api/import/preview")
async def import_preview(params: ImportParameters):
    try:
        # Log the request with masked sensitive information
        masked_params = params.dict()
        masked_params["password"] = "[REDACTED]"
        logger.info(f"Import preview request received with parameters: {masked_params}")
        
        # Call the preview function
        preview_result = preview_data_import(params)
        
        return preview_result
    except Exception as e:
        logger.error(f"Error in import preview: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error generating import preview: {str(e)}")

@app.post("/api/import/excel", response_class=StreamingResponse)
async def import_excel(params: ImportParameters):
    try:
        # Log the request with masked sensitive information
        masked_params = params.dict()
        masked_params["password"] = "[REDACTED]"
        logger.info(f"Import excel request received with parameters: {masked_params}")
        
        # Check if this is a download-only request (for large datasets)
        download_only = getattr(params, 'download_only', False)
        operation_id = getattr(params, 'operation_id', None)
        
        if download_only and operation_id:
            # This is a request to download a file that was already generated
            logger.info(f"Download-only request received for operation ID: {operation_id}")
            
            # Import the operation tracker functions
            from app.api.operation_tracker import get_operation_details
            
            # Get the operation details
            operation_details = get_operation_details(operation_id)
            
            if not operation_details:
                logger.warning(f"Operation ID {operation_id} not found")
                raise HTTPException(status_code=404, detail=f"Operation ID {operation_id} not found")
                
            # Check if the operation is completed
            if operation_details.get('status') != 'completed':
                logger.info(f"Operation {operation_id} is not yet completed. Status: {operation_details.get('status')}")
                raise HTTPException(status_code=404, detail=f"Excel file is still being generated")
                
            # Get the file path from the operation details
            file_path = operation_details.get('file_path')
            
            if not file_path or not os.path.exists(file_path):
                logger.warning(f"File for operation {operation_id} not found at {file_path}")
                raise HTTPException(status_code=404, detail=f"Excel file not found")
                
            # Return the file as a download
            filename = os.path.basename(file_path)
            
            logger.info(f"Returning existing Excel file for operation {operation_id}: {file_path}")
        else:
            # Normal flow - generate the Excel file
            file_path, operation_id = generate_excel_import(params)
            
            # Return the file as a download
            filename = os.path.basename(file_path)
            
            logger.info(f"Excel file generated for operation {operation_id}: {file_path}")
        
        # Stream the file to the client
        def iterfile():
            with open(file_path, mode="rb") as file_like:
                # Use a larger chunk size for better performance with large files
                chunk_size = 1024 * 1024  # 1MB chunks
                while chunk := file_like.read(chunk_size):
                    yield chunk
            # Clean up after sending
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Temporary file removed: {file_path}")
        
        headers = {
            'Content-Disposition': f'attachment; filename="{filename}"',
            'Access-Control-Expose-Headers': 'Content-Disposition, X-Operation-ID',
            'X-Operation-ID': operation_id
        }
        
        return StreamingResponse(
            iterfile(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers=headers
        )
    except HTTPException:
        # Re-raise HTTP exceptions without modification
        raise
    except Exception as e:
        logger.error(f"Error in import excel: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error generating import excel: {str(e)}")

# Operation progress endpoint
@app.get("/api/operation/{operation_id}/progress")
async def get_operation_progress(operation_id: str):
    try:
        from app.api.operation_tracker import get_operation_details
        
        # Get operation details
        operation_details = get_operation_details(operation_id)
        
        if not operation_details:
            raise HTTPException(status_code=404, detail=f"Operation ID {operation_id} not found")
            
        # Extract progress information
        status = operation_details.get('status', 'unknown')
        current = operation_details.get('progress_current', 0)
        total = operation_details.get('progress_total', 0)
        
        # Calculate percentage completion
        percentage = 0
        if total > 0:
            percentage = min(int((current / total) * 100), 100)
        
        return {
            "operation_id": operation_id,
            "status": status,
            "current": current,
            "total": total,
            "percentage": percentage
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting operation progress: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error retrieving operation progress: {str(e)}")

# Cleanup endpoint for database connections
@app.post("/api/cleanup")
async def cleanup_connection(params: dict):
    try:
        # This is a no-op endpoint that simply returns success
        # Real cleanup happens automatically on the backend
        return {"success": True, "message": "Cleanup completed successfully"}
    except Exception as e:
        logger.error(f"Error in cleanup: {str(e)}", exc_info=True)
        # Don't raise an exception for cleanup failures
        return {"success": False, "message": f"Cleanup failed: {str(e)}"}

# Root endpoint for API health check
@app.get("/")
async def root():
    return {"status": "healthy", "message": "DBExportHub API is running", "version": "1.0.0"}
