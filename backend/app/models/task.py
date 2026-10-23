"""
SQLAlchemy model for Task.
"""
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship
from app.db.database import Base
from app.schemas.enums import TaskStatus


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(120), nullable=False, index=True)
    description = Column(Text, nullable=False)
    category = Column(String(30), nullable=False, index=True)
    priority = Column(String(20), nullable=False, index=True)
    location = Column(String(200), nullable=True, index=True)
    skills_required = Column(JSON, nullable=False, default=list)
    resources_required = Column(JSON, nullable=False, default=list)
    status = Column(String(30), nullable=False, default=TaskStatus.PENDING.value, index=True)

    assigned_to = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    deadline = Column(DateTime(timezone=True), nullable=True)

    created_by = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    # Relationships
    creator = relationship("UserProfile", foreign_keys=[created_by], back_populates="tasks_created")
    assignee = relationship("UserProfile", foreign_keys=[assigned_to], back_populates="tasks_assigned")
    evidence = relationship("CompletionEvidence", back_populates="task", cascade="all, delete-orphan")
    feedback = relationship("TaskFeedback", back_populates="task", cascade="all, delete-orphan")
    assignment_history = relationship("AssignmentHistory", back_populates="task", cascade="all, delete-orphan")

    @property
    def is_overdue(self) -> bool:
        """
        Dynamically calculates whether the task is past its deadline.
        Terminal states (verified, cancelled) are not considered overdue.
        """
        if not self.deadline:
            return False
        if self.status in (TaskStatus.VERIFIED.value, TaskStatus.CANCELLED.value):
            return False

        # Ensure timezone-aware comparison
        target_deadline = self.deadline
        if target_deadline.tzinfo is None:
            target_deadline = target_deadline.replace(tzinfo=timezone.utc)
        return datetime.now(timezone.utc) > target_deadline

    def __repr__(self) -> str:
        return f"<Task id={self.id} title={self.title!r} status={self.status} assigned_to={self.assigned_to}>"
