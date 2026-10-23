"""AI service interface and integration adapter.
Member 4 owns the actual Gemma 4 / Gemini API client implementation.
"""

import logging
from typing import Optional, Protocol
from app.config import get_settings
from app.core.exceptions import AIServiceException, ValidationException
from app.schemas.ai import AIAnalysisResult

logger = logging.getLogger(__name__)

SUPPORTED_IMAGE_MIMES = {"image/jpeg", "image/png", "image/webp"}


class AIProviderProtocol(Protocol):
    """Protocol for AI problem analysis providers."""
    def analyze(
        self,
        description: str,
        image_base64: Optional[str] = None,
        image_mime_type: Optional[str] = None,
    ) -> AIAnalysisResult:
        ...


def analyze_community_problem(
    description: str,
    image_base64: Optional[str] = None,
    image_mime_type: Optional[str] = None,
) -> AIAnalysisResult:
    """Interface function agreed with Member 4 (Gemma 4 AI Integration).
    Validates inputs, applies timeouts, and safely translates external errors
    to AIServiceException (502 AI_SERVICE_ERROR).
    """
    settings = get_settings()

    # --- Input validation gate (our layer) ---
    clean_desc = description.strip()
    if not clean_desc:
        raise ValidationException("Problem description cannot be empty.")
    if len(clean_desc) > 5000:
        raise ValidationException(
            "Problem description exceeds maximum allowed length of 5000 characters."
        )

    if image_base64:
        if not image_mime_type:
            raise ValidationException(
                "image_mime_type is required when image_base64 is provided."
            )
        if image_mime_type.lower() not in SUPPORTED_IMAGE_MIMES:
            raise ValidationException(
                f"Unsupported image MIME type '{image_mime_type}'. "
                f"Supported: {', '.join(sorted(SUPPORTED_IMAGE_MIMES))}."
            )
        if len(image_base64) > 10 * 1024 * 1024:
            raise ValidationException("Image payload exceeds maximum allowed size (10MB).")

    # --- API key guard ---
    if not settings.gemini_api_key:
        logger.warning("GEMINI_API_KEY is not configured in backend environment.")
        raise AIServiceException(
            "AI analysis service is currently unavailable. API key not configured."
        )

    # --- Delegate to Member 4 Gemma implementation ---
    # Lazy import: loaded only when API key present, prevents import-time crashes
    # if google-genai is absent in pure unit-test environments.
    from app.ai.gemma_service import analyze_community_problem as _gemma_analyze
    from app.ai.exceptions import AIServiceError

    try:
        return _gemma_analyze(
            description=description,
            image_base64=image_base64,
            image_mime_type=image_mime_type,
        )
    except AIServiceError as ai_err:
        # Bridge plain AIServiceError into our AppException hierarchy so
        # FastAPI registered handlers emit the correct HTTP error envelope.
        if ai_err.code == "VALIDATION_ERROR":
            raise ValidationException(
                message=ai_err.message,
                details=ai_err.details if ai_err.details else None,
            )
        # AI_SERVICE_ERROR and any other codes -> 502
        raise AIServiceException(
            message=ai_err.message,
            details=ai_err.details if ai_err.details else None,
        )
