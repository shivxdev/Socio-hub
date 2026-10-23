"""
Firebase Authentication Integration and Token Verification.
Follows 00_READ_FIRST_AND_SHARED_CONTRACT.md and 03_MEMBER_3_DATABASE_AUTH_ASSIGNMENT.md.
"""
import json
import os
from pathlib import Path
from typing import Any
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
from fastapi import HTTPException, status
from app.schemas.auth import VerifiedIdentity

_firebase_app: firebase_admin.App | None = None


def init_firebase() -> firebase_admin.App | None:
    """
    Initializes the Firebase Admin SDK if not already initialized.
    Sources credentials safely from environment variables:
    1. FIREBASE_CREDENTIALS_PATH (path to service account JSON file)
    2. FIREBASE_SERVICE_ACCOUNT_JSON (raw JSON string)
    3. Default application credentials (Google Cloud environment)
    """
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    if firebase_admin._apps:
        _firebase_app = firebase_admin.get_app()
        return _firebase_app

    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
    cred_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    project_id = os.getenv("FIREBASE_PROJECT_ID")

    cred = None
    if cred_path and Path(cred_path).exists():
        cred = credentials.Certificate(cred_path)
    elif cred_json:
        try:
            cert_dict = json.loads(cred_json)
            cred = credentials.Certificate(cert_dict)
        except Exception as e:
            raise RuntimeError(f"Invalid FIREBASE_SERVICE_ACCOUNT_JSON: {e}")

    options = {}
    if project_id:
        options["projectId"] = project_id

    try:
        if cred:
            _firebase_app = firebase_admin.initialize_app(cred, options=options if options else None)
        else:
            # Attempt default application credentials
            _firebase_app = firebase_admin.initialize_app(options=options if options else None)
        return _firebase_app
    except Exception:
        # If Firebase cannot be initialized (e.g. offline dev or testing without credentials),
        # return None so mock dev auth can take over if explicitly permitted.
        return None


def is_dev_mock_auth_allowed() -> bool:
    """
    Returns True ONLY if mock authentication is explicitly enabled in a development/test environment.
    Strictly forbidden and disabled in production.
    """
    allow_mock = os.getenv("ALLOW_DEV_MOCK_AUTH", "false").lower() == "true"
    env = os.getenv("APP_ENV", "development").lower()
    return allow_mock and env in ("development", "test", "testing")


def verify_firebase_token(id_token: str) -> VerifiedIdentity:
    """
    Verifies a Firebase ID token and extracts the authenticated UID and identity.
    Signature required by shared contract:
    verify_firebase_token(id_token: str) -> VerifiedIdentity

    Handles expired, malformed, revoked tokens and maps them to HTTP 401 exceptions.
    Never trusts client-supplied roles.
    """
    if not id_token or not isinstance(id_token, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "Missing or invalid authorization token format.",
                    "details": [],
                }
            },
        )

    clean_token = id_token.strip()
    if clean_token.startswith("Bearer "):
        clean_token = clean_token[7:].strip()

    if not clean_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "Empty authorization token.",
                    "details": [],
                }
            },
        )

    # Explicit Opt-in Dev Mock Auth Check
    if is_dev_mock_auth_allowed() and (clean_token.startswith("mock:") or clean_token.startswith("dev-mock:")):
        parts = clean_token.split(":")
        mock_uid = parts[1] if len(parts) > 1 and parts[1] else "mock-user-123"
        mock_email = f"{mock_uid}@example.com"
        return VerifiedIdentity(
            uid=mock_uid,
            email=mock_email,
            display_name=f"Mock User ({mock_uid})",
            email_verified=True,
            token_claims={"mock": True, "uid": mock_uid},
        )

    # Initialize Firebase if needed
    app = init_firebase()
    if app is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Firebase Authentication service is not configured on the server.",
                    "details": [],
                }
            },
        )

    try:
        decoded_token = firebase_auth.verify_id_token(clean_token, check_revoked=True)
        uid = decoded_token.get("uid") or decoded_token.get("sub")
        if not uid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "error": {
                        "code": "UNAUTHORIZED",
                        "message": "Token does not contain a valid user identifier.",
                        "details": [],
                    }
                },
            )
        return VerifiedIdentity(
            uid=uid,
            email=decoded_token.get("email"),
            display_name=decoded_token.get("name"),
            email_verified=bool(decoded_token.get("email_verified", False)),
            token_claims=decoded_token,
        )
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "Firebase ID token has expired. Please refresh your session.",
                    "details": [],
                }
            },
        )
    except firebase_auth.RevokedIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "Firebase ID token has been revoked.",
                    "details": [],
                }
            },
        )
    except (firebase_auth.InvalidIdTokenError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": f"Invalid Firebase ID token: {str(e)}",
                    "details": [],
                }
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": f"Authentication failed: {str(e)}",
                    "details": [],
                }
            },
        )
