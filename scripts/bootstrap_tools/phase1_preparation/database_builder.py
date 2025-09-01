# server/database/bootstrap_tools/phase1_preparation/database_builder.py
import csv
import json
import sys
from pathlib import Path

# Add server directory to path
sys.path.append(str(Path(__file__).parent.parent.parent.parent))

from guessing_game.config.database import engine, get_db_session
from guessing_game.config.settings import ARCS_JSON_PATH
from ..bootstrap_settings import CHARACTER_CSV_PATH
from guessing_game.config.vector_db import initialize_collection
from guessing_game.models.base import Base
from guessing_game.models.db_arc import DBArc
from guessing_game.models.db_character import DBCharacter

class DatabaseBuilder:
    def __init__(self):
        self.engine = engine
        self.characters_file = CHARACTER_CSV_PATH
        self.arcs_file = ARCS_JSON_PATH

    def create_tables(self):
        """Create all database tables"""
        Base.metadata.create_all(self.engine)

    def initialize_vector_db(self):
        """Initialize the vector database collection"""
        try:
            print("Initializing vector database...")
            client, collection, model = initialize_collection()
            print(f"Vector database initialized with collection: {collection.name}")
            return client, collection, model
        except Exception as e:
            print(f"Error initializing vector database: {e}")
            raise

    def drop_tables(self):
        """Drop all database tables"""
        Base.metadata.drop_all(self.engine)

    def reset_database(self):
        """Drop and recreate all tables and initialize vector DB"""
        print("\n", "=" * 20, "Database reset", "=" * 20)
        self.drop_tables()
        self.create_tables()
        self.initialize_vector_db()
        self.load_initial_data()

    def load_initial_data(self):
        with get_db_session() as session:
            if session.query(DBCharacter).count() == 0:
                self.load_characters_from_csv()

            if session.query(DBArc).count() == 0:
                self.load_arcs_from_json()

    def _create_character_from_row(self, row):
        """Create a DBCharacter object from a CSV row"""
        field_mapping = {
            'ID': 'id',
            'Name': 'name',
            'Type': 'filler_status',
            'Wiki': 'wiki_link',
            'Chapter': 'chapter',
            'Episode': 'episode',
            'Number': 'number',
            'Year': 'year',
            'Note': 'note',
            'Appears in': 'appears_in'
        }

        character_data = {}
        for csv_key, model_key in field_mapping.items():
            if csv_key in row:
                value = row[csv_key]

                # Convert empty strings to None
                if value == '':
                    value = None
                # Handle episode and number fields specially
                elif model_key in ['episode', 'number'] and value is not None:
                    try:
                        value = int(float(value))
                    except ValueError:
                        # If episode/number is a string, move it to appears_in and set to None
                        character_data['appears_in'] = value
                        value = None
                # Convert string numbers to integers for other integer fields
                elif model_key in ['chapter', 'year'] and value is not None:
                    value = int(float(value))

                character_data[model_key] = value

        return DBCharacter(**character_data)


    def load_characters_from_csv(self):
        """Load characters from CSV file"""
        with get_db_session() as session:
            try:
                with open(self.characters_file, 'r', encoding='utf-8') as file:
                    reader = csv.DictReader(file)
                    for row in reader:
                        character = self._create_character_from_row(row)
                        session.add(character)

                print(f"Loaded characters from {self.characters_file}")

            except Exception as e:
                print(f"Error: {e}")
                raise

    def load_arcs_from_json(self):
        """Load arcs from JSON file"""
        with get_db_session() as session:
            try:
                with open(self.arcs_file, 'r', encoding='utf-8') as file:
                    data = json.load(file)

                    for arc_data in data:
                        arc = DBArc(**arc_data)
                        session.add(arc)

                print(f"Loaded arcs from {self.arcs_file}")

            except Exception as e:
                print(f"Error loading JSON: {e}")
                raise

def main():
    builder = DatabaseBuilder()
    builder.reset_database()

if __name__ == "__main__":
    main()