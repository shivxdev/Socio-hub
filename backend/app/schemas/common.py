"""Shared enums and common schema definitions."""

from enum import Enum
from typing import Any, List
from pydantic import BaseModel, Field


class UserRole(str, Enum):
    """User roles recognized by the system."""
    COMMUNITY = "community"
    ADMIN = "admin"
    VOLUNTEER = "volunteer"


class TaskCategory(str, Enum):
    """Problem and task categories."""
    MEDICAL = "medical"
    FOOD = "food"
    EDUCATION = "education"
    INFRASTRUCTURE = "infrastructure"
    EMERGENCY = "emergency"
    OTHER = "other"


class Priority(str, Enum):
    """Task urgency levels."""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class TaskStatus(str, Enum):
    """Task status lifecycle."""
    PENDING = "pending"
    ASSIGNED = "assigned"
    ACCEPTED = "accepted"
    ACTIVE = "active"
    COMPLETION_SUBMITTED = "completion_submitted"
    VERIFIED = "verified"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class ErrorDetail(BaseModel):
    """Specific error field detail."""
    field: str | None = None
    issue: str | None = None
    location: List[Any] | None = None


class ErrorBody(BaseModel):
    """Standard error response payload."""
    code: str = Field(description="Machine-readable error code")
    message: str = Field(description="Human-readable error description")
    details: List[Any] = Field(default_factory=list, description="Detailed validation or context items")


class StandardErrorResponse(BaseModel):
    """Top-level error response envelope."""
    error: ErrorBody


class HealthResponse(BaseModel):
    """Public health check response."""
    status: str = "ok"
