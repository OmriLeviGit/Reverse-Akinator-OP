# server/database/bootstrap_tools/vector_database_builder.py
import sys
from pathlib import Path

# Add server directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from server.config.vector_db import initialize_collection, add_character_to_db, load_characters_from_csv
from server.database.bootstrap_tools.character_scraping import scrape_character


def build_vector_database():
    """Initialize the database by scraping and adding all characters from the CSV file"""
    print("Initializing vector database with all characters...")

    # Initialize database
    client, collection, model = initialize_collection()

    # Load all characters from CSV
    characters = load_characters_from_csv()

    if not characters:
        print("No characters found in CSV file")
        return

    print(f"Found {len(characters)} characters to process")

    # Process each character
    successful = 0
    failed = 0

    for i, char_info in enumerate(characters, 1):
        character_id = char_info['id']
        wiki_url = char_info['url']

        print(f"Processing {i}/{len(characters)}: {character_id}")

        try:
            # Scrape character data
            structured_data, narrative_sections = scrape_character(wiki_url)

            # Add to database
            add_character_to_db(collection, model, character_id, structured_data, narrative_sections)

            successful += 1

        except Exception as e:
            print(f"ERROR processing {character_id}: {e}")
            failed += 1
            continue

    # Summary
    print(f"\n{'=' * 60}")
    print("VECTOR DATABASE INITIALIZATION COMPLETE")
    print(f"{'=' * 60}")
    print(f"Successfully processed: {successful}")
    print(f"Failed: {failed}")
    print(f"Total characters: {len(characters)}")
    print(f"{'=' * 60}")

    return client, collection, model


if __name__ == "__main__":
    build_vector_database()