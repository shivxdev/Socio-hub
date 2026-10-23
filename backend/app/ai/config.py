"""
Configuration settings for the Gemma 4 / Gemini API AI module.
Reads from backend environment variables only.
"""
import os
from dataclasses import dataclass, field
from pathlib import Path
from dotenv import load_dotenv

# Load backend/.env reliably regardless of current working directory
_backend_dir = Path(__file__).resolve().parents[2]
_env_path = _backend_dir / ".env"
if _env_path.exists():
    load_dotenv(dotenv_path=_env_path, override=True)
else:
    load_dotenv(override=True)


@dataclass(frozen=True)
class AIConfig:
    api_key: str = field(
        default_factory=lambda: os.getenv("GEMINI_API_KEY", "").strip()
    )
    model_id: str = field(
        default_factory=lambda: os.getenv("GEMINI_MODEL_ID", "gemma-4-26b-a4b-it").strip()
    )
    timeout_seconds: float = field(
        default_factory=lambda: float(os.getenv("GEMINI_TIMEOUT_SECONDS", "30.0"))
    )
    max_description_length: int = 5000
    min_description_length: int = 3
    max_image_bytes: int = 10 * 1024 * 1024  # 10 MB
    allowed_image_mime_types: tuple[str, ...] = (
        "image/jpeg",
        "image/png",
        "image/webp",
    )


def get_ai_config() -> AIConfig:
    return AIConfig()
