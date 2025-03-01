import pyodbc
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
from contextlib import contextmanager

from .config import settings

def create_connection_string(server: str, database: str, username: str, password: str) -> str:
    """Create a connection string for SQL Server"""
    return f"DRIVER={{{settings.DB_DRIVER}}};SERVER={server};DATABASE={database};UID={username};PWD={password}"

# Check if this function exists and is properly implemented
def test_connection(server, database, username, password):
    """Test database connection with provided credentials"""
    try:
        connection_string = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password}"
        import pyodbc
        conn = pyodbc.connect(connection_string)
        # Test the connection with a simple query
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchall()
        cursor.close()
        return conn
    except Exception as e:
        print(f"Connection test failed: {str(e)}")
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

# Replace the direct pandas read_sql with a more efficient approach
def execute_query(query, conn, params=None):
    try:
        # For large datasets, use chunking to improve performance
        if isinstance(query, str) and "LIMIT" not in query.upper() and "TOP" not in query.upper():
            # Try to create an engine from the connection string or object
            try:
                from sqlalchemy import create_engine
                from sqlalchemy.engine import Connection
                
                if not isinstance(conn, Connection):
                    # Use pandas directly with the connection
                    import pandas as pd
                    return pd.read_sql(query, conn, params=params)
            except:
                # Fall back to chunked reading if SQLAlchemy conversion fails
                import pandas as pd
                
                # Use chunksize for large datasets
                chunks = []
                for chunk in pd.read_sql(query, conn, params=params, chunksize=10000):
                    chunks.append(chunk)
                return pd.concat(chunks) if chunks else pd.DataFrame()
        
        # For smaller datasets or already limited queries
        return pd.read_sql(query, conn, params=params)
    except Exception as e:
        print(f"Error executing query: {e}")
        raise

def query_to_dataframe(conn, query: str, params: Optional[List[Any]] = None) -> pd.DataFrame:
    """Execute a SQL query and return results as a pandas DataFrame"""
    try:
        if params:
            df = pd.read_sql(query, conn, params=params)
        else:
            df = pd.read_sql(query, conn)
        
        # Replace NaN values with None for JSON serialization
        df = df.replace({np.nan: None})
        return df
    except Exception as e:
        raise Exception(f"Error executing query to DataFrame: {str(e)}")