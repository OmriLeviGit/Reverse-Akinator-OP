# guessing_game/config/settings.py
import os
from pathlib import Path

# Project paths - for src/guessing_game structure
BASE_DIR = Path(__file__).parent.parent  # src/guessing_game/
SRC_DIR = BASE_DIR.parent                # src/
PROJECT_ROOT = SRC_DIR.parent            # guess_game/ (project root)

# Data directories
DATA_DIR = BASE_DIR / "data"
STATIC_DATA_DIR = BASE_DIR / "static_data"
DATABASE_PATH = DATA_DIR / "app.db"
VECTOR_DB_PATH = DATA_DIR / "character_vector_db"

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATABASE_PATH}")

# Data files
ARCS_JSON_PATH = STATIC_DATA_DIR / "arcs.json"
GAME_PROMPT_PATH = STATIC_DATA_DIR / "game_prompt.txt"

# Embedding settings
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
CHUNK_SIZE = 200  # Target number of words per chunk (was previously character-based)
CHUNK_OVERLAP = 100

# ChromaDB settings
COLLECTION_NAME = "characters"
COLLECTION_METADATA = {"hnsw:space": "cosine"}

# Redis settings
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Game settings
GAME_TTL = 3600  # 1 hour TTL for games

# Environment
DEBUG = os.getenv("DEBUG", "False").lower() == "true"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Ensure data directories exist
DATA_DIR.mkdir(exist_ok=True)