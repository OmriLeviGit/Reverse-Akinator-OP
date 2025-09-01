# server/config/__init__.py
from .settings import *
from .database import engine, SessionLocal, get_db, get_db_session
from .vector_db import get_vector_client, get_embedding_model, initialize_collection
from .redis_client import get_redis

__all__ = [
    "engine", "SessionLocal", "get_db", "get_db_session",
    "get_vector_client", "get_embedding_model", "initialize_collection",
    "get_redis",
    "DATA_DIR", "DATABASE_PATH", "VECTOR_DB_PATH", "STATIC_DATA_DIR",
    "ARCS_JSON_PATH", "GAME_PROMPT_PATH",
    "EMBEDDING_MODEL", "CHUNK_SIZE", "COLLECTION_NAME", "COLLECTION_METADATA", "GAME_TTL",
    "REDIS_URL", "DATABASE_URL"
]
