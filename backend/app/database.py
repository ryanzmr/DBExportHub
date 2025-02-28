import pyodbc
import pandas as pd
from typing import List, Dict, Any, Optional
from contextlib import contextmanager

from .config import settings

def create_connection_string(server: str, database: str, username: str, password: str) -> str:
    """Create a connection string for SQL Server"""
    return f"DRIVER={{{settings.DB_DRIVER}}};SERVER={server};DATABASE={database};UID={username};PWD={password}"

def test_connection(connection_string: str) -> bool:
    """Test database connection with provided credentials"""
    try:
        conn = pyodbc.connect(connection_string)
        conn.close()
        return True
    except Exception as e:
        raise Exception(f"Failed to connect to database: {str(e)}")

@contextmanager
def get_db_connection(server: str, database: str, username: str, password: str):
    """Context manager for database connections"""
    connection_string = create_connection_string(server, database, username, password)
    conn = None
    try:
        conn = pyodbc.connect(connection_string)
        yield conn
    except Exception as e:
        raise Exception(f"Database connection error: {str(e)}")
    finally:
        if conn:
            conn.close()

def execute_stored_procedure(conn, procedure_name: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Execute a stored procedure and return results as a list of dictionaries"""
    try:
        cursor = conn.cursor()
        
        # Build parameter string
        param_str = ", ".join([f"@{key}=?" for key in params.keys()])
        sql = f"EXEC {procedure_name} {param_str}"
        
        # Execute procedure
        cursor.execute(sql, list(params.values()))
        
        # Get column names
        columns = [column[0] for column in cursor.description]
        
        # Fetch all rows and convert to dictionaries
        rows = []
        for row in cursor.fetchall():
            rows.append(dict(zip(columns, row)))
            
        return rows
    except Exception as e:
        raise Exception(f"Error executing stored procedure: {str(e)}")

def execute_query(conn, query: str, params: Optional[List[Any]] = None) -> List[Dict[str, Any]]:
    """Execute a SQL query and return results as a list of dictionaries"""
    try:
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
                
            return rows
        return []
    except Exception as e:
        raise Exception(f"Error executing query: {str(e)}")

def query_to_dataframe(conn, query: str, params: Optional[List[Any]] = None) -> pd.DataFrame:
    """Execute a SQL query and return results as a pandas DataFrame"""
    try:
        if params:
            return pd.read_sql(query, conn, params=params)
        else:
            return pd.read_sql(query, conn)
    except Exception as e:
        raise Exception(f"Error executing query to DataFrame: {str(e)}")