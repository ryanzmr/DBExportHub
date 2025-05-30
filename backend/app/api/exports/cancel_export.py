from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional

from ..core.logger import logger
from ..core.operation_tracker import cancel_operation, get_operation_status

# Create a router for export cancellation endpoints
export_cancel_router = APIRouter()

# Model for export cancellation request
class ExportCancellationRequest(BaseModel):
    operation_id: str
    
# Model for export cancellation response
class ExportCancellationResponse(BaseModel):
    success: bool
    message: str
    operation_id: str
    status: Optional[str] = None

@export_cancel_router.post("/cancel-export", response_model=ExportCancellationResponse)
async def cancel_export_operation(request: ExportCancellationRequest):
    """
    Cancel an ongoing export operation by its ID.
    """
    try:
        logger.info(f"Received export cancellation request for operation: {request.operation_id}")
        
        # Get current status before attempting cancellation
        current_status = get_operation_status(request.operation_id)
        
        if not current_status:
            logger.warning(f"Export operation not found: {request.operation_id}")
            return ExportCancellationResponse(
                success=False,
                message=f"Export operation not found: {request.operation_id}",
                operation_id=request.operation_id,
                status="not_found"
            )
        
        # If export operation is already completed, return appropriate response
        if current_status.get("completed", False):
            logger.info(f"Cannot cancel completed export operation: {request.operation_id}")
            return ExportCancellationResponse(
                success=False,
                message="Export operation already completed",
                operation_id=request.operation_id,
                status="completed"
            )
        
        # If export operation is already cancelled, return appropriate response
        if current_status.get("cancelled", False):
            logger.info(f"Export operation already cancelled: {request.operation_id}")
            return ExportCancellationResponse(
                success=True,
                message="Export operation was already cancelled",
                operation_id=request.operation_id,
                status="cancelled"
            )
        
        # Attempt to cancel the export operation
        success = cancel_operation(request.operation_id)
        
        if success:
            logger.info(f"Successfully cancelled export operation: {request.operation_id}")
            return ExportCancellationResponse(
                success=True,
                message="Export operation cancelled successfully",
                operation_id=request.operation_id,
                status="cancelled"
            )
        else:
            logger.warning(f"Failed to cancel export operation: {request.operation_id}")
            return ExportCancellationResponse(
                success=False,
                message="Failed to cancel export operation",
                operation_id=request.operation_id,
                status=current_status.get("status", "unknown")
            )
    except Exception as e:
        logger.error(f"Error cancelling export operation {request.operation_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error cancelling export operation: {str(e)}"
        )
