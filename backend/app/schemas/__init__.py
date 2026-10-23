"""
Shared schemas package for Socio-hub NGO Community Solution.
Contains schemas for AI analysis, User profiles, Tasks, Auth, and Assignment.
"""
from app.schemas.ai import (
    AIAnalysisRequest,
    AIAnalysisResult,
    ProblemCategory,
    SuggestedPriority,
)
from app.schemas.enums import (
    AssignmentAction,
    TaskPriority,
    TaskStatus,
    UserRole,
)
from app.schemas.auth import VerifiedIdentity
from app.schemas.user import (
    UserProfileBase,
    UserProfileCreate,
    UserProfileResponse,
    UserProfileUpdate,
)
from app.schemas.task import (
    CompletionEvidenceCreate,
    CompletionEvidenceResponse,
    TaskCreate,
    TaskFeedbackCreate,
    TaskFeedbackResponse,
    TaskResponse,
    TaskUpdate,
)
from app.schemas.assignment import AssignmentResult

__all__ = [
    # AI (Member 4)
    "AIAnalysisRequest",
    "AIAnalysisResult",
    "ProblemCategory",
    "SuggestedPriority",
    # Enums (Member 3)
    "TaskPriority",
    "UserRole",
    "TaskStatus",
    "AssignmentAction",
    # Auth
    "VerifiedIdentity",
    # User Profile
    "UserProfileBase",
    "UserProfileCreate",
    "UserProfileUpdate",
    "UserProfileResponse",
    # Task
    "TaskCreate",
    "TaskUpdate",
    "TaskResponse",
    "CompletionEvidenceCreate",
    "CompletionEvidenceResponse",
    "TaskFeedbackCreate",
    "TaskFeedbackResponse",
    # Assignment
    "AssignmentResult",
]
