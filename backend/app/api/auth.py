from fastapi import HTTPException, status
from ..database import test_connection
from pydantic import BaseModel

class LoginRequest(BaseModel):
    server: str
    database: str
    username: str
    password: str

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