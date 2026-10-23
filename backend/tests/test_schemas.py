"""Unit tests for Phase 3 canonical Pydantic schemas."""

from datetime import datetime, timezone
import pytest
from pydantic import ValidationError
from app.schemas.ai import AIAnalysisRequest, AIAnalysisResult
from app.schemas.analytics import AnalyticsSummaryResponse
from app.schemas.common import Priority, TaskCategory, TaskStatus, UserRole
from app.schemas.task import (
    CompletionEvidenceCreate,
    FeedbackCreate,
    FeedbackResponse,
    TaskActionReasonRequest,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)
from app.schemas.user import UserProfile, VerifiedIdentity


def test_user_profile_schema_valid() -> None:
    """Verify valid UserProfile construction."""
    profile = UserProfile(
        id="uid-100",
        display_name="John Community",
        email="john@community.org",
        role=UserRole.COMMUNITY,
        skills=["organizing"],
        service_locations=["East Ward"],
        is_available=True,
        active_task_count=0,
    )
    assert profile.role == UserRole.COMMUNITY
    assert profile.active_task_count == 0


def test_task_create_valid() -> None:
    """Verify TaskCreate accepts valid payload matching contract."""
    task_in = TaskCreate(
        title="Distribute Clean Water",
        description="Provide 200 bottles of water to the relief camp.",
        category=TaskCategory.EMERGENCY,
        priority=Priority.HIGH,
        location="Camp A",
        skills_required=["driving"],
        resources_required=["water bottles", "truck"],
        deadline=datetime(2026, 11, 1, 12, 0, tzinfo=timezone.utc),
    )
    assert task_in.title == "Distribute Clean Water"
    assert task_in.priority == Priority.HIGH
    assert task_in.category == TaskCategory.EMERGENCY


@pytest.mark.parametrize("invalid_title", ["a", "ab", "x" * 121])
def test_task_create_invalid_title_length(invalid_title: str) -> None:
    """Verify TaskCreate rejects titles shorter than 3 or longer than 120 chars."""
    with pytest.raises(ValidationError):
        TaskCreate(
            title=invalid_title,
            description="Valid description here",
            category=TaskCategory.FOOD,
            priority=Priority.MEDIUM,
        )


def test_task_update_forbids_protected_fields() -> None:
    """Verify TaskUpdate raises ValidationError if client attempts to pass status or assigned_to."""
    with pytest.raises(ValidationError) as exc_info:
        TaskUpdate.model_validate({
            "title": "Updated Title",
            "status": "verified",  # Forbidden protected field
        })
    assert "extra_forbidden" in str(exc_info.value)

    with pytest.raises(ValidationError) as exc_info2:
        TaskUpdate.model_validate({
            "assigned_to": "someone-else",  # Forbidden protected field
        })
    assert "extra_forbidden" in str(exc_info2.value)


@pytest.mark.parametrize("valid_rating", [1, 2, 3, 4, 5])
def test_feedback_create_valid_ratings(valid_rating: int) -> None:
    """Verify FeedbackCreate accepts ratings between 1 and 5 inclusive."""
    fb = FeedbackCreate(rating=valid_rating, comment="Good job")
    assert fb.rating == valid_rating


@pytest.mark.parametrize("invalid_rating", [0, -1, 6, 10])
def test_feedback_create_invalid_ratings(invalid_rating: int) -> None:
    """Verify FeedbackCreate rejects ratings outside 1..5."""
    with pytest.raises(ValidationError):
        FeedbackCreate(rating=invalid_rating)


def test_ai_schemas_serialization() -> None:
    """Verify AIAnalysisRequest and AIAnalysisResult serialize and match contract types."""
    req = AIAnalysisRequest(description="School flooded with water.")
    assert req.image_base64 is None

    res = AIAnalysisResult(
        summary="School facility requires flood water extraction.",
        category=TaskCategory.INFRASTRUCTURE,
        suggested_priority=Priority.HIGH,
        skills_required=["water pumping"],
        resources_required=["water pump", "pipes"],
        missing_information=["exact water depth"],
    )
    assert res.category == TaskCategory.INFRASTRUCTURE
    assert res.suggested_priority == Priority.HIGH
    assert len(res.resources_required) == 2


def test_analytics_summary_response_valid() -> None:
    """Verify AnalyticsSummaryResponse serialization."""
    summary = AnalyticsSummaryResponse(
        total_tasks=10,
        tasks_by_status={"pending": 3, "verified": 7},
        tasks_by_category={"education": 4, "medical": 6},
        tasks_by_priority={"high": 2, "medium": 8},
        active_volunteers=5,
        overdue_tasks=1,
        average_rating=4.5,
    )
    assert summary.total_tasks == 10
    assert summary.average_rating == 4.5
