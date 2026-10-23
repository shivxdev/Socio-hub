"""Admin analytics summary schemas."""

from typing import Dict
from pydantic import BaseModel, ConfigDict, Field


class AnalyticsSummaryResponse(BaseModel):
    """Aggregate statistics and metrics for administrator dashboard."""
    total_tasks: int = Field(ge=0, description="Total number of tasks across all states")
    tasks_by_status: Dict[str, int] = Field(description="Task count aggregated by status")
    tasks_by_category: Dict[str, int] = Field(description="Task count aggregated by category")
    tasks_by_priority: Dict[str, int] = Field(description="Task count aggregated by priority")
    active_volunteers: int = Field(ge=0, description="Count of currently active volunteers")
    overdue_tasks: int = Field(ge=0, description="Count of tasks currently overdue")
    average_rating: float | None = Field(default=None, description="Average feedback rating from completed tasks")

    model_config = ConfigDict(from_attributes=True)
