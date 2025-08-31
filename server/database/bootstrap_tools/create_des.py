import random

from server.services.character_service import CharacterService
from server.services.prompt_service import PromptService
from server.services.llm_service import LLMService
from server.services.arc_service import ArcService

def generate_descriptions(characters, prompt_service, llm_service):
    """Generate descriptions for a list of characters"""
    print(f"\nGenerating descriptions for {len(characters)} characters...")
    print("=" * 80)
    
    for i, character in enumerate(characters, 1):
        print(f"\n{i}. CHARACTER: {character.name}")
        print("-" * 50)
        
        # Generate description
        print("Loading embedding model for description...")
        description_prompt = prompt_service.create_character_description(character.id)
        print("Generating description...")
        description = llm_service.query(description_prompt)
        
        print(f"\nDESCRIPTION:")
        print(description)
        print("\n" + "=" * 80)

def generate_fun_facts(characters, prompt_service, llm_service):
    """Generate fun facts for a list of characters"""
    print(f"\nGenerating fun facts for {len(characters)} characters...")
    print("=" * 80)
    
    for i, character in enumerate(characters, 1):
        print(f"\n{i}. CHARACTER: {character.name}")
        print("-" * 50)
        
        # Generate fun fact
        print("Loading embedding model for fun fact...")
        fun_fact_prompt = prompt_service.create_character_fun_fact(character.id)
        print("Generating fun fact...")
        fun_fact = llm_service.query(fun_fact_prompt)
        
        print(f"\nFUN FACT:")
        print(fun_fact)
        print("\n" + "=" * 80)

def main():
    # Initialize services
    character_service = CharacterService()
    prompt_service = PromptService()
    llm_service = LLMService()
    arc_service = ArcService()
    
    # Set up the LLM model
    llm_service.set_model('gemini', model='gemini-1.5-flash')
    
    # Get Whole Cake Island arc
    whole_cake_arc = arc_service.get_arc_by_name("Whole Cake Island")
    print(f"Using arc: {whole_cake_arc.name} (Chapter {whole_cake_arc.chapter}, Episode {whole_cake_arc.episode})")
    
    # Get characters from Whole Cake Island arc
    canon_characters = character_service.get_canon_characters(arc=whole_cake_arc)
    print(f"Found {len(canon_characters)} canon characters in Whole Cake Island arc")
    
    # Select 5 random characters
    if len(canon_characters) < 5:
        selected_characters = canon_characters
        print(f"Only {len(canon_characters)} characters available, using all of them")
    else:
        selected_characters = random.sample(canon_characters, 5)
    
    # Add specific characters to test
    specific_character_names = ["ace", "teach", "mihawk"]
    specific_characters = []
    
    for name in specific_character_names:
        character = character_service.get_character_by_name(name)
        if character:
            specific_characters.append(character)
            print(f"Found specific character: {character.name}")
        else:
            print(f"Character '{name}' not found")
    
    # Combine selected random characters with specific characters
    all_characters = selected_characters + specific_characters
    
    # Generate descriptions for all characters
    # generate_descriptions(all_characters, prompt_service, llm_service)
    
    # Generate fun facts for all characters
    generate_fun_facts(all_characters, prompt_service, llm_service)

if __name__ == "__main__":
    main()


