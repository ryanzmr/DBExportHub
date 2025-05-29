# This file contains the API routes for export operations.
from fastapi import APIRouter, Depends, HTTPException, status # Added APIRouter, Depends, etc.
from fastapi.responses import StreamingResponse # For generate_excel
import os # For os.path.basename and os.remove in generate_excel route

from typing import Any, Dict, Tuple, Optional # For type hinting

# Updated imports:
from ...logging_operation.loggers import log_execution_time, export_logger as logger # Added logger
from ...exports_operation.service import preview_data as preview_data_service
from ...exports_operation.service import generate_excel as generate_excel_service
from ...models.schemas import ExportParameters, PreviewResponse # Import Pydantic models for request body and response
from ...utilities.data_utils import CustomJSONEncoder # For direct use or re-export

router = APIRouter(
    prefix="/export", # All routes in this file will be under /api/export
    tags=["export"],  # Tag for API documentation
)

# Re-export CustomJSONEncoder if main.py or other modules expect it from here.
# For clarity, main.py should import it from data_utils directly.
# However, if it was part of the public interface of the old `api.export` module,
# clients of this router module might expect it.
__all__ = ['router', 'CustomJSONEncoder'] # Export router and CustomJSONEncoder


@router.post("/preview", response_model=PreviewResponse) # Define response_model
@log_execution_time
async def preview_export_data(params: ExportParameters) -> Dict[str, Any]: # Use Pydantic model for params
    """
    API endpoint for generating a preview of the export data.
    """
    try:
        # Log the request with masked sensitive information
        # This kind of logging might be better in a middleware or dependency if done for all routes
        masked_params_dict = params.dict()
        masked_params_dict["password"] = "[REDACTED]" # Assuming ExportParameters has password
        logger.info(f"Export preview request received with parameters: {masked_params_dict}", extra={"params": masked_params_dict})

        result_dict = await preview_data_service(params) # Call the service function
        # The service should return a dict compatible with PreviewResponse.
        # Based on previous refactoring of base_file_service, handle_preview_data returns a dict with:
        # "data", "operation_id", "total_records".
        # PreviewResponse model might need adjustment if it expects 'count' instead of 'total_records'.
        # Let's assume they are compatible or service returns what PreviewResponse expects.
        return result_dict
    except Exception as e:
        logger.error(f"Error in export preview endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error generating export preview: {str(e)}")

@router.post("/excel", response_class=StreamingResponse)
@log_execution_time
async def generate_export_excel(params: ExportParameters) -> StreamingResponse:
    """
    API endpoint for generating an Excel file based on export parameters.
    """
    try:
        masked_params_dict = params.dict()
        masked_params_dict["password"] = "[REDACTED]"
        logger.info(f"Export excel request received with parameters: {masked_params_dict}", extra={"params": masked_params_dict})

        # generate_excel_service returns (file_path, operation_id) or (error_dict, operation_id)
        response_data, operation_id = await generate_excel_service(params)

        if isinstance(response_data, dict) and response_data.get("status") == "limit_exceeded":
            # This case means the file generation was paused due to limit.
            # main.py originally returned this dict directly with a 200 OK.
            # For an API router, it might be more RESTful to return a specific status code,
            # or ensure the client understands this 200 OK response.
            # For now, mimicking the original behavior of returning the dict.
            # However, this endpoint is StreamingResponse, so returning a dict is not directly compatible.
            # This indicates a structural issue: an endpoint declared as StreamingResponse
            # cannot easily return a JSON dict for the limit_exceeded case.
            # Solution: raise an HTTPException or change response_class based on outcome,
            # or have a different endpoint for limit exceeded status checks.
            # For now, let's raise an HTTPException for this specific case.
            logger.warning(f"Excel generation limit exceeded for operation {operation_id}: {response_data.get('message')}")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, # 409 Conflict or 413 Payload Too Large might be options
                detail=response_data
            )

        file_path = response_data # If not limit_exceeded, response_data is file_path

        if not file_path or not isinstance(file_path, str):
             logger.error(f"Invalid file_path received from service for operation {operation_id}: {file_path}")
             raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to generate Excel file path.")


        filename = os.path.basename(file_path)
        
        def iterfile():
            try:
                with open(file_path, mode="rb") as file_like:
                    yield from file_like # More efficient way to yield chunks
            finally:
                if os.path.exists(file_path):
                    try:
                        os.remove(file_path)
                        logger.info(f"Temporary file removed: {file_path}", extra={"operation_id": operation_id})
                    except Exception as e_remove:
                        logger.error(f"Error removing temporary file {file_path}: {e_remove}", extra={"operation_id": operation_id})
        
        headers = {
            'Content-Disposition': f'attachment; filename="{filename}"',
            'Access-Control-Expose-Headers': 'Content-Disposition, X-Operation-ID', # Expose custom headers
            'X-Operation-ID': operation_id
        }
        
        return StreamingResponse(
            iterfile(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers=headers
        )
    except HTTPException: # Re-raise HTTPException to let FastAPI handle it
        raise
    except Exception as e:
        logger.error(f"Error in export excel endpoint: {str(e)}", exc_info=True)
        # operation_id might not be defined if error is very early.
        op_id_for_log = operation_id if 'operation_id' in locals() else "UNKNOWN"
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error generating export excel (op: {op_id_for_log}): {str(e)}")
