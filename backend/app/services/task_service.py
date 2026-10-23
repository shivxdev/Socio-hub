"""
Task Persistence and Lifecycle Service.
Follows 00_READ_FIRST_AND_SHARED_CONTRACT.md and 03_MEMBER_3_DATABASE_AUTH_ASSIGNMENT.md.
"""
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.assignment_history import AssignmentHistory
from app.models.evidence import CompletionEvidence
from app.models.feedback import TaskFeedback
from app.models.task import Task
from app.models.user import UserProfile
from app.schemas.enums import AssignmentAction, TaskStatus, UserRole
from app.schemas.task import CompletionEvidenceCreate, TaskCreate, TaskFeedbackCreate
from app.services.assignment import MAX_ACTIVE_TASKS


def create_task(task_data: TaskCreate, created_by: str, db: Session | None = None) -> Task:
    """
    Creates a new Task with status 'pending'.
    Signature required by shared contract:
    create_task(task_data: TaskCreate, created_by: str) -> Task
    """
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        new_task = Task(
            title=task_data.title.strip(),
            description=task_data.description.strip(),
            category=task_data.category.value,
            priority=task_data.priority.value,
            location=task_data.location.strip() if task_data.location else None,
            skills_required=task_data.skills_required or [],
            resources_required=task_data.resources_required or [],
            status=TaskStatus.PENDING.value,
            assigned_to=None,
            deadline=task_data.deadline,
            created_by=created_by,
        )
        db.add(new_task)
        db.commit()
        db.refresh(new_task)
        return new_task
    except Exception:
        db.rollback()
        raise
    finally:
        if should_close:
            db.close()


def get_task_by_id(task_id: int, db: Session | None = None) -> Task | None:
    """
    Retrieves a Task by integer ID.
    Signature required by shared contract:
    get_task_by_id(task_id: int) -> Task | None
    """
    if db is not None:
        return db.query(Task).filter(Task.id == task_id).first()

    with SessionLocal() as session:
        return session.query(Task).filter(Task.id == task_id).first()


def record_assignment_history(
    task_id: int,
    volunteer_id: str,
    action: AssignmentAction | str,
    reason: str | None,
    db: Session,
) -> AssignmentHistory:
    """Helper to record an audit trail event for task assignments and rejections."""
    action_val = action.value if isinstance(action, AssignmentAction) else str(action)
    record = AssignmentHistory(
        task_id=task_id,
        volunteer_id=volunteer_id,
        action=action_val,
        reason=reason,
    )
    db.add(record)
    return record


def transition_task_status(
    task: Task,
    new_status: TaskStatus | str,
    actor: UserProfile,
    db: Session | None = None,
    reason: str | None = None,
    assignee_id: str | None = None,
) -> Task:
    """
    Enforces valid state lifecycle transitions and role permissions.
    Signature required by shared contract:
    transition_task_status(task: Task, new_status: TaskStatus, actor: UserProfile) -> Task
    """
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        # Re-attach or refresh task in active session
        task = db.query(Task).filter(Task.id == task.id).first()
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": {"code": "NOT_FOUND", "message": "Task not found."}},
            )

        target_status = new_status.value if isinstance(new_status, TaskStatus) else str(new_status)
        current_status = task.status
        actor_role = str(actor.role).lower()
        is_admin = actor_role == UserRole.ADMIN.value

        # Disallow transitions from terminal states
        if current_status in (TaskStatus.VERIFIED.value, TaskStatus.CANCELLED.value):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": {
                        "code": "INVALID_STATUS_TRANSITION",
                        "message": f"Task #{task.id} is in terminal state '{current_status}' and cannot transition to '{target_status}'.",
                    }
                },
            )

        # 1. PENDING -> ASSIGNED
        if target_status == TaskStatus.ASSIGNED.value:
            if current_status not in (TaskStatus.PENDING.value, TaskStatus.REJECTED.value):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "error": {
                            "code": "INVALID_STATUS_TRANSITION",
                            "message": f"Cannot assign task from current status '{current_status}'. Expected 'pending'.",
                        }
                    },
                )
            if not is_admin:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={"error": {"code": "FORBIDDEN", "message": "Only administrators can assign tasks."}},
                )
            assigned_uid = assignee_id or task.assigned_to
            if not assigned_uid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={"error": {"code": "VALIDATION_ERROR", "message": "Assignee UID must be provided."}},
                )
            assigned_volunteer = db.query(UserProfile).filter(UserProfile.id == assigned_uid).first()
            if not assigned_volunteer or assigned_volunteer.role != UserRole.VOLUNTEER.value:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={"error": {"code": "VALIDATION_ERROR", "message": "Assignee must be a registered volunteer."}},
                )
            if (assigned_volunteer.active_task_count or 0) >= MAX_ACTIVE_TASKS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "error": {
                            "code": "VALIDATION_ERROR",
                            "message": f"Volunteer '{assigned_uid}' has reached maximum active tasks limit ({MAX_ACTIVE_TASKS}).",
                        }
                    },
                )
            task.assigned_to = assigned_uid
            task.status = TaskStatus.ASSIGNED.value
            assigned_volunteer.active_task_count = (assigned_volunteer.active_task_count or 0) + 1
            record_assignment_history(task.id, assigned_uid, AssignmentAction.ASSIGNED, reason or "Task assigned", db)

        # 2. ASSIGNED -> ACCEPTED
        elif target_status == TaskStatus.ACCEPTED.value:
            if current_status != TaskStatus.ASSIGNED.value:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "error": {
                            "code": "INVALID_STATUS_TRANSITION",
                            "message": f"Cannot accept task from current status '{current_status}'. Expected 'assigned'.",
                        }
                    },
                )
            if not is_admin and actor.id != task.assigned_to:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={"error": {"code": "FORBIDDEN", "message": "Only the assigned volunteer can accept this task."}},
                )
            task.status = TaskStatus.ACCEPTED.value
            record_assignment_history(task.id, task.assigned_to, AssignmentAction.ACCEPTED, reason or "Volunteer accepted task", db)

        # 3. ASSIGNED -> REJECTED (transitions back to PENDING, exclusions tracked)
        elif target_status == TaskStatus.REJECTED.value:
            if current_status != TaskStatus.ASSIGNED.value:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "error": {
                            "code": "INVALID_STATUS_TRANSITION",
                            "message": f"Cannot reject task from current status '{current_status}'. Expected 'assigned'.",
                        }
                    },
                )
            if not is_admin and actor.id != task.assigned_to:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={"error": {"code": "FORBIDDEN", "message": "Only the assigned volunteer can reject this task."}},
                )
            assigned_uid = task.assigned_to
            volunteer = db.query(UserProfile).filter(UserProfile.id == assigned_uid).first()
            if volunteer and (volunteer.active_task_count or 0) > 0:
                volunteer.active_task_count -= 1

            record_assignment_history(task.id, assigned_uid, AssignmentAction.REJECTED, reason or "Volunteer rejected task", db)
            # Revert task to pending and clear assigned_to
            task.assigned_to = None
            task.status = TaskStatus.PENDING.value

        # 4. ACCEPTED -> ACTIVE
        elif target_status == TaskStatus.ACTIVE.value:
            if current_status != TaskStatus.ACCEPTED.value:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "error": {
                            "code": "INVALID_STATUS_TRANSITION",
                            "message": f"Cannot start task from current status '{current_status}'. Expected 'accepted'.",
                        }
                    },
                )
            if not is_admin and actor.id != task.assigned_to:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={"error": {"code": "FORBIDDEN", "message": "Only the assigned volunteer can start this task."}},
                )
            task.status = TaskStatus.ACTIVE.value

        # 5. ACTIVE -> COMPLETION_SUBMITTED
        elif target_status == TaskStatus.COMPLETION_SUBMITTED.value:
            if current_status != TaskStatus.ACTIVE.value:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "error": {
                            "code": "INVALID_STATUS_TRANSITION",
                            "message": f"Cannot submit completion for task with status '{current_status}'. Expected 'active'.",
                        }
                    },
                )
            if not is_admin and actor.id != task.assigned_to:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={"error": {"code": "FORBIDDEN", "message": "Only the assigned volunteer can submit completion evidence."}},
                )
            task.status = TaskStatus.COMPLETION_SUBMITTED.value

        # 6. COMPLETION_SUBMITTED -> VERIFIED (Admin Only)
        elif target_status == TaskStatus.VERIFIED.value:
            if current_status != TaskStatus.COMPLETION_SUBMITTED.value:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "error": {
                            "code": "INVALID_STATUS_TRANSITION",
                            "message": f"Cannot verify task from status '{current_status}'. Expected 'completion_submitted'.",
                        }
                    },
                )
            if not is_admin:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={"error": {"code": "FORBIDDEN", "message": "Only administrators can verify completed tasks."}},
                )
            task.status = TaskStatus.VERIFIED.value
            # Release volunteer workload
            if task.assigned_to:
                volunteer = db.query(UserProfile).filter(UserProfile.id == task.assigned_to).first()
                if volunteer and (volunteer.active_task_count or 0) > 0:
                    volunteer.active_task_count -= 1

        # 7. ANY NON-TERMINAL -> CANCELLED (Admin Only)
        elif target_status == TaskStatus.CANCELLED.value:
            if not is_admin:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={"error": {"code": "FORBIDDEN", "message": "Only administrators can cancel tasks."}},
                )
            # Release volunteer workload if task was assigned
            if task.assigned_to:
                volunteer = db.query(UserProfile).filter(UserProfile.id == task.assigned_to).first()
                if volunteer and (volunteer.active_task_count or 0) > 0:
                    volunteer.active_task_count -= 1
                record_assignment_history(task.id, task.assigned_to, AssignmentAction.CANCELLED, reason or "Task cancelled by admin", db)
            task.status = TaskStatus.CANCELLED.value

        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": {
                        "code": "INVALID_STATUS_TRANSITION",
                        "message": f"Unsupported target status '{target_status}'.",
                    }
                },
            )

        task.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(task)
        return task
    except Exception:
        db.rollback()
        raise
    finally:
        if should_close:
            db.close()


def submit_completion_evidence(
    task: Task,
    actor: UserProfile,
    evidence_data: CompletionEvidenceCreate,
    db: Session,
) -> CompletionEvidence:
    """
    Submits completion evidence and transitions task status to completion_submitted.
    """
    if task.status != TaskStatus.ACTIVE.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "INVALID_STATUS_TRANSITION",
                    "message": f"Task must be in 'active' status to submit completion. Current status is '{task.status}'.",
                }
            },
        )
    if actor.role != UserRole.ADMIN.value and actor.id != task.assigned_to:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": {"code": "FORBIDDEN", "message": "Only the assigned volunteer can submit completion evidence."}},
        )

    evidence = CompletionEvidence(
        task_id=task.id,
        volunteer_id=actor.id,
        note=evidence_data.note.strip(),
        evidence_urls=evidence_data.evidence_urls or [],
    )
    try:
        db.add(evidence)
        task.status = TaskStatus.COMPLETION_SUBMITTED.value
        task.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(evidence)
        return evidence
    except Exception:
        db.rollback()
        raise


def submit_task_feedback(
    task: Task,
    actor: UserProfile,
    feedback_data: TaskFeedbackCreate,
    db: Session,
) -> TaskFeedback:
    """
    Submits feedback on a verified task. Only allowed for authorized community user (e.g. creator or community).
    """
    if task.status != TaskStatus.VERIFIED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": {
                    "code": "INVALID_STATUS_TRANSITION",
                    "message": f"Feedback can only be submitted on 'verified' tasks. Current status is '{task.status}'.",
                }
            },
        )

    # Creator or community user check
    if actor.role != UserRole.ADMIN.value and actor.id != task.created_by:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": {"code": "FORBIDDEN", "message": "Only the community creator can submit feedback for this task."}},
        )

    # Prevent duplicate feedback from the same user for this task
    existing = db.query(TaskFeedback).filter(
        TaskFeedback.task_id == task.id,
        TaskFeedback.user_id == actor.id,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "VALIDATION_ERROR", "message": "Feedback has already been submitted for this task."}},
        )

    feedback = TaskFeedback(
        task_id=task.id,
        user_id=actor.id,
        rating=feedback_data.rating,
        comment=feedback_data.comment.strip() if feedback_data.comment else None,
    )
    try:
        db.add(feedback)
        db.commit()
        db.refresh(feedback)
        return feedback
    except Exception:
        db.rollback()
        raise
