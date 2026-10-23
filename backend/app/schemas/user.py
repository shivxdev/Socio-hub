"""
User profile schemas following 00_READ_FIRST_AND_SHARED_CONTRACT.md.
"""
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.enums import UserRole


class UserProfileBase(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., min_length=3, max_length=255)
    role: UserRole = Field(default=UserRole.COMMUNITY)
    skills: list[str] = Field(default_factory=list)
    service_locations: list[str] = Field(default_factory=list)
    is_available: bool = Field(default=True)


class UserProfileCreate(UserProfileBase):
    """Schema to register or initialize a local user profile for a verified Firebase UID."""
    id: str = Field(..., description="Firebase UID")


class UserProfileUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=100)
    skills: list[str] | None = None
    service_locations: list[str] | None = None
    is_available: bool | None = None
    role: UserRole | None = None


class UserProfileResponse(UserProfileBase):
    """
    Public representation of user profile.
    Matches shared contract specification.
    """
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="Firebase UID")
    active_task_count: int = Field(default=0)
    created_at: datetime | None = Field(default=None)
    updated_at: datetime | None = Field(default=None)
