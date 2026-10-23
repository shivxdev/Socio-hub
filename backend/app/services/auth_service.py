"""Authentication service interfaces and token verification.
Agreed interface with Member 3 (Database & Auth).
"""

import logging
from typing import Any, Protocol
from sqlalchemy.orm import Session
from app.config import get_settings
from app.core.exceptions import UnauthorizedException
from app.schemas.user import UserProfile, VerifiedIdentity

logger = logging.getLogger(__name__)


class TokenVerifierProtocol(Protocol):
    """Protocol for Firebase token verification."""
    def verify(self, id_token: str) -> VerifiedIdentity:
        ...


class UserProfileProviderProtocol(Protocol):
    """Protocol for local user profile lookup."""
    def get_profile(self, uid: str, db: Session) -> UserProfile | None:
        ...


def verify_firebase_token(id_token: str) -> VerifiedIdentity:
    """Verifies a Firebase ID token using the Firebase Admin SDK.
    Agreed signature with Member 3.

    Raises UnauthorizedException on invalid, expired, or malformed tokens.
    Never logs or exposes the raw token in exceptions or error logs.
    """
    settings = get_settings()

    # Clean and check token structure
    token = id_token.strip()
    if not token or len(token) < 10:
        raise UnauthorizedException("Invalid or malformed authentication token.")

    # Firebase Admin SDK integration hook (Member 3 live integration)
    try:
        import firebase_admin
        from firebase_admin import auth

        # Verify decoded token with Firebase Admin
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token.get("uid")
        if not uid:
            raise UnauthorizedException("Token payload missing user identifier.")

        return VerifiedIdentity(
            uid=uid,
            email=decoded_token.get("email"),
            claims=decoded_token,
        )
    except ImportError:
        logger.debug("firebase_admin package not installed in environment.")
    except Exception as exc:
        logger.warning("Firebase token verification rejected: %s", type(exc).__name__)
        raise UnauthorizedException("Invalid or expired authentication token.")

    # Fallback when firebase_admin is not initialized/installed
    # In production, this must fail closed
    if settings.app_env == "production":
        logger.error("Firebase Admin SDK is required in production.")
        raise UnauthorizedException("Authentication service unavailable.")

    raise UnauthorizedException("Authentication service is not configured with Firebase credentials.")


def get_current_user_profile(uid: str, db: Session) -> UserProfile | None:
    """Retrieves local user profile by Firebase UID from SQLite.
    Agreed signature with Member 3.

    Returns None if user does not exist in local database.
    """
    # Member 3 will bind this to SQLAlchemy User model query:
    # return db.query(models.User).filter(models.User.id == uid).first()
    return None
