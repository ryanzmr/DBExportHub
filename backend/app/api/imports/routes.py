# This file contains the API routes for import operations.
from fastapi import APIRouter, Depends, HTTPException, status, Request # Added APIRouter, Request for potential use
from fastapi.responses import StreamingResponse, JSONResponse # For generate_excel
import os # For os.path.basename and os.remove in generate_excel route

from typing import Any, Dict, Tuple, Optional

# Updated imports:
from ...logging_operation.loggers import log_execution_time, import_logger as logger # Added logger
from ...imports_operation.service import preview_data as preview_data_service
from ...imports_operation.service import generate_excel as generate_excel_service
from ...models.schemas import ImportParameters, PreviewResponse # Import Pydantic models
from ...utilities.data_utils import CustomJSONEncoder # For direct use or re-export
# For operation_tracker if download_only logic remains here
from ...utilities.operation_tracker import get_operation_details

router = APIRouter(
    prefix="/import", # All routes in this file will be under /api/import
    tags=["import"],  # Tag for API documentation
)

# Re-export CustomJSONEncoder
__all__ = ['router', 'CustomJSONEncoder']


@router.post("/preview", response_model=PreviewResponse) # Define response_model
@log_execution_time
async def preview_import_data(params: ImportParameters) -> Dict[str, Any]: # Use Pydantic model
    """
    API endpoint for generating a preview of the import data.
    """
    try:
        masked_params_dict = params.dict()
        masked_params_dict["password"] = "[REDACTED]"
        logger.info(f"Import preview request received with parameters: {masked_params_dict}", extra={"params": masked_params_dict})

        result_dict = await preview_data_service(params)
        # Service returns dict with 'data', 'operation_id', 'total_records', 'headers', 'first_row_hs'
        # Ensure this matches PreviewResponse model structure.
        return result_dict
    except Exception as e:
        logger.error(f"Error in import preview endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error generating import preview: {str(e)}")


@router.post("/excel") # response_class will be determined dynamically
@log_execution_time
async def generate_import_excel(params: ImportParameters, request: Request): # Added Request for client host
    """
    API endpoint for generating or downloading an Excel file for import data.
    Handles both new generation and download of already generated files (if operation_id is provided).
    """
    masked_params_dict = params.dict()
    masked_params_dict["password"] = "[REDACTED]"
    logger.info(f"Import excel request received from {request.client.host if request.client else 'unknown'} with parameters: {masked_params_dict}", extra={"params": masked_params_dict})

    # Logic from main.py for download_only
    if params.download_only and params.operation_id:
        logger.info(f"Download-only request for import operation ID: {params.operation_id}", extra={"operation_id": params.operation_id})
        operation_details = get_operation_details(params.operation_id)
        if not operation_details:
            logger.warning(f"Operation ID {params.operation_id} not found for download.", extra={"operation_id": params.operation_id})
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Operation ID {params.operation_id} not found.")
        
        if operation_details.get('status') != 'completed':
            logger.info(f"Operation {params.operation_id} not yet completed. Status: {operation_details.get('status')}", extra={"operation_id": params.operation_id})
            # Return a JSON response indicating the status, as it's not a StreamingResponse case.
            return JSONResponse(
                status_code=status.HTTP_202_ACCEPTED, # 202 Accepted or another suitable code
                content={"operation_id": params.operation_id, "status": operation_details.get('status'), "message": "Excel file is still being generated."}
            )
            
        file_path = operation_details.get('file_path')
        if not file_path or not os.path.exists(file_path):
            logger.warning(f"File for operation {params.operation_id} not found at {file_path}", extra={"operation_id": params.operation_id})
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Excel file not found for this operation ID.")
        
        filename = os.path.basename(file_path)
        logger.info(f"Returning existing import Excel file for operation {params.operation_id}: {file_path}", extra={"operation_id": params.operation_id})
        operation_id_to_return = params.operation_id # Use the provided operation_id
    else:
        # Normal generation flow
        # generate_excel_service returns (file_path_or_response_dict, operation_id_or_data)
        # The second element is operation_id if first is file_path, or the limit_exceeded_dict if first is None.
        response_data, operation_id_from_service = await generate_excel_service(params)

        if isinstance(response_data, dict) and response_data.get("status") == "limit_exceeded":
            logger.warning(f"Import Excel generation limit exceeded for operation {operation_id_from_service}: {response_data.get('message')}", extra={"operation_id": operation_id_from_service})
            # Return a JSON response for limit exceeded, not a StreamingResponse
            return JSONResponse(status_code=status.HTTP_409_CONFLICT, content=response_data)

        file_path = response_data # If not limit_exceeded, response_data is file_path
        operation_id_to_return = operation_id_from_service # Use operation_id from service call

        if not file_path or not isinstance(file_path, str):
             logger.error(f"Invalid file_path received from import service for operation {operation_id_to_return}: {file_path}", extra={"operation_id": operation_id_to_return})
             raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to generate import Excel file path.")
        
        filename = os.path.basename(file_path)
        logger.info(f"Import Excel file generated for operation {operation_id_to_return}: {file_path}", extra={"operation_id": operation_id_to_return})

    # Common streaming logic for both download_only and new generation
    def iterfile():
        try:
            with open(file_path, mode="rb") as file_like:
                yield from file_like
        finally:
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    logger.info(f"Temporary import file removed: {file_path}", extra={"operation_id": operation_id_to_return})
                except Exception as e_remove:
                    logger.error(f"Error removing temporary import file {file_path}: {e_remove}", extra={"operation_id": operation_id_to_return})
    
    headers = {
        'Content-Disposition': f'attachment; filename="{filename}"',
        'Access-Control-Expose-Headers': 'Content-Disposition, X-Operation-ID',
        'X-Operation-ID': operation_id_to_return
    }
    
    return StreamingResponse(
        iterfile(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers
    )
