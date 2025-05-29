import pandas as pd
import numpy as np
import json
from typing import List, Dict, Any, Optional

# Custom JSON encoder to handle pandas Timestamp objects
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if hasattr(obj, 'isoformat'):
            return obj.isoformat()
        elif pd.isna(obj):
            return None
        return super().default(obj)

def process_dataframe_for_json(df):
    """Process a DataFrame to make it suitable for JSON serialization"""
    # Convert all timestamps to strings in ISO format
    for col in df.select_dtypes(include=['datetime64']).columns:
        df[col] = df[col].dt.strftime('%Y-%m-%dT%H:%M:%S')
    
    # Replace NaN values with None for JSON serialization
    df = df.replace({np.nan: None})
    
    # Convert to records
    result = df.to_dict('records')
    
    return result