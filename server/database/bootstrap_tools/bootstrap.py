# server/database/bootstrap_tools/bootstrap.py
import sys
from pathlib import Path

# Add server directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from server.database.bootstrap_tools.section_and_table_discovery import discover_sections
from server.database.bootstrap_tools.generate_small_avatars import create_all_small_avatars
from server.database.bootstrap_tools.download_large_avatars import download_character_avatars
from server.database.bootstrap_tools.build_character_csv import scrape_character_data


def fetch_static_data(discover=False):
    """Download and process all static data from wiki"""
    scrape_character_data() # creates a table of all characters
    download_character_avatars(skip_existing=True)
    create_all_small_avatars(small_size=128, skip_existing=True)

    if discover:
        discover_sections()


def bootstrap():
    """Bootstrap all data"""
    fetch_static_data()


if __name__ == "__main__":
    # Note: Don't forget to update headers to avoid bot detection
    bootstrap()