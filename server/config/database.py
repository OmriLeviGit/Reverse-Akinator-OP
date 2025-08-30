# server/config/database.py
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager
from .settings import DATABASE_URL, DEBUG

# Create engine
engine = create_engine(
    DATABASE_URL,
    echo=DEBUG,  # Log SQL queries in debug mode
    connect_args={
        "check_same_thread": False  # For SQLite
    }
)

# Set up SQLite pragmas using event listeners
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.execute("PRAGMA cache_size=1000")
    cursor.execute("PRAGMA temp_store=memory")
    cursor.close()

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