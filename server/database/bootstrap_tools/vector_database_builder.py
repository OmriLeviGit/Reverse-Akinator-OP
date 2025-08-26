# server/database/bootstrap_tools/vector_database_builder.py
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from server.config.vector_db import initialize_collection, add_character_to_db


def get_sample_characters():
    """Return sample character data"""
    return [
        {
            'name': 'Monkey D. Luffy',
            'structured': {
                'height': '174 cm',
                'age': '19',
                'first_appearance': 'Chapter 1',
                'occupation': 'Pirate Captain',
                'devil_fruit': 'Gomu Gomu no Mi'
            },
            'narrative': [
                "Luffy's basic info and personality...",
                "Luffy's devil fruit powers and abilities...",
                "Luffy's family and background...",
                "Luffy's crew and relationships..."
            ]
        },
    ]


def main():
    client, collection, model = initialize_collection()
    characters = get_sample_characters()

    for char in characters:
        add_character_to_db(collection, model, char['name'], char['structured'], char['narrative'])

    print("Database built successfully!")
    print(f"Collection now has {collection.count()} total chunks")


if __name__ == "__main__":
    main()