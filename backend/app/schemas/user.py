"""User and identity schemas."""

from typing import Any, List
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.schemas.common import UserRole


class VerifiedIdentity(BaseModel):
    """Verified identity extracted from a validated Firebase ID token."""
    uid: str = Field(description="Unique Firebase User ID")
    email: str | None = Field(default=None, description="Email associated with Firebase account")
    claims: dict[str, Any] = Field(default_factory=dict, description="Custom token claims")


class UserProfile(BaseModel):
    """Canonical user profile model used across backend and volunteer matching."""
    id: str = Field(description="Firebase UID (Primary Key)")
    display_name: str = Field(description="User display name")
    email: str = Field(description="User email address")
    role: UserRole = Field(description="Role: community, admin, or volunteer")
    skills: List[str] = Field(default_factory=list, description="List of volunteer skills")
    service_locations: List[str] = Field(default_factory=list, description="Locations user can service")
    is_available: bool = Field(default=True, description="Volunteer availability flag")
    active_task_count: int = Field(default=0, ge=0, description="Number of currently active tasks")

    model_config = ConfigDict(from_attributes=True)


class UserProfileResponse(UserProfile):
    """Response schema for GET /api/v1/users/me."""
    pass
