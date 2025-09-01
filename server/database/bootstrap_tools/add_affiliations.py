#!/usr/bin/env python3

import sys
import csv
import json
from pathlib import Path

# Add the project root to the path
sys.path.append(str(Path(__file__).parent.parent.parent.parent))

from server.config.settings import CHARACTER_CSV_PATH
from server.config.vector_db import get_vector_client, COLLECTION_NAME
from server.config.database import get_db_session
from server.models.db_character import DBCharacter


def get_character_affiliations_from_vector_db(character_id):
    """Get affiliations for a character from the vector database structured metadata"""
    try:
        client = get_vector_client()
        collection = client.get_collection(COLLECTION_NAME)
        
        # Get all chunks for this character
        results = collection.get(
            where={"character_id": character_id}
        )
        
        if not results['metadatas']:
            return None
            
        # Get structured data from the first chunk (all chunks should have same structured data)
        first_metadata = results['metadatas'][0]
        structured_data_json = first_metadata.get('structured_data')
        
        if not structured_data_json:
            return None
            
        structured_data = json.loads(structured_data_json)
        
        # Look for affiliations in the structured data
        for key, value in structured_data.items():
            if key.lower() == 'affiliations' and value:
                return value
                
        return None
        
    except Exception as e:
        print(f"Error getting affiliations for {character_id}: {e}")
        return None


def update_character_affiliations():
    """Update all characters with affiliations from vector database"""
    
    # Load character IDs from CSV
    character_ids = []
    try:
        with open(CHARACTER_CSV_PATH, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                character_id = row.get('ID')
                if character_id:
                    character_ids.append(character_id)
    except FileNotFoundError:
        print(f"Error: Could not find CSV file at {CHARACTER_CSV_PATH}")
        return
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        return
    
    print(f"Found {len(character_ids)} characters to process")
    
    updated_count = 0
    not_found_count = 0
    error_count = 0
    
    # Process each character
    with get_db_session() as session:
        for i, character_id in enumerate(character_ids):
            try:
                # Get character from database
                db_character = session.query(DBCharacter).filter(DBCharacter.id == character_id).first()
                
                if not db_character:
                    print(f"Character {character_id} not found in database")
                    not_found_count += 1
                    continue
                
                # Get affiliations from vector database
                affiliations = get_character_affiliations_from_vector_db(character_id)
                
                if affiliations:
                    # Format affiliations with space after semicolons and fix encoding issues
                    formatted_affiliations = affiliations.replace(';', '; ')
                    # Fix common encoding issues
                    formatted_affiliations = formatted_affiliations.encode('utf-8', errors='ignore').decode('utf-8')
                    # Update character with affiliations
                    db_character.affiliations = formatted_affiliations
                    updated_count += 1
                    # Handle encoding issues when printing
                    try:
                        print(f"Updated {character_id} with affiliations: {formatted_affiliations[:50]}...")
                    except UnicodeEncodeError:
                        print(f"Updated {character_id} with affiliations (contains special characters)")
                else:
                    print(f"No affiliations found for {character_id}")
                
                # Progress indicator
                if (i + 1) % 50 == 0:
                    print(f"Processed {i + 1}/{len(character_ids)} characters...")
                    
            except Exception as e:
                print(f"Error processing {character_id}: {e}")
                error_count += 1
                continue
    
    print(f"\nCompleted processing:")
    print(f"- Updated: {updated_count}")
    print(f"- Not found in DB: {not_found_count}")
    print(f"- Errors: {error_count}")
    print(f"- Total processed: {len(character_ids)}")


if __name__ == "__main__":
    print("Adding affiliations from vector database to SQLite database...")
    update_character_affiliations()
    print("Done!")