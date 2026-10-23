"""AI analysis request and result schemas."""

from typing import List
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.common import Priority, TaskCategory

# Aliases used by Member 4's gemma_service module.
# String values are identical to TaskCategory/Priority — wire contract is unchanged.
ProblemCategory = TaskCategory
SuggestedPriority = Priority


class AIAnalysisRequest(BaseModel):
    """Payload for requesting AI analysis of a community problem."""
    description: str = Field(min_length=1, description="Description of the problem reported by community")
    image_base64: str | None = Field(default=None, description="Optional base64-encoded image")
    image_mime_type: str | None = Field(default=None, description="Optional image MIME type (e.g. image/jpeg)")


class AIAnalysisResult(BaseModel):
    """Structured AI analysis output suggested to admin/community."""
    summary: str = Field(description="Concise summary of the problem")
    category: TaskCategory = Field(description="Suggested category")
    suggested_priority: Priority = Field(description="Suggested priority")
    skills_required: List[str] = Field(default_factory=list, description="Skills suggested to address problem")
    resources_required: List[str] = Field(default_factory=list, description="Resources or materials suggested")
    missing_information: List[str] = Field(default_factory=list, description="Information missing from the report")

    model_config = ConfigDict(from_attributes=True)
