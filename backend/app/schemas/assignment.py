"""
Assignment schemas for deterministic volunteer matching results.
"""
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.user import UserProfileResponse


class AssignmentResult(BaseModel):
    """
    Result returned by select_best_candidate deterministic assignment logic.
    Provides candidate profile, match level, and explainable audit reason.
    """
    model_config = ConfigDict(from_attributes=True)

    candidate: UserProfileResponse
    match_level: str = Field(..., description="E.g. location_and_skills, skills_only, location_only, category_fallback")
    reason: str = Field(..., description="Explainable reason string for auditability")
    matched_skills: list[str] = Field(default_factory=list)
    matched_locations: list[str] = Field(default_factory=list)
