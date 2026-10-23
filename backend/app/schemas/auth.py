"""
Authentication schemas for Firebase token verification.
"""
from typing import Any
from pydantic import BaseModel, Field


class VerifiedIdentity(BaseModel):
    """
    Decoded and verified identity resulting from a validated Firebase ID token.
    Never contains client-supplied roles; roles must be loaded from local database.
    """
    uid: str = Field(..., description="Firebase unique user identifier")
    email: str | None = Field(default=None, description="User email from Firebase token")
    display_name: str | None = Field(default=None, description="User display name from Firebase token")
    email_verified: bool = Field(default=False, description="Whether email is verified in Firebase")
    token_claims: dict[str, Any] = Field(default_factory=dict, description="Raw claims from token payload")
