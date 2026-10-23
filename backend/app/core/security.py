"""Authentication and role-based authorization dependencies."""

import logging
from typing import Callable, List
from fastapi import Depends, Header
from sqlalchemy.orm import Session
from app.config import Settings, get_settings
from app.core.exceptions import ForbiddenException, UnauthorizedException

from app.db.session import get_db
from app.schemas.common import UserRole
from app.schemas.user import UserProfile
from app.services import auth_service

logger = logging.getLogger(__name__)


def extract_bearer_token(authorization: str | None = Header(default=None, alias="Authorization")) -> str:
    """Extract and validate Bearer token from the Authorization header.
    Never logs the token value.
    """
    if not authorization or not authorization.strip():
        raise UnauthorizedException("Authentication credentials were not provided.")

    parts = authorization.strip().split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise UnauthorizedException("Invalid authorization scheme. Expected 'Bearer <token>'.")

    token = parts[1].strip()
    if not token:
        raise UnauthorizedException("Bearer token cannot be empty.")

    return token


def get_current_user(
    token: str = Depends(extract_bearer_token),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> UserProfile:
    """Authenticates the request by verifying the Firebase ID token and loading the local user profile.

    Enforces:
    1. Token must be validly signed and unexpired.
    2. User profile must exist in local database.
    3. Dev auth override is strictly disabled in production.
    """
    # Fail closed: development auth override is strictly forbidden in production
    if settings.enable_dev_auth_override:
        if settings.app_env == "production":
            logger.critical("SECURITY ALERT: enable_dev_auth_override active in production! Failing closed.")
            raise UnauthorizedException("Authentication override is strictly forbidden in production.")


    # Verify Firebase token via agreed Member 3 interface
    identity = auth_service.verify_firebase_token(token)

    # Load local profile via agreed Member 3 interface
    profile = auth_service.get_current_user_profile(identity.uid, db)
    if profile is None:
        # User is authenticated with Firebase but has no local profile in SQLite
        raise UnauthorizedException("User profile not found. Please contact an administrator.")

    return profile


def require_role(*allowed_roles: UserRole) -> Callable[[UserProfile], UserProfile]:
    """Reusable FastAPI dependency factory for role-based authorization.
    Verifies that the caller's authoritative local role is in allowed_roles.
    """
    def role_verifier(current_user: UserProfile = Depends(get_current_user)) -> UserProfile:
        if current_user.role not in allowed_roles:
            raise ForbiddenException(
                f"Role '{current_user.role.value}' is not authorized to perform this action."
            )
        return current_user

    return role_verifier
