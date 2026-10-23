"""
FastAPI Authentication & Role-Based Authorization Dependencies.
Follows 00_READ_FIRST_AND_SHARED_CONTRACT.md and 03_MEMBER_3_DATABASE_AUTH_ASSIGNMENT.md.
"""
from typing import Callable
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.auth.firebase import verify_firebase_token
from app.db.database import SessionLocal
from app.db.session import get_db
from app.models.user import UserProfile
from app.schemas.auth import VerifiedIdentity
from app.schemas.enums import UserRole

# HTTP Bearer scheme for Authorization: Bearer <firebase_id_token>
security = HTTPBearer(auto_error=False)


def get_current_user_profile(uid: str, db: Session | None = None) -> UserProfile | None:
    """
    Retrieves the local UserProfile from the database by Firebase UID.
    Signature required by shared contract:
    get_current_user_profile(uid: str) -> UserProfile | None
    """
    if not uid:
        return None

    if db is not None:
        return db.query(UserProfile).filter(UserProfile.id == uid).first()

    with SessionLocal() as session:
        return session.query(UserProfile).filter(UserProfile.id == uid).first()


def get_verified_identity(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> VerifiedIdentity:
    """
    FastAPI dependency that extracts and validates the Bearer token.
    Returns VerifiedIdentity containing verified Firebase UID.
    """
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "Authorization header missing or invalid format. Expected 'Bearer <token>'.",
                    "details": [],
                }
            },
        )
    return verify_firebase_token(credentials.credentials)


def get_current_user(
    identity: VerifiedIdentity = Depends(get_verified_identity),
    db: Session = Depends(get_db),
) -> UserProfile:
    """
    FastAPI dependency that resolves the authenticated user profile.
    Never trusts client-supplied roles; loads role exclusively from local database.
    """
    user_profile = get_current_user_profile(identity.uid, db=db)
    if user_profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": {
                    "code": "NOT_FOUND",
                    "message": f"User profile for UID '{identity.uid}' is not registered in the local database.",
                    "details": [],
                }
            },
        )
    return user_profile


def require_role(*allowed_roles: str | UserRole) -> Callable[[UserProfile], UserProfile]:
    """
    Dependency factory to enforce role-based access control (RBAC).
    Raises HTTP 403 Forbidden if current_user's role is not within allowed_roles.
    """
    # Normalize roles to string values
    role_values = {r.value if isinstance(r, UserRole) else str(r) for r in allowed_roles}

    def role_checker(current_user: UserProfile = Depends(get_current_user)) -> UserProfile:
        user_role = str(current_user.role).lower()
        if user_role not in role_values:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": {
                        "code": "FORBIDDEN",
                        "message": f"Access forbidden: role '{user_role}' lacks required permissions ({', '.join(sorted(role_values))}).",
                        "details": [],
                    }
                },
            )
        return current_user

    return role_checker


# Convenient role dependency shortcuts for routes
require_admin = require_role(UserRole.ADMIN)
require_volunteer = require_role(UserRole.VOLUNTEER)
require_community = require_role(UserRole.COMMUNITY)
require_admin_or_volunteer = require_role(UserRole.ADMIN, UserRole.VOLUNTEER)
require_any_authenticated = require_role(UserRole.ADMIN, UserRole.VOLUNTEER, UserRole.COMMUNITY)
