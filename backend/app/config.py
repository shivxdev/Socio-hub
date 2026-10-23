"""Application configuration settings."""

from functools import lru_cache
from typing import Any, List
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings read from environment variables or .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Core Application
    app_env: str = Field(default="development", description="Environment: development, test, production")
    app_name: str = Field(default="NGO Community Solution API")
    port: int = Field(default=8000)
    debug: bool = Field(default=False)
    cors_origins: List[str] = Field(
        default=["http://localhost:5173", "http://127.0.0.1:5173"],
        description="Allowed CORS origins for the frontend application",
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> List[str]:
        """Support both JSON arrays and comma-separated strings for CORS origins."""
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v


    # Database (Managed by Member 3)
    database_url: str = Field(
        default="sqlite:///./data/ngo_community.db",
        description="Database connection URL",
    )

    # Authentication (Managed by Member 3)
    # Auth override is strictly disabled by default and restricted from production
    enable_dev_auth_override: bool = Field(
        default=False,
        description="Development-only auth override. MUST NEVER be True in production.",
    )
    firebase_project_id: str | None = Field(default=None)
    firebase_credentials_path: str | None = Field(default=None)

    # AI Service (Managed by Member 4)
    # Model ID is configurable. Member 4 must verify the exact supported model ID
    # and whether image input is supported before live AI operations.
    gemini_api_key: str | None = Field(default=None)
    gemini_model_id: str = Field(
        default="",
        description="Gemini/Gemma API model identifier verified by Member 4",
    )
    gemini_timeout_seconds: int = Field(default=15)

    # Smart Assignment (Shared / Member 3)
    max_active_tasks: int = Field(
        default=2,
        description="Maximum concurrent active tasks allowed per volunteer",
    )


@lru_cache()
def get_settings() -> Settings:
    """Retrieve cached application settings instance."""
    return Settings()
