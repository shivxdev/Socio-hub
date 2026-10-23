"""Task, evidence, and feedback schemas."""

from datetime import datetime
from typing import List
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.common import Priority, TaskCategory, TaskStatus


class TaskCreate(BaseModel):
    """Schema for creating a new community problem task."""
    title: str = Field(min_length=3, max_length=120, description="Task title (3-120 chars)")
    description: str = Field(min_length=1, description="Detailed problem description")
    category: TaskCategory = Field(description="Problem category")
    priority: Priority = Field(description="Task urgency priority")
    location: str | None = Field(default=None, description="Village or specific service area")
    skills_required: List[str] = Field(default_factory=list, description="Required volunteer skills")
    resources_required: List[str] = Field(default_factory=list, description="Required supplies or equipment")
    deadline: datetime | None = Field(default=None, description="Target completion datetime (ISO-8601)")


class TaskUpdate(BaseModel):
    """Schema for admin updating editable task fields.
    Protected fields (status, assigned_to, created_by) are forbidden.
    """
    title: str | None = Field(default=None, min_length=3, max_length=120)
    description: str | None = Field(default=None, min_length=1)
    category: TaskCategory | None = None
    priority: Priority | None = None
    location: str | None = None
    skills_required: List[str] | None = None
    resources_required: List[str] | None = None
    deadline: datetime | None = None

    model_config = ConfigDict(extra="forbid")


class TaskActionReasonRequest(BaseModel):
    """Optional reason for task rejection or cancellation."""
    reason: str | None = Field(default=None, description="Reason for rejection or cancellation")


class CompletionEvidenceCreate(BaseModel):
    """Schema for submitting task completion evidence."""
    note: str = Field(min_length=1, description="Completion note describing execution")
    evidence_urls: List[str] = Field(default_factory=list, description="Links to receipts or photos")


class FeedbackCreate(BaseModel):
    """Schema for community feedback on verified tasks."""
    rating: int = Field(ge=1, le=5, description="Satisfaction rating from 1 (lowest) to 5 (highest)")
    comment: str | None = Field(default=None, description="Optional feedback commentary")


class FeedbackResponse(BaseModel):
    """Response schema for task feedback."""
    id: int | None = None
    task_id: int
    user_id: str
    rating: int
    comment: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskResponse(BaseModel):
    """Standard task response model."""
    id: int = Field(description="Database primary key")
    title: str
    description: str
    category: TaskCategory
    priority: Priority
    location: str | None = None
    skills_required: List[str] = Field(default_factory=list)
    resources_required: List[str] = Field(default_factory=list)
    status: TaskStatus
    assigned_to: str | None = None
    deadline: datetime | None = None
    is_overdue: bool = False
    created_by: str = Field(description="Firebase UID of creator")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
