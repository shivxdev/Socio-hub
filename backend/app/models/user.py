"""
SQLAlchemy model for UserProfile.
"""
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Integer, JSON, String
from sqlalchemy.orm import relationship
from app.db.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UserProfile(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True, comment="Firebase UID")
    display_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    role = Column(String(20), nullable=False, default="community", index=True)
    skills = Column(JSON, nullable=False, default=list)
    service_locations = Column(JSON, nullable=False, default=list)
    is_available = Column(Boolean, nullable=False, default=True, index=True)
    active_task_count = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    # Relationships
    tasks_created = relationship(
        "Task",
        foreign_keys="Task.created_by",
        back_populates="creator",
        cascade="all, delete-orphan",
    )
    tasks_assigned = relationship(
        "Task",
        foreign_keys="Task.assigned_to",
        back_populates="assignee",
    )
    evidence_submissions = relationship(
        "CompletionEvidence",
        back_populates="volunteer",
        cascade="all, delete-orphan",
    )
    feedbacks = relationship(
        "TaskFeedback",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    assignment_records = relationship(
        "AssignmentHistory",
        back_populates="volunteer",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<UserProfile id={self.id} email={self.email} role={self.role}>"
