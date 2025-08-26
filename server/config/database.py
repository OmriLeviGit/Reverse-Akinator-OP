# server/config/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager
from .settings import DATABASE_PATH, DEBUG

# Database configuration
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# Create engine
engine = create_engine(
    DATABASE_URL,
    echo=DEBUG,  # Log SQL queries in debug mode
    connect_args={"check_same_thread": False}  # For SQLite
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@contextmanager
def get_db_session():
    """Context manager for database sessions"""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

def get_db():
    """Dependency for getting DB sessions (for FastAPI)"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()