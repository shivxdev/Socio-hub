"""Task API router endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from app.core.security import get_current_user, require_role
from app.schemas.common import TaskCategory, TaskStatus, UserRole
from app.schemas.task import (
    CompletionEvidenceCreate,
    FeedbackCreate,
    FeedbackResponse,
    TaskActionReasonRequest,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)
from app.schemas.user import UserProfile
from app.services.task_service import TaskService, get_task_service

router = APIRouter(prefix="/tasks", tags=["Tasks"])


class TaskAssignRequest(BaseModel):
    """Optional payload specifying candidate volunteer for manual assignment."""
    volunteer_id: Optional[str] = None


@router.post(
    "",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new task",
    description="Community users or admins create a new task. Initial status is always 'pending'.",
)
async def create_task(
    task_in: TaskCreate,
    current_user: UserProfile = Depends(require_role(UserRole.COMMUNITY, UserRole.ADMIN)),
    service: TaskService = Depends(get_task_service),
) -> TaskResponse:

    """Create task with status pending and created_by bound to authenticated user."""
    return service.create_task(task_in, current_user)


@router.get(
    "",
    response_model=List[TaskResponse],
    summary="List tasks",
    description="List tasks permitted for caller: admin sees all, volunteer sees assigned, community sees created.",
)
async def list_tasks(
    status_filter: Optional[TaskStatus] = Query(default=None, alias="status"),
    category_filter: Optional[TaskCategory] = Query(default=None, alias="category"),
    current_user: UserProfile = Depends(get_current_user),
    service: TaskService = Depends(get_task_service),
) -> List[TaskResponse]:
    """List tasks according to caller permissions and query filters."""
    return service.list_tasks(current_user, status=status_filter, category=category_filter)


@router.get(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Get task details",
    description="Get single task details if permitted (admin, creator, or assigned volunteer).",
)
async def get_task_by_id(
    task_id: int,
    current_user: UserProfile = Depends(get_current_user),
    service: TaskService = Depends(get_task_service),
) -> TaskResponse:
    """Return task by ID."""
    return service.get_task(task_id, current_user)


@router.patch(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Update editable task fields",
    description="Admin updates approved editable fields. Protected fields cannot be modified here.",
)
async def update_task(
    task_id: int,
    updates: TaskUpdate,
    current_user: UserProfile = Depends(require_role(UserRole.ADMIN)),
    service: TaskService = Depends(get_task_service),
) -> TaskResponse:
    """Update editable fields on a task."""
    return service.update_task(task_id, updates, current_user)


@router.post(
    "/{task_id}/assign",
    response_model=TaskResponse,
    summary="Assign task to volunteer",
    description="Admin triggers assignment. Status transitions from 'pending' to 'assigned'.",
)
async def assign_task(
    task_id: int,
    assign_payload: Optional[TaskAssignRequest] = None,
    current_user: UserProfile = Depends(require_role(UserRole.ADMIN)),
    service: TaskService = Depends(get_task_service),
) -> TaskResponse:
    """Assign task to volunteer."""
    vol_id = assign_payload.volunteer_id if assign_payload else None
    return service.assign_task(task_id, current_user, volunteer_id=vol_id)


@router.post(
    "/{task_id}/accept",
    response_model=TaskResponse,
    summary="Accept assigned task",
    description="Assigned volunteer accepts the task. Status becomes 'accepted'.",
)
async def accept_task(
    task_id: int,
    current_user: UserProfile = Depends(require_role(UserRole.VOLUNTEER)),
    service: TaskService = Depends(get_task_service),
) -> TaskResponse:
    """Volunteer accepts assigned task."""
    return service.accept_task(task_id, current_user)


@router.post(
    "/{task_id}/reject",
    response_model=TaskResponse,
    summary="Reject assigned task",
    description="Assigned volunteer rejects task with optional reason. Resets to 'pending' and excludes volunteer.",
)
async def reject_task(
    task_id: int,
    reason_req: Optional[TaskActionReasonRequest] = None,
    current_user: UserProfile = Depends(require_role(UserRole.VOLUNTEER)),
    service: TaskService = Depends(get_task_service),
) -> TaskResponse:
    """Volunteer rejects assigned task."""
    reason = reason_req.reason if reason_req else None
    return service.reject_task(task_id, current_user, reason=reason)


@router.post(
    "/{task_id}/start",
    response_model=TaskResponse,
    summary="Start working on task",
    description="Assigned volunteer marks task active. Status becomes 'active'.",
)
async def start_task(
    task_id: int,
    current_user: UserProfile = Depends(require_role(UserRole.VOLUNTEER)),
    service: TaskService = Depends(get_task_service),
) -> TaskResponse:
    """Volunteer starts working on accepted task."""
    return service.start_task(task_id, current_user)


@router.post(
    "/{task_id}/completion",
    response_model=TaskResponse,
    summary="Submit completion evidence",
    description="Assigned volunteer submits completion note and evidence. Status becomes 'completion_submitted'.",
)
async def submit_completion(
    task_id: int,
    evidence: CompletionEvidenceCreate,
    current_user: UserProfile = Depends(require_role(UserRole.VOLUNTEER)),
    service: TaskService = Depends(get_task_service),
) -> TaskResponse:
    """Volunteer submits completion evidence."""
    return service.submit_completion(task_id, evidence, current_user)


@router.post(
    "/{task_id}/verify",
    response_model=TaskResponse,
    summary="Verify task completion",
    description="Admin verifies outcome after completion evidence is submitted. Status becomes 'verified'.",
)
async def verify_task(
    task_id: int,
    current_user: UserProfile = Depends(require_role(UserRole.ADMIN)),
    service: TaskService = Depends(get_task_service),
) -> TaskResponse:
    """Admin verifies task completion."""
    return service.verify_task(task_id, current_user)


@router.post(
    "/{task_id}/cancel",
    response_model=TaskResponse,
    summary="Cancel task",
    description="Admin cancels task with optional reason. Status becomes 'cancelled'.",
)
async def cancel_task(
    task_id: int,
    reason_req: Optional[TaskActionReasonRequest] = None,
    current_user: UserProfile = Depends(require_role(UserRole.ADMIN)),
    service: TaskService = Depends(get_task_service),
) -> TaskResponse:
    """Admin cancels task."""
    reason = reason_req.reason if reason_req else None
    return service.cancel_task(task_id, current_user, reason=reason)


@router.post(
    "/{task_id}/feedback",
    response_model=FeedbackResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit feedback on verified task",
    description="Community creator submits satisfaction rating and comment after verification.",
)
async def submit_feedback(
    task_id: int,
    feedback: FeedbackCreate,
    current_user: UserProfile = Depends(require_role(UserRole.COMMUNITY)),
    service: TaskService = Depends(get_task_service),
) -> FeedbackResponse:
    """Creator submits feedback on verified task."""
    return service.submit_feedback(task_id, feedback, current_user)
