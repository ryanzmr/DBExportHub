from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional

from ..core.logger import logger
from ..core.operation_tracker import cancel_operation, get_operation_status

# Create a router for import cancellation endpoints
import_cancel_router = APIRouter()

# Model for import cancellation request
class ImportCancellationRequest(BaseModel):
    operation_id: str
    
# Model for import cancellation response
class ImportCancellationResponse(BaseModel):
    success: bool
    message: str
    operation_id: str
    status: Optional[str] = None

@import_cancel_router.post("/cancel-import", response_model=ImportCancellationResponse)
async def cancel_import_operation(request: ImportCancellationRequest):
    """
    Cancel an ongoing import operation by its ID.
    """
    try:
        logger.info(f"Received import cancellation request for operation: {request.operation_id}")
        
        # Get current status before attempting cancellation
        current_status = get_operation_status(request.operation_id)
        
        if not current_status:
            logger.warning(f"Import operation not found: {request.operation_id}")
            return ImportCancellationResponse(
                success=False,
                message=f"Import operation not found: {request.operation_id}",
                operation_id=request.operation_id,
                status="not_found"
            )
        
        # If import operation is already completed, return appropriate response
        if current_status.get("completed", False):
            logger.info(f"Cannot cancel completed import operation: {request.operation_id}")
            return ImportCancellationResponse(
                success=False,
                message="Import operation already completed",
                operation_id=request.operation_id,
                status="completed"
            )
        
        # If import operation is already cancelled, return appropriate response
        if current_status.get("cancelled", False):
            logger.info(f"Import operation already cancelled: {request.operation_id}")
            return ImportCancellationResponse(
                success=True,
                message="Import operation was already cancelled",
                operation_id=request.operation_id,
                status="cancelled"
            )
        
        # Attempt to cancel the import operation
        success = cancel_operation(request.operation_id)
        
        if success:
            logger.info(f"Successfully cancelled import operation: {request.operation_id}")
            return ImportCancellationResponse(
                success=True,
                message="Import operation cancelled successfully",
                operation_id=request.operation_id,
                status="cancelled"
            )
        else:
            logger.warning(f"Failed to cancel import operation: {request.operation_id}")
            return ImportCancellationResponse(
                success=False,
                message="Failed to cancel import operation",
                operation_id=request.operation_id,
                status=current_status.get("status", "unknown")
            )
    except Exception as e:
        logger.error(f"Error cancelling import operation {request.operation_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error cancelling import operation: {str(e)}"
        )
