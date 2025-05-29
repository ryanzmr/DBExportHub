from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional

from ..logger import logger
from .operation_tracker import cancel_operation, get_operation_status

# Create a router for cancellation endpoints
cancel_router = APIRouter()

# Model for cancellation request
class CancellationRequest(BaseModel):
    operation_id: str
    
# Model for cancellation response
class CancellationResponse(BaseModel):
    success: bool
    message: str
    operation_id: str
    status: Optional[str] = None

@cancel_router.post("/cancel", response_model=CancellationResponse)
async def cancel_operation_endpoint(request: CancellationRequest):
    """
    Cancel an ongoing operation by its ID.
    """
    try:
        logger.info(f"Received cancellation request for operation: {request.operation_id}")
        
        # Get current status before attempting cancellation
        current_status = get_operation_status(request.operation_id)
        
        if not current_status:
            logger.warning(f"Operation not found: {request.operation_id}")
            return CancellationResponse(
                success=False,
                message=f"Operation not found: {request.operation_id}",
                operation_id=request.operation_id,
                status="not_found"
            )
        
        # If operation is already completed, return appropriate response
        if current_status.get("completed", False):
            logger.info(f"Cannot cancel completed operation: {request.operation_id}")
            return CancellationResponse(
                success=False,
                message="Operation already completed",
                operation_id=request.operation_id,
                status="completed"
            )
        
        # If operation is already cancelled, return appropriate response
        if current_status.get("cancelled", False):
            logger.info(f"Operation already cancelled: {request.operation_id}")
            return CancellationResponse(
                success=True,
                message="Operation was already cancelled",
                operation_id=request.operation_id,
                status="cancelled"
            )
        
        # Attempt to cancel the operation
        success = cancel_operation(request.operation_id)
        
        if success:
            logger.info(f"Successfully cancelled operation: {request.operation_id}")
            return CancellationResponse(
                success=True,
                message="Operation cancelled successfully",
                operation_id=request.operation_id,
                status="cancelled"
            )
        else:
            logger.warning(f"Failed to cancel operation: {request.operation_id}")
            return CancellationResponse(
                success=False,
                message="Failed to cancel operation",
                operation_id=request.operation_id,
                status=current_status.get("status", "unknown")
            )
    except Exception as e:
        logger.error(f"Error cancelling operation {request.operation_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error cancelling operation: {str(e)}"
        )