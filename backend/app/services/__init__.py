"""
Services package for Socio-hub NGO Community Solution.
"""
from app.services.assignment import (
    MAX_ACTIVE_TASKS,
    select_best_candidate,
)
from app.services.task_service import (
    create_task,
    get_task_by_id,
    record_assignment_history,
    submit_completion_evidence,
    submit_task_feedback,
    transition_task_status,
)

__all__ = [
    "MAX_ACTIVE_TASKS",
    "select_best_candidate",
    "create_task",
    "get_task_by_id",
    "transition_task_status",
    "submit_completion_evidence",
    "submit_task_feedback",
    "record_assignment_history",
]
