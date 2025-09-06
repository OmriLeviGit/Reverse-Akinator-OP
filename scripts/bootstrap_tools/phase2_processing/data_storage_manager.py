import sys
from pathlib import Path
import requests
from PIL import Image
from io import BytesIO
import os

# Add the server directory to the Python path
sys.path.append(str(Path(__file__).parent.parent.parent.parent))

from guessing_game.config.database import get_db_session
from guessing_game.config.vector_db import add_character_to_db
from ..bootstrap_settings import LARGE_AVATARS_DIR, SMALL_AVATARS_DIR
from guessing_game.models.db_character import DBCharacter
from guessing_game.services.prompt_service import PromptService
from guessing_game.services.llm_service import LLMService
from ..phase1_preparation.database_builder import DatabaseBuilder


class DataStorageManager:
    """Unified manager for storing all character data across different databases and systems"""

    def __init__(self, vector_collection, vector_model):
        self.vector_collection = vector_collection
        self.vector_model = vector_model
        self.prompt_service = PromptService()
        self.llm_service = LLMService()
        # Set up the LLM model for descriptions/fun facts
        self.llm_service.set_model('gemini', model='gemini-1.5-flash')

        # Initialize database builder for metadata updates
        self.database_builder = DatabaseBuilder()

        # Ensure avatar directories exist
        os.makedirs(LARGE_AVATARS_DIR, exist_ok=True)
        os.makedirs(SMALL_AVATARS_DIR, exist_ok=True)

    def store_character_complete(self, character_id, character_data):
        """
        Store complete character data across all systems

        Returns:
        dict: Storage results with success/failure for each component:
            - sql_db: bool - Success of SQL database update
            - vector_db: bool - Success of vector database storage
            - avatar_download: bool or "403_BLOCKED" - Avatar download result
            - all_skipped: bool - True if all operations were skipped
        """
        results = {
            'sql_db': False,
            'vector_db': False,
            'avatar_download': False,
            'all_skipped': False,
        }

        try:
            # 1. Update character metadata in SQL Database
            sql_result = self.add_character_metadata(character_id, character_data)
            results['sql_db'] = sql_result['success']
            sql_skipped = sql_result['skipped']

            # 2. Store in Vector Database
            vector_result = self._store_in_vector_db(character_id, character_data)
            results['vector_db'] = vector_result['success']
            vector_skipped = vector_result['skipped']

            # 3. Download and process avatar
            avatar_skipped = True
            if character_data.get('avatar_url'):
                avatar_result = self._download_avatar(character_id, character_data['avatar_url'])
                if avatar_result == "403_BLOCKED":
                    results['avatar_download'] = "403_BLOCKED"
                    avatar_skipped = False  # This is an actual result, not a skip
                elif isinstance(avatar_result, dict):
                    if avatar_result['success']:
                        self._create_small_avatar(character_id)
                        results['avatar_download'] = True
                    avatar_skipped = avatar_result['skipped']

            # Determine if everything was skipped
            results['all_skipped'] = sql_skipped and vector_skipped and avatar_skipped

            return results

        except Exception as e:
            print(f"Error storing character {character_id}: {e}")
            return results

    def add_character_metadata(self, character_id, character_data):
        """Add description, fun fact and affiliations for an existing character only if they don't exist"""
        with get_db_session() as session:
            character = session.query(DBCharacter).filter_by(id=character_id).first()

            if not character:
                print(f"Character {character_id} not found")
                return {'success': False, 'skipped': False}

            updated_fields = []

            # Only update description if it's empty/None
            if not character.description:
                description = self._generate_description(character_id)
                if description is not None:
                    character.description = description
                    updated_fields.append("description")

            # Only update fun_fact if it's empty/None
            if not character.fun_fact:
                fun_fact = self._generate_fun_fact(character_id)
                if fun_fact is not None:
                    character.fun_fact = fun_fact
                    updated_fields.append("fun_fact")

            #  Update affiliations as they were scraped regardless
            character.affiliations = character_data.get('affiliations')

            if updated_fields:
                print(f"Updated character {character_id}: {', '.join(updated_fields)}")
                return {'success': True, 'skipped': False}
            else:
                print(f"Character {character_id} already has description and fun_fact - skipped")
                return {'success': True, 'skipped': True}

    def _store_in_vector_db(self, character_id, character_data, verbose=False):
        """Store character data in vector database"""
        try:
            # Check if data already exists
            existing_data = self.vector_collection.get(
                where={"character_id": character_id}
            )

            if existing_data['ids']:
                if verbose:
                    print(f"  Skipping {character_id} - already exists ({len(existing_data['ids'])} documents)")
                return {'success': True, 'skipped': True}

            # No existing data, proceed with adding
            structured_data = character_data.get('structured_data', {})
            narrative_sections = character_data.get('narrative_sections', {})

            add_character_to_db(
                self.vector_collection,
                self.vector_model,
                character_id,
                structured_data,
                narrative_sections
            )

            if verbose:
                print(f"  Stored in vector DB: {character_id}")
            return {'success': True, 'skipped': False}

        except Exception as e:
            print(f"  Error storing {character_id} in vector DB: {e}")
            return {'success': False, 'skipped': False}

    def _download_avatar(self, character_id, avatar_url, verbose=False):
        """Download character avatar image"""
        try:
            # Determine save path
            if 'NoPicAvailable' in avatar_url:
                save_path = LARGE_AVATARS_DIR / "_NoPicAvailable.webp"
                avatar_type = "placeholder"
            else:
                save_path = LARGE_AVATARS_DIR / f"{character_id}.webp"
                avatar_type = "character"

            # Check if avatar already exists
            if save_path.exists():
                if verbose:
                    print(f"  Avatar: {avatar_type} already exists for {character_id}")
                return {'success': True, 'skipped': True}

            # Avatar doesn't exist, proceed with download
            message = f"  Avatar: downloading {avatar_type} for {character_id}"
            if verbose:
                print(message)

            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }

            response = requests.get(avatar_url, headers=headers, timeout=30)
            response.raise_for_status()

            # Open image from memory
            img = Image.open(BytesIO(response.content))

            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')

            # Save image
            img.save(save_path, 'WEBP', quality=95, optimize=True)

            return {'success': True, 'skipped': False}

        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 403:
                print(f"  Access blocked (403) for avatar {character_id}")
                return "403_BLOCKED"
            else:
                print(f"  HTTP error {e.response.status_code} for avatar {character_id}: {e}")
                return {'success': False, 'skipped': False}
        except Exception as e:
            print(f"  Error downloading avatar for {character_id}: {e}")
            return {'success': False, 'skipped': False}

    def _create_small_avatar(self, character_id, verbose=False):
        """Create small avatar thumbnail"""
        try:
            large_path = LARGE_AVATARS_DIR / f"{character_id}.webp"
            small_path = SMALL_AVATARS_DIR / f"{character_id}.webp"

            # Check if small avatar already exists
            if small_path.exists():
                if verbose:
                    print(f"  Small avatar already exists: {character_id}")
                return True

            # Check if placeholder should be used
            if not large_path.exists():
                placeholder_path = LARGE_AVATARS_DIR / "_NoPicAvailable.webp"
                if placeholder_path.exists():
                    large_path = placeholder_path
                else:
                    return False

            # Load the large avatar
            large_img = Image.open(large_path)

            # Crop to square from top-center
            width, height = large_img.size
            square_size = min(width, height)
            left = (width - square_size) // 2
            top = 0
            right = left + square_size
            bottom = square_size
            square_img = large_img.crop((left, top, right, bottom))

            # Resize to small size (128x128)
            small_img = square_img.resize((128, 128), Image.Resampling.LANCZOS)

            # Save small avatar
            small_img.save(small_path, 'WEBP', quality=90, optimize=True)

            if verbose:
                print(f"  Small avatar created: {character_id}")
            return True

        except Exception as e:
            print(f"  Error creating small avatar for {character_id}: {e}")
            return False

    def _store_affiliations(self, character_id, affiliations, verbose=False):
        """Store character affiliations"""
        try:
            with get_db_session() as session:
                character = session.query(DBCharacter).filter_by(id=character_id).first()

                if character and affiliations:
                    # Affiliations is a simple semicolon-separated string
                    affiliation_text = f"affiliations: {affiliations}"
                    affiliation_count = len([a.strip() for a in affiliations.split(';') if a.strip()])

                    # Store in character note field
                    if character.note:
                        character.note += f"; {affiliation_text}"
                    else:
                        character.note = affiliation_text

                    if verbose:
                        print(f"  Stored {affiliation_count} affiliations for {character_id}")

                return True

        except Exception as e:
            print(f"  Error storing affiliations for {character_id}: {e}")
            return False

    def _generate_description(self, character_id):
        """Generate character description using LLM"""
        try:
            # Get the prompt from prompt service
            description_prompt = self.prompt_service.create_character_description(character_id)

            if description_prompt is None:
                return None

            # Generate description using LLM
            description = self.llm_service.generate(description_prompt)

            if description and description.strip():
                return description.strip()

            return None

        except Exception as e:
            print(f"  Error generating description for {character_id}: {e}")
            return None

    def _generate_fun_fact(self, character_id):
        """Generate character fun fact using LLM"""
        try:
            # Get the prompt from prompt service
            fun_fact_prompt = self.prompt_service.create_character_fun_fact(character_id)

            if fun_fact_prompt is None:
                return None

            # Generate fun fact using LLM
            fun_fact = self.llm_service.generate(fun_fact_prompt)

            if fun_fact and fun_fact.strip():
                return fun_fact.strip()

            return None

        except Exception as e:
            print(f"  Error generating fun fact for {character_id}: {e}")
            return None

    def get_storage_stats(self):
        """Get statistics about stored data"""
        stats = {}

        try:
            # SQL database stats
            with get_db_session() as session:
                stats['sql_characters'] = session.query(DBCharacter).count()
                stats['characters_with_descriptions'] = session.query(DBCharacter).filter(
                    DBCharacter.description.isnot(None)
                ).count()
                stats['characters_with_fun_facts'] = session.query(DBCharacter).filter(
                    DBCharacter.fun_fact.isnot(None)
                ).count()

            # Avatar stats
            large_avatars = list(LARGE_AVATARS_DIR.glob("*.webp"))
            stats['large_avatars'] = len(large_avatars)

        except Exception as e:
            print(f"Error getting storage stats: {e}")

        return stats