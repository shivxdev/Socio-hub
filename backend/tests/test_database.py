"""
Tests for Database initialization, SQLAlchemy models, relationships, and constraints.
"""
from datetime import datetime, timedelta, timezone
from pathlib import Path
import sys
import unittest

from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.db.database import Base, init_db
from app.models.assignment_history import AssignmentHistory
from app.models.evidence import CompletionEvidence
from app.models.feedback import TaskFeedback
from app.models.task import Task
from app.models.user import UserProfile
from app.schemas.enums import AssignmentAction, ProblemCategory, TaskPriority, TaskStatus, UserRole


class TestDatabaseAndModels(unittest.TestCase):
    def setUp(self):
        # Use an in-memory SQLite database isolated for each test
        self.engine = create_engine("sqlite:///:memory:", echo=False)
        self.TestSession = sessionmaker(bind=self.engine)
        Base.metadata.create_all(bind=self.engine)
        self.session = self.TestSession()

    def tearDown(self):
        self.session.close()
        Base.metadata.drop_all(bind=self.engine)

    def test_init_db_creates_tables_safely(self):
        """Verifies init_db does not drop tables or crash."""
        init_db()
        tables = list(Base.metadata.tables.keys())
        self.assertIn("users", tables)
        self.assertIn("tasks", tables)
        self.assertIn("completion_evidences", tables)
        self.assertIn("task_feedbacks", tables)
        self.assertIn("assignment_history", tables)

    def test_user_profile_persistence_and_unique_email(self):
        """Test persisting user profiles and enforcing unique email constraint."""
        user1 = UserProfile(
            id="uid_1",
            display_name="Alice Volunteer",
            email="alice@example.com",
            role=UserRole.VOLUNTEER.value,
            skills=["first aid", "logistics"],
            service_locations=["Downtown", "North Ward"],
            is_available=True,
            active_task_count=0,
        )
        self.session.add(user1)
        self.session.commit()

        queried = self.session.query(UserProfile).filter(UserProfile.id == "uid_1").first()
        self.assertIsNotNone(queried)
        self.assertEqual(queried.display_name, "Alice Volunteer")
        self.assertEqual(queried.skills, ["first aid", "logistics"])
        self.assertEqual(queried.service_locations, ["Downtown", "North Ward"])

        # Attempt duplicate email
        duplicate = UserProfile(
            id="uid_2",
            display_name="Bob Duplicate",
            email="alice@example.com",
            role=UserRole.COMMUNITY.value,
        )
        self.session.add(duplicate)
        with self.assertRaises(IntegrityError):
            self.session.commit()
        self.session.rollback()

    def test_task_relationships_and_foreign_keys(self):
        """Test task creation with creator and assignee relationships."""
        creator = UserProfile(
            id="uid_creator",
            display_name="Carol Community",
            email="carol@example.com",
            role=UserRole.COMMUNITY.value,
        )
        volunteer = UserProfile(
            id="uid_volunteer",
            display_name="Dave Volunteer",
            email="dave@example.com",
            role=UserRole.VOLUNTEER.value,
        )
        self.session.add_all([creator, volunteer])
        self.session.commit()

        task = Task(
            title="Emergency Medical Support",
            description="Need first-aid kit and trained volunteer",
            category=ProblemCategory.MEDICAL.value,
            priority=TaskPriority.HIGH.value,
            location="Downtown",
            skills_required=["first aid"],
            resources_required=["bandages"],
            status=TaskStatus.ASSIGNED.value,
            created_by=creator.id,
            assigned_to=volunteer.id,
        )
        self.session.add(task)
        self.session.commit()

        # Check relationships
        self.assertEqual(task.creator.id, "uid_creator")
        self.assertEqual(task.assignee.id, "uid_volunteer")
        self.assertEqual(len(creator.tasks_created), 1)
        self.assertEqual(len(volunteer.tasks_assigned), 1)

    def test_task_dynamic_is_overdue_property(self):
        """Test dynamic is_overdue property under different deadlines and states."""
        creator = UserProfile(
            id="uid_creator_2",
            display_name="Eva Community",
            email="eva@example.com",
            role=UserRole.COMMUNITY.value,
        )
        self.session.add(creator)
        self.session.commit()

        past_deadline = datetime.now(timezone.utc) - timedelta(hours=2)
        future_deadline = datetime.now(timezone.utc) + timedelta(hours=5)

        task_overdue = Task(
            title="Overdue Task",
            description="Should be overdue",
            category=ProblemCategory.FOOD.value,
            priority=TaskPriority.MEDIUM.value,
            created_by=creator.id,
            deadline=past_deadline,
            status=TaskStatus.ACTIVE.value,
        )
        task_future = Task(
            title="Future Task",
            description="Should not be overdue",
            category=ProblemCategory.FOOD.value,
            priority=TaskPriority.LOW.value,
            created_by=creator.id,
            deadline=future_deadline,
            status=TaskStatus.ACTIVE.value,
        )
        task_verified_past = Task(
            title="Verified Past Task",
            description="Verified tasks are never overdue",
            category=ProblemCategory.FOOD.value,
            priority=TaskPriority.MEDIUM.value,
            created_by=creator.id,
            deadline=past_deadline,
            status=TaskStatus.VERIFIED.value,
        )

        self.assertTrue(task_overdue.is_overdue)
        self.assertFalse(task_future.is_overdue)
        self.assertFalse(task_verified_past.is_overdue)

    def test_completion_evidence_and_feedback(self):
        """Test completion evidence submission and task feedback models."""
        creator = UserProfile(
            id="uid_c3",
            display_name="Faith Community",
            email="faith@example.com",
            role=UserRole.COMMUNITY.value,
        )
        volunteer = UserProfile(
            id="uid_v3",
            display_name="George Volunteer",
            email="george@example.com",
            role=UserRole.VOLUNTEER.value,
        )
        self.session.add_all([creator, volunteer])
        self.session.commit()

        task = Task(
            title="Distribute Food",
            description="Food packages to center",
            category=ProblemCategory.FOOD.value,
            priority=TaskPriority.MEDIUM.value,
            created_by=creator.id,
            assigned_to=volunteer.id,
            status=TaskStatus.ACTIVE.value,
        )
        self.session.add(task)
        self.session.commit()

        evidence = CompletionEvidence(
            task_id=task.id,
            volunteer_id=volunteer.id,
            note="10 food parcels successfully delivered.",
            evidence_urls=["https://example.com/receipt.jpg"],
        )
        self.session.add(evidence)
        self.session.commit()

        feedback = TaskFeedback(
            task_id=task.id,
            user_id=creator.id,
            rating=5,
            comment="Excellent and prompt help!",
        )
        self.session.add(feedback)
        self.session.commit()

        self.assertEqual(len(task.evidence), 1)
        self.assertEqual(task.evidence[0].note, "10 food parcels successfully delivered.")
        self.assertEqual(len(task.feedback), 1)
        self.assertEqual(task.feedback[0].rating, 5)


if __name__ == "__main__":
    unittest.main()
