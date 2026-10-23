"""
SQLAlchemy model for Completion Evidence.
"""
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship
from app.db.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class CompletionEvidence(Base):
    __tablename__ = "completion_evidences"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    volunteer_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    note = Column(Text, nullable=False)
    evidence_urls = Column(JSON, nullable=False, default=list)
    submitted_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    # Relationships
    task = relationship("Task", back_populates="evidence")
    volunteer = relationship("UserProfile", back_populates="evidence_submissions")

    def __repr__(self) -> str:
        return f"<CompletionEvidence id={self.id} task_id={self.task_id} volunteer_id={self.volunteer_id}>"
