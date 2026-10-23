"""
Tests for Task Persistence and Lifecycle State Transitions.
Follows 00_READ_FIRST_AND_SHARED_CONTRACT.md and 03_MEMBER_3_DATABASE_AUTH_ASSIGNMENT.md.
"""
from pathlib import Path
import sys
import unittest

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.db.database import Base
from app.models.assignment_history import AssignmentHistory
from app.models.evidence import CompletionEvidence
from app.models.feedback import TaskFeedback
from app.models.task import Task
from app.models.user import UserProfile
from app.schemas.enums import ProblemCategory, TaskPriority, TaskStatus, UserRole
from app.schemas.task import CompletionEvidenceCreate, TaskCreate, TaskFeedbackCreate
from app.services.task_service import (
    create_task,
    get_task_by_id,
    submit_completion_evidence,
    submit_task_feedback,
    transition_task_status,
)


class TestTaskLifecycle(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:", echo=False)
        self.TestSession = sessionmaker(bind=self.engine)
        Base.metadata.create_all(bind=self.engine)
        self.session = self.TestSession()

        # Users setup
        self.community_user = UserProfile(
            id="uid_comm",
            display_name="Community Member",
            email="community@example.com",
            role=UserRole.COMMUNITY.value,
        )
        self.volunteer_user = UserProfile(
            id="uid_vol",
            display_name="Assigned Volunteer",
            email="vol@example.com",
            role=UserRole.VOLUNTEER.value,
            active_task_count=0,
        )
        self.other_volunteer = UserProfile(
            id="uid_other_vol",
            display_name="Other Volunteer",
            email="other@example.com",
            role=UserRole.VOLUNTEER.value,
            active_task_count=0,
        )
        self.admin_user = UserProfile(
            id="uid_admin",
            display_name="Admin Coordinator",
            email="admin@example.com",
            role=UserRole.ADMIN.value,
        )
        self.session.add_all([self.community_user, self.volunteer_user, self.other_volunteer, self.admin_user])
        self.session.commit()

    def tearDown(self):
        self.session.close()
        Base.metadata.drop_all(bind=self.engine)

    # 1. Create Task Helper
    def test_create_and_get_task(self):
        task_data = TaskCreate(
            title="Clean local park",
            description="Remove trash and clean pathways",
            category=ProblemCategory.INFRASTRUCTURE,
            priority=TaskPriority.LOW,
            location="Green Park",
            skills_required=["gardening", "cleaning"],
            resources_required=["bags", "gloves"],
        )
        task = create_task(task_data, created_by=self.community_user.id, db=self.session)
        self.assertIsNotNone(task.id)
        self.assertEqual(task.status, TaskStatus.PENDING.value)
        self.assertIsNone(task.assigned_to)

        fetched = get_task_by_id(task.id, db=self.session)
        self.assertEqual(fetched.id, task.id)
        self.assertEqual(fetched.title, "Clean local park")

    # 2. Full Happy Path Lifecycle
    def test_full_valid_task_lifecycle(self):
        # Create
        task_data = TaskCreate(
            title="Deliver Ration Kits",
            description="Food kits for flood victims",
            category=ProblemCategory.FOOD,
            priority=TaskPriority.HIGH,
            location="Shelter 4",
        )
        task = create_task(task_data, created_by=self.community_user.id, db=self.session)
        self.assertEqual(task.status, TaskStatus.PENDING.value)

        # 1. pending -> assigned (by admin)
        task = transition_task_status(
            task,
            TaskStatus.ASSIGNED,
            actor=self.admin_user,
            assignee_id=self.volunteer_user.id,
            db=self.session,
        )
        self.assertEqual(task.status, TaskStatus.ASSIGNED.value)
        self.assertEqual(task.assigned_to, self.volunteer_user.id)
        # Volunteer workload incremented
        self.assertEqual(self.volunteer_user.active_task_count, 1)

        # 2. assigned -> accepted (by assigned volunteer)
        task = transition_task_status(task, TaskStatus.ACCEPTED, actor=self.volunteer_user, db=self.session)
        self.assertEqual(task.status, TaskStatus.ACCEPTED.value)

        # 3. accepted -> active (by assigned volunteer)
        task = transition_task_status(task, TaskStatus.ACTIVE, actor=self.volunteer_user, db=self.session)
        self.assertEqual(task.status, TaskStatus.ACTIVE.value)

        # 4. active -> completion_submitted (via submit_completion_evidence)
        evidence_in = CompletionEvidenceCreate(
            note="Delivered 25 ration kits successfully.",
            evidence_urls=["https://example.com/receipt.pdf"],
        )
        evidence = submit_completion_evidence(task, actor=self.volunteer_user, evidence_data=evidence_in, db=self.session)
        self.assertEqual(task.status, TaskStatus.COMPLETION_SUBMITTED.value)
        self.assertEqual(evidence.volunteer_id, self.volunteer_user.id)

        # 5. completion_submitted -> verified (by admin)
        task = transition_task_status(task, TaskStatus.VERIFIED, actor=self.admin_user, db=self.session)
        self.assertEqual(task.status, TaskStatus.VERIFIED.value)
        # Volunteer workload decremented upon verification
        self.assertEqual(self.volunteer_user.active_task_count, 0)

        # 6. Feedback submitted by community user
        feedback_in = TaskFeedbackCreate(rating=5, comment="Thank you for the quick relief kits!")
        fb = submit_task_feedback(task, actor=self.community_user, feedback_data=feedback_in, db=self.session)
        self.assertEqual(fb.rating, 5)
        self.assertEqual(fb.user_id, self.community_user.id)

    # 3. Rejection Flow: assigned -> rejected -> returns to pending
    def test_rejection_lifecycle_and_history(self):
        task_data = TaskCreate(
            title="Roof Repair",
            description="Leaking roof repair",
            category=ProblemCategory.INFRASTRUCTURE,
            priority=TaskPriority.MEDIUM,
        )
        task = create_task(task_data, created_by=self.community_user.id, db=self.session)
        task = transition_task_status(
            task,
            TaskStatus.ASSIGNED,
            actor=self.admin_user,
            assignee_id=self.volunteer_user.id,
            db=self.session,
        )
        self.assertEqual(self.volunteer_user.active_task_count, 1)

        # Volunteer rejects with a reason
        task = transition_task_status(
            task,
            TaskStatus.REJECTED,
            actor=self.volunteer_user,
            db=self.session,
            reason="Lacking ladder equipment today",
        )
        # Task reverts to pending, unassigned
        self.assertEqual(task.status, TaskStatus.PENDING.value)
        self.assertIsNone(task.assigned_to)
        # Workload released
        self.assertEqual(self.volunteer_user.active_task_count, 0)

        # Verify audit history was recorded
        history = self.session.query(AssignmentHistory).filter(AssignmentHistory.task_id == task.id).all()
        actions = [h.action for h in history]
        self.assertIn("assigned", actions)
        self.assertIn("rejected", actions)

    # 4. Unauthorized Actor Attempts
    def test_unauthorized_actor_rejections(self):
        task_data = TaskCreate(
            title="Medical Triage",
            description="Medical checkup",
            category=ProblemCategory.MEDICAL,
            priority=TaskPriority.HIGH,
        )
        task = create_task(task_data, created_by=self.community_user.id, db=self.session)
        task = transition_task_status(
            task,
            TaskStatus.ASSIGNED,
            actor=self.admin_user,
            assignee_id=self.volunteer_user.id,
            db=self.session,
        )

        # Other volunteer tries to accept someone else's task (Forbidden 403)
        with self.assertRaises(HTTPException) as ctx:
            transition_task_status(task, TaskStatus.ACCEPTED, actor=self.other_volunteer, db=self.session)
        self.assertEqual(ctx.exception.status_code, 403)

        # Non-admin tries to verify completion (Forbidden 403)
        task.status = TaskStatus.COMPLETION_SUBMITTED.value
        with self.assertRaises(HTTPException) as ctx:
            transition_task_status(task, TaskStatus.VERIFIED, actor=self.community_user, db=self.session)
        self.assertEqual(ctx.exception.status_code, 403)

    # Regression test: Volunteer must never be able to trigger pending -> assigned
    def test_volunteer_cannot_assign_task(self):
        task_data = TaskCreate(
            title="Community Food Drive",
            description="Sorting groceries",
            category=ProblemCategory.FOOD,
            priority=TaskPriority.MEDIUM,
        )
        task = create_task(task_data, created_by=self.community_user.id, db=self.session)
        self.assertEqual(task.status, TaskStatus.PENDING.value)

        # Volunteer actor attempts to trigger pending -> assigned (Forbidden 403)
        with self.assertRaises(HTTPException) as ctx:
            transition_task_status(
                task,
                TaskStatus.ASSIGNED,
                actor=self.volunteer_user,
                assignee_id=self.other_volunteer.id,
                db=self.session,
            )
        self.assertEqual(ctx.exception.status_code, 403)
        self.assertEqual(ctx.exception.detail["error"]["code"], "FORBIDDEN")

    # Regression test: Direct assignment call enforces workload cap MAX_ACTIVE_TASKS = 2
    def test_direct_assignment_enforces_workload_cap(self):
        # Set volunteer to already have 2 active tasks
        self.volunteer_user.active_task_count = 2
        self.session.commit()

        task_data = TaskCreate(
            title="Shelter Setup",
            description="Setup emergency beds",
            category=ProblemCategory.INFRASTRUCTURE,
            priority=TaskPriority.HIGH,
        )
        task = create_task(task_data, created_by=self.community_user.id, db=self.session)

        # Admin tries to assign volunteer who is already at maximum capacity
        with self.assertRaises(HTTPException) as ctx:
            transition_task_status(
                task,
                TaskStatus.ASSIGNED,
                actor=self.admin_user,
                assignee_id=self.volunteer_user.id,
                db=self.session,
            )
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertEqual(ctx.exception.detail["error"]["code"], "VALIDATION_ERROR")
        self.assertIn("maximum active tasks limit", ctx.exception.detail["error"]["message"])

    # Regression test: Transaction rollback on commit error
    def test_transaction_rollback_on_commit_error(self):
        from unittest.mock import patch
        task_data = TaskCreate(
            title="Park cleanup",
            description="Clean paths",
            category=ProblemCategory.INFRASTRUCTURE,
            priority=TaskPriority.LOW,
        )
        task = create_task(task_data, created_by=self.community_user.id, db=self.session)

        # Simulate database commit error during transition
        with patch.object(self.session, "commit", side_effect=RuntimeError("Simulated DB Disk Failure")):
            with patch.object(self.session, "rollback") as mock_rollback:
                with self.assertRaises(RuntimeError):
                    transition_task_status(
                        task,
                        TaskStatus.ASSIGNED,
                        actor=self.admin_user,
                        assignee_id=self.volunteer_user.id,
                        db=self.session,
                    )
                mock_rollback.assert_called_once()

    # 5. Invalid Status Transitions (400)
    def test_invalid_status_transitions(self):
        task_data = TaskCreate(
            title="School supplies",
            description="Books distribution",
            category=ProblemCategory.EDUCATION,
            priority=TaskPriority.LOW,
        )
        task = create_task(task_data, created_by=self.community_user.id, db=self.session)

        # Cannot jump from pending directly to verified or completed
        with self.assertRaises(HTTPException) as ctx:
            transition_task_status(task, TaskStatus.VERIFIED, actor=self.admin_user, db=self.session)
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertEqual(ctx.exception.detail["error"]["code"], "INVALID_STATUS_TRANSITION")

        # Cannot accept a task that is still pending
        with self.assertRaises(HTTPException) as ctx:
            transition_task_status(task, TaskStatus.ACCEPTED, actor=self.volunteer_user, db=self.session)
        self.assertEqual(ctx.exception.status_code, 400)

    # 6. Cancellation Flow (Admin Only)
    def test_cancellation_by_admin(self):
        task_data = TaskCreate(
            title="Temporary Water Tank",
            description="Need clean water tank",
            category=ProblemCategory.EMERGENCY,
            priority=TaskPriority.HIGH,
        )
        task = create_task(task_data, created_by=self.community_user.id, db=self.session)
        task = transition_task_status(
            task,
            TaskStatus.ASSIGNED,
            actor=self.admin_user,
            assignee_id=self.volunteer_user.id,
            db=self.session,
        )
        self.assertEqual(self.volunteer_user.active_task_count, 1)

        # Cancelled by admin
        task = transition_task_status(
            task,
            TaskStatus.CANCELLED,
            actor=self.admin_user,
            db=self.session,
            reason="Municipality restored water line",
        )
        self.assertEqual(task.status, TaskStatus.CANCELLED.value)
        self.assertEqual(self.volunteer_user.active_task_count, 0)

        # Terminal state cannot be transitioned again
        with self.assertRaises(HTTPException) as ctx:
            transition_task_status(task, TaskStatus.ACTIVE, actor=self.admin_user, db=self.session)
        self.assertEqual(ctx.exception.status_code, 400)


if __name__ == "__main__":
    unittest.main()
