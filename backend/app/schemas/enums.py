"""
Shared Enums for Socio-hub NGO Community Solution.
Follows 00_READ_FIRST_AND_SHARED_CONTRACT.md exactly.
Reuses ProblemCategory and SuggestedPriority from app.schemas.ai to avoid duplication.
"""
from enum import Enum
from app.schemas.ai import ProblemCategory, SuggestedPriority

# TaskPriority uses the same values as SuggestedPriority
TaskPriority = SuggestedPriority


class UserRole(str, Enum):
    COMMUNITY = "community"
    ADMIN = "admin"
    VOLUNTEER = "volunteer"


class TaskStatus(str, Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    ACCEPTED = "accepted"
    ACTIVE = "active"
    COMPLETION_SUBMITTED = "completion_submitted"
    VERIFIED = "verified"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class AssignmentAction(str, Enum):
    ASSIGNED = "assigned"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    REASSIGNED = "reassigned"
    CANCELLED = "cancelled"
