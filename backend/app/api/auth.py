from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Optional
from datetime import datetime, timedelta
import jwt
import secrets
from pydantic import BaseModel, Field
import os
from dotenv import load_dotenv

# Import database functions
from ..database import test_connection
from ..config import settings

# Load environment variables
load_dotenv()

# Constants for JWT
# Generate a secure secret key if not provided in environment
if not os.getenv("SECRET_KEY"):
    import secrets
    print("WARNING: Using auto-generated SECRET_KEY. For production, set SECRET_KEY in environment variables.")

SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_hex(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Login request model
class LoginRequest(BaseModel):
    server: str
    database: str
    username: str
    password: str

# Token refresh request model
class TokenRefreshRequest(BaseModel):
    token: str = Field(..., description="The current access token")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Create a JWT access token with an expiration time
    """
    to_encode = data.copy()
    
    # Store the real password in session storage
    real_password = None
    if "connection" in to_encode and isinstance(to_encode["connection"], dict) and "password" in to_encode["connection"]:
        real_password = to_encode["connection"]["password"]
        
    # Create a safe version for the token payload
    if "connection" in to_encode and isinstance(to_encode["connection"], dict):
        # Create a copy of connection details without the password
        connection_safe = to_encode["connection"].copy()
        if "password" in connection_safe:
            connection_safe["password"] = real_password  # Keep the real password
        to_encode["connection"] = connection_safe
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def authenticate_user(connection_details: LoginRequest):
    """
    Authenticate user by testing database connection
    """
    try:
        # Log authentication attempt with masked password
        safe_details = connection_details.dict()
        safe_details["password"] = "[REDACTED]"
        print(f"Authenticating user with details: {safe_details}")
        
        # Verify database connection using test_connection
        conn = test_connection(
            connection_details.server,
            connection_details.database,
            connection_details.username,
            connection_details.password
        )
        return True
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_connection(token: str = Depends(oauth2_scheme)):
    """
    Decode JWT token and return connection details
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        connection = payload.get("connection")
        if connection is None:
            raise credentials_exception
        return connection
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise credentials_exception