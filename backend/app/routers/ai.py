"""AI Problem Analysis route controller."""

from fastapi import APIRouter, Depends
from app.core.security import require_role
from app.schemas.ai import AIAnalysisRequest, AIAnalysisResult
from app.schemas.common import UserRole
from app.schemas.user import UserProfile
from app.services import ai_service

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post(
    "/analyze",
    response_model=AIAnalysisResult,
    summary="Analyze community problem using AI",
    description="Community users or admins submit problem description and optional image for structured suggestions.",
)
async def analyze_problem(
    payload: AIAnalysisRequest,
    current_user: UserProfile = Depends(require_role(UserRole.COMMUNITY, UserRole.ADMIN)),
) -> AIAnalysisResult:
    """Analyze problem text and optional image using the agreed AI service."""
    return ai_service.analyze_community_problem(
        description=payload.description,
        image_base64=payload.image_base64,
        image_mime_type=payload.image_mime_type,
    )
