# server/database/bootstrap_tools/bootstrap.py
import sys
from pathlib import Path

# Add server directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from server.database.bootstrap_tools.section_and_table_discovery import discover_sections
from server.database.bootstrap_tools.generate_small_avatars import create_all_small_avatars
from server.database.bootstrap_tools.download_large_avatars import download_character_avatars
from server.database.bootstrap_tools.build_character_csv import scrape_character_data
from server.database.bootstrap_tools.vector_database_builder import build_vector_database


def fetch_static_data():
    """Download and process all static data from wiki"""
    scrape_character_data() # creates a table of all characters
    download_character_avatars(skip_existing=True)
    create_all_small_avatars(small_size=128, skip_existing=True)
    discover_sections()

def bootstrap(include_vector_db=True):
    """Complete database and data initialization"""
    print("Starting bootstrap process...")
    
    # Fetch all static data
    fetch_static_data()
    
    # Build vector database if requested
    if include_vector_db:
        print("\nBuilding vector database...")
        build_vector_database()
    
    print("\nBootstrap complete!")


if __name__ == "__main__":
    # Note: Don't forget to update headers to avoid bot detection
    bootstrap()