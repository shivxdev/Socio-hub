"""
Core Gemma 4 AI Analysis service module.
Adheres to 00_READ_FIRST_AND_SHARED_CONTRACT.md and 04_MEMBER_4_GEMMA4_AI.md.
"""
import base64
import json
import logging
import re
from typing import Any

from google import genai
from google.genai import types
from pydantic import ValidationError

from app.ai.config import AIConfig, get_ai_config
from app.ai.exceptions import AIServiceError
from app.ai.prompts import GEMMA_SYSTEM_INSTRUCTION, USER_PROMPT_TEMPLATE
from app.schemas.ai import AIAnalysisResult, ProblemCategory, SuggestedPriority

logger = logging.getLogger(__name__)


def _sanitize_log_text(text: str, api_key: str | None = None) -> str:
    """Mask potential secrets or API keys in error logging."""
    if api_key and len(api_key) > 4 and api_key in text:
        text = text.replace(api_key, "[REDACTED_API_KEY]")
    text = re.sub(r"(AIza[0-9A-Za-z-_]{20,})", "[REDACTED_API_KEY]", text)
    text = re.sub(r"(AQ\.[0-9A-Za-z-_]{20,})", "[REDACTED_API_KEY]", text)
    return text


def _validate_inputs(
    description: str,
    image_base64: str | None,
    image_mime_type: str | None,
    config: AIConfig,
) -> bytes | None:
    """Validate report description and optional image payload."""
    if not isinstance(description, str) or not description.strip():
        raise AIServiceError(
            message="Description cannot be empty.",
            code="VALIDATION_ERROR",
            details=["The problem description text must be provided."],
        )

    stripped_desc = description.strip()
    if len(stripped_desc) < config.min_description_length:
        raise AIServiceError(
            message=f"Description must be at least {config.min_description_length} characters.",
            code="VALIDATION_ERROR",
            details=[f"Provided description has {len(stripped_desc)} characters."],
        )

    if len(description) > config.max_description_length:
        raise AIServiceError(
            message=f"Description exceeds maximum length of {config.max_description_length} characters.",
            code="VALIDATION_ERROR",
            details=[f"Provided description length: {len(description)} characters."],
        )

    image_bytes: bytes | None = None
    if image_base64 is not None:
        if not image_mime_type or image_mime_type.lower() not in config.allowed_image_mime_types:
            allowed = ", ".join(config.allowed_image_mime_types)
            raise AIServiceError(
                message=f"Invalid or unsupported image MIME type. Supported: {allowed}",
                code="VALIDATION_ERROR",
                details=[f"Received MIME type: {image_mime_type}"],
            )

        try:
            image_bytes = base64.b64decode(image_base64, validate=True)
        except Exception as e:
            raise AIServiceError(
                message="Invalid base64 image data.",
                code="VALIDATION_ERROR",
                details=["The supplied image_base64 string could not be decoded."],
                original_error=e,
            )

        if not image_bytes:
            raise AIServiceError(
                message="Image content cannot be empty.",
                code="VALIDATION_ERROR",
                details=["Decoded image bytes are empty."],
            )

        if len(image_bytes) > config.max_image_bytes:
            max_mb = config.max_image_bytes // (1024 * 1024)
            raise AIServiceError(
                message=f"Image exceeds maximum allowed size of {max_mb} MB.",
                code="VALIDATION_ERROR",
                details=[f"Decoded image size: {len(image_bytes)} bytes."],
            )

    return image_bytes


def _get_genai_client(config: AIConfig) -> genai.Client:
    """Initialize Google GenAI client with timeouts."""
    if not config.api_key:
        raise AIServiceError(
            message="AI service is not configured (missing GEMINI_API_KEY).",
            code="AI_SERVICE_ERROR",
            details=["GEMINI_API_KEY environment variable is not set."],
        )

    return genai.Client(
        api_key=config.api_key,
        http_options=types.HttpOptions(
            timeout=int(config.timeout_seconds * 1000)  # ms
        ),
    )


def _parse_model_output(response: Any) -> AIAnalysisResult:
    """Parse and strictly validate model output against AIAnalysisResult."""
    # 1. Check if SDK automatically parsed into the target schema
    parsed_obj = getattr(response, "parsed", None)
    if isinstance(parsed_obj, AIAnalysisResult):
        return parsed_obj

    if isinstance(parsed_obj, dict):
        try:
            return AIAnalysisResult.model_validate(parsed_obj)
        except ValidationError as e:
            logger.warning("Pydantic validation failed on response.parsed: %s", e)

    # 2. Extract and sanitize raw text from response
    raw_text = getattr(response, "text", "") or ""
    if not raw_text.strip():
        raise AIServiceError(
            message="AI model returned empty response.",
            code="AI_SERVICE_ERROR",
            details=["Model response did not contain content or parsed object."],
        )

    # Strip markdown code fences if present (e.g. ```json ... ```)
    cleaned_text = raw_text.strip()
    if cleaned_text.startswith("```"):
        cleaned_text = re.sub(r"^```(?:json)?\s*", "", cleaned_text, flags=re.IGNORECASE)
        cleaned_text = re.sub(r"\s*```$", "", cleaned_text)

    # 3. Decode JSON
    try:
        data = json.loads(cleaned_text)
    except json.JSONDecodeError as err:
        logger.error("Failed to decode JSON from AI model response: %s", err)
        raise AIServiceError(
            message="AI model returned malformed output.",
            code="AI_SERVICE_ERROR",
            details=["Failed to parse JSON response."],
            original_error=err,
        )

    if not isinstance(data, dict):
        raise AIServiceError(
            message="AI model returned unexpected data structure.",
            code="AI_SERVICE_ERROR",
            details=["Expected a JSON object matching AIAnalysisResult."],
        )

    # 4. Strict Pydantic validation
    try:
        return AIAnalysisResult.model_validate(data)
    except ValidationError as val_err:
        error_details = [f"{'.'.join(str(loc) for loc in err['loc'])}: {err['msg']}" for err in val_err.errors()]
        logger.error("AI output failed schema validation: %s", error_details)
        raise AIServiceError(
            message="AI analysis result failed contract validation.",
            code="AI_SERVICE_ERROR",
            details=error_details,
            original_error=val_err,
        )


def analyze_community_problem(
    description: str,
    image_base64: str | None = None,
    image_mime_type: str | None = None,
    client: genai.Client | None = None,
    config: AIConfig | None = None,
) -> AIAnalysisResult:
    """
    Analyze a community problem report using Gemma 4 via Gemini API.

    Contract:
    - description: str (required, untrusted user report)
    - image_base64: str | None (optional base64-encoded image)
    - image_mime_type: str | None (optional MIME type: image/jpeg, image/png, image/webp)

    Returns:
    - AIAnalysisResult with summary, category, suggested_priority, skills_required,
      resources_required, missing_information.

    Raises:
    - AIServiceError: Controlled exception with code, message, and details.
    """
    cfg = config or get_ai_config()

    # 1. Validate inputs
    image_bytes = _validate_inputs(description, image_base64, image_mime_type, cfg)

    # 2. Get or initialize client
    active_client = client or _get_genai_client(cfg)

    # 3. Assemble contents
    contents: list[Any] = []
    if image_bytes is not None and image_mime_type is not None:
        contents.append(
            types.Part.from_bytes(
                data=image_bytes,
                mime_type=image_mime_type.lower(),
            )
        )

    user_prompt = USER_PROMPT_TEMPLATE.format(description=description.strip())
    contents.append(user_prompt)

    # 4. Configure generation
    gen_config = types.GenerateContentConfig(
        system_instruction=GEMMA_SYSTEM_INSTRUCTION,
        response_mime_type="application/json",
        response_schema=AIAnalysisResult,
        temperature=0.1,  # Low temperature for factual, deterministic extraction
    )

    # 5. Execute API call with safe error handling
    try:
        response = active_client.models.generate_content(
            model=cfg.model_id,
            contents=contents,
            config=gen_config,
        )
    except AIServiceError:
        raise
    except TimeoutError as te:
        logger.error("Gemini API call timed out: %s", te)
        raise AIServiceError(
            message="AI analysis request timed out.",
            code="AI_SERVICE_ERROR",
            details=["The request to the AI model exceeded the configured timeout."],
            original_error=te,
        )
    except Exception as exc:
        sanitized_msg = _sanitize_log_text(str(exc), api_key=cfg.api_key)
        logger.error("Error communicating with Gemini API: %s", sanitized_msg)
        raise AIServiceError(
            message="AI analysis is temporarily unavailable.",
            code="AI_SERVICE_ERROR",
            details=["An unexpected error occurred while communicating with the AI service."],
            original_error=exc,
        )

    # 6. Parse and strictly validate result
    return _parse_model_output(response)
