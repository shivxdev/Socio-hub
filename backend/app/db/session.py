"""Database session and engine configuration.
Agreed interface with Member 3 (Database & Auth).
"""

import os
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config import get_settings

settings = get_settings()

# Ensure SQLite data directory exists if local sqlite path is configured
if settings.database_url.startswith("sqlite:///./"):
    db_relative_path = settings.database_url.replace("sqlite:///./", "")
    db_dir = os.path.dirname(db_relative_path)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)

# Configure SQLAlchemy engine based on DATABASE_URL
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a SQLAlchemy database session.
    Agreed contract with Member 3.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
