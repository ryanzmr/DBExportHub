import pandas as pd
import numpy as np
import json
from typing import List, Dict, Any, Optional # Kept for completeness, though Optional is not used

# Custom JSON encoder to handle pandas Timestamp objects
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if hasattr(obj, 'isoformat'): # Handles datetime, Timestamp, etc.
            return obj.isoformat()
        elif pd.isna(obj): # Handles pd.NaT, np.nan
            return None
        # Add handling for other specific types if needed, e.g., Decimal
        # elif isinstance(obj, Decimal):
        #     return float(obj) # or str(obj)
        return super().default(obj)

def process_dataframe_for_json(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Process a DataFrame to make it suitable for JSON serialization"""
    # Convert all known datetime-like columns to strings in ISO format
    # This is more robust than selecting by dtype 'datetime64' which might miss timezone-aware datetimes
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            df[col] = df[col].dt.isoformat() # Use .isoformat() for consistency with encoder
        elif pd.api.types.is_timedelta64_dtype(df[col]): # Handle timedeltas if they exist
            df[col] = df[col].astype(str) # Convert timedeltas to string representation

    # Replace remaining NaN/NaT values with None for JSON serialization
    # Using df.replace({np.nan: None}) might be too broad.
    # df.fillna(value=None) is generally preferred for replacing NaN, but to_dict handles it.
    # The to_dict('records') method with Pandas > 1.0 should handle np.nan to None correctly.
    # However, explicit replacement can be safer for older versions or specific dtypes.
    # Let's refine this for clarity and safety, ensuring all NaNs become None.
    # Create a new DataFrame with NaNs replaced to avoid SettingWithCopyWarning
    processed_df = df.copy()
    for col in processed_df.columns:
        # Replace numpy.nan and pandas.NaT for all dtypes
        if processed_df[col].isnull().any(): # Check if there are any nulls to avoid unnecessary operations
             # For object columns that might contain np.nan or None mixed with other types
            if processed_df[col].dtype == 'object':
                processed_df[col] = processed_df[col].apply(lambda x: None if pd.isna(x) else x)
            # For numeric columns, np.nan is the standard. For datetime, NaT.
            # These are typically handled well by to_dict, but explicit can be good.
            # This step might be redundant if to_dict handles it, but ensures None for all nulls.
    
    # Convert to records. Pandas to_dict('records') handles np.nan -> None for JSON.
    result = processed_df.to_dict('records')
    
    return result
