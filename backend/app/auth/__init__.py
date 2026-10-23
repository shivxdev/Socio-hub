"""
Authentication package for Socio-hub NGO Community Solution.
"""
from app.auth.firebase import init_firebase, verify_firebase_token, is_dev_mock_auth_allowed
from app.auth.dependencies import (
    get_current_user_profile,
    get_current_user,
    get_verified_identity,
    require_role,
    require_admin,
    require_volunteer,
    require_community,
    require_admin_or_volunteer,
    require_any_authenticated,
)

__all__ = [
    "init_firebase",
    "verify_firebase_token",
    "is_dev_mock_auth_allowed",
    "get_current_user_profile",
    "get_current_user",
    "get_verified_identity",
    "require_role",
    "require_admin",
    "require_volunteer",
    "require_community",
    "require_admin_or_volunteer",
    "require_any_authenticated",
]
