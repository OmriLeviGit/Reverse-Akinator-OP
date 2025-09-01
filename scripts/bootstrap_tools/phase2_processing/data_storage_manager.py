import sys
from pathlib import Path
import requests
import time
import random
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


class DataStorageManager:
    """Unified manager for storing all character data across different databases and systems"""
    
    def __init__(self, vector_collection, vector_model):
        self.vector_collection = vector_collection
        self.vector_model = vector_model
        self.prompt_service = PromptService()
        self.llm_service = LLMService()
        # Set up the LLM model for descriptions/fun facts
        self.llm_service.set_model('gemini', model='gemini-1.5-flash')
        
        # Ensure avatar directories exist
        os.makedirs(LARGE_AVATARS_DIR, exist_ok=True)
        os.makedirs(SMALL_AVATARS_DIR, exist_ok=True)
    
    def store_character_complete(self, character_id, character_data, generate_descriptions=True):
        """
        Store complete character data across all systems
        
        Args:
            character_id (str): Character identifier
            character_data (dict): Complete character data with keys:
                - structured_data: dict
                - narrative_sections: dict 
                - avatar_url: str or None
                - affiliations: str (semicolon-separated)
                - name: str
                - wiki_url: str
            generate_descriptions (bool): Whether to generate AI descriptions and fun facts
            
        Returns:
            dict: Storage results with success/failure for each component
        """
        results = {
            'sql_db': False,
            'vector_db': False,
            'avatar_download': False,
            'small_avatar': False,
            'affiliations': False,
            'descriptions': False,
            'fun_facts': False
        }
        
        character_name = character_data.get('name', character_id)
        
        try:
            # 1. Store in SQL Database
            results['sql_db'] = self._store_in_sql_db(character_id, character_data)
            
            # 2. Store in Vector Database  
            results['vector_db'] = self._store_in_vector_db(character_id, character_data)
            
            # 3. Download and process avatar
            if character_data.get('avatar_url'):
                avatar_result = self._download_avatar(character_id, character_data['avatar_url'])
                if avatar_result == "403_BLOCKED":
                    results['avatar_download'] = "403_BLOCKED"
                    results['small_avatar'] = False
                elif avatar_result:
                    results['avatar_download'] = True
                    results['small_avatar'] = self._create_small_avatar(character_id)
                else:
                    results['avatar_download'] = False
                    results['small_avatar'] = False
            
            # 4. Store affiliations
            if character_data.get('affiliations'):
                results['affiliations'] = self._store_affiliations(character_id, character_data['affiliations'])
            
            # 5. Generate and store descriptions/fun facts (if requested)
            if generate_descriptions:
                description_success = self._generate_and_store_description(character_id, character_name)
                fun_fact_success = self._generate_and_store_fun_fact(character_id, character_name)
                
                results['descriptions'] = description_success
                results['fun_facts'] = fun_fact_success
            
            return results
            
        except Exception as e:
            print(f"Error storing character {character_id}: {e}")
            return results
    
    def _store_in_sql_db(self, character_id, character_data):
        """Store basic character info in SQL database"""
        try:
            with get_db_session() as session:
                # Check if character already exists
                existing_character = session.query(DBCharacter).filter_by(id=character_id).first()
                
                if existing_character:
                    # Update existing character
                    existing_character.name = character_data.get('name', character_id)
                    existing_character.wiki_link = character_data.get('wiki_url')
                    # Don't overwrite existing description/fun_fact unless empty
                    print(f"  Updated existing character: {character_id}")
                else:
                    # Create new character
                    new_character = DBCharacter(
                        id=character_id,
                        name=character_data.get('name', character_id),
                        wiki_link=character_data.get('wiki_url'),
                        filler_status='Canon',  # Default value, can be updated later
                    )
                    session.add(new_character)
                    print(f"  Created new character: {character_id}")
                
                return True
                
        except Exception as e:
            print(f"  Error storing {character_id} in SQL DB: {e}")
            return False
    
    def _store_in_vector_db(self, character_id, character_data):
        """Store character data in vector database"""
        try:
            structured_data = character_data.get('structured_data', {})
            narrative_sections = character_data.get('narrative_sections', {})
            
            add_character_to_db(
                self.vector_collection, 
                self.vector_model, 
                character_id, 
                structured_data, 
                narrative_sections
            )
            
            print(f"  Stored in vector DB: {character_id}")
            return True
            
        except Exception as e:
            print(f"  Error storing {character_id} in vector DB: {e}")
            return False
    
    def _download_avatar(self, character_id, avatar_url):
        """Download character avatar image"""
        try:
            # Handle placeholder images
            if 'NoPicAvailable' in avatar_url:
                placeholder_path = LARGE_AVATARS_DIR / "_NoPicAvailable.webp"
                
                if placeholder_path.exists():
                    # Placeholder already downloaded
                    print(f"  Avatar: using existing placeholder for {character_id}")
                    return True
                
                print(f"  Avatar: downloading placeholder for {character_id}")
            else:
                print(f"  Avatar: downloading for {character_id}")
            
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
            if 'NoPicAvailable' in avatar_url:
                save_path = LARGE_AVATARS_DIR / "_NoPicAvailable.webp"
            else:
                save_path = LARGE_AVATARS_DIR / f"{character_id}.webp"
                
            img.save(save_path, 'WEBP', quality=95, optimize=True)
            
            return True
            
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 403:
                print(f"  Access blocked (403) for avatar {character_id}")
                return "403_BLOCKED"
            else:
                print(f"  HTTP error {e.response.status_code} for avatar {character_id}: {e}")
                return False
        except Exception as e:
            print(f"  Error downloading avatar for {character_id}: {e}")
            return False
    
    def _create_small_avatar(self, character_id):
        """Create small avatar thumbnail"""
        try:
            large_path = LARGE_AVATARS_DIR / f"{character_id}.webp"
            small_path = SMALL_AVATARS_DIR / f"{character_id}.webp"
            
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
            
            print(f"  Small avatar created: {character_id}")
            return True
            
        except Exception as e:
            print(f"  Error creating small avatar for {character_id}: {e}")
            return False
    
    def _store_affiliations(self, character_id, affiliations):
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
                    
                    print(f"  Stored {affiliation_count} affiliations for {character_id}")
                
                return True
                
        except Exception as e:
            print(f"  Error storing affiliations for {character_id}: {e}")
            return False
    
    def _generate_and_store_description(self, character_id, character_name):
        """Generate and store character description using LLM"""
        try:
            # Get the prompt from prompt service
            description_prompt = self.prompt_service.create_character_description(character_id)
            
            if description_prompt is None:
                print(f"  Description: No relevant chunks found for {character_name}")
                return False
            
            # Generate description using LLM
            description = self.llm_service.query(description_prompt)
            
            if description and description.strip():
                # Store in database
                with get_db_session() as session:
                    character = session.query(DBCharacter).filter_by(id=character_id).first()
                    if character:
                        character.description = description.strip()
                        print(f"  Description generated: {character_name} ({len(description)} chars)")
                        return True
                
            return False
            
        except Exception as e:
            print(f"  Error generating description for {character_id}: {e}")
            return False
    
    def _generate_and_store_fun_fact(self, character_id, character_name):
        """Generate and store character fun fact using LLM"""
        try:
            # Get the prompt from prompt service
            fun_fact_prompt = self.prompt_service.create_character_fun_fact(character_id)
            
            if fun_fact_prompt is None:
                print(f"  Fun fact: No relevant chunks found for {character_name}")
                return False
            
            # Generate fun fact using LLM
            fun_fact = self.llm_service.query(fun_fact_prompt)
            
            if fun_fact and fun_fact.strip():
                # Store in database
                with get_db_session() as session:
                    character = session.query(DBCharacter).filter_by(id=character_id).first()
                    if character:
                        character.fun_fact = fun_fact.strip()
                        print(f"  Fun fact generated: {character_name} ({len(fun_fact)} chars)")
                        return True
                
            return False
            
        except Exception as e:
            print(f"  Error generating fun fact for {character_id}: {e}")
            return False
    
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
            small_avatars = list(SMALL_AVATARS_DIR.glob("*.webp"))
            
            stats['large_avatars'] = len(large_avatars)
            stats['small_avatars'] = len(small_avatars)
            
            # Vector DB stats would require additional query methods
            # stats['vector_characters'] = self.vector_collection.count()
            
        except Exception as e:
            print(f"Error getting storage stats: {e}")
        
        return stats
    
    def print_storage_summary(self, results):
        """Print a summary of storage results"""
        total_operations = len([k for k in results.keys() if k != 'character_id'])
        successful_operations = sum(1 for v in results.values() if v is True)
        
        print(f"  Storage Summary: {successful_operations}/{total_operations} operations successful")
        
        if not results['sql_db']:
            print(f"    [FAIL] SQL Database")
        else:
            print(f"    [OK] SQL Database")
            
        if not results['vector_db']:
            print(f"    [FAIL] Vector Database")
        else:
            print(f"    [OK] Vector Database")
            
        if results['avatar_download']:
            print(f"    [OK] Avatar Download")
            if results['small_avatar']:
                print(f"    [OK] Small Avatar")
            else:
                print(f"    [FAIL] Small Avatar")
        elif 'avatar_url' in results:
            print(f"    [FAIL] Avatar Download")
            
        if results['affiliations']:
            print(f"    [OK] Affiliations")
            
        if results['descriptions']:
            print(f"    [OK] Description Generated")
        elif 'descriptions' in results:
            print(f"    [FAIL] Description Generation")
            
        if results['fun_facts']:
            print(f"    [OK] Fun Fact Generated")
        elif 'fun_facts' in results:
            print(f"    [FAIL] Fun Fact Generation")