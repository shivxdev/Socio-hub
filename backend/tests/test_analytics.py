"""Tests for GET /api/v1/analytics/summary endpoint."""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict
import pytest
from fastapi import Header
from fastapi.testclient import TestClient
from app.core.exceptions import UnauthorizedException
from app.core.security import get_current_user
from app.main import create_app
from app.schemas.common import Priority, TaskCategory, TaskStatus, UserRole
from app.schemas.task import TaskCreate
from app.schemas.user import UserProfile
from app.services.task_service import TaskRepository, TaskService, get_task_service

ADMIN_USER = UserProfile(
    id="uid-admin-analytics",
    display_name="Analytics Admin",
    email="admin@analytics.org",
    role=UserRole.ADMIN,
    skills=[],
    service_locations=[],
    is_available=True,
    active_task_count=0,
)

VOLUNTEER_USER = UserProfile(
    id="uid-volunteer-analytics",
    display_name="Analytics Volunteer",
    email="vol@analytics.org",
    role=UserRole.VOLUNTEER,
    skills=[],
    service_locations=[],
    is_available=True,
    active_task_count=0,
)

COMMUNITY_USER = UserProfile(
    id="uid-community-analytics",
    display_name="Analytics Community",
    email="comm@analytics.org",
    role=UserRole.COMMUNITY,
    skills=[],
    service_locations=[],
    is_available=True,
    active_task_count=0,
)

USER_MAP: Dict[str, UserProfile] = {
    "admin": ADMIN_USER,
    "volunteer": VOLUNTEER_USER,
    "community": COMMUNITY_USER,
}


def resolve_auth_user(authorization: str | None = Header(default=None, alias="Authorization")) -> UserProfile:
    if not authorization:
        raise UnauthorizedException("No token provided.")
    token = authorization.replace("Bearer ", "").strip()
    user = USER_MAP.get(token)
    if not user:
        raise UnauthorizedException(f"User {token} not found.")
    return user


@pytest.fixture
def analytics_repo() -> TaskRepository:
    return TaskRepository()


@pytest.fixture
def analytics_service(analytics_repo: TaskRepository) -> TaskService:
    return TaskService(analytics_repo)


@pytest.fixture
def test_app(analytics_service: TaskService):
    app = create_app()
    app.dependency_overrides[get_task_service] = lambda: analytics_service
    app.dependency_overrides[get_current_user] = resolve_auth_user
    return app


@pytest.fixture
def client(test_app):
    with TestClient(test_app) as c:
        yield c


def test_analytics_empty_repository(client: TestClient) -> None:
    """Verify analytics summary on empty dataset returns zeroed metrics and null rating."""
    response = client.get("/api/v1/analytics/summary", headers={"Authorization": "Bearer admin"})
    assert response.status_code == 200
    data = response.json()
    assert data["total_tasks"] == 0
    assert data["active_volunteers"] == 0
    assert data["overdue_tasks"] == 0
    assert data["average_rating"] is None
    # All status counts are 0
    for status_key, count in data["tasks_by_status"].items():
        assert count == 0
    # All category counts are 0
    for cat_key, count in data["tasks_by_category"].items():
        assert count == 0


def test_analytics_calculated_dynamically_from_real_records(
    client: TestClient, analytics_repo: TaskRepository
) -> None:
    """Verify analytics summary accurately aggregates multiple tasks, statuses,
    active volunteers, overdue counts, and average feedback ratings dynamically.
    """
    now = datetime.now(timezone.utc)
    past_deadline = now - timedelta(days=2)
    future_deadline = now + timedelta(days=3)

    # 1. Create Task 1: Education, High priority, Overdue, Active, Assigned to Vol 1
    t1 = analytics_repo.create(
        TaskCreate(title="Task 1", description="desc 1", category=TaskCategory.EDUCATION, priority=Priority.HIGH, deadline=past_deadline),
        created_by="comm-1",
    )
    analytics_repo.update(t1.id, status=TaskStatus.ACTIVE, assigned_to="vol-1")

    # 2. Create Task 2: Medical, Medium priority, Future deadline, Completion submitted, Assigned to Vol 2
    t2 = analytics_repo.create(
        TaskCreate(title="Task 2", description="desc 2", category=TaskCategory.MEDICAL, priority=Priority.MEDIUM, deadline=future_deadline),
        created_by="comm-1",
    )
    analytics_repo.update(t2.id, status=TaskStatus.COMPLETION_SUBMITTED, assigned_to="vol-2")

    # 3. Create Task 3: Food, Low priority, Verified (terminal), Assigned to Vol 1
    t3 = analytics_repo.create(
        TaskCreate(title="Task 3", description="desc 3", category=TaskCategory.FOOD, priority=Priority.LOW, deadline=past_deadline),
        created_by="comm-2",
    )
    analytics_repo.update(t3.id, status=TaskStatus.VERIFIED, assigned_to="vol-1")
    # Record feedback: ratings 5 and 4
    analytics_repo.record_feedback(t3.id, user_id="comm-2", rating=5, comment="Great")

    # 4. Create Task 4: Food, Medium priority, Verified with rating 4
    t4 = analytics_repo.create(
        TaskCreate(title="Task 4", description="desc 4", category=TaskCategory.FOOD, priority=Priority.MEDIUM),
        created_by="comm-2",
    )
    analytics_repo.update(t4.id, status=TaskStatus.VERIFIED)
    analytics_repo.record_feedback(t4.id, user_id="comm-2", rating=4, comment="Good")

    # 5. Create Task 5: Emergency, High priority, Pending, No assignee
    analytics_repo.create(
        TaskCreate(title="Task 5", description="desc 5", category=TaskCategory.EMERGENCY, priority=Priority.HIGH),
        created_by="comm-3",
    )

    response = client.get("/api/v1/analytics/summary", headers={"Authorization": "Bearer admin"})
    assert response.status_code == 200
    data = response.json()

    # Totals
    assert data["total_tasks"] == 5

    # Status counts
    assert data["tasks_by_status"]["active"] == 1
    assert data["tasks_by_status"]["completion_submitted"] == 1
    assert data["tasks_by_status"]["verified"] == 2
    assert data["tasks_by_status"]["pending"] == 1
    assert data["tasks_by_status"]["assigned"] == 0

    # Category counts
    assert data["tasks_by_category"]["education"] == 1
    assert data["tasks_by_category"]["medical"] == 1
    assert data["tasks_by_category"]["food"] == 2
    assert data["tasks_by_category"]["emergency"] == 1

    # Priority counts
    assert data["tasks_by_priority"]["high"] == 2
    assert data["tasks_by_priority"]["medium"] == 2
    assert data["tasks_by_priority"]["low"] == 1

    # Active volunteers: Vol 1 (on active t1) and Vol 2 (on comp t2) -> 2 distinct active volunteers
    assert data["active_volunteers"] == 2

    # Overdue tasks: t1 is past deadline and active (counts). t3 is past deadline but verified (does NOT count).
    assert data["overdue_tasks"] == 1

    # Average rating: (5 + 4) / 2 = 4.5
    assert data["average_rating"] == 4.5


def test_analytics_restricted_to_admin(client: TestClient) -> None:
    """Verify non-admin roles (volunteer, community) are rejected with 403 FORBIDDEN."""
    # Volunteer forbidden
    vol_res = client.get("/api/v1/analytics/summary", headers={"Authorization": "Bearer volunteer"})
    assert vol_res.status_code == 403
    assert vol_res.json()["error"]["code"] == "FORBIDDEN"

    # Community user forbidden
    comm_res = client.get("/api/v1/analytics/summary", headers={"Authorization": "Bearer community"})
    assert comm_res.status_code == 403
    assert comm_res.json()["error"]["code"] == "FORBIDDEN"

    # Unauthenticated forbidden (401)
    no_auth_res = client.get("/api/v1/analytics/summary")
    assert no_auth_res.status_code == 401
