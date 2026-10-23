"""User profile route controllers."""

from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.schemas.user import UserProfile, UserProfileResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    response_model=UserProfileResponse,
    summary="Get current user profile",
    description="Returns the profile of the currently authenticated user.",
)
async def get_my_profile(
    current_user: UserProfile = Depends(get_current_user),
) -> UserProfileResponse:
    """Return profile for the verified caller."""
    return UserProfileResponse.model_validate(current_user)
