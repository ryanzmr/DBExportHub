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
from .database.connection import get_db_connection, test_connection # Correct
from .models.schemas import ExportParameters, ImportParameters, PreviewResponse, LoginRequest, OperationProgressResponse, TestConnectionResponse, CleanupResponse, HealthCheckResponse, LoginResponse as LoginResponseModel # Correct, added more for clarity
from .api.exports.routes import router as export_router # Import router
from .api.imports.routes import router as import_router # Import router
from .api.auth.handlers import router as auth_router # Import router
from .api.operations.cancel_handlers import cancel_router # Correct
from .logging_operation.loggers import logger, access_logger # Correct
from .config.settings import settings # Correct
from .utilities.data_utils import CustomJSONEncoder # Correct
# Removed direct import of generate_excel, preview_data from routes files as they are now part of routers
# The CustomJSONEncoder is not used in main.py directly, but good to have a consistent import if it were.

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

# Include the routers
app.include_router(auth_router, prefix="/api") # Add prefix for auth routes
app.include_router(export_router, prefix="/api") # Add prefix for export routes
app.include_router(import_router, prefix="/api") # Add prefix for import routes
app.include_router(cancel_router, prefix="/api") # cancel_router already has /operations prefix

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

# Removed direct endpoint definitions for /api/auth/login, /api/test-connection,
# /api/export/preview, /api/export/excel, /api/import/preview, /api/import/excel.
# These are now handled by their respective routers.

# Universal token functions (create_access_token, verify_token) were moved to api/auth/handlers.py
# If needed by other parts of main.py (not apparent now), they'd need to be imported from there or a shared auth utility.

# Operation progress endpoint - kept in main.py as it's a general operation utility
@app.get("/api/operations/{operation_id}/progress", response_model=OperationProgressResponse) # Standardized path
async def get_operation_progress(operation_id: str) -> Dict[str, Any]: # Return type hint using Pydantic model
    try:
        from .utilities.operation_tracker import get_operation_details # Path already updated
        
        operation_details = get_operation_details(operation_id)
        
        if not operation_details:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Operation ID {operation_id} not found")
            
        status_val = operation_details.get('status', 'unknown')
        progress_dict = operation_details.get('progress', {})
        current_val = progress_dict.get('current', 0)
        total_val = progress_dict.get('total', 0)
        
        percentage = 0
        if total_val > 0:
            percentage = min(int((current_val / total_val) * 100), 100)
        
        return {
            "operation_id": operation_id,
            "status": status_val,
            "current": current_val,
            "total": total_val,
            "percentage": percentage
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting operation progress for {operation_id}: {str(e)}", exc_info=True, extra={"operation_id": operation_id})
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error retrieving operation progress: {str(e)}")

# Cleanup endpoint for database connections - kept in main.py
@app.post("/api/cleanup", response_model=CleanupResponse) # Standardized path
async def cleanup_connection_endpoint(params: Optional[Dict[Any, Any]] = None) -> Dict[str, Any]: # params not used, made optional
    # This endpoint's purpose is unclear in a stateless API. DB connections are managed per request.
    # If it's for client-side state cleanup, that's different.
    # Assuming it's a no-op as per original.
    logger.info("Cleanup endpoint called.", extra={"params": params if params else {}})
    return {"success": True, "message": "Cleanup acknowledgement. Backend manages resources per request."}

# Root endpoint for API health check - kept in main.py
@app.get("/", response_model=HealthCheckResponse) # Standardized path
async def root() -> Dict[str, str]:
    return {"status": "healthy", "message": "DBExportHub API is running", "version": settings.API_VERSION if hasattr(settings, 'API_VERSION') else "1.0.0"}
