"""Task lifecycle orchestration and business logic service.
Implements the task state machine, role permissions, and rejection history.
"""

from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional, Set
from app.core.exceptions import (
    ForbiddenException,
    InvalidStatusTransitionException,
    NotFoundException,
    ValidationException,
)
from app.schemas.analytics import AnalyticsSummaryResponse
from app.schemas.common import Priority, TaskCategory, TaskStatus, UserRole
from app.schemas.task import (
    CompletionEvidenceCreate,
    FeedbackCreate,
    FeedbackResponse,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)
from app.schemas.user import UserProfile

logger = logging.getLogger(__name__)



class TaskRepository:
    """In-memory task repository adapter.
    Enables decoupled testing and standalone operation before Member 3's DB models arrive.
    Designed to mirror Member 3's SQLAlchemy tables.
    """

    def __init__(self) -> None:
        self._tasks: Dict[int, TaskResponse] = {}
        self._next_id: int = 1
        self._rejection_history: Dict[int, List[Dict[str, Any]]] = {}  # task_id -> list of rejection records
        self._evidence: Dict[int, List[Dict[str, Any]]] = {}  # task_id -> list of evidence
        self._feedback: Dict[int, FeedbackResponse] = {}  # task_id -> feedback

    def create(self, task_data: TaskCreate, created_by: str) -> TaskResponse:
        now = datetime.now(timezone.utc)
        task_id = self._next_id
        self._next_id += 1

        task = TaskResponse(
            id=task_id,
            title=task_data.title,
            description=task_data.description,
            category=task_data.category,
            priority=task_data.priority,
            location=task_data.location,
            skills_required=task_data.skills_required or [],
            resources_required=task_data.resources_required or [],
            status=TaskStatus.PENDING,
            assigned_to=None,
            deadline=task_data.deadline,
            is_overdue=False,
            created_by=created_by,
            created_at=now,
            updated_at=now,
        )
        self._tasks[task_id] = task
        return task

    def get_by_id(self, task_id: int) -> Optional[TaskResponse]:
        return self._tasks.get(task_id)

    def list_all(
        self,
        status: Optional[TaskStatus] = None,
        category: Optional[TaskCategory] = None,
        created_by: Optional[str] = None,
        assigned_to: Optional[str] = None,
    ) -> List[TaskResponse]:
        results = list(self._tasks.values())
        if status:
            results = [t for t in results if t.status == status]
        if category:
            results = [t for t in results if t.category == category]
        if created_by:
            results = [t for t in results if t.created_by == created_by]
        if assigned_to:
            results = [t for t in results if t.assigned_to == assigned_to]
        return results

    def update(self, task_id: int, **fields: Any) -> Optional[TaskResponse]:
        task = self._tasks.get(task_id)
        if not task:
            return None

        data = task.model_dump()
        for k, v in fields.items():
            data[k] = v
        data["updated_at"] = datetime.now(timezone.utc)


        updated_task = TaskResponse.model_validate(data)
        self._tasks[task_id] = updated_task
        return updated_task

    def record_assignment_history(
        self,
        task_id: int,
        volunteer_id: str,
        action: str,
        reason: Optional[str] = None,
    ) -> None:
        entry = {
            "task_id": task_id,
            "volunteer_id": volunteer_id,
            "action": action,
            "reason": reason,
            "created_at": datetime.now(timezone.utc),
        }
        self._rejection_history.setdefault(task_id, []).append(entry)

    def get_excluded_volunteers(self, task_id: int) -> Set[str]:
        records = self._rejection_history.get(task_id, [])
        return {r["volunteer_id"] for r in records if r["action"] == "rejected"}

    def record_evidence(self, task_id: int, volunteer_id: str, note: str, evidence_urls: List[str]) -> None:
        entry = {
            "task_id": task_id,
            "volunteer_id": volunteer_id,
            "note": note,
            "evidence_urls": evidence_urls,
            "created_at": datetime.now(timezone.utc),
        }
        self._evidence.setdefault(task_id, []).append(entry)

    def record_feedback(self, task_id: int, user_id: str, rating: int, comment: Optional[str] = None) -> FeedbackResponse:
        fb = FeedbackResponse(
            id=len(self._feedback) + 1,
            task_id=task_id,
            user_id=user_id,
            rating=rating,
            comment=comment,
            created_at=datetime.now(timezone.utc),
        )
        self._feedback[task_id] = fb
        return fb

    def get_feedback(self, task_id: int) -> Optional[FeedbackResponse]:
        return self._feedback.get(task_id)

    def get_analytics(self) -> AnalyticsSummaryResponse:
        """Derive dynamic statistics across all tasks and feedback records."""
        now = datetime.now(timezone.utc)
        total_tasks = len(self._tasks)

        # Initialize all 8 statuses to 0
        tasks_by_status = {s.value: 0 for s in TaskStatus}
        for task in self._tasks.values():
            tasks_by_status[task.status.value] = tasks_by_status.get(task.status.value, 0) + 1

        # Initialize all categories to 0
        tasks_by_category = {c.value: 0 for c in TaskCategory}
        for task in self._tasks.values():
            tasks_by_category[task.category.value] = tasks_by_category.get(task.category.value, 0) + 1

        # Initialize all priorities to 0
        tasks_by_priority = {p.value: 0 for p in Priority}
        for task in self._tasks.values():
            tasks_by_priority[task.priority.value] = tasks_by_priority.get(task.priority.value, 0) + 1

        # Active volunteers: distinct helpers assigned to non-terminal tasks
        active_volunteer_ids = {
            task.assigned_to
            for task in self._tasks.values()
            if task.assigned_to
            and task.status in (
                TaskStatus.ASSIGNED,
                TaskStatus.ACCEPTED,
                TaskStatus.ACTIVE,
                TaskStatus.COMPLETION_SUBMITTED,
            )
        }
        active_volunteers = len(active_volunteer_ids)

        # Overdue tasks: deadline exists, deadline in past, not in terminal states (verified, cancelled)
        overdue_tasks = 0
        for task in self._tasks.values():
            if task.deadline and task.status not in (TaskStatus.VERIFIED, TaskStatus.CANCELLED):
                task_deadline = task.deadline if task.deadline.tzinfo else task.deadline.replace(tzinfo=timezone.utc)
                if task_deadline < now:
                    overdue_tasks += 1

        # Average feedback rating
        if self._feedback:
            avg_rating = round(sum(fb.rating for fb in self._feedback.values()) / len(self._feedback), 2)
        else:
            avg_rating = None

        return AnalyticsSummaryResponse(
            total_tasks=total_tasks,
            tasks_by_status=tasks_by_status,
            tasks_by_category=tasks_by_category,
            tasks_by_priority=tasks_by_priority,
            active_volunteers=active_volunteers,
            overdue_tasks=overdue_tasks,
            average_rating=avg_rating,
        )



# Module-level default repository instance
default_task_repo = TaskRepository()


class TaskService:
    """Encapsulates task business logic, lifecycle transitions, and permissions."""

    def __init__(self, repo: TaskRepository = default_task_repo) -> None:
        self.repo = repo

    def create_task(self, task_in: TaskCreate, actor: UserProfile) -> TaskResponse:
        """Create a new task. Status defaults strictly to pending."""
        if actor.role not in (UserRole.COMMUNITY, UserRole.ADMIN):
            raise ForbiddenException("Only community users and administrators can create tasks.")
        return self.repo.create(task_in, created_by=actor.id)

    def get_task(self, task_id: int, actor: UserProfile) -> TaskResponse:
        """Retrieve task by ID with role permission scoping."""
        task = self.repo.get_by_id(task_id)
        if not task:
            raise NotFoundException(f"Task {task_id} not found.")

        # Permission scoping
        if actor.role == UserRole.ADMIN:
            return task
        if actor.role == UserRole.COMMUNITY and task.created_by == actor.id:
            return task
        if actor.role == UserRole.VOLUNTEER and task.assigned_to == actor.id:
            return task

        raise ForbiddenException("You do not have permission to view this task.")

    def list_tasks(
        self,
        actor: UserProfile,
        status: Optional[TaskStatus] = None,
        category: Optional[TaskCategory] = None,
    ) -> List[TaskResponse]:
        """List tasks scoped by caller's role."""
        if actor.role == UserRole.ADMIN:
            return self.repo.list_all(status=status, category=category)
        if actor.role == UserRole.VOLUNTEER:
            return self.repo.list_all(status=status, category=category, assigned_to=actor.id)
        if actor.role == UserRole.COMMUNITY:
            return self.repo.list_all(status=status, category=category, created_by=actor.id)
        return []

    def update_task(self, task_id: int, update_data: TaskUpdate, actor: UserProfile) -> TaskResponse:
        """Admin-only update of approved editable fields.
        Protected fields (status, assigned_to, created_by) are strictly disallowed.
        """
        if actor.role != UserRole.ADMIN:
            raise ForbiddenException("Only administrators can update task details.")

        task = self.repo.get_by_id(task_id)
        if not task:
            raise NotFoundException(f"Task {task_id} not found.")

        updates = update_data.model_dump(exclude_unset=True)
        updated = self.repo.update(task_id, **updates)
        assert updated is not None
        return updated

    def assign_task(
        self,
        task_id: int,
        actor: UserProfile,
        volunteer_id: Optional[str] = None,
    ) -> TaskResponse:
        """Admin triggers task assignment.
        Moves status from pending -> assigned.
        """
        if actor.role != UserRole.ADMIN:
            raise ForbiddenException("Only administrators can assign tasks.")

        task = self.repo.get_by_id(task_id)
        if not task:
            raise NotFoundException(f"Task {task_id} not found.")

        if task.status != TaskStatus.PENDING:
            raise InvalidStatusTransitionException(
                f"Task cannot be assigned from status '{task.status.value}'. Must be 'pending'."
            )

        if not volunteer_id:
            # When Member 3 assignment service is plugged in, deterministic matching runs here.
            # If no candidate found, task remains pending per shared contract.
            return task

        # Check if volunteer previously rejected this task
        excluded = self.repo.get_excluded_volunteers(task_id)
        if volunteer_id in excluded:
            raise ValidationException(
                f"Volunteer '{volunteer_id}' previously rejected this task and is excluded from assignment."
            )

        self.repo.record_assignment_history(task_id, volunteer_id, action="assigned")
        updated = self.repo.update(
            task_id,
            status=TaskStatus.ASSIGNED,
            assigned_to=volunteer_id,
        )
        assert updated is not None
        return updated

    def accept_task(self, task_id: int, actor: UserProfile) -> TaskResponse:
        """Assigned volunteer accepts the task (assigned -> accepted)."""
        if actor.role != UserRole.VOLUNTEER:
            raise ForbiddenException("Only volunteers can accept tasks.")

        task = self.repo.get_by_id(task_id)
        if not task:
            raise NotFoundException(f"Task {task_id} not found.")

        if task.assigned_to != actor.id:
            raise ForbiddenException("You are not assigned to this task.")

        if task.status != TaskStatus.ASSIGNED:
            raise InvalidStatusTransitionException(
                f"Task cannot be accepted from status '{task.status.value}'. Must be 'assigned'."
            )

        self.repo.record_assignment_history(task_id, actor.id, action="accepted")
        updated = self.repo.update(task_id, status=TaskStatus.ACCEPTED)
        assert updated is not None
        return updated

    def reject_task(self, task_id: int, actor: UserProfile, reason: Optional[str] = None) -> TaskResponse:
        """Assigned volunteer rejects the task.
        Records rejection in AssignmentHistory, resets active task to pending,
        clears assigned_to, and excludes volunteer from future assignment.
        """
        if actor.role != UserRole.VOLUNTEER:
            raise ForbiddenException("Only volunteers can reject tasks.")

        task = self.repo.get_by_id(task_id)
        if not task:
            raise NotFoundException(f"Task {task_id} not found.")

        if task.assigned_to != actor.id:
            raise ForbiddenException("You are not assigned to this task.")

        if task.status != TaskStatus.ASSIGNED:
            raise InvalidStatusTransitionException(
                f"Task cannot be rejected from status '{task.status.value}'. Must be 'assigned'."
            )

        # Record audit history for rejection
        self.repo.record_assignment_history(task_id, actor.id, action="rejected", reason=reason)

        # Reset task to pending and clear assigned_to
        updated = self.repo.update(
            task_id,
            status=TaskStatus.PENDING,
            assigned_to=None,
        )
        assert updated is not None
        return updated

    def start_task(self, task_id: int, actor: UserProfile) -> TaskResponse:
        """Assigned volunteer begins work on the task (accepted -> active)."""
        if actor.role != UserRole.VOLUNTEER:
            raise ForbiddenException("Only volunteers can start tasks.")

        task = self.repo.get_by_id(task_id)
        if not task:
            raise NotFoundException(f"Task {task_id} not found.")

        if task.assigned_to != actor.id:
            raise ForbiddenException("You are not assigned to this task.")

        if task.status != TaskStatus.ACCEPTED:
            raise InvalidStatusTransitionException(
                f"Task cannot be started from status '{task.status.value}'. Must be 'accepted'."
            )

        updated = self.repo.update(task_id, status=TaskStatus.ACTIVE)
        assert updated is not None
        return updated

    def submit_completion(
        self,
        task_id: int,
        evidence: CompletionEvidenceCreate,
        actor: UserProfile,
    ) -> TaskResponse:
        """Assigned volunteer submits completion evidence (active -> completion_submitted)."""
        if actor.role != UserRole.VOLUNTEER:
            raise ForbiddenException("Only volunteers can submit task completion.")

        task = self.repo.get_by_id(task_id)
        if not task:
            raise NotFoundException(f"Task {task_id} not found.")

        if task.assigned_to != actor.id:
            raise ForbiddenException("You are not assigned to this task.")

        if task.status != TaskStatus.ACTIVE:
            raise InvalidStatusTransitionException(
                f"Completion evidence can only be submitted from status 'active'. Current status: '{task.status.value}'."
            )

        self.repo.record_evidence(task_id, actor.id, evidence.note, evidence.evidence_urls)
        updated = self.repo.update(task_id, status=TaskStatus.COMPLETION_SUBMITTED)
        assert updated is not None
        return updated

    def verify_task(self, task_id: int, actor: UserProfile) -> TaskResponse:
        """Admin verifies task outcome after completion evidence is submitted (completion_submitted -> verified)."""
        if actor.role != UserRole.ADMIN:
            raise ForbiddenException("Only administrators can verify tasks.")

        task = self.repo.get_by_id(task_id)
        if not task:
            raise NotFoundException(f"Task {task_id} not found.")

        if task.status != TaskStatus.COMPLETION_SUBMITTED:
            raise InvalidStatusTransitionException(
                f"Task cannot be verified from status '{task.status.value}'. Must be 'completion_submitted'."
            )

        updated = self.repo.update(task_id, status=TaskStatus.VERIFIED)
        assert updated is not None
        return updated

    def cancel_task(self, task_id: int, actor: UserProfile, reason: Optional[str] = None) -> TaskResponse:
        """Admin cancels a task from any non-terminal state -> cancelled."""
        if actor.role != UserRole.ADMIN:
            raise ForbiddenException("Only administrators can cancel tasks.")

        task = self.repo.get_by_id(task_id)
        if not task:
            raise NotFoundException(f"Task {task_id} not found.")

        if task.status in (TaskStatus.VERIFIED, TaskStatus.CANCELLED):
            raise InvalidStatusTransitionException(
                f"Cannot cancel a task that is already '{task.status.value}'."
            )

        if task.assigned_to:
            self.repo.record_assignment_history(task_id, task.assigned_to, action="cancelled", reason=reason)

        updated = self.repo.update(task_id, status=TaskStatus.CANCELLED)
        assert updated is not None
        return updated

    def submit_feedback(
        self,
        task_id: int,
        feedback: FeedbackCreate,
        actor: UserProfile,
    ) -> FeedbackResponse:
        """Community creator submits feedback on verified task."""
        if actor.role != UserRole.COMMUNITY:
            raise ForbiddenException("Only community users can submit feedback.")

        task = self.repo.get_by_id(task_id)
        if not task:
            raise NotFoundException(f"Task {task_id} not found.")

        if task.created_by != actor.id:
            raise ForbiddenException("You can only submit feedback for tasks you created.")

        if task.status != TaskStatus.VERIFIED:
            raise InvalidStatusTransitionException(
                f"Feedback can only be submitted after task is 'verified'. Current status: '{task.status.value}'."
            )

        if self.repo.get_feedback(task_id):
            raise ValidationException("Feedback has already been submitted for this task.")

        return self.repo.record_feedback(task_id, actor.id, feedback.rating, feedback.comment)

    def get_analytics_summary(self, actor: UserProfile) -> AnalyticsSummaryResponse:
        """Admin-only aggregated counts and metrics across all tasks and volunteers."""
        if actor.role != UserRole.ADMIN:
            raise ForbiddenException("Only administrators can access analytics summary.")
        return self.repo.get_analytics()


def get_task_service() -> TaskService:
    """FastAPI dependency for accessing the TaskService instance."""
    return TaskService(default_task_repo)

