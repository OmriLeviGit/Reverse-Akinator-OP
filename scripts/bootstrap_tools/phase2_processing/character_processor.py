import sys
import time
import random
import csv
from pathlib import Path

from guessing_game.config import get_db_session
from guessing_game.models.db_character import DBCharacter

# Add the server directory to the Python path
sys.path.append(str(Path(__file__).parent.parent.parent.parent))

from ..bootstrap_settings import CHARACTER_CSV_PATH, LARGE_AVATARS_DIR
from guessing_game.config.vector_db import initialize_collection

# Import our new modules
from .enhanced_character_scraping import scrape_character_complete
from .data_storage_manager import DataStorageManager

# 403 handling configuration
MAX_CONSECUTIVE_403S = 2
BLOCK_RETRY_DELAY = 300


class CharacterProcessor:
    """
    Unified character processing pipeline that scrapes character data from wiki URLs
    and stores it in both SQL and vector databases with avatar downloading.

    Handles rate limiting, 403 error blocking, and provides retry logic with statistics tracking.
    """

    def __init__(self, delay_between_characters=1.0, delay_between_requests=0.1):
        """
        Initialize the character processor

        Args:
            delay_between_characters (float): Seconds to wait between processing characters
            delay_between_requests (float): Seconds to wait between individual web requests
        """
        self.delay_between_characters = delay_between_characters
        self.delay_between_requests = delay_between_requests

        # Initialize vector database
        print("Initializing vector database connection...")
        self.vector_client, self.vector_collection, self.vector_model = initialize_collection()
        print(f"Connected to vector collection: {self.vector_collection.name}")

        # Initialize storage manager
        self.storage_manager = DataStorageManager(self.vector_collection, self.vector_model)

        # 403 blocking tracking
        self.consecutive_403_errors = 0

        # Statistics
        self.stats = {
            'total_processed': 0,
            'successful': 0,
            'failed': 0,
            'skipped': 0,
            'sql_db_success': 0,
            'vector_db_success': 0,
            'avatars_downloaded': 0,
            'descriptions_generated': 0,
            'fun_facts_generated': 0,
            'affiliations_stored': 0,
            '403_blocks_encountered': 0,
            'characters_retried': 0,
        }

    def load_character_list(self, csv_path: Path = CHARACTER_CSV_PATH) -> list[dict]:
        """Load character list from CSV file"""
        characters = []

        try:
            with open(csv_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    character_id = row.get('ID')
                    wiki_url = row.get('Wiki')

                    if character_id and wiki_url:
                        characters.append({
                            'id': character_id.strip(),
                            'wiki_url': wiki_url.strip()
                        })

        except Exception as e:
            print(f"Error loading characters from {csv_path}: {e}")
            raise

        return characters

    def process_single_character(self, character_info: dict, verbose=False, retry_count=0) -> dict:
        """
        Process a single character completely

        Args:
            character_info (dict): Character info with keys 'id', 'wiki_url'
            verbose (bool): Enable verbose output (currently unused)
            retry_count (int): Current retry attempt (0 = first attempt)

        Returns:
            dict: Processing results
        """
        character_id = character_info['id']
        wiki_url = character_info['wiki_url']

        retry_prefix = f"[RETRY {retry_count}] " if retry_count > 0 else ""
        print(f"\n--- {retry_prefix}Processing: {character_id} ---")
        print(f"Wiki: {wiki_url}")

        try:
            # Step 1: Check what data is missing
            print("Step 1: Checking existing data...")
            missing_data = self._check_missing_data(character_id)

            if not any(missing_data.values()):
                print("All data already exists - skipping")
                self.stats['total_processed'] += 1
                self.stats['successful'] += 1
                return {
                    'success': True,
                    'character_id': character_id,
                    'storage_results': {
                        'sql_db': True,
                        'vector_db': True,
                        'avatar_download': True,
                        'all_skipped': True
                    },
                    'data_summary': {
                        'all_data_exists': True
                    }
                }

            print(f"Missing data: {[k for k, v in missing_data.items() if v]}")

            # Step 2: Scrape character data (only if we need it)
            print("Step 2: Scraping character data...")
            character_data = scrape_character_complete(wiki_url)

            # Check for 403 blocking
            if character_data.get('error') == '403_BLOCKED':
                return self._handle_403_block(character_info)

            # Add basic info to character data
            character_data['wiki_url'] = wiki_url

            # Log what was found
            structured_fields = len(character_data.get('structured_data', {}))
            narrative_sections = len(character_data.get('narrative_sections', {}))
            total_paragraphs = sum(
                len(paragraphs) for paragraphs in character_data.get('narrative_sections', {}).values())
            avatar_found = bool(character_data.get('avatar_url'))
            affiliations_found = len(character_data.get('affiliations', '').split(';')) if character_data.get(
                'affiliations') else 0

            print(f"  Found: {structured_fields} structured fields, {narrative_sections} narrative sections")
            print(
                f"  Found: {total_paragraphs} total paragraphs, avatar: {avatar_found}, affiliations: {affiliations_found}")

            # Step 3: Store all data
            print("Step 3: Storing character data...")
            storage_results = self.storage_manager.store_character_complete(
                character_id,
                character_data
            )

            # Step 4: Update statistics
            self._update_stats(storage_results)

            # Reset 403 counter on successful processing
            self.consecutive_403_errors = 0

            return {
                'success': True,
                'character_id': character_id,
                'storage_results': storage_results,
                'data_summary': {
                    'structured_fields': structured_fields,
                    'narrative_sections': narrative_sections,
                    'total_paragraphs': total_paragraphs,
                    'avatar_found': avatar_found,
                    'affiliations_found': affiliations_found,
                    'missing_data_found': missing_data
                }
            }

        except Exception as e:
            print(f"[FAIL] Error processing {character_id}: {e}")

            # Retry logic for general errors (not 403)
            if retry_count < 3:
                print(f"[RETRY] Will retry {character_id} in 5 seconds... (attempt {retry_count + 1}/3)")
                time.sleep(5)
                return self.process_single_character(character_info, verbose, retry_count + 1)
            else:
                print(f"[FAIL] All retries exhausted for {character_id}")
                self.stats['failed'] += 1

                return {
                    'success': False,
                    'character_id': character_id,
                    'error': str(e),
                    'retries_attempted': retry_count
                }

    def _check_missing_data(self, character_id):
        """
        Check what data is missing for a character

        Returns:
            dict: Keys are data types, values are True if missing
        """
        missing = {
            'sql_metadata': False,
            'vector_data': False,
            'avatar': False
        }

        try:
            # Check SQL metadata (description, fun_fact)
            with get_db_session() as session:
                character = session.query(DBCharacter).filter_by(id=character_id).first()
                if character:
                    if not character.description or not character.fun_fact:
                        missing['sql_metadata'] = True
                else:
                    missing['sql_metadata'] = True  # Character doesn't exist

            # Check vector database
            existing_vector_data = self.vector_collection.get(
                where={"character_id": character_id}
            )
            if not existing_vector_data['ids']:
                missing['vector_data'] = True

            # Check avatar
            avatar_path = LARGE_AVATARS_DIR / f"{character_id}.webp"
            if not avatar_path.exists():
                missing['avatar'] = True

        except Exception as e:
            print(f"Error checking missing data for {character_id}: {e}")
            # If we can't check, assume data is missing to be safe
            return {'sql_metadata': True, 'vector_data': True, 'avatar': True}

        return missing

    def process_characters_batch(self, characters: list[dict], start_index: int = 0,
                                 limit: int | None = None) -> dict:
        """Process a batch of characters"""

        total_characters = len(characters)
        end_index = min(start_index + limit, total_characters) if limit else total_characters

        print(f"\n{'=' * 80}")
        print(f"CHARACTER PROCESSING BATCH")
        print(f"{'=' * 80}")
        print(f"Total characters: {total_characters}")
        print(f"Processing: {start_index} to {end_index - 1} ({end_index - start_index} characters)")
        print(f"{'=' * 80}")

        batch_results = []
        processed_count = 0

        for i in range(start_index, end_index):
            character_info = characters[i]

            print(f"\n[{i + 1}/{total_characters}] ", end="")

            # Process character
            result = self.process_single_character(character_info)
            batch_results.append(result)

            if result['success']:
                processed_count += 1
                self.stats['successful'] += 1

            self.stats['total_processed'] += 1

            # Progress update every 10 characters
            if (i + 1) % 10 == 0:
                self._print_progress_summary()

            # Only delay if actual work was done (not everything skipped)
            if i < end_index - 1:  # Don't delay after the last character
                should_delay = True

                # Check if everything was skipped for this character
                if result.get('success') and result.get('storage_results', {}).get('all_skipped', False):
                    print("All operations skipped - no delay needed")
                    should_delay = False

                if should_delay:
                    delay_time = self.delay_between_characters + random.uniform(-0.5, 0.5)
                    print(f"Waiting {delay_time:.1f}s before next character...")
                    time.sleep(delay_time)

        return {
            'batch_results': batch_results,
            'processed_count': processed_count,
            'start_index': start_index,
            'end_index': end_index,
            'stats': self.stats.copy()
        }

    def process_all_characters(self, start_from: str | None = None, limit: int | None = None) -> dict:
        """
        Process all characters from the CSV file

        Args:
            start_from (str): Character ID to start from (for resuming)
            limit (int): Maximum number of characters to process

        Returns:
            dict: Complete processing results
        """

        # Load character list
        print("Loading character list from CSV...")

        characters = self.load_character_list()

        if not characters:
            print("No characters found to process!")
            return {'success': False, 'error': 'No characters found'}

        # Find starting index
        start_index = 0
        if start_from:
            for i, char in enumerate(characters):
                if char['id'] == start_from:
                    start_index = i
                    print(f"Resuming from character: {start_from} (index {i})")
                    break
            else:
                print(f"Warning: Character {start_from} not found, starting from beginning")

        # Process batch
        results = self.process_characters_batch(
            characters,
            start_index=start_index,
            limit=limit
        )

        # Final summary
        self._print_final_summary(results)

        return results

    def _handle_403_block(self, character_info: dict) -> dict:
        """Handle 403 blocking with retry logic similar to legacy downloader"""
        character_id = character_info['id']
        wiki_url = character_info['wiki_url']

        self.consecutive_403_errors += 1
        self.stats['403_blocks_encountered'] += 1

        print(f"[FAIL] Access blocked for {character_id} (403 error #{self.consecutive_403_errors})")

        if self.consecutive_403_errors >= MAX_CONSECUTIVE_403S:
            print(f"\n[TIME] PAUSE: {MAX_CONSECUTIVE_403S} consecutive 403 errors detected.")
            print("Taking a 5-minute break to let the rate limit reset...")

            # Sleep for 5 minutes with countdown updates
            for remaining in range(BLOCK_RETRY_DELAY, 0, -30):
                minutes = remaining // 60
                seconds = remaining % 60
                print(f"⏰ Resuming in {minutes}m {seconds}s...")
                time.sleep(30)  # Update every 30 seconds

            print("[RETRY] Resuming processing...")
            self.consecutive_403_errors = 0  # Reset counter after the break

            # RETRY the current character after the break
            print(f"[RETRY] Retrying {character_id}: {wiki_url}")
            self.stats['characters_retried'] += 1

            # Recursive call to retry the character
            return self.process_single_character(character_info)
        else:
            # Less than MAX_CONSECUTIVE_403S, return failure for now
            return {
                'success': False,
                'character_id': character_id,
                'error': '403_BLOCKED',
                'retry_pending': True
            }

    def _update_stats(self, storage_results: dict):
        """Update processing statistics"""
        if storage_results.get('sql_db'):
            self.stats['sql_db_success'] += 1
        if storage_results.get('vector_db'):
            self.stats['vector_db_success'] += 1
        if storage_results.get('avatar_download'):
            self.stats['avatars_downloaded'] += 1

    def _print_progress_summary(self):
        """Print current progress summary"""
        total = self.stats['total_processed']
        successful = self.stats['successful']
        failed = self.stats['failed']

        print(f"\n--- PROGRESS UPDATE ---")
        print(f"Processed: {total} | Successful: {successful} | Failed: {failed}")
        print(f"Success Rate: {(successful / total * 100):.1f}%" if total > 0 else "Success Rate: 0%")
        print(f"SQL DB: {self.stats['sql_db_success']} | Vector DB: {self.stats['vector_db_success']}")
        print(f"Avatars: {self.stats['avatars_downloaded']} | Descriptions: {self.stats['descriptions_generated']}")
        if self.stats['403_blocks_encountered'] > 0:
            print(
                f"403 Blocks: {self.stats['403_blocks_encountered']} | Characters Retried: {self.stats['characters_retried']}")
        print("---")

    def _print_final_summary(self, results: dict):
        """Print final processing summary"""
        stats = self.stats
        storage_stats = self.storage_manager.get_storage_stats()

        print(f"\n{'=' * 80}")
        print("FINAL PROCESSING SUMMARY")
        print(f"{'=' * 80}")
        print(f"Total Characters Processed: {stats['total_processed']}")
        print(f"Successful: {stats['successful']} ({stats['successful'] / stats['total_processed'] * 100:.1f}%)")
        print(f"Failed: {stats['failed']} ({stats['failed'] / stats['total_processed'] * 100:.1f}%)")
        print(f"")
        print(f"STORAGE BREAKDOWN:")
        print(f"  SQL Database: {stats['sql_db_success']}/{stats['total_processed']}")
        print(f"  Vector Database: {stats['vector_db_success']}/{stats['total_processed']}")
        print(f"  Avatars Downloaded: {stats['avatars_downloaded']}")
        print(f"  Descriptions Generated: {stats['descriptions_generated']}")
        print(f"  Fun Facts Generated: {stats['fun_facts_generated']}")
        print(f"  Affiliations Stored: {stats['affiliations_stored']}")
        if stats['403_blocks_encountered'] > 0:
            print(f"  403 Blocks Encountered: {stats['403_blocks_encountered']}")
            print(f"  Characters Retried: {stats['characters_retried']}")
        print(f"")
        print(f"CURRENT DATABASE STATE:")
        for key, value in storage_stats.items():
            print(f"  {key.replace('_', ' ').title()}: {value}")
        print(f"{'=' * 80}")


def main():
    """Main function for running the character processor"""

    # Configuration
    START_FROM = None  # Set to character ID to resume from a specific character
    LIMIT = 5  # Set to None to process all characters, or a number to limit for testing

    # Create processor
    processor = CharacterProcessor(
        delay_between_characters=2.0,  # 2 second delay between characters
        delay_between_requests=0.1  # 0.1 second delay between requests
    )

    # Process characters
    try:
        results = processor.process_all_characters(
            start_from=START_FROM,
            limit=LIMIT
        )

        if results.get('success', True):  # Default to True if key doesn't exist
            print("\n[OK] Character processing completed successfully!")
        else:
            print(f"\n[FAIL] Character processing failed: {results.get('error')}")

    except KeyboardInterrupt:
        print("\n\n[STOP] Processing interrupted by user")
        processor._print_progress_summary()
    except Exception as e:
        print(f"\n[FAIL] Unexpected error: {e}")
        processor._print_progress_summary()


if __name__ == "__main__":
    main()