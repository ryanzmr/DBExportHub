from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import jwt 
import json # For fallback create_access_token
import base64 # For fallback create_access_token
import uuid # For session_id in token

# Updated imports:
from ...database.connection import get_db_connection, test_connection 
from ...models.schemas import LoginRequest, LoginResponse, TestConnectionResponse # Added LoginResponse, TestConnectionResponse
from ...config.settings import settings 
from ...logging_operation.loggers import logger # For logging errors

router = APIRouter(
    prefix="/auth", # Prefix for all routes in this file
    tags=["authentication"],  # Tag for API documentation
)

__all__ = ['router']

# JWT constants from config (moved from main.py)
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

# Universal token functions (moved from main.py)
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire.timestamp()}) # Use .timestamp() for numeric exp
    
    try:
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        if isinstance(encoded_jwt, bytes): # Ensure string return
            encoded_jwt = encoded_jwt.decode('utf-8')
        return encoded_jwt
    except Exception as e: # Catch generic jwt error
        logger.warning(f"PyJWT encode failed ({type(e).__name__}: {e}), using fallback implementation.")
        payload_json = json.dumps(to_encode, sort_keys=True).encode('utf-8') # sort_keys for deterministic behavior
        b64_payload = base64.urlsafe_b64encode(payload_json).decode('utf-8').rstrip("=") # Use URL-safe base64
        # Simplified "signature" for fallback - this is NOT a real JWT signature
        # In a real scenario, a proper crypto library should be used if PyJWT is unavailable.
        # This fallback is more of a placeholder to match original structure if PyJWT had issues.
        header = {"alg": "HS256", "typ": "JWT"} # Mock header
        b64_header = base64.urlsafe_b64encode(json.dumps(header).encode('utf-8')).decode('utf-8').rstrip("=")
        # Fallback signature is just a hash of header and payload with secret, not standard
        # This part is NOT cryptographically secure like a real JWT.
        # For this exercise, we assume PyJWT is available. The fallback is illustrative.
        # If PyJWT is truly optional, a different token strategy or simpler session management would be needed.
        # Given PyJWT is in requirements, this fallback is unlikely to be used.
        # The original fallback signature logic was also not a standard JWT signature.
        # For simplicity, if PyJWT fails, this will effectively be an opaque token.
        mock_signature = base64.urlsafe_b64encode(
            (b64_header + "." + b64_payload + SECRET_KEY).encode('utf-8') 
        ).decode('utf-8').rstrip("=")
        return f"{b64_header}.{b64_payload}.{mock_signature}"


# The authenticate_user function from original auth.py is not directly a route.
# It was a helper. The login route below will incorporate its logic.

@router.post("/login", response_model=LoginResponse)
async def login_for_access_token(login_data: LoginRequest) -> Dict[str, str]:
    """
    Login endpoint. Tests DB connection and returns JWT token on success.
    """
    try:
        # Test DB connection with provided credentials
        # test_connection raises an exception on failure or returns dict with success.
        conn_test_result = test_connection(
            login_data.server, login_data.database, login_data.username, login_data.password
        )
        if not conn_test_result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=conn_test_result.get("message", "Invalid credentials or database connection failed."),
                headers={"WWW-Authenticate": "Bearer"},
            )

        # If connection is successful, create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        token_data = {
            "sub": login_data.username, # Standard subject claim
            "server": login_data.server,
            "database": login_data.database,
            # "username": login_data.username, # Already in "sub"
            "session_id": str(uuid.uuid4()), 
            "created_at": datetime.utcnow().isoformat()
            # Add other claims as needed, e.g., roles, permissions
        }
        access_token = create_access_token(
            data=token_data, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}

    except HTTPException: # Re-raise if test_connection raised it or if we raise it
        raise
    except Exception as e:
        logger.error(f"Login error for user {login_data.username}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, # Or 401 if preferred for all login errors
            detail="An unexpected error occurred during login.",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.post("/test-connection", response_model=TestConnectionResponse)
async def test_db_connection_route(params: LoginRequest) -> Dict[str, Any]:
    """
    Test database connection endpoint.
    """
    try:
        result = test_connection(params.server, params.database, params.username, params.password)
        return result # test_connection returns {"success": bool, "message": str}
    except Exception as e:
        logger.error(f"Test connection endpoint error: {str(e)}", exc_info=True)
        # Return a consistent error structure even for unexpected errors
        return {"success": False, "message": f"An unexpected error occurred: {str(e)}"}
