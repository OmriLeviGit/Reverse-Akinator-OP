# server/database/bootstrap_tools/bootstrap.py
import sys
from pathlib import Path

# Add project root to path for imports
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from server.config.settings import (
    CHARACTER_CSV_PATH,
    LARGE_AVATARS_DIR,
    SMALL_AVATARS_DIR
)
from server.database.bootstrap_tools.generate_small_avatars import create_all_small_avatars
from server.database.bootstrap_tools.download_large_avatars import download_character_avatars
from server.database.bootstrap_tools.fetch_character_data import scrape_character_data


def fetch_static_data():
    """Download and process all static data from wiki"""
    scrape_character_data(CHARACTER_CSV_PATH)
    download_character_avatars(CHARACTER_CSV_PATH, LARGE_AVATARS_DIR, skip_existing=True)
    create_all_small_avatars(LARGE_AVATARS_DIR, SMALL_AVATARS_DIR, small_size=128, skip_existing=True)

def bootstrap():
    """Bootstrap all data"""
    fetch_static_data()

if __name__ == "__main__":
    # Note: Don't forget to update headers to avoid bot detection
    bootstrap()