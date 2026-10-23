"""Core application exceptions and standard error response handlers."""

import logging
from typing import Any, List
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)

# Starlette deprecation compatibility (422 status code)
HTTP_422_UNPROCESSABLE = getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", 422)



class AppException(Exception):
    """Base application exception mapping to standard error response."""

    def __init__(
        self,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        code: str = "BAD_REQUEST",
        message: str = "An error occurred.",
        details: List[Any] | None = None,
    ) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details or []
        super().__init__(message)


class UnauthorizedException(AppException):
    """401 Unauthorized exception."""

    def __init__(self, message: str = "Authentication required.", details: List[Any] | None = None) -> None:
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHORIZED",
            message=message,
            details=details,
        )


class ForbiddenException(AppException):
    """403 Forbidden exception."""

    def __init__(self, message: str = "You do not have permission to perform this action.", details: List[Any] | None = None) -> None:
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            code="FORBIDDEN",
            message=message,
            details=details,
        )


class NotFoundException(AppException):
    """404 Not Found exception."""

    def __init__(self, message: str = "Resource not found.", details: List[Any] | None = None) -> None:
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            code="NOT_FOUND",
            message=message,
            details=details,
        )


class ValidationException(AppException):
    """422 Validation Error exception."""

    def __init__(self, message: str = "The request contains invalid fields.", details: List[Any] | None = None) -> None:
        super().__init__(
            status_code=HTTP_422_UNPROCESSABLE,
            code="VALIDATION_ERROR",
            message=message,
            details=details,
        )



class InvalidStatusTransitionException(AppException):
    """400 Invalid Status Transition exception."""

    def __init__(self, message: str = "The requested status transition is not allowed.", details: List[Any] | None = None) -> None:
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            code="INVALID_STATUS_TRANSITION",
            message=message,
            details=details,
        )


class AIServiceException(AppException):
    """502 AI Service Error exception."""

    def __init__(self, message: str = "AI analysis service failed or timed out.", details: List[Any] | None = None) -> None:
        super().__init__(
            status_code=status.HTTP_502_BAD_GATEWAY,
            code="AI_SERVICE_ERROR",
            message=message,
            details=details,
        )


def _format_error(code: str, message: str, details: List[Any] | None = None) -> dict[str, Any]:
    return {
        "error": {
            "code": code,
            "message": message,
            "details": details or [],
        }
    }


async def app_exception_handler(_: Request, exc: AppException) -> JSONResponse:
    """Handle custom application exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content=_format_error(code=exc.code, message=exc.message, details=exc.details),
    )


async def http_exception_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Handle standard Starlette/FastAPI HTTPExceptions."""
    code_map = {
        status.HTTP_401_UNAUTHORIZED: "UNAUTHORIZED",
        status.HTTP_403_FORBIDDEN: "FORBIDDEN",
        status.HTTP_404_NOT_FOUND: "NOT_FOUND",
        status.HTTP_405_METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
        status.HTTP_400_BAD_REQUEST: "BAD_REQUEST",
        HTTP_422_UNPROCESSABLE: "VALIDATION_ERROR",
        status.HTTP_500_INTERNAL_SERVER_ERROR: "INTERNAL_ERROR",
    }

    code = code_map.get(exc.status_code, "HTTP_ERROR")
    # For server errors (5xx), do not expose internal exception details to clients
    message = "An unexpected internal server error occurred." if exc.status_code >= 500 else str(exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content=_format_error(code=code, message=message),
    )


async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle request validation errors into contract shape."""
    details = []
    for err in exc.errors():
        field_loc = [str(loc) for loc in err.get("loc", []) if loc != "body"]
        field_name = ".".join(field_loc) if field_loc else "body"
        details.append({
            "field": field_name,
            "issue": err.get("msg", "Invalid field"),
            "type": err.get("type", "value_error"),
        })

    return JSONResponse(
        status_code=HTTP_422_UNPROCESSABLE,
        content=_format_error(
            code="VALIDATION_ERROR",
            message="The request contains invalid fields.",
            details=details,
        ),
    )


async def generic_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    """Handle unhandled internal server exceptions without exposing tracebacks or internal details."""
    logger.exception("Unhandled server exception: %s", exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=_format_error(
            code="INTERNAL_ERROR",
            message="An unexpected internal server error occurred.",
            details=[],
        ),
    )



def register_exception_handlers(app: FastAPI) -> None:
    """Register all standard error handlers onto the FastAPI application."""
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)
