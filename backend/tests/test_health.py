"""Tests for root health check and foundational error formatting."""

from fastapi.testclient import TestClient


def test_root_health_check_returns_200_and_ok(client: TestClient) -> None:
    """Verify GET /health returns 200 OK with exact expected JSON payload."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"
    data = response.json()
    assert data == {"status": "ok"}


def test_standard_404_error_envelope(client: TestClient) -> None:
    """Verify non-existent route returns standard error JSON envelope."""
    response = client.get("/api/v1/unknown-endpoint")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "NOT_FOUND"
    assert isinstance(data["error"]["message"], str)
    assert isinstance(data["error"]["details"], list)


def test_cors_headers_for_allowed_origin(client: TestClient) -> None:
    """Verify CORS middleware responds with correct headers for allowed origin."""
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_custom_app_exception_formatting(client: TestClient) -> None:
    """Verify AppException returns custom status code and standard contract error structure."""
    from app.core.exceptions import AppException

    app = client.app

    @app.get("/api/v1/test-app-error")
    def _raise_app_error():
        raise AppException(
            status_code=400,
            code="INVALID_STATUS_TRANSITION",
            message="Cannot transition from verified to pending.",
            details=["Status is terminal"],
        )

    response = client.get("/api/v1/test-app-error")
    assert response.status_code == 400
    data = response.json()
    assert data == {
        "error": {
            "code": "INVALID_STATUS_TRANSITION",
            "message": "Cannot transition from verified to pending.",
            "details": ["Status is terminal"],
        }
    }


def test_validation_error_envelope_and_field_reporting(client: TestClient) -> None:
    """Verify 422 RequestValidationError formats correctly into standard contract shape."""
    from pydantic import BaseModel, Field

    class SamplePayload(BaseModel):
        title: str = Field(min_length=3)
        rating: int = Field(ge=1, le=5)

    app = client.app

    @app.post("/api/v1/test-validation")
    def _validate_payload(body: SamplePayload):
        return {"status": "valid"}

    # Send payload violating min_length and rating constraints
    response = client.post("/api/v1/test-validation", json={"title": "a", "rating": 10})
    assert response.status_code == 422
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert data["error"]["message"] == "The request contains invalid fields."
    assert len(data["error"]["details"]) == 2

    fields = {item["field"] for item in data["error"]["details"]}
    assert "title" in fields
    assert "rating" in fields


def test_unhandled_server_exception_does_not_leak_details() -> None:
    """Verify 500 internal errors do not leak internal tracebacks or exception messages."""
    from app.main import create_app

    test_app = create_app()

    @test_app.get("/api/v1/test-crash")
    def _crash_route():
        raise RuntimeError("Sensitive DB error: secret_key_12345")

    with TestClient(test_app, raise_server_exceptions=False) as no_raise_client:
        response = no_raise_client.get("/api/v1/test-crash", headers={"Accept": "application/json"})
        assert response.status_code == 500
        data = response.json()
        assert data["error"]["code"] == "INTERNAL_ERROR"
        assert data["error"]["message"] == "An unexpected internal server error occurred."
        assert data["error"]["details"] == []
        # Guarantee no leak of secret message
        assert "secret_key_12345" not in response.text



def test_api_v1_prefix_does_not_expose_misleading_routes(client: TestClient) -> None:
    """Confirm requesting unmapped /api/v1 base path cleanly returns 404 NOT_FOUND."""
    response = client.get("/api/v1")
    assert response.status_code == 404
    data = response.json()
    assert data["error"]["code"] == "NOT_FOUND"

    openapi_response = client.get("/openapi.json")
    assert openapi_response.status_code == 200
    paths = openapi_response.json()["paths"]
    assert "/health" in paths
    assert "/api/v1" not in paths


def test_cors_origins_config_parsing() -> None:
    """Verify Settings parses both comma-separated strings and JSON arrays for CORS origins."""
    from app.config import Settings

    # Comma-separated format
    s1 = Settings(cors_origins="http://example.com, https://test.org")  # type: ignore[arg-type]
    assert s1.cors_origins == ["http://example.com", "https://test.org"]

    # JSON array string format
    s2 = Settings(cors_origins='["http://alpha.com", "http://beta.com"]')  # type: ignore[arg-type]
    assert s2.cors_origins == ["http://alpha.com", "http://beta.com"]


