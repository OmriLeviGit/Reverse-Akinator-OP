# server/database/bootstrap_tools/bootstrap.py
"""
Bootstrap script for initializing the One Piece character guessing game database.

WORKFLOW:
1. First run: Set STEP = "fetch_data" and run this script
   - Downloads character data, avatars, and discovers sections/statistics
   - Check server/database/static_data/discovery_results.txt for discovered sections
   - Update server/config/settings.py WHITELISTED_SECTIONS and WHITELISTED_STATISTICS

2. Second run: Set STEP = "build_vector_db" and run this script
   - Builds the vector database using the whitelisted sections from settings.py

3. Full run (after whitelist is configured): Set STEP = "all"
   - Runs both fetch_data and build_vector_db in sequence
"""
import sys
from pathlib import Path

# Add server directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from server.database.bootstrap_tools.section_and_table_discovery import discover_sections
from server.database.bootstrap_tools.generate_small_avatars import create_all_small_avatars
from server.database.bootstrap_tools.download_large_avatars import download_character_avatars
from server.database.bootstrap_tools.build_character_csv import scrape_character_data
from server.database.bootstrap_tools.vector_database_builder import build_vector_database

# CONFIGURATION: Set which step to run
STEP = "fetch_data"  # Options: "fetch_data", "build_vector_db", "all"


def fetch_static_data():
    """
    Download and process all static data from wiki.
    
    This includes:
    - Scraping character data into CSV
    - Downloading character avatars
    - Creating small avatar thumbnails
    - Discovering sections and statistics from wiki pages
    
    After running this, check discovery_results.txt and update settings.py
    """
    print("=== FETCHING STATIC DATA ===")
    print("1. Scraping character data...")
    scrape_character_data()
    
    print("2. Downloading character avatars...")
    download_character_avatars(skip_existing=True)
    
    print("3. Creating small avatar thumbnails...")
    create_all_small_avatars(small_size=128, skip_existing=True)
    
    print("4. Discovering sections and statistics...")
    discover_sections()
    
    print("\n" + "="*60)
    print("MANUAL STEP REQUIRED:")
    print("1. Check server/database/static_data/discovery_results.txt")
    print("2. Update server/config/settings.py:")
    print("   - Add relevant sections to WHITELISTED_SECTIONS")
    print("   - Add relevant statistics to WHITELISTED_STATISTICS")
    print("3. Then change STEP = 'build_vector_db' and run again")
    print("="*60)


def build_vector_database_only():
    """
    Build the vector database using whitelisted sections from settings.py.
    
    This step requires that:
    1. Static data has been fetched (CSV exists)
    2. Settings.py has been updated with desired whitelisted sections
    """
    print("=== BUILDING VECTOR DATABASE ===")
    print("Building vector database with current whitelist settings...")
    build_vector_database()
    print("\nVector database build complete!")


def bootstrap_all():
    """
    Complete bootstrap process - runs both fetch and build steps.
    
    WARNING: Only use this if you've already configured your whitelist settings
    in server/config/settings.py. Otherwise, use the two-step process.
    """
    print("=== COMPLETE BOOTSTRAP PROCESS ===")
    print("Running complete bootstrap (fetch + build)...")
    print("WARNING: This assumes whitelist settings are already configured!\n")
    
    fetch_static_data()
    
    print("\nProceeding to build vector database...")
    print("If your whitelist settings aren't ready, press Ctrl+C now!\n")
    
    build_vector_database_only()
    
    print("\nBootstrap complete!")


if __name__ == "__main__":
    if STEP == "fetch_data":
        fetch_static_data()
    elif STEP == "build_vector_db":
        build_vector_database_only()
    elif STEP == "all":
        bootstrap_all()
    else:
        print(f"Invalid STEP: {STEP}")
        print("Valid options: 'fetch_data', 'build_vector_db', 'all'")
        print("Update the STEP variable at the top of this file.")