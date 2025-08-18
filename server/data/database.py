import csv
import json
import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import sys

from server.data.db_models import DBCharacter, Arc, Base

BASE_DIR = Path(__file__).parent  # Use pathlib.Path
sys.path.append(str(BASE_DIR.parent))



class DatabaseManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if hasattr(self, 'initialized'):
            return

        # Database configuration
        self.database_url = f"sqlite:///{os.path.join(BASE_DIR, 'app.db')}"

        # Create engine and session factory
        self.engine = create_engine(self.database_url)
        self.SessionLocal = sessionmaker(bind=self.engine)

        # Initialize database
        self.create_tables()

        self.data_dir = BASE_DIR
        self.games_file = self.data_dir / "games.csv"
        self.characters_file = self.data_dir / "character_data.csv"
        self.arcs_file = self.data_dir / "arcs.json"

        self.initialized = True


    def create_tables(self):
        """Create all database tables"""
        Base.metadata.create_all(self.engine)

    def drop_tables(self):
        """Drop all database tables"""
        Base.metadata.drop_all(self.engine)

    def get_session(self):
        """Get a database session"""
        return self.SessionLocal()

    def close_session(self, session):
        """Close a database session"""
        session.close()

    def reset_database(self):
        """Drop and recreate all tables"""
        self.drop_tables()
        self.create_tables()
        self.load_initial_data()

    def load_initial_data(self):
        session = self.get_session()
        try:
            if session.query(DBCharacter).count() == 0:
                self.load_characters_from_csv()

            if session.query(Arc).count() == 0:
                self.load_arcs_from_json()
        finally:
            self.close_session(session)

    def load_characters_from_csv(self):
        """Load characters from CSV file"""
        session = self.get_session()

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

        try:
            with open(self.characters_file, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
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

                    character = DBCharacter(**character_data)
                    session.add(character)

            session.commit()
            print(f"Loaded characters from {self.characters_file}")

        except Exception as e:
            session.rollback()
            print(f"Error: {e}")
        finally:
            self.close_session(session)


    def load_arcs_from_json(self):
        """Load arcs from JSON file"""
        session = self.get_session()

        try:
            with open(self.arcs_file, 'r', encoding='utf-8') as file:
                data = json.load(file)

                for arc_data in data:
                    arc = Arc(**arc_data)
                    session.add(arc)

            session.commit()
            print(f"Loaded arcs from {self.arcs_file}")

        except Exception as e:
            session.rollback()
            print(f"Error loading JSON: {e}")
        finally:
            self.close_session(session)

# Create global instance
db_manager = DatabaseManager()
db_manager.reset_database()