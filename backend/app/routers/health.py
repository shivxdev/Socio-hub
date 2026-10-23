"""Public health check endpoint."""

from fastapi import APIRouter
from app.schemas.common import HealthResponse

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Public health check",
    description="Returns service health status for load balancers and clients.",
)
async def get_health() -> HealthResponse:
    """Return application health status."""
    return HealthResponse(status="ok")
