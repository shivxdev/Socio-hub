"""
SQLAlchemy model for Task Feedback.
"""
from datetime import datetime, timezone
from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.db.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class TaskFeedback(Base):
    __tablename__ = "task_feedbacks"
    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="check_valid_rating_range"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    # Relationships
    task = relationship("Task", back_populates="feedback")
    user = relationship("UserProfile", back_populates="feedbacks")

    def __repr__(self) -> str:
        return f"<TaskFeedback id={self.id} task_id={self.task_id} rating={self.rating}>"
