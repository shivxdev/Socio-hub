"""Tests for POST /api/v1/ai/analyze endpoint."""

from typing import Dict
import pytest
from fastapi import Header
from fastapi.testclient import TestClient
from app.core.exceptions import AIServiceException, UnauthorizedException
from app.core.security import get_current_user
from app.main import create_app
from app.schemas.ai import AIAnalysisResult
from app.schemas.common import Priority, TaskCategory, UserRole
from app.schemas.user import UserProfile
from app.services import ai_service

COMMUNITY_USER = UserProfile(
    id="uid-comm-ai",
    display_name="AI Community",
    email="comm@village.org",
    role=UserRole.COMMUNITY,
    skills=[],
    service_locations=[],
    is_available=True,
    active_task_count=0,
)

ADMIN_USER = UserProfile(
    id="uid-admin-ai",
    display_name="AI Admin",
    email="admin@ngo.org",
    role=UserRole.ADMIN,
    skills=[],
    service_locations=[],
    is_available=True,
    active_task_count=0,
)

VOLUNTEER_USER = UserProfile(
    id="uid-vol-ai",
    display_name="AI Volunteer",
    email="vol@helpers.org",
    role=UserRole.VOLUNTEER,
    skills=[],
    service_locations=[],
    is_available=True,
    active_task_count=0,
)

USER_MAP: Dict[str, UserProfile] = {
    "community": COMMUNITY_USER,
    "admin": ADMIN_USER,
    "volunteer": VOLUNTEER_USER,
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
def test_app():
    app = create_app()
    app.dependency_overrides[get_current_user] = resolve_auth_user
    return app


@pytest.fixture
def client(test_app):
    with TestClient(test_app) as c:
        yield c


MOCK_AI_RESULT = AIAnalysisResult(
    summary="A community primary school requires textbook assistance and supplies.",
    category=TaskCategory.EDUCATION,
    suggested_priority=Priority.MEDIUM,
    skills_required=["teaching", "community coordination"],
    resources_required=["textbooks", "notebooks", "pencils"],
    missing_information=["student count", "preferred textbook publisher"],
)


def test_ai_analyze_success_with_mock_provider(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify POST /api/v1/ai/analyze succeeds for community user with valid mock analysis."""
    def _mock_analyze(description: str, image_base64=None, image_mime_type=None) -> AIAnalysisResult:
        assert "school" in description.lower()
        return MOCK_AI_RESULT

    monkeypatch.setattr(ai_service, "analyze_community_problem", _mock_analyze)

    payload = {"description": "Our village school needs new books and supplies."}
    response = client.post("/api/v1/ai/analyze", json=payload, headers={"Authorization": "Bearer community"})

    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "education"
    assert data["suggested_priority"] == "medium"
    assert "textbooks" in data["resources_required"]
    assert "student count" in data["missing_information"]


def test_ai_analyze_allowed_for_admin(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify admin role is also permitted to analyze problems."""
    monkeypatch.setattr(ai_service, "analyze_community_problem", lambda *args, **kwargs: MOCK_AI_RESULT)

    payload = {"description": "Flood damage on local bridge."}
    response = client.post("/api/v1/ai/analyze", json=payload, headers={"Authorization": "Bearer admin"})
    assert response.status_code == 200


def test_ai_analyze_forbidden_for_volunteers(client: TestClient) -> None:
    """Verify volunteer role is rejected with 403 FORBIDDEN."""
    payload = {"description": "Some problem description."}
    response = client.post("/api/v1/ai/analyze", json=payload, headers={"Authorization": "Bearer volunteer"})
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"


def test_ai_analyze_unauthenticated_rejected(client: TestClient) -> None:
    """Verify unauthenticated calls return 401 UNAUTHORIZED."""
    payload = {"description": "Some problem."}
    response = client.post("/api/v1/ai/analyze", json=payload)
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


def test_ai_analyze_empty_description_rejected(client: TestClient) -> None:
    """Verify empty description fails validation with 422 VALIDATION_ERROR."""
    payload = {"description": ""}
    response = client.post("/api/v1/ai/analyze", json=payload, headers={"Authorization": "Bearer community"})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_ai_analyze_unsupported_image_mime_rejected(client: TestClient) -> None:
    """Verify unsupported image MIME type fails with 422 VALIDATION_ERROR."""
    payload = {
        "description": "Damaged road",
        "image_base64": "aGVsbG8=",
        "image_mime_type": "image/gif",  # Unsupported format
    }
    response = client.post("/api/v1/ai/analyze", json=payload, headers={"Authorization": "Bearer community"})
    assert response.status_code == 422
    assert "unsupported" in response.json()["error"]["message"].lower()


def test_ai_analyze_provider_failure_returns_502(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify external Gemini API failure or timeout maps cleanly to 502 AI_SERVICE_ERROR."""
    def _mock_failure(*args, **kwargs):
        raise AIServiceException("Gemini API connection timed out after 15 seconds.")

    monkeypatch.setattr(ai_service, "analyze_community_problem", _mock_failure)

    payload = {"description": "Village needs emergency electricity generator."}
    response = client.post("/api/v1/ai/analyze", json=payload, headers={"Authorization": "Bearer community"})

    assert response.status_code == 502
    data = response.json()
    assert data["error"]["code"] == "AI_SERVICE_ERROR"
    assert "timed out" in data["error"]["message"]
