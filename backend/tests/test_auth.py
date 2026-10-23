"""Tests for authentication, authorization dependencies, and user endpoints."""

import pytest
from fastapi import Depends
from fastapi.testclient import TestClient
from app.config import get_settings, Settings
from app.core.security import get_current_user, require_role
from app.main import create_app
from app.schemas.common import UserRole
from app.schemas.user import UserProfile, VerifiedIdentity
from app.services import auth_service


# Test User Fixtures
MOCK_VOLUNTEER = UserProfile(
    id="firebase-uid-volunteer",
    display_name="Volunteer Val",
    email="val@example.org",
    role=UserRole.VOLUNTEER,
    skills=["first aid", "logistics"],
    service_locations=["District 1"],
    is_available=True,
    active_task_count=1,
)

MOCK_ADMIN = UserProfile(
    id="firebase-uid-admin",
    display_name="Admin Alice",
    email="alice@ngo.org",
    role=UserRole.ADMIN,
    skills=[],
    service_locations=[],
    is_available=True,
    active_task_count=0,
)

MOCK_COMMUNITY = UserProfile(
    id="firebase-uid-community",
    display_name="Community Charlie",
    email="charlie@village.org",
    role=UserRole.COMMUNITY,
    skills=[],
    service_locations=[],
    is_available=True,
    active_task_count=0,
)


def test_missing_authorization_header_returns_401(client: TestClient) -> None:
    """Verify request with missing Authorization header returns 401 UNAUTHORIZED."""
    response = client.get("/api/v1/users/me")
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"
    assert "credentials were not provided" in data["error"]["message"].lower()


@pytest.mark.parametrize(
    "invalid_header",
    [
        "Basic dXNlcjpwYXNz",
        "Token xyz123",
        "Bearer",
        "Bearer   ",
        "NotBearer token123",
    ],
)
def test_malformed_bearer_header_returns_401(client: TestClient, invalid_header: str) -> None:
    """Verify malformed authorization headers return 401 UNAUTHORIZED in standard envelope."""
    response = client.get("/api/v1/users/me", headers={"Authorization": invalid_header})
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"


def test_invalid_or_expired_token_returns_401(monkeypatch: pytest.MonkeyPatch, client: TestClient) -> None:
    """Verify an invalid or rejected token raises 401 UNAUTHORIZED."""
    def _mock_verify_reject(id_token: str) -> VerifiedIdentity:
        from app.core.exceptions import UnauthorizedException
        raise UnauthorizedException("Invalid or expired authentication token.")

    monkeypatch.setattr(auth_service, "verify_firebase_token", _mock_verify_reject)

    response = client.get("/api/v1/users/me", headers={"Authorization": "Bearer invalid-token-xyz"})
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"
    assert "invalid or expired" in data["error"]["message"].lower()


def test_valid_token_with_no_local_profile_returns_401(monkeypatch: pytest.MonkeyPatch, client: TestClient) -> None:
    """Verify an authenticated user with no local SQLite profile returns 401 without granting access."""
    def _mock_verify_success(id_token: str) -> VerifiedIdentity:
        return VerifiedIdentity(uid="orphan-firebase-uid", email="orphan@example.com")

    def _mock_profile_none(uid: str, db) -> UserProfile | None:
        return None

    monkeypatch.setattr(auth_service, "verify_firebase_token", _mock_verify_success)
    monkeypatch.setattr(auth_service, "get_current_user_profile", _mock_profile_none)

    response = client.get("/api/v1/users/me", headers={"Authorization": "Bearer valid-firebase-token"})
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"
    assert "user profile not found" in data["error"]["message"].lower()


def test_successful_get_my_profile(monkeypatch: pytest.MonkeyPatch, client: TestClient) -> None:
    """Verify authenticated user receives their exact profile matching shared contract."""
    def _mock_verify_success(id_token: str) -> VerifiedIdentity:
        return VerifiedIdentity(uid="firebase-uid-volunteer", email="val@example.org")

    def _mock_profile_success(uid: str, db) -> UserProfile | None:
        return MOCK_VOLUNTEER

    monkeypatch.setattr(auth_service, "verify_firebase_token", _mock_verify_success)
    monkeypatch.setattr(auth_service, "get_current_user_profile", _mock_profile_success)

    response = client.get("/api/v1/users/me", headers={"Authorization": "Bearer valid-token"})
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "firebase-uid-volunteer"
    assert data["display_name"] == "Volunteer Val"
    assert data["email"] == "val@example.org"
    assert data["role"] == "volunteer"
    assert data["skills"] == ["first aid", "logistics"]
    assert data["service_locations"] == ["District 1"]
    assert data["is_available"] is True
    assert data["active_task_count"] == 1


def test_require_role_forbids_unauthorized_user(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify require_role returns 403 FORBIDDEN when user's authoritative role is not allowed."""
    app = create_app()

    @app.get("/api/v1/admin-only")
    def _admin_endpoint(user: UserProfile = Depends(require_role(UserRole.ADMIN))):
        return {"access": "granted"}

    # Mock user as volunteer
    def _mock_verify(id_token: str) -> VerifiedIdentity:
        return VerifiedIdentity(uid=MOCK_VOLUNTEER.id)

    def _mock_profile(uid: str, db) -> UserProfile | None:
        return MOCK_VOLUNTEER

    monkeypatch.setattr(auth_service, "verify_firebase_token", _mock_verify)
    monkeypatch.setattr(auth_service, "get_current_user_profile", _mock_profile)

    with TestClient(app) as local_client:
        response = local_client.get("/api/v1/admin-only", headers={"Authorization": "Bearer volunteer-token"})
        assert response.status_code == 403
        data = response.json()
        assert data["error"]["code"] == "FORBIDDEN"
        assert "not authorized" in data["error"]["message"].lower()


def test_require_role_permits_authorized_user(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify require_role grants access when user has one of the allowed roles."""
    app = create_app()

    @app.get("/api/v1/admin-action")
    def _admin_endpoint(user: UserProfile = Depends(require_role(UserRole.ADMIN))):
        return {"access": "granted", "caller": user.display_name}

    def _mock_verify(id_token: str) -> VerifiedIdentity:
        return VerifiedIdentity(uid=MOCK_ADMIN.id)

    def _mock_profile(uid: str, db) -> UserProfile | None:
        return MOCK_ADMIN

    monkeypatch.setattr(auth_service, "verify_firebase_token", _mock_verify)
    monkeypatch.setattr(auth_service, "get_current_user_profile", _mock_profile)

    with TestClient(app) as local_client:
        response = local_client.get("/api/v1/admin-action", headers={"Authorization": "Bearer admin-token"})
        assert response.status_code == 200
        assert response.json()["access"] == "granted"
        assert response.json()["caller"] == "Admin Alice"


def test_dev_auth_override_strictly_forbidden_in_production(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify dev auth override causes 401 fail-closed if app_env is production."""
    prod_settings = Settings(
        app_env="production",
        enable_dev_auth_override=True,  # Dangerous configuration in production
    )

    app = create_app()
    app.dependency_overrides[get_settings] = lambda: prod_settings

    with TestClient(app) as local_client:
        response = local_client.get("/api/v1/users/me", headers={"Authorization": "Bearer any-token"})
        assert response.status_code == 401
        data = response.json()
        assert data["error"]["code"] == "UNAUTHORIZED"
        assert "forbidden in production" in data["error"]["message"].lower()
