"""
AI Module for NGO Community Solution using Gemma 4 via Gemini API.
"""
from app.ai.config import AIConfig, get_ai_config
from app.ai.exceptions import AIServiceError
from app.ai.gemma_service import analyze_community_problem

__all__ = [
    "analyze_community_problem",
    "AIServiceError",
    "AIConfig",
    "get_ai_config",
]
