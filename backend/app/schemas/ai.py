"""
AI Analysis schemas shared across backend modules.
Follows 00_READ_FIRST_AND_SHARED_CONTRACT.md exactly.
"""
from enum import Enum
from pydantic import BaseModel, ConfigDict, Field


class ProblemCategory(str, Enum):
    MEDICAL = "medical"
    FOOD = "food"
    EDUCATION = "education"
    INFRASTRUCTURE = "infrastructure"
    EMERGENCY = "emergency"
    OTHER = "other"


class SuggestedPriority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class AIAnalysisRequest(BaseModel):
    """Schema for POST /api/v1/ai/analyze request body."""
    model_config = ConfigDict(extra="forbid")

    description: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="Text describing the community problem report",
    )
    image_base64: str | None = Field(
        default=None,
        description="Optional base64-encoded image payload",
    )
    image_mime_type: str | None = Field(
        default=None,
        description="Optional MIME type, e.g. image/jpeg, image/png, image/webp",
    )


class AIAnalysisResult(BaseModel):
    """
    Schema for AI analysis response.
    Exact contract specified in 00_READ_FIRST_AND_SHARED_CONTRACT.md.
    """
    model_config = ConfigDict(extra="ignore")

    summary: str = Field(
        ...,
        description="A concise summary of the reported problem based strictly on provided info",
    )
    category: ProblemCategory = Field(
        ...,
        description="Classified problem category",
    )
    suggested_priority: SuggestedPriority = Field(
        ...,
        description="Suggested priority for administrative review",
    )
    skills_required: list[str] = Field(
        default_factory=list,
        description="List of volunteer skills required to address the report",
    )
    resources_required: list[str] = Field(
        default_factory=list,
        description="List of physical resources or materials required",
    )
    missing_information: list[str] = Field(
        default_factory=list,
        description="Missing critical information (e.g. location, quantities, contact)",
    )
