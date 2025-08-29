# server/config/settings.py
import os
from pathlib import Path

from dotenv import load_dotenv

# Project paths - assuming we're running from guess_game/ (project root)
BASE_DIR = Path(__file__).parent.parent  # server/
PROJECT_ROOT = BASE_DIR.parent           # guess_game/

# Environment file path
ENV_FILE = BASE_DIR / '.env'

load_dotenv(ENV_FILE)

# Data directories
DATA_DIR = BASE_DIR / "data"
STATIC_DATA_DIR = BASE_DIR / "database" / "static_data"
DATABASE_PATH = DATA_DIR / "app.db"
VECTOR_DB_PATH = DATA_DIR / "character_vector_db"

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DATABASE_PATH}")

# Image directories
LARGE_AVATARS_DIR = STATIC_DATA_DIR / "img" / "lg_avatars"
SMALL_AVATARS_DIR = STATIC_DATA_DIR / "img" / "sm_avatars"

# Data files
CHARACTER_CSV_PATH = STATIC_DATA_DIR / "character_data.csv"
DISCOVERY_PATH = STATIC_DATA_DIR / "discovery_results.txt"
ARCS_JSON_PATH = STATIC_DATA_DIR / "arcs.json"
GAME_PROMPT_PATH = STATIC_DATA_DIR / "game_prompt.txt"

# Embedding settings
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
CHUNK_SIZE = 1000
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

# Character scraping settings
WHITELISTED_SECTIONS = [
    'Abilities',
    'Abilities & Powers',
    'Abilities and Biology',
    'Abilities and Power',
    'Abilities and Powers',
    'Abilities and powers',
    'Abilities And Powers',
    'Abilities and Traits',
    'Appearance',
    'Appearances',
    'Behavior',
    'Biography',
    'Citizens',
    'Crew Members',
    'Crew Strength',
    'Development Towards Nami',
    'During and After the Timeskip',
    'Emperors and Crews',
    'Emperors and Groups',
    'Entering Impel Down',
    'Family',
    'Final',
    'History',
    'Jolly Roger',
    'New World',
    'Other Appearances',
    'Overall Strength',
    'Overview',
    'Paradise',
    'Personalities',
    'Personality',
    'Personality and Relationships',
    'Pirates',
    'Post Timeskip',
    'Powers and Abilities',
    'Relationship',
    'Relationships',
    'Ship',
    'Ship Design and Appearance',
    'Ships',
    'Summit War',
    'The Final Sea: The New World Saga',
    'Turtles',
    'Wano',
    'Whole Cake',
    'World Government',
    'Yonko and Crews'
]


WHITELISTED_STATISTICS = [
    ('status', 'statistics'),
    ('occupations', 'statistics'),
    ('affiliations', 'statistics'),
    ('residence', 'statistics'),
    ('birthday', 'statistics'),
    ('origin', 'statistics'),
    ('age', 'statistics'),
    ('height', 'statistics'),
    ('epithet', 'statistics'),
    ('bounty', 'statistics'),
    ('type', 'devil fruit'),
    ('english name', 'devil fruit'),
    ('japanese name', 'devil fruit'),
    ('meaning', 'devil fruit'),
    ('alias', 'statistics'),
    ('age at death', 'statistics'),
    ('birth name', 'statistics'),
    ('doriki', 'statistics'),
    ('weight', 'statistics'),
    ('gladiatornumber', 'statistics'),
    ('cp9key', 'statistics'),
    ('length', 'statistics'),
    ('size', 'statistics'),
]

# Ensure data directories exist
DATA_DIR.mkdir(exist_ok=True)
LARGE_AVATARS_DIR.mkdir(parents=True, exist_ok=True)
SMALL_AVATARS_DIR.mkdir(parents=True, exist_ok=True)