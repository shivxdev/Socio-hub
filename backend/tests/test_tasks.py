"""Comprehensive automated tests for task endpoints, status transitions, and permissions."""

from typing import Any, Dict
import pytest
from fastapi import Header
from fastapi.testclient import TestClient
from app.core.exceptions import UnauthorizedException
from app.core.security import get_current_user
from app.main import create_app
from app.schemas.common import Priority, TaskCategory, TaskStatus, UserRole
from app.schemas.user import UserProfile
from app.services.task_service import TaskRepository, TaskService, get_task_service

# Test User Fixtures
USER_COMMUNITY_1 = UserProfile(
    id="uid-comm-1",
    display_name="Community Charlie",
    email="charlie@village.org",
    role=UserRole.COMMUNITY,
    skills=[],
    service_locations=[],
    is_available=True,
    active_task_count=0,
)

USER_COMMUNITY_2 = UserProfile(
    id="uid-comm-2",
    display_name="Community Dave",
    email="dave@village.org",
    role=UserRole.COMMUNITY,
    skills=[],
    service_locations=[],
    is_available=True,
    active_task_count=0,
)

USER_VOLUNTEER_A = UserProfile(
    id="uid-vol-a",
    display_name="Volunteer Alice",
    email="alice@helpers.org",
    role=UserRole.VOLUNTEER,
    skills=["medical", "driving"],
    service_locations=["District 1"],
    is_available=True,
    active_task_count=0,
)

USER_VOLUNTEER_B = UserProfile(
    id="uid-vol-b",
    display_name="Volunteer Bob",
    email="bob@helpers.org",
    role=UserRole.VOLUNTEER,
    skills=["logistics"],
    service_locations=["District 1"],
    is_available=True,
    active_task_count=0,
)

USER_ADMIN = UserProfile(
    id="uid-admin",
    display_name="Admin Admin",
    email="admin@ngo.org",
    role=UserRole.ADMIN,
    skills=[],
    service_locations=[],
    is_available=True,
    active_task_count=0,
)

USER_REGISTRY: Dict[str, UserProfile] = {
    "comm-1": USER_COMMUNITY_1,
    "comm-2": USER_COMMUNITY_2,
    "vol-a": USER_VOLUNTEER_A,
    "vol-b": USER_VOLUNTEER_B,
    "admin": USER_ADMIN,
}


def resolve_test_user(authorization: str | None = Header(default=None, alias="Authorization")) -> UserProfile:
    """Dynamically resolve test user from Bearer token."""
    if not authorization:
        raise UnauthorizedException("Authentication credentials were not provided.")
    token = authorization.replace("Bearer ", "").strip()
    user = USER_REGISTRY.get(token)
    if not user:
        raise UnauthorizedException(f"Test user for token '{token}' not found.")
    return user


class AuthenticatedUserClient:
    """Wrapper around TestClient that automatically attaches Bearer auth headers."""

    def __init__(self, client: TestClient, user_token: str):
        self._client = client
        self._auth_header = {"Authorization": f"Bearer {user_token}"}

    def get(self, url: str, **kwargs: Any):
        headers = {**self._auth_header, **kwargs.pop("headers", {})}
        return self._client.get(url, headers=headers, **kwargs)

    def post(self, url: str, **kwargs: Any):
        headers = {**self._auth_header, **kwargs.pop("headers", {})}
        return self._client.post(url, headers=headers, **kwargs)

    def patch(self, url: str, **kwargs: Any):
        headers = {**self._auth_header, **kwargs.pop("headers", {})}
        return self._client.patch(url, headers=headers, **kwargs)


@pytest.fixture
def fresh_task_service() -> TaskService:
    """Fixture providing an isolated fresh TaskService repository for each test."""
    repo = TaskRepository()
    return TaskService(repo)


@pytest.fixture
def test_app(fresh_task_service: TaskService):
    """FastAPI application with dependency overrides."""
    app = create_app()
    app.dependency_overrides[get_task_service] = lambda: fresh_task_service
    app.dependency_overrides[get_current_user] = resolve_test_user
    return app


@pytest.fixture
def raw_client(test_app):
    with TestClient(test_app) as c:
        yield c


@pytest.fixture
def comm_1(raw_client):
    return AuthenticatedUserClient(raw_client, "comm-1")


@pytest.fixture
def comm_2(raw_client):
    return AuthenticatedUserClient(raw_client, "comm-2")


@pytest.fixture
def vol_a(raw_client):
    return AuthenticatedUserClient(raw_client, "vol-a")


@pytest.fixture
def vol_b(raw_client):
    return AuthenticatedUserClient(raw_client, "vol-b")


@pytest.fixture
def admin(raw_client):
    return AuthenticatedUserClient(raw_client, "admin")


# --------------------------------------------------------------------------
# 1. Full Lifecycle Success Test
# --------------------------------------------------------------------------

def test_full_successful_task_lifecycle(comm_1, admin, vol_a) -> None:
    """Verify complete intended task lifecycle:
    pending -> assigned -> accepted -> active -> completion_submitted -> verified -> feedback
    """
    # 1. Community creates task (status: pending)
    create_payload = {
        "title": "Repair village water pump",
        "description": "The main handpump near the school has broken handles.",
        "category": "infrastructure",
        "priority": "high",
        "location": "Ward 4 School",
        "skills_required": ["plumbing"],
        "resources_required": ["spare valves", "tools"],
    }
    create_res = comm_1.post("/api/v1/tasks", json=create_payload)
    assert create_res.status_code == 201
    task = create_res.json()
    task_id = task["id"]
    assert task["status"] == "pending"
    assert task["created_by"] == USER_COMMUNITY_1.id
    assert task["assigned_to"] is None

    # 2. Admin assigns task to Volunteer A (status: assigned)
    assign_res = admin.post(f"/api/v1/tasks/{task_id}/assign", json={"volunteer_id": USER_VOLUNTEER_A.id})
    assert assign_res.status_code == 200
    assert assign_res.json()["status"] == "assigned"
    assert assign_res.json()["assigned_to"] == USER_VOLUNTEER_A.id

    # 3. Volunteer A accepts task (status: accepted)
    accept_res = vol_a.post(f"/api/v1/tasks/{task_id}/accept")
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "accepted"

    # 4. Volunteer A starts task (status: active)
    start_res = vol_a.post(f"/api/v1/tasks/{task_id}/start")
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "active"

    # 5. Volunteer A submits completion evidence (status: completion_submitted)
    evidence_payload = {
        "note": "Replaced the valve and tested the flow. Water is clean and working.",
        "evidence_urls": ["https://example.com/photos/pump_repaired.jpg"],
    }
    comp_res = vol_a.post(f"/api/v1/tasks/{task_id}/completion", json=evidence_payload)
    assert comp_res.status_code == 200
    assert comp_res.json()["status"] == "completion_submitted"

    # 6. Admin verifies task (status: verified)
    verify_res = admin.post(f"/api/v1/tasks/{task_id}/verify")
    assert verify_res.status_code == 200
    assert verify_res.json()["status"] == "verified"

    # 7. Community creator submits feedback
    feedback_payload = {
        "rating": 5,
        "comment": "Pump fixed promptly, great work!",
    }
    fb_res = comm_1.post(f"/api/v1/tasks/{task_id}/feedback", json=feedback_payload)
    assert fb_res.status_code == 201
    fb_data = fb_res.json()
    assert fb_data["rating"] == 5
    assert fb_data["user_id"] == USER_COMMUNITY_1.id
    assert fb_data["task_id"] == task_id


# --------------------------------------------------------------------------
# 2. Rejection Lifecycle & Exclusion Test
# --------------------------------------------------------------------------

def test_task_rejection_resets_to_pending_and_excludes_volunteer(comm_1, admin, vol_a, vol_b) -> None:
    """Verify task rejection records history, resets status to pending,
    clears assigned_to, and excludes rejecting volunteer from immediate reassignment.
    """
    # Create task
    task_res = comm_1.post(
        "/api/v1/tasks",
        json={"title": "Deliver Medical Supplies", "description": "Need insulin delivery", "category": "medical", "priority": "high"},
    )
    task_id = task_res.json()["id"]

    # Admin assigns to Volunteer A
    admin.post(f"/api/v1/tasks/{task_id}/assign", json={"volunteer_id": USER_VOLUNTEER_A.id})

    # Volunteer A rejects task with reason
    reject_res = vol_a.post(f"/api/v1/tasks/{task_id}/reject", json={"reason": "Unavailable due to personal emergency"})
    assert reject_res.status_code == 200
    rejected_task = reject_res.json()
    assert rejected_task["status"] == "pending"
    assert rejected_task["assigned_to"] is None

    # Admin attempts to reassign the same task to Volunteer A -> Rejection exclusion enforced
    retry_res = admin.post(f"/api/v1/tasks/{task_id}/assign", json={"volunteer_id": USER_VOLUNTEER_A.id})
    assert retry_res.status_code == 422
    assert "excluded" in retry_res.json()["error"]["message"].lower()

    # Admin assigns to Volunteer B -> Allowed
    assign_b_res = admin.post(f"/api/v1/tasks/{task_id}/assign", json={"volunteer_id": USER_VOLUNTEER_B.id})
    assert assign_b_res.status_code == 200
    assert assign_b_res.json()["status"] == "assigned"
    assert assign_b_res.json()["assigned_to"] == USER_VOLUNTEER_B.id


# --------------------------------------------------------------------------
# 3. Cancellation Lifecycle Test
# --------------------------------------------------------------------------

def test_admin_can_cancel_task_and_terminal_state_is_immutable(comm_1, admin) -> None:
    """Verify admin cancellation transitions task to cancelled and terminal tasks cannot be altered."""
    task_res = comm_1.post(
        "/api/v1/tasks",
        json={"title": "Distribution of warm clothing", "description": "Clothing needed", "category": "other", "priority": "low"},
    )
    task_id = task_res.json()["id"]

    # Admin cancels task
    cancel_res = admin.post(f"/api/v1/tasks/{task_id}/cancel", json={"reason": "Already handled by local council"})
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"

    # Attempting to re-cancel an already cancelled task fails
    re_cancel = admin.post(f"/api/v1/tasks/{task_id}/cancel", json={"reason": "Repeat cancel"})
    assert re_cancel.status_code == 400
    assert re_cancel.json()["error"]["code"] == "INVALID_STATUS_TRANSITION"


# --------------------------------------------------------------------------
# 4. Role Permissions & Ownership Enforcement Tests
# --------------------------------------------------------------------------

def test_role_permissions_enforced_strictly(comm_1, vol_a, vol_b, admin) -> None:
    """Verify that unauthorized roles cannot perform restricted actions."""
    # 1. Volunteer cannot create tasks
    vol_create = vol_a.post("/api/v1/tasks", json={"title": "Bad Request", "description": "desc", "category": "food", "priority": "low"})
    assert vol_create.status_code == 403

    # Community creates valid task
    task_res = comm_1.post("/api/v1/tasks", json={"title": "Community Meal Delivery", "description": "desc", "category": "food", "priority": "medium"})
    task_id = task_res.json()["id"]

    # 2. Community user cannot assign tasks
    comm_assign = comm_1.post(f"/api/v1/tasks/{task_id}/assign", json={"volunteer_id": USER_VOLUNTEER_A.id})
    assert comm_assign.status_code == 403

    # Admin assigns to Volunteer A
    admin.post(f"/api/v1/tasks/{task_id}/assign", json={"volunteer_id": USER_VOLUNTEER_A.id})

    # 3. Volunteer B cannot accept task assigned to Volunteer A
    b_accept = vol_b.post(f"/api/v1/tasks/{task_id}/accept")
    assert b_accept.status_code == 403

    # 4. Volunteer cannot verify or cancel
    vol_verify = vol_a.post(f"/api/v1/tasks/{task_id}/verify")
    assert vol_verify.status_code == 403

    vol_cancel = vol_a.post(f"/api/v1/tasks/{task_id}/cancel")
    assert vol_cancel.status_code == 403


def test_feedback_restricted_to_task_creator(comm_1, comm_2, admin, vol_a) -> None:
    """Verify feedback can only be submitted by the user who created the task."""
    # User 1 creates task
    task_res = comm_1.post("/api/v1/tasks", json={"title": "Elderly Grocery Help", "description": "desc", "category": "food", "priority": "low"})
    task_id = task_res.json()["id"]

    # Run to verified
    admin.post(f"/api/v1/tasks/{task_id}/assign", json={"volunteer_id": USER_VOLUNTEER_A.id})
    vol_a.post(f"/api/v1/tasks/{task_id}/accept")
    vol_a.post(f"/api/v1/tasks/{task_id}/start")
    vol_a.post(f"/api/v1/tasks/{task_id}/completion", json={"note": "Groceries delivered", "evidence_urls": []})
    admin.post(f"/api/v1/tasks/{task_id}/verify")

    # User 2 tries to submit feedback -> 403
    fb_res_2 = comm_2.post(f"/api/v1/tasks/{task_id}/feedback", json={"rating": 5, "comment": "Not my task"})
    assert fb_res_2.status_code == 403
    assert "only submit feedback for tasks you created" in fb_res_2.json()["error"]["message"].lower()

    # User 1 submits feedback -> 201
    fb_res_1 = comm_1.post(f"/api/v1/tasks/{task_id}/feedback", json={"rating": 5, "comment": "My task, excellent!"})
    assert fb_res_1.status_code == 201

    # User 1 tries to submit duplicate feedback -> 422
    dup_fb = comm_1.post(f"/api/v1/tasks/{task_id}/feedback", json={"rating": 4})
    assert dup_fb.status_code == 422


# --------------------------------------------------------------------------
# 5. Invalid Status Transitions
# --------------------------------------------------------------------------

def test_illegal_status_transitions_rejected(comm_1, admin, vol_a) -> None:
    """Verify invalid task transitions fail with 400 INVALID_STATUS_TRANSITION."""
    task_res = comm_1.post("/api/v1/tasks", json={"title": "Illegal Transition Test", "description": "desc", "category": "food", "priority": "low"})
    task_id = task_res.json()["id"]

    # 1. Attempting to accept directly while status is pending
    illegal_accept = vol_a.post(f"/api/v1/tasks/{task_id}/accept")
    assert illegal_accept.status_code == 403  # not assigned

    admin.post(f"/api/v1/tasks/{task_id}/assign", json={"volunteer_id": USER_VOLUNTEER_A.id})

    # 2. Attempting to start before accepting
    illegal_start = vol_a.post(f"/api/v1/tasks/{task_id}/start")
    assert illegal_start.status_code == 400
    assert illegal_start.json()["error"]["code"] == "INVALID_STATUS_TRANSITION"

    # 3. Attempting to verify before completion is submitted
    vol_a.post(f"/api/v1/tasks/{task_id}/accept")
    vol_a.post(f"/api/v1/tasks/{task_id}/start")

    illegal_verify = admin.post(f"/api/v1/tasks/{task_id}/verify")
    assert illegal_verify.status_code == 400
    assert illegal_verify.json()["error"]["code"] == "INVALID_STATUS_TRANSITION"

    # 4. Attempting feedback before verified
    illegal_fb = comm_1.post(f"/api/v1/tasks/{task_id}/feedback", json={"rating": 5})
    assert illegal_fb.status_code == 400
    assert illegal_fb.json()["error"]["code"] == "INVALID_STATUS_TRANSITION"


# --------------------------------------------------------------------------
# 6. Admin PATCH & Protected Fields Validation
# --------------------------------------------------------------------------

def test_admin_patch_editable_fields_and_forbids_protected_fields(comm_1, admin) -> None:
    """Verify admin can update editable fields, but cannot modify status/assignee through PATCH."""
    task_res = comm_1.post("/api/v1/tasks", json={"title": "Old Title", "description": "desc", "category": "food", "priority": "low"})
    task_id = task_res.json()["id"]

    # Admin updates allowed fields
    patch_res = admin.patch(
        f"/api/v1/tasks/{task_id}",
        json={"title": "New Updated Title", "location": "New Location", "priority": "high"},
    )
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["title"] == "New Updated Title"
    assert updated["location"] == "New Location"
    assert updated["priority"] == "high"

    # Attempting to tamper with status via PATCH -> 422
    tamper_status = admin.patch(f"/api/v1/tasks/{task_id}", json={"status": "verified"})
    assert tamper_status.status_code == 422

    # Attempting to tamper with assigned_to via PATCH -> 422
    tamper_assign = admin.patch(f"/api/v1/tasks/{task_id}", json={"assigned_to": "hacked-user"})
    assert tamper_assign.status_code == 422


# --------------------------------------------------------------------------
# 7. Role-Scoped Task Listing & Single Task Access
# --------------------------------------------------------------------------

def test_list_tasks_scoped_by_caller_role(comm_1, comm_2, admin, vol_a) -> None:
    """Verify GET /api/v1/tasks scopes tasks appropriately by caller role."""
    # User 1 creates Task 1
    t1 = comm_1.post("/api/v1/tasks", json={"title": "Task 1 by User 1", "description": "d1", "category": "education", "priority": "low"}).json()
    # User 2 creates Task 2
    t2 = comm_2.post("/api/v1/tasks", json={"title": "Task 2 by User 2", "description": "d2", "category": "medical", "priority": "high"}).json()

    # Admin assigns Task 1 to Volunteer A
    admin.post(f"/api/v1/tasks/{t1['id']}/assign", json={"volunteer_id": USER_VOLUNTEER_A.id})

    # Admin sees both tasks
    admin_list = admin.get("/api/v1/tasks").json()
    assert len(admin_list) == 2

    # Community 1 sees only Task 1
    comm_1_list = comm_1.get("/api/v1/tasks").json()
    assert len(comm_1_list) == 1
    assert comm_1_list[0]["id"] == t1["id"]

    # Community 2 sees only Task 2
    comm_2_list = comm_2.get("/api/v1/tasks").json()
    assert len(comm_2_list) == 1
    assert comm_2_list[0]["id"] == t2["id"]

    # Volunteer A sees only assigned Task 1
    vol_list = vol_a.get("/api/v1/tasks").json()
    assert len(vol_list) == 1
    assert vol_list[0]["id"] == t1["id"]


def test_get_single_task_permission_scoping(comm_1, comm_2, vol_a, admin) -> None:
    """Verify GET /api/v1/tasks/{task_id} permissions:
    Creator, assignee, and admin can view; unrelated users receive 403.
    """
    t1 = comm_1.post("/api/v1/tasks", json={"title": "Private Community Request", "description": "desc", "category": "food", "priority": "low"}).json()
    task_id = t1["id"]

    # Creator can view
    assert comm_1.get(f"/api/v1/tasks/{task_id}").status_code == 200

    # Admin can view
    assert admin.get(f"/api/v1/tasks/{task_id}").status_code == 200

    # Unassigned Volunteer A cannot view -> 403
    assert vol_a.get(f"/api/v1/tasks/{task_id}").status_code == 403

    # Other Community user cannot view -> 403
    assert comm_2.get(f"/api/v1/tasks/{task_id}").status_code == 403

    # Non-existent task returns 404
    assert admin.get("/api/v1/tasks/99999").status_code == 404
