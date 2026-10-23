"""
Database configuration and session management for SQLite with SQLAlchemy.
Ensures the data directory exists and tables are created safely without data loss.
"""
import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Default SQLite database path: backend/data/ngo_community.db
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_DATA_DIR = BACKEND_DIR / "data"
DEFAULT_DB_PATH = DEFAULT_DATA_DIR / "ngo_community.db"

# Allow override via DATABASE_URL environment variable
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = f"sqlite:///{DEFAULT_DB_PATH.as_posix()}"

# SQLite specific connect arguments
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=os.getenv("SQL_ECHO", "false").lower() == "true",
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def ensure_data_directory() -> Path:
    """Ensure that the directory for SQLite database storage exists."""
    if DATABASE_URL.startswith("sqlite"):
        db_file_path = DATABASE_URL.replace("sqlite:///", "")
        db_dir = Path(db_file_path).parent
        db_dir.mkdir(parents=True, exist_ok=True)
        return db_dir
    return DEFAULT_DATA_DIR


def init_db() -> None:
    """
    Initializes database tables safely.
    Does NOT drop existing tables or delete existing data.
    """
    ensure_data_directory()
    # Import all models to ensure they are registered with Base.metadata before creation
    import app.models  # noqa: F401
    Base.metadata.create_all(bind=engine)
