import pyodbc
import pandas as pd
from typing import List, Dict, Any, Optional
from contextlib import contextmanager
import uuid

from .config import settings
from .logger import db_logger, log_execution_time, mask_sensitive_data

# Enhanced database logging with emojis
def db_log_info(message: str, **kwargs):
    """Enhanced database logging with emojis"""
    emoji = "🔄"  # Default database operation emoji
    
    # Choose appropriate emoji based on message content
    if "connection" in message.lower():
        emoji = "🔌"
    elif "test" in message.lower():
        emoji = "🧪"
    elif "successful" in message.lower() or "success" in message.lower():
        emoji = "✅"
    elif "failed" in message.lower() or "error" in message.lower():
        emoji = "❌"
    elif "executing" in message.lower():
        emoji = "⚙️"
    elif "query" in message.lower():
        emoji = "🔍"
    elif "stored procedure" in message.lower():
        emoji = "📦"
    elif "dataframe" in message.lower():
        emoji = "📊"
    elif "cache" in message.lower():
        if "miss" in message.lower():
            emoji = "🔍"
        else:
            emoji = "💾"
    
    db_logger.info(f"{emoji} {message}", extra=kwargs)

def db_log_debug(message: str, **kwargs):
    """Enhanced database debug logging with emojis"""
    db_logger.debug(f"🔬 {message}", extra=kwargs)

def db_log_error(message: str, **kwargs):
    """Enhanced database error logging with emojis"""
    db_logger.error(f"❌ {message}", extra=kwargs)

def create_connection_string(server: str, database: str, username: str, password: str) -> str:
    """Create a connection string for SQL Server"""
    # Convert server and database to strings if they aren't already
    server = str(server)
    database = str(database)
    
    # Log this operation with sensitive data masked
    db_log_debug(
        f"Creating connection string for server={server}, database={database}",
        server=server,
        database=database,
        username=username,
        password="[REDACTED]"
    )
    return f"DRIVER={{{settings.DB_DRIVER}}};SERVER={server};DATABASE={database};UID={username};PWD={password}"

@log_execution_time
def test_connection(server: str, database: str, username: str, password: str) -> bool:
    """Test database connection with provided credentials"""
    try:
        # Mask sensitive data for logging
        masked_credentials = {
            "server": server,
            "database": database,
            "username": username,
            "password": "[REDACTED]"
        }
        
        db_log_info(
            f"Testing connection to {server}/{database}", 
            **masked_credentials
        )
        
        connection_string = create_connection_string(server, database, username, password)
        conn = pyodbc.connect(connection_string)
        conn.close()
        
        db_log_info(
            f"Connection test successful for {server}/{database}",
            **masked_credentials
        )
        return True
    except Exception as e:
        db_log_error(
            f"Failed to connect to database {server}/{database}: {str(e)}",
            server=server,
            database=database,
            error=str(e),
            exc_info=True
        )
        raise Exception(f"Failed to connect to database: {str(e)}")

@contextmanager
def get_db_connection(server: str, database: str, username: str, password: str):
    """Context manager for database connections"""
    connection_id = str(uuid.uuid4())[:8]  # Use UUID instead of object id for more reliable unique identifiers
    
    # Log connection attempt with masked credentials
    db_log_info(
        f"Opening database connection [ID: {connection_id}]",
        connection_id=connection_id,
        server=server,
        database=database,
        username=username,
        operation="connection_open"
    )
    
    connection_string = create_connection_string(server, database, username, password)
    conn = None
    try:
        conn = pyodbc.connect(connection_string)
        db_log_debug(
            f"Database connection established [ID: {connection_id}]",
            connection_id=connection_id, 
            operation="connection_established"
        )
        yield conn
    except Exception as e:
        db_log_error(
            f"Database connection error [ID: {connection_id}]: {str(e)}",
            connection_id=connection_id,
            server=server,
            database=database,
            error=str(e),
            operation="connection_error",
            exc_info=True
        )
        raise Exception(f"Database connection error: {str(e)}")
    finally:
        if conn:
            conn.close()
            db_log_debug(
                f"Database connection closed [ID: {connection_id}]",
                connection_id=connection_id, 
                operation="connection_close"
            )

@log_execution_time
def execute_stored_procedure(conn, procedure_name: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Execute a stored procedure and return results as a list of dictionaries"""
    try:
        # Mask any sensitive parameters for logging
        masked_params = mask_sensitive_data(params)
        
        db_log_info(
            f"Executing stored procedure: {procedure_name}",
            procedure=procedure_name,
            params=masked_params
        )
        
        cursor = conn.cursor()
        
        # Build parameter string
        param_str = ", ".join([f"@{key}=?" for key in params.keys()])
        sql = f"EXEC {procedure_name} {param_str}"
        
        db_logger.debug(f"Prepared SQL: {sql}")
        
        # Execute procedure
        cursor.execute(sql, list(params.values()))
        
        # Get column names
        columns = [column[0] for column in cursor.description]
        
        # Fetch all rows and convert to dictionaries
        rows = []
        for row in cursor.fetchall():
            rows.append(dict(zip(columns, row)))
        
        db_logger.info(
            f"Stored procedure {procedure_name} executed successfully, returned {len(rows)} rows",
            extra={"procedure": procedure_name, "row_count": len(rows)}
        )
            
        return rows
    except Exception as e:
        db_logger.error(
            f"Error executing stored procedure {procedure_name}: {str(e)}",
            extra={
                "procedure": procedure_name,
                "params": masked_params,
                "error": str(e)
            },
            exc_info=True
        )
        raise Exception(f"Error executing stored procedure: {str(e)}")

@log_execution_time
def execute_query(conn, query: str, params: Optional[List[Any]] = None) -> List[Dict[str, Any]]:
    """Execute a SQL query and return results as a list of dictionaries"""
    try:
        # For logging, truncate very long queries
        log_query = query[:500] + "..." if len(query) > 500 else query
        
        db_logger.info(
            f"Executing query: {log_query}",
            extra={
                "query_length": len(query),
                "has_params": params is not None
            }
        )
        
        cursor = conn.cursor()
        
        # Execute query
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        
        # Get column names
        if cursor.description:
            columns = [column[0] for column in cursor.description]
            
            # Fetch all rows and convert to dictionaries
            rows = []
            for row in cursor.fetchall():
                rows.append(dict(zip(columns, row)))
            
            db_logger.info(
                f"Query executed successfully, returned {len(rows)} rows",
                extra={"row_count": len(rows)}
            )
                
            return rows
        
        db_logger.info("Query executed successfully, no results returned")
        return []
    except Exception as e:
        db_logger.error(
            f"Error executing query: {str(e)}",
            extra={
                "query": log_query,
                "error": str(e)
            },
            exc_info=True
        )
        raise Exception(f"Error executing query: {str(e)}")

@log_execution_time
def query_to_dataframe(conn, query: str, params: Optional[List[Any]] = None) -> pd.DataFrame:
    """Execute a SQL query and return results as a pandas DataFrame"""
    try:
        # For logging, truncate very long queries
        log_query = query[:500] + "..." if len(query) > 500 else query
        
        db_logger.info(
            f"Executing query to DataFrame: {log_query}",
            extra={
                "query_length": len(query),
                "has_params": params is not None
            }
        )
        
        start_time = pd.Timestamp.now()
        if params:
            df = pd.read_sql(query, conn, params=params)
        else:
            df = pd.read_sql(query, conn)
        
        execution_time = (pd.Timestamp.now() - start_time).total_seconds()
        
        db_logger.info(
            f"Query to DataFrame completed in {execution_time:.2f}s, returned {len(df)} rows and {len(df.columns)} columns",
            extra={
                "row_count": len(df),
                "column_count": len(df.columns),
                "execution_time": execution_time
            }
        )
        
        return df
    except Exception as e:
        db_logger.error(
            f"Error executing query to DataFrame: {str(e)}",
            extra={
                "query": log_query,
                "error": str(e)
            },
            exc_info=True
        )
        raise Exception(f"Error executing query to DataFrame: {str(e)}")