"""FastAPI Application Entrypoint."""

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.routers import health


def create_app() -> FastAPI:
    """Create and configure the FastAPI application instance."""
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        description="FastAPI Backend for NGO Community Problem Reporting & Resolution Platform",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register standardized error handlers
    register_exception_handlers(app)

    # Root public health check endpoint (GET /health)
    app.include_router(health.router)

    # Application routes under /api/v1 prefix
    api_v1_router = APIRouter(prefix="/api/v1")
    # Subsequent modules (users, ai, tasks, analytics) will be mounted here
    app.include_router(api_v1_router)

    return app


app = create_app()
