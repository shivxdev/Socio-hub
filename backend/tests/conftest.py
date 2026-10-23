"""Pytest fixtures for backend tests."""

import pytest
from fastapi.testclient import TestClient
from app.main import create_app
from app.config import get_settings, Settings


@pytest.fixture(scope="session")
def test_settings() -> Settings:
    """Fixture providing testing settings."""
    return Settings(
        app_env="test",
        debug=True,
        enable_dev_auth_override=False,
    )


@pytest.fixture(scope="module")
def client() -> TestClient:
    """Fixture providing a FastAPI TestClient."""
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client
