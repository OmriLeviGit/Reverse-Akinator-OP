# server/config/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager
from .settings import DATABASE_URL, DEBUG

# Create engine
engine = create_engine(
    DATABASE_URL,
    echo=DEBUG,  # Log SQL queries in debug mode
    connect_args={
        "check_same_thread": False,  # For SQLite
        "pragma_statements": [
            "PRAGMA journal_mode=WAL",
            "PRAGMA synchronous=NORMAL",
            "PRAGMA cache_size=1000",
            "PRAGMA temp_store=memory"
        ]
    }
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