from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel # BaseModel is used, so keep pydantic
from typing import Optional

# Updated imports:
from ...logging_operation.loggers import logger # Was: from ..logger import logger
from ...utilities.operation_tracker import cancel_operation, get_operation_status # Was: from .operation_tracker import ...

# Create a router for cancellation endpoints
# This router will be included in main.py or a higher-level router in api/operations
cancel_router = APIRouter(
    prefix="/operations", # Example prefix, might be defined when including the router
    tags=["operations"],  # Example tag for API docs
)

# Model for cancellation request - this can stay here or move to a shared models/schemas if used elsewhere
class CancellationRequest(BaseModel):
    operation_id: str
    
# Model for cancellation response - can also stay or move to shared models/schemas
class CancellationResponse(BaseModel):
    success: bool
    message: str
    operation_id: str
    status: Optional[str] = None

@cancel_router.post("/cancel", response_model=CancellationResponse) # Endpoint path might be just "/cancel" if prefix is "/operations"
async def cancel_operation_endpoint(request: CancellationRequest) -> CancellationResponse: # Added return type hint
    """
    Cancel an ongoing operation by its ID.
    """
    try:
        logger.info(f"Received cancellation request for operation: {request.operation_id}", extra={"operation_id": request.operation_id})
        
        current_op_details = get_operation_status(request.operation_id) # get_operation_status returns a dict or None
        
        if not current_op_details:
            logger.warning(f"Operation not found for cancellation: {request.operation_id}", extra={"operation_id": request.operation_id})
            # Return a 404 directly, or let main.py handle it via HTTPException if preferred for consistency.
            # For now, returning the response model directly as in original code.
            return CancellationResponse(
                success=False,
                message=f"Operation not found: {request.operation_id}",
                operation_id=request.operation_id,
                status="not_found"
            )
        
        current_status_str = current_op_details.get("status", "unknown")

        if current_op_details.get("completed", False):
            logger.info(f"Cannot cancel completed operation: {request.operation_id}", extra={"operation_id": request.operation_id, "current_status": current_status_str})
            return CancellationResponse(
                success=False,
                message="Operation already completed",
                operation_id=request.operation_id,
                status=current_status_str # Return actual completed status
            )
        
        if current_op_details.get("cancelled", False): # Should ideally match status="cancelled"
            logger.info(f"Operation already cancelled: {request.operation_id}", extra={"operation_id": request.operation_id, "current_status": current_status_str})
            return CancellationResponse(
                success=True, # Indicate successful state (already cancelled)
                message="Operation was already cancelled",
                operation_id=request.operation_id,
                status=current_status_str # Return actual cancelled status
            )
        
        # Attempt to cancel the operation
        cancellation_successful = cancel_operation(request.operation_id)
        
        # Fetch the latest status after cancellation attempt
        final_op_status = get_operation_status(request.operation_id)
        final_status_str = final_op_status.get("status", "unknown") if final_op_status else current_status_str
        
        if cancellation_successful:
            logger.info(f"Successfully initiated cancellation for operation: {request.operation_id}", extra={"operation_id": request.operation_id, "final_status": final_status_str})
            return CancellationResponse(
                success=True,
                message="Operation cancellation initiated successfully.", # Message reflects initiation
                operation_id=request.operation_id,
                status=final_status_str 
            )
        else:
            # This path might be less common if cancel_operation itself updates status or if op was already terminal
            logger.warning(f"Failed to cancel operation (or already terminal before attempt): {request.operation_id}", extra={"operation_id": request.operation_id, "current_status_before_cancel_call": current_status_str})
            return CancellationResponse(
                success=False,
                message="Failed to cancel operation (it might have completed or been cancelled just before this request).",
                operation_id=request.operation_id,
                status=final_status_str 
            )
    except Exception as e:
        logger.error(f"Error during cancellation of operation {request.operation_id}: {str(e)}", exc_info=True, extra={"operation_id": request.operation_id})
        # It's generally better to raise HTTPException here to let FastAPI handle standard error responses.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error cancelling operation {request.operation_id}: {str(e)}"
        )
