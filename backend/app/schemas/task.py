"""
Task, Completion Evidence, and Feedback schemas following 00_READ_FIRST_AND_SHARED_CONTRACT.md.
"""
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.enums import ProblemCategory, TaskPriority, TaskStatus


class TaskCreate(BaseModel):
    """
    Schema for POST /api/v1/tasks request body.
    Never accepts created_by, assigned_to, or status from the untrusted client.
    """
    model_config = ConfigDict(extra="forbid")

    title: str = Field(..., min_length=3, max_length=120)
    description: str = Field(..., min_length=1)
    category: ProblemCategory
    priority: TaskPriority
    location: str | None = Field(default=None)
    skills_required: list[str] = Field(default_factory=list)
    resources_required: list[str] = Field(default_factory=list)
    deadline: datetime | None = Field(default=None)


class TaskUpdate(BaseModel):
    """
    Schema for PATCH /api/v1/tasks/{task_id} admin editable fields.
    Does not allow arbitrary status or assignment overrides.
    """
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=3, max_length=120)
    description: str | None = Field(default=None, min_length=1)
    category: ProblemCategory | None = None
    priority: TaskPriority | None = None
    location: str | None = None
    skills_required: list[str] | None = None
    resources_required: list[str] | None = None
    deadline: datetime | None = None


class TaskResponse(BaseModel):
    """
    Schema for Task responses matching shared contract.
    """
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    category: ProblemCategory
    priority: TaskPriority
    location: str | None
    skills_required: list[str]
    resources_required: list[str]
    status: TaskStatus
    assigned_to: str | None
    deadline: datetime | None
    is_overdue: bool
    created_by: str
    created_at: datetime
    updated_at: datetime


class CompletionEvidenceCreate(BaseModel):
    """Schema for POST /api/v1/tasks/{task_id}/completion request body."""
    model_config = ConfigDict(extra="forbid")

    note: str = Field(..., min_length=1, max_length=2000)
    evidence_urls: list[str] = Field(default_factory=list)


class CompletionEvidenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    volunteer_id: str
    note: str
    evidence_urls: list[str]
    submitted_at: datetime


class TaskFeedbackCreate(BaseModel):
    """Schema for POST /api/v1/tasks/{task_id}/feedback request body."""
    model_config = ConfigDict(extra="forbid")

    rating: int = Field(..., ge=1, le=5, description="Rating integer 1-5")
    comment: str | None = Field(default=None, max_length=1000)


class TaskFeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    user_id: str
    rating: int
    comment: str | None
    created_at: datetime
