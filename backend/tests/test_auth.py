"""
Tests for Firebase Authentication, Token Verification, Profile Lookup, and RBAC.
"""
import os
from pathlib import Path
import sys
import unittest
from unittest.mock import MagicMock, patch

from fastapi import HTTPException
from firebase_admin import auth as firebase_auth
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.auth.dependencies import (
    get_current_user,
    get_current_user_profile,
    require_admin,
    require_community,
    require_role,
    require_volunteer,
)
from app.auth.firebase import init_firebase, is_dev_mock_auth_allowed, verify_firebase_token
from app.db.database import Base
from app.models.user import UserProfile
from app.schemas.auth import VerifiedIdentity
from app.schemas.enums import UserRole


class TestAuthAndRBAC(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:", echo=False)
        self.TestSession = sessionmaker(bind=self.engine)
        Base.metadata.create_all(bind=self.engine)
        self.session = self.TestSession()

        # Seed test users
        self.community_user = UserProfile(
            id="uid_comm_1",
            display_name="Comm User",
            email="comm@example.com",
            role=UserRole.COMMUNITY.value,
        )
        self.volunteer_user = UserProfile(
            id="uid_vol_1",
            display_name="Vol User",
            email="vol@example.com",
            role=UserRole.VOLUNTEER.value,
            skills=["cooking"],
            service_locations=["East Side"],
        )
        self.admin_user = UserProfile(
            id="uid_admin_1",
            display_name="Admin User",
            email="admin@example.com",
            role=UserRole.ADMIN.value,
        )
        self.session.add_all([self.community_user, self.volunteer_user, self.admin_user])
        self.session.commit()

    def tearDown(self):
        self.session.close()
        Base.metadata.drop_all(bind=self.engine)

    # 1. Valid token verification using mocked Firebase Admin
    @patch("app.auth.firebase.firebase_auth.verify_id_token")
    @patch("app.auth.firebase.init_firebase")
    def test_verify_valid_token(self, mock_init, mock_verify):
        mock_init.return_value = MagicMock()
        mock_verify.return_value = {
            "uid": "uid_vol_1",
            "email": "vol@example.com",
            "name": "Vol User",
            "email_verified": True,
        }

        identity = verify_firebase_token("Bearer valid_test_token_123")
        self.assertIsInstance(identity, VerifiedIdentity)
        self.assertEqual(identity.uid, "uid_vol_1")
        self.assertEqual(identity.email, "vol@example.com")
        self.assertTrue(identity.email_verified)

    # 2. Expired token handling
    @patch("app.auth.firebase.firebase_auth.verify_id_token")
    @patch("app.auth.firebase.init_firebase")
    def test_verify_expired_token(self, mock_init, mock_verify):
        mock_init.return_value = MagicMock()
        mock_verify.side_effect = firebase_auth.ExpiredIdTokenError("Token expired", "detail")

        with self.assertRaises(HTTPException) as ctx:
            verify_firebase_token("Bearer expired_token")
        self.assertEqual(ctx.exception.status_code, 401)
        self.assertEqual(ctx.exception.detail["error"]["code"], "UNAUTHORIZED")

    # 3. Revoked token handling
    @patch("app.auth.firebase.firebase_auth.verify_id_token")
    @patch("app.auth.firebase.init_firebase")
    def test_verify_revoked_token(self, mock_init, mock_verify):
        mock_init.return_value = MagicMock()
        mock_verify.side_effect = firebase_auth.RevokedIdTokenError("Token revoked")

        with self.assertRaises(HTTPException) as ctx:
            verify_firebase_token("Bearer revoked_token")
        self.assertEqual(ctx.exception.status_code, 401)
        self.assertEqual(ctx.exception.detail["error"]["code"], "UNAUTHORIZED")

    # 4. Invalid or empty tokens
    def test_invalid_and_empty_tokens(self):
        for invalid_token in ["", "   ", None, "Bearer "]:
            with self.assertRaises(HTTPException) as ctx:
                verify_firebase_token(invalid_token)
            self.assertEqual(ctx.exception.status_code, 401)

    # 5. Opt-in Dev Mock Auth: Works when explicitly enabled in dev/test, rejected in prod
    def test_dev_mock_auth_flag_behavior(self):
        # Case A: Dev mock enabled
        with patch.dict(os.environ, {"ALLOW_DEV_MOCK_AUTH": "true", "APP_ENV": "development"}):
            self.assertTrue(is_dev_mock_auth_allowed())
            identity = verify_firebase_token("mock:test_volunteer_99")
            self.assertEqual(identity.uid, "test_volunteer_99")

        # Case B: Dev mock disabled (default)
        with patch.dict(os.environ, {"ALLOW_DEV_MOCK_AUTH": "false", "APP_ENV": "development"}):
            self.assertFalse(is_dev_mock_auth_allowed())

        # Case C: Production environment rejects mock even if flag is mistakenly true
        with patch.dict(os.environ, {"ALLOW_DEV_MOCK_AUTH": "true", "APP_ENV": "production"}):
            self.assertFalse(is_dev_mock_auth_allowed())

    # 6. Profile lookup in database
    def test_get_current_user_profile(self):
        profile = get_current_user_profile("uid_vol_1", db=self.session)
        self.assertIsNotNone(profile)
        self.assertEqual(profile.display_name, "Vol User")
        self.assertEqual(profile.role, UserRole.VOLUNTEER.value)

        non_existent = get_current_user_profile("non_existent_uid", db=self.session)
        self.assertIsNone(non_existent)

    # 7. Unregistered user raises 404
    def test_get_current_user_unregistered_profile(self):
        unregistered_identity = VerifiedIdentity(uid="unknown_uid_999")
        with self.assertRaises(HTTPException) as ctx:
            get_current_user(identity=unregistered_identity, db=self.session)
        self.assertEqual(ctx.exception.status_code, 404)
        self.assertEqual(ctx.exception.detail["error"]["code"], "NOT_FOUND")

    # 8. Role-Based Access Control (RBAC) enforcement
    def test_require_role_boundaries(self):
        admin_guard = require_admin
        vol_guard = require_volunteer
        comm_guard = require_community

        # Admin user passes admin guard
        self.assertEqual(admin_guard(self.admin_user).id, self.admin_user.id)

        # Community user fails admin guard (403 Forbidden)
        with self.assertRaises(HTTPException) as ctx:
            admin_guard(self.community_user)
        self.assertEqual(ctx.exception.status_code, 403)
        self.assertEqual(ctx.exception.detail["error"]["code"], "FORBIDDEN")

        # Volunteer user passes volunteer guard
        self.assertEqual(vol_guard(self.volunteer_user).id, self.volunteer_user.id)

        # Volunteer fails community guard
        with self.assertRaises(HTTPException) as ctx:
            comm_guard(self.volunteer_user)
        self.assertEqual(ctx.exception.status_code, 403)
        self.assertEqual(ctx.exception.detail["error"]["code"], "FORBIDDEN")


if __name__ == "__main__":
    unittest.main()
