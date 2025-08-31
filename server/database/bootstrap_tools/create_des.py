import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent))

from server.config.database import get_db_session
from server.models.db_character import DBCharacter
from server.services.prompt_service import PromptService
from server.services.llm_service import LLMService


class CharacterDescriptionPopulator:
    """Populate character descriptions and fun facts in the database"""
    
    def __init__(self):
        self.prompt_service = PromptService()
        self.llm_service = LLMService()
        # Set up the LLM model
        self.llm_service.set_model('gemini', model='gemini-1.5-flash')
        
    def generate_description_for_character(self, character_id: str, character_name: str) -> str | None:
        """Generate description for a single character"""
        print(f"  Generating description for {character_name}...")
        
        # Get the prompt from prompt service
        description_prompt = self.prompt_service.create_character_description(character_id)
        
        if description_prompt is None:
            print(f"  ❌ No relevant chunks found for description of {character_name}")
            return None
        
        # Generate description using LLM
        description = self.llm_service.query(description_prompt)
        
        if description and description.strip():
            print(f"  ✅ Generated description: {description[:100]}...")
            return description.strip()
        else:
            print(f"  ❌ Failed to generate description for {character_name}")
            return None
    
    def generate_fun_fact_for_character(self, character_id: str, character_name: str) -> str | None:
        """Generate fun fact for a single character"""
        print(f"  Generating fun fact for {character_name}...")
        
        # Get the prompt from prompt service
        fun_fact_prompt = self.prompt_service.create_character_fun_fact(character_id)
        
        if fun_fact_prompt is None:
            print(f"  ❌ No relevant chunks found for fun fact of {character_name}")
            return None
        
        # Generate fun fact using LLM
        fun_fact = self.llm_service.query(fun_fact_prompt)
        
        if fun_fact and fun_fact.strip():
            print(f"  ✅ Generated fun fact: {fun_fact[:100]}...")
            return fun_fact.strip()
        else:
            print(f"  ❌ Failed to generate fun fact for {character_name}")
            return None
    
    def populate_all_characters(self, skip_existing_descriptions: bool = True, skip_existing_fun_facts: bool = True):
        """Populate descriptions and fun facts for all characters in the database"""
        print("=== POPULATING CHARACTER DESCRIPTIONS AND FUN FACTS ===")
        
        with get_db_session() as session:
            # Get all characters from database
            characters = session.query(DBCharacter).all()
            
            total_characters = len(characters)
            processed_count = 0
            description_success_count = 0
            fun_fact_success_count = 0
            
            print(f"\nFound {total_characters} characters in database")
            print("=" * 80)
            
            for i, character in enumerate(characters, 1):
                print(f"\n{i}/{total_characters}. CHARACTER: {character.name} (ID: {character.id})")
                print("-" * 60)
                
                character_updated = False
                
                # Generate description if needed
                if not skip_existing_descriptions or not character.description:
                    description = self.generate_description_for_character(character.id, character.name)
                    if description:
                        character.description = description
                        description_success_count += 1
                        character_updated = True
                else:
                    print(f"  ⏭️  Skipping description (already exists)")
                
                # Generate fun fact if needed
                if not skip_existing_fun_facts or not character.fun_fact:
                    fun_fact = self.generate_fun_fact_for_character(character.id, character.name)
                    if fun_fact:
                        character.fun_fact = fun_fact
                        fun_fact_success_count += 1
                        character_updated = True
                else:
                    print(f"  ⏭️  Skipping fun fact (already exists)")
                
                if character_updated:
                    processed_count += 1
                
                print("-" * 60)
            
            # Commit all changes
            session.commit()
            
            print(f"\n" + "=" * 80)
            print("SUMMARY:")
            print(f"  Total characters: {total_characters}")
            print(f"  Characters processed: {processed_count}")
            print(f"  Successful descriptions: {description_success_count}")
            print(f"  Successful fun facts: {fun_fact_success_count}")
            print("=" * 80)
    
    def populate_specific_characters(self, character_names: list[str]):
        """Populate descriptions and fun facts for specific characters by name"""
        print(f"=== POPULATING SPECIFIC CHARACTERS: {', '.join(character_names)} ===")
        
        with get_db_session() as session:
            found_characters = []
            
            # Find characters by name (case-insensitive partial match)
            for name in character_names:
                characters = session.query(DBCharacter).filter(
                    DBCharacter.name.ilike(f"%{name}%")
                ).all()
                
                if characters:
                    found_characters.extend(characters)
                    print(f"Found {len(characters)} character(s) matching '{name}': {[c.name for c in characters]}")
                else:
                    print(f"❌ No characters found matching '{name}'")
            
            if not found_characters:
                print("No characters found to process.")
                return
            
            print(f"\nProcessing {len(found_characters)} characters...")
            print("=" * 80)
            
            for i, character in enumerate(found_characters, 1):
                print(f"\n{i}/{len(found_characters)}. CHARACTER: {character.name} (ID: {character.id})")
                print("-" * 60)
                
                # Generate description
                description = self.generate_description_for_character(character.id, character.name)
                if description:
                    character.description = description
                
                # Generate fun fact
                fun_fact = self.generate_fun_fact_for_character(character.id, character.name)
                if fun_fact:
                    character.fun_fact = fun_fact
                
                print("-" * 60)
            
            # Commit all changes
            session.commit()
            print("\n✅ All updates committed to database.")


def main():
    populator = CharacterDescriptionPopulator()
    
    # Choose mode:
    # 1. Populate all characters
    populator.populate_all_characters(skip_existing_descriptions=True, skip_existing_fun_facts=True)

    # 2. Or populate specific characters (uncomment to use)
    # populator.populate_specific_characters(["Luffy", "Zoro", "Nami"])


if __name__ == "__main__":
    main()