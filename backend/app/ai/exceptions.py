"""
Custom exceptions for the AI module.
Designed to align with the standard error response contract in 00_READ_FIRST_AND_SHARED_CONTRACT.md:
{
  "error": {
    "code": "AI_SERVICE_ERROR",
    "message": "AI analysis is temporarily unavailable.",
    "details": []
  }
}
"""
from typing import Any


class AIServiceError(Exception):
    """
    Controlled domain exception for AI service failures.
    Safe to display to users or map to standard HTTP 502/503 responses
    without exposing provider credentials or raw infrastructure details.
    """
    def __init__(
        self,
        message: str = "AI analysis is temporarily unavailable.",
        code: str = "AI_SERVICE_ERROR",
        details: list[str] | None = None,
        original_error: Exception | None = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.details = details or []
        self.original_error = original_error

    def to_dict(self) -> dict[str, Any]:
        return {
            "error": {
                "code": self.code,
                "message": self.message,
                "details": self.details,
            }
        }
