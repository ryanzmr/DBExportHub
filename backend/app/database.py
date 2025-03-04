import pyodbc
import pandas as pd
from typing import List, Dict, Any, Optional
from contextlib import contextmanager

from .config import settings

def create_connection_string(server: str, database: str, username: str, password: str) -> str:
    """Create a connection string for SQL Server"""
    return f"DRIVER={{{settings.DB_DRIVER}}};SERVER={server};DATABASE={database};UID={username};PWD={password}"

def test_connection(server: str, database: str, username: str, password: str) -> bool:
    """Test database connection with provided credentials"""
    try:
        connection_string = create_connection_string(server, database, username, password)
        conn = pyodbc.connect(connection_string)
        conn.close()
        return True
    except pyodbc.Error as e:
        error_message = str(e)
        if "Login failed" in error_message:
            raise Exception(f"Authentication failed: Invalid username or password")
        elif "Cannot open database" in error_message:
            raise Exception(f"Database error: Cannot open database '{database}'. It may not exist or you don't have access.")
        elif "SQL Server Network Interfaces" in error_message:
            raise Exception(f"Connection error: Cannot connect to server '{server}'. Please verify the server name and network connectivity.")
        else:
            raise Exception(f"Failed to connect to database: {error_message}")
    except Exception as e:
        raise Exception(f"Failed to connect to database: {str(e)}")

@contextmanager
def get_db_connection(server: str, database: str, username: str, password: str):
    """Context manager for database connections"""
    connection_string = create_connection_string(server, database, username, password)
    conn = None
    try:
        conn = pyodbc.connect(connection_string)
        # Set timeout for queries
        conn.timeout = 300  # 5 minutes timeout
        yield conn
    except pyodbc.Error as e:
        error_message = str(e)
        if "Login failed" in error_message:
            raise Exception(f"Authentication failed: Invalid username or password")
        elif "Cannot open database" in error_message:
            raise Exception(f"Database error: Cannot open database '{database}'. It may not exist or you don't have access.")
        elif "SQL Server Network Interfaces" in error_message:
            raise Exception(f"Connection error: Cannot connect to server '{server}'. Please verify the server name and network connectivity.")
        else:
            raise Exception(f"Database connection error: {error_message}")
    except Exception as e:
        raise Exception(f"Database connection error: {str(e)}")
    finally:
        if conn:
            try:
                conn.close()
            except Exception as e:
                # Just log the error but don't raise it
                print(f"Error closing database connection: {str(e)}")

def execute_stored_procedure(conn, procedure_name: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Execute a stored procedure and return results as a list of dictionaries"""
    cursor = None
    try:
        cursor = conn.cursor()
        
        # Build parameter string
        param_str = ", ".join([f"@{key}=?" for key in params.keys()])
        sql = f"EXEC {procedure_name} {param_str}"
        
        # Log the query for debugging (without sensitive values)
        param_keys = list(params.keys())
        print(f"Executing stored procedure: {procedure_name} with parameters: {param_keys}")
        
        # Execute procedure
        cursor.execute(sql, list(params.values()))
        
        # Get column names
        if cursor.description:
            columns = [column[0] for column in cursor.description]
            
            # Fetch all rows and convert to dictionaries
            rows = []
            for row in cursor.fetchall():
                rows.append(dict(zip(columns, row)))
                
            return rows
        return []
    except pyodbc.Error as e:
        error_message = str(e)
        if "Timeout expired" in error_message:
            raise Exception(f"Database timeout: The stored procedure '{procedure_name}' took too long to execute. Please try with more specific filters.")
        elif "Invalid object name" in error_message:
            raise Exception(f"Database error: The stored procedure '{procedure_name}' does not exist.")
        else:
            raise Exception(f"Error executing stored procedure '{procedure_name}': {error_message}")
    except Exception as e:
        raise Exception(f"Error executing stored procedure '{procedure_name}': {str(e)}")
    finally:
        if cursor:
            cursor.close()

def execute_query(conn, query: str, params: Optional[List[Any]] = None) -> List[Dict[str, Any]]:
    """Execute a SQL query and return results as a list of dictionaries"""
    cursor = None
    try:
        cursor = conn.cursor()
        
        # Log the query for debugging (without sensitive values)
        print(f"Executing query: {query[:100]}..." if len(query) > 100 else f"Executing query: {query}")
        
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
                
            return rows
        return []
    except pyodbc.Error as e:
        error_message = str(e)
        if "Timeout expired" in error_message:
            raise Exception(f"Database timeout: The query took too long to execute. Please try with more specific filters.")
        elif "Invalid object name" in error_message:
            # Extract the object name from the error message
            import re
            match = re.search(r"Invalid object name '([^']+)'.", error_message)
            object_name = match.group(1) if match else "unknown"
            raise Exception(f"Database error: The object '{object_name}' does not exist.")
        else:
            raise Exception(f"Error executing query: {error_message}")
    except Exception as e:
        raise Exception(f"Error executing query: {str(e)}")
    finally:
        if cursor:
            cursor.close()

def query_to_dataframe(conn, query: str, params: Optional[List[Any]] = None) -> pd.DataFrame:
    """Execute a SQL query and return results as a pandas DataFrame"""
    try:
        # Log the query for debugging (without sensitive values)
        print(f"Executing DataFrame query: {query[:100]}..." if len(query) > 100 else f"Executing DataFrame query: {query}")
        
        if params:
            return pd.read_sql(query, conn, params=params)
        else:
            return pd.read_sql(query, conn)
    except pyodbc.Error as e:
        error_message = str(e)
        if "Timeout expired" in error_message:
            raise Exception(f"Database timeout: The query took too long to execute. Please try with more specific filters.")
        else:
            raise Exception(f"Error executing query to DataFrame: {error_message}")
    except pd.io.sql.DatabaseError as e:
        raise Exception(f"Pandas database error: {str(e)}")
    except Exception as e:
        raise Exception(f"Error executing query to DataFrame: {str(e)}")