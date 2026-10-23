"""Analytics router for administrator dashboard."""

from fastapi import APIRouter, Depends
from app.core.security import require_role
from app.schemas.analytics import AnalyticsSummaryResponse
from app.schemas.common import UserRole
from app.schemas.user import UserProfile
from app.services.task_service import TaskService, get_task_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get(
    "/summary",
    response_model=AnalyticsSummaryResponse,
    summary="Get analytics summary",
    description="Returns aggregate counts, status breakdowns, and performance metrics. Administrator access only.",
)
async def get_analytics_summary(
    current_user: UserProfile = Depends(require_role(UserRole.ADMIN)),
    service: TaskService = Depends(get_task_service),
) -> AnalyticsSummaryResponse:
    """Return aggregated metrics for administrators."""
    return service.get_analytics_summary(current_user)
