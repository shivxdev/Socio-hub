"""
SQLAlchemy model for Assignment History and rejection tracking.
"""
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.db.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class AssignmentHistory(Base):
    __tablename__ = "assignment_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    volunteer_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(30), nullable=False, index=True)  # assigned, accepted, rejected, reassigned, cancelled
    reason = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    # Relationships
    task = relationship("Task", back_populates="assignment_history")
    volunteer = relationship("UserProfile", back_populates="assignment_records")

    def __repr__(self) -> str:
        return f"<AssignmentHistory id={self.id} task_id={self.task_id} volunteer_id={self.volunteer_id} action={self.action}>"
