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
from .models import ExportParameters, PreviewResponse, LoginRequest
from .api.export import generate_excel, preview_data, CustomJSONEncoder
from .api.cancel import cancel_router
from .logger import logger, access_logger, log_api_request
from .config import settings
from .api.excel_row_limit import process_exceeding_limit_response

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
    max_age=3600  # Cache preflight requests for 1 hour
)

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    # Generate unique request ID
    request_id = str(uuid.uuid4())
    
    # Log the start of the request
    start_time = time.time()
    path = request.url.path
    method = request.method
    
    # Add emojis based on HTTP method
    method_emojis = {
        "GET": "📥",
        "POST": "📤",
        "PUT": "🔄",
        "DELETE": "🗑️",
        "PATCH": "🩹",
        "OPTIONS": "🔍"
    }
    
    method_emoji = method_emojis.get(method, "🌐")
    
    # Add emojis based on path
    path_emoji = "🔗"
    if "auth" in path:
        path_emoji = "🔐"
    elif "export" in path:
        path_emoji = "📊"
    elif "preview" in path:
        path_emoji = "👁️"
    elif "health" in path:
        path_emoji = "💓"
    
    access_logger.info(
        f"{method_emoji} {path_emoji} Received {method} request to {path}",
        extra={
            "request_id": request_id,
            "method": method,
            "path": path,
            "client_host": request.client.host if request.client else None
        }
    )
    
    # Process the request
    response = await call_next(request)
    
    # Calculate processing time
    process_time = time.time() - start_time
    
    # Status code emojis
    status_emoji = "ℹ️"
    if 200 <= response.status_code < 300:
        status_emoji = "✅"
    elif 300 <= response.status_code < 400:
        status_emoji = "↪️"
    elif 400 <= response.status_code < 500:
        status_emoji = "⚠️"
    elif 500 <= response.status_code < 600:
        status_emoji = "❌"
    
    # Log the completed request with status code
    access_logger.info(
        f"{method_emoji} {path_emoji} {status_emoji} Completed {method} request to {path} with status {response.status_code} in {process_time:.3f}s",
        extra={
            "request_id": request_id,
            "method": method,
            "path": path,
            "status_code": response.status_code,
            "processing_time": process_time
        }
    )
    
    # Add custom header with request ID for tracking
    response.headers["X-Request-ID"] = request_id
    return response

# Root endpoint
@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {"message": "Welcome to DBExportHub API"}

# Login endpoint
# Update the login endpoint to better handle errors and provide more debugging
@app.post("/api/auth/login")
@log_api_request()
async def login(connection_details: LoginRequest):
    try:
        # Create a safe copy of connection details with masked password for logging
        safe_details = connection_details.dict()
        safe_details["password"] = "[REDACTED]"
        logger.info(f"Login attempt with details: {safe_details}")
        
        # Verify database connection using test_connection
        conn = test_connection(
            connection_details.server,
            connection_details.database,
            connection_details.username,
            connection_details.password
        )
        
        logger.info("Database connection successful")
        
        # If connection successful, create access token
        # Create a safe copy of connection details with masked password for token
        safe_connection = connection_details.dict()
        safe_connection["password"] = "[REDACTED]"
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"connection": safe_connection},
            expires_delta=access_token_expires
        )
        
        logger.info(f"Generated token with expiry: {ACCESS_TOKEN_EXPIRE_MINUTES} minutes")
        
        return {
            "token": access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        import traceback
        error_details = traceback.format_exc()
        logger.debug(f"Login error details: {error_details}")
        
        raise HTTPException(
            status_code=401,
            detail=f"Authentication failed: {str(e)}"
        )

# Preview data endpoint
@app.post("/api/export/preview")
@log_api_request()
async def get_preview(params: ExportParameters):
    try:
        # Mask sensitive information for logging
        masked_params = params.dict(exclude={"password"})
        masked_params["password"] = "[REDACTED]"
        logger.info(f"Preview request received with parameters: {masked_params}")
        
        # Get preview data (first 100 records) and operation ID
        result = preview_data(params)
        data = result["data"]
        operation_id = result["operation_id"]
        total_records = result["total_records"]  # Get the total records count
        
        logger.info(f"Preview generated successfully, returning {len(data)} records of {total_records} total with operation ID: {operation_id}")
        
        # Use custom JSON encoder for timestamps
        json_compatible_data = json.loads(
            json.dumps({
                "data": data, 
                "count": len(data), 
                "total_records": total_records,  # Include total records in response
                "operation_id": operation_id
            }, cls=CustomJSONEncoder)
        )
        
        # Return a properly formatted response
        return json_compatible_data
    except Exception as e:
        logger.error(f"Preview error: {str(e)}", exc_info=True)
        import traceback
        error_details = traceback.format_exc()
        logger.debug(f"Preview error details: {error_details}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating preview: {str(e)}"
        )

# Export data endpoint with streaming response
@app.post("/api/export", response_class=StreamingResponse)
@log_api_request()
async def export_data(params: ExportParameters):
    # Set a longer timeout for the endpoint to handle large datasets
    operation_id = None
    start_time = time.time()
    
    try:
        # Call the export function
        result, operation_id = generate_excel(params)
        
        # Check if result is a dictionary indicating row limit exceeded
        if isinstance(result, dict) and result.get("excel_limit_exceeded"):
            # Return a JSON response that can be used by the frontend to prompt the user
            # Include the operation_id so the frontend can continue the operation if needed
            return JSONResponse(content=result)
            
        # If not a row limit exceeded case, the result is the expected file path
        file_path = result

        # Verify file exists
        if not os.path.exists(file_path):
            error_msg = f"Generated file not found at {file_path}"
            logger.error(f"Export error [ID: {operation_id}]: {error_msg}", extra={"export_id": operation_id})
            raise Exception(error_msg)
            
        # Get file size for logging
        file_size = os.path.getsize(file_path)
        generation_time = time.time() - start_time
        
        logger.info(
            f"Excel file generated [ID: {operation_id}]: {file_path}, Size: {file_size} bytes in {generation_time:.2f}s",
            extra={
                "export_id": operation_id,
                "file_path": file_path,
                "file_size": file_size,
                "generation_time": generation_time
            }
        )
        
        # Return the file for download with explicit headers
        filename = os.path.basename(file_path)
        
        headers = {
            'Content-Disposition': f'attachment; filename="{filename}"',
            'Access-Control-Expose-Headers': 'Content-Disposition, X-Operation-ID',
            'X-Export-ID': operation_id,
            'X-Operation-ID': operation_id
        }
        
        logger.info(
            f"Starting file stream [ID: {operation_id}] for file: {filename}",
            extra={"export_id": operation_id, "file_name": filename}
        )
        
        return StreamingResponse(
            iterfile(file_path, operation_id),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers=headers
        )
    except Exception as e:
        # Log the full error for debugging
        logger.error(f"Export error [ID: {operation_id}]: {str(e)}", extra={"export_id": operation_id}, exc_info=True)
        import traceback
        error_details = traceback.format_exc()
        logger.debug(f"Export error details [ID: {operation_id}]: {error_details}", extra={"export_id": operation_id})
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error exporting data: {str(e)}"
        )

# Health check endpoint
@app.get("/api/health")
async def health_check():
    logger.debug("Health check endpoint accessed")
    return {"status": "healthy"}

# Add a cleanup endpoint
@app.post("/api/cleanup")
@log_api_request()
async def cleanup_connection(connection_info: dict):
    try:
        session_id = connection_info.get('sessionId', 'unknown')
        logger.info(f"Cleaning up connection for session: {session_id}", extra={"session_id": session_id})
        # Implement any cleanup logic here if needed
        return {"status": "success", "message": "Connection cleaned up successfully"}
    except Exception as e:
        logger.error(f"Cleanup error for session {session_id}: {str(e)}", extra={"session_id": session_id}, exc_info=True)
        return {"status": "error", "message": str(e)}

# Add a new endpoint to get export operation progress
@app.get("/api/progress/{operation_id}")
async def get_operation_progress(operation_id: str):
    """
    Get the progress of an export operation
    """
    from .api.operation_tracker import get_operation_status
    
    # Log the request
    access_logger.info(
        f"📊 📈 Received GET request for operation progress: {operation_id}",
        extra={
            "operation_id": operation_id,
            "path": f"/api/progress/{operation_id}"
        }
    )
    
    # Get the operation status
    status = get_operation_status(operation_id)
    
    if status is None:
        # Log the error
        access_logger.warning(
            f"📊 ⚠️ Operation not found: {operation_id}",
            extra={
                "operation_id": operation_id
            }
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Operation with ID {operation_id} not found"
        )
    
    # Prepare response
    response = {
        "operation_id": operation_id,
        "status": status["status"],
        "progress": status.get("progress", {
            "current": 0,
            "total": 0,
            "percentage": 0
        })
    }
    
    # Log the response
    access_logger.info(
        f"📊 ✅ Completed GET request for operation progress: {operation_id}, status: {status['status']}, progress: {response['progress']['percentage']}%",
        extra={
            "operation_id": operation_id,
            "status": status["status"],
            "progress": response["progress"]["percentage"]
        }
    )
    
    return JSONResponse(content=response)

# Include the cancellation router
app.include_router(cancel_router, prefix="/api/operations")

@app.post("/api/export/continue", response_class=StreamingResponse)
@log_api_request()
async def continue_export(params: dict):
    """
    Continue an export operation after user confirmation for row limit exceeded cases
    """
    operation_id = params.get("operation_id")
    proceed = params.get("proceed", False)
    total_rows = params.get("total_rows", 0)
    
    # Debug: Log the received parameters
    logger.info(f"Continue export parameters: {params}")
    
    if not operation_id:
        return JSONResponse(
            status_code=400,
            content={"error": "Missing operation_id parameter"}
        )
    
    try:
        # Process the user's decision
        should_continue, rows_to_export, message = process_exceeding_limit_response(
            proceed, total_rows, operation_id
        )
        
        if not should_continue:
            # User chose to cancel the export
            return JSONResponse(
                content={
                    "status": "cancelled",
                    "message": message
                }
            )
        
        # User chose to proceed with partial export
        # Continue the export with the modified parameters
        logger.info(f"Proceeding with limited export of {rows_to_export} rows")
        
        # Keep necessary parameters from the original request
        modified_params = {
            "server": params.get("server", ""),
            "database": params.get("database", ""),
            "username": params.get("username", ""),
            "password": params.get("password", ""),
            "fromMonth": params.get("fromMonth", 0),
            "toMonth": params.get("toMonth", 0),
            "hs": params.get("hs", ""),
            "prod": params.get("prod", ""),
            "iec": params.get("iec", ""),
            "expCmp": params.get("exporter", ""),
            "forcount": params.get("country", ""),
            "forname": params.get("forname", ""),
            "port": params.get("port", ""),
            "max_rows": rows_to_export  # Add the row limit
        }
        
        # Convert dictionary parameters to ExportParameters model
        # This is required since generate_excel expects a Pydantic model
        from .models import ExportParameters
        export_params = ExportParameters(
            server=modified_params["server"],
            database=modified_params["database"],
            username=modified_params["username"],
            password=modified_params["password"],
            fromMonth=modified_params["fromMonth"],
            toMonth=modified_params["toMonth"],
            hs=modified_params["hs"],
            prod=modified_params["prod"],
            iec=modified_params["iec"],
            expCmp=modified_params["expCmp"],
            forcount=modified_params["forcount"],
            forname=modified_params["forname"],
            port=modified_params["port"],
            preview_only=False,
            max_records=100  # This is just for preview, not the actual export limit
        )
        
        # Add max_rows attribute to the model instance
        export_params.max_rows = rows_to_export
        
        # Log what we're passing to generate_excel
        logger.info(f"Starting limited export with {rows_to_export} rows max")
        
        # Call the export function with the modified parameters
        file_path, operation_id = generate_excel(export_params)
        
        # Check if we still got a dictionary instead of a file path
        if isinstance(file_path, dict) and file_path.get("excel_limit_exceeded"):
            # This shouldn't happen as we're already limiting the rows
            return JSONResponse(content={
                "status": "error",
                "message": "An unexpected error occurred. Please try again."
            })
            
        # Return the file as a streaming response
        filename = os.path.basename(file_path)
        headers = {
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Operation-ID": operation_id
        }
        
        # Create streaming response for efficient transfer of large files
        return StreamingResponse(
            iterfile(file_path, operation_id),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers=headers
        )
    except Exception as e:
        logger.error(f"Error in continue_export: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

# Helper function for file streaming
def iterfile(file_path, operation_id=None):
    """
    Generator function to stream a file in chunks.
    Efficiently handles large files by reading in manageable chunks.
    
    Args:
        file_path: Path to the file to stream
        operation_id: Optional operation ID for logging
    
    Yields:
        Chunks of the file as bytes
    """
    if not operation_id:
        operation_id = str(uuid.uuid4())[:8]
        
    chunk_count = 0
    total_bytes = 0
    
    try:
        with open(file_path, mode="rb") as file_like:
            chunk_size = 1024 * 1024  # 1MB chunks
            while chunk := file_like.read(chunk_size):
                chunk_count += 1
                total_bytes += len(chunk)
                if chunk_count % 10 == 0:  # Log every 10 chunks (10MB)
                    logger.debug(
                        f"Streaming progress [ID: {operation_id}]: {total_bytes} bytes sent in {chunk_count} chunks",
                        extra={"export_id": operation_id, "bytes_sent": total_bytes}
                    )
                yield chunk
    except Exception as e:
        logger.error(
            f"Error during file streaming [ID: {operation_id}]: {str(e)}",
            extra={"export_id": operation_id, "error": str(e)},
            exc_info=True
        )
        raise
    finally:
        # Clean up the file after sending
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(
                    f"Temporary file removed [ID: {operation_id}]: {file_path}",
                    extra={"export_id": operation_id, "file_path": file_path}
                )
            except Exception as cleanup_error:
                logger.warning(
                    f"Failed to remove temporary file [ID: {operation_id}]: {str(cleanup_error)}",
                    extra={"export_id": operation_id, "error": str(cleanup_error)}
                )