import random

from pyasn1_modules.rfc4357 import cryptographic_Gost_Useful_Definitions

from server.SessionManager import SessionManager
from server.pydantic_schemas.arc_schemas import Arc
from server.pydantic_schemas.character_schemas import Character

from server.pydantic_schemas.game_schemas import GameStartRequest

from server.Repository import Repository

def get_difficulty_range(difficulty_level: str) -> list[str]:
    """Map user-friendly difficulty to database difficulty ranges"""
    difficulty_mapping = {
        "easy": ["very easy", "easy", "medium"],
        "medium": ["easy", "medium", "hard"],
        "hard": ["medium", "hard", "really hard"]
    }

    if difficulty_level not in difficulty_mapping:
        raise ValueError(f"Invalid difficulty level: {difficulty_level}")

    return difficulty_mapping[difficulty_level]

def start_game(request: GameStartRequest, session_mgr: SessionManager, repository: Repository) -> list[Character]:
    """Initialize a new game session"""

    # Extract request parameters
    until_arc, include_unrated, difficulty_level, filler_percentage, include_non_tv_fillers = (
        request.arc_selection, request.include_unrated, request.difficulty_level,
        request.filler_percentage, request.include_non_tv_fillers
    )

    arc = repository.get_arc_by_name(until_arc)
    difficulty_range = get_difficulty_range(difficulty_level)

    # Get all possible characters based on filters - USE difficulty_range here
    canon_characters = repository.get_canon_characters(arc, difficulty_range, include_unrated)

    filler_characters = []
    if filler_percentage > 0:
        if include_non_tv_fillers:
            filler_characters = repository.get_non_canon_characters(arc, difficulty_range, include_unrated)
        else:
            filler_characters = repository.get_filler_characters(arc, difficulty_range, include_unrated)

    # Validate we have characters available
    if not canon_characters and not filler_characters:
        raise ValueError(
            f"No characters found for arc '{until_arc}' at difficulty {difficulty_level}")

    # Choose character type based on filler percentage
    random_num = random.random() * 100
    choose_canon = filler_percentage < random_num

    if choose_canon and canon_characters:
        chosen_character = random.choice(canon_characters)
    elif filler_characters:
        chosen_character = random.choice(filler_characters)
    elif canon_characters:
        chosen_character = random.choice(canon_characters)
    else:
        raise ValueError("No valid characters available for selection")

    # # Override character
    # for c in canon_characters:
    #     name = "cavendish"
    #     if name.lower() in c.name.lower():
    #         chosen_character = c
    #         break

    print(f"Chosen character: {chosen_character.name}")

    # Combine and sort all possible characters
    all_characters = canon_characters + filler_characters
    character_list = sorted(all_characters, key=lambda char: char.name)

    game_settings = {
        "arc_selection": until_arc,
        "filler_percentage": filler_percentage,
        "include_non_tv_fillers": include_non_tv_fillers,
        "difficulty_level": difficulty_level,
        "include_unrated": include_unrated,
    }

    prompt = create_game_prompt(chosen_character, session_mgr.get_global_arc_limit())
    session_mgr.start_new_game(chosen_character, game_settings, prompt)

    print(f"Game ID: {session_mgr.get_game_id()}")

    return character_list


def ask_question(question: str, session_mgr: SessionManager, llm) -> str:
    """Process a question about the character"""
    try:
        if not session_mgr.has_active_game():
            raise ValueError("No active game session")

        # Add user question to conversation
        session_mgr.add_conversation_message("user", question)

        # Get current conversation for context
        conversation = session_mgr.get_conversation()

        conversation_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in conversation])
        response = llm.query(conversation_text)

        # Add AI response to conversation
        session_mgr.add_conversation_message("assistant", response)

        return response

    except Exception as e:
        raise ValueError(f"Error processing question: {str(e)}")


def make_guess(character_name: str, session_mgr: SessionManager) -> dict:
    """Process a character guess"""
    try:
        if not session_mgr.has_active_game():
            raise ValueError("No active game session")

        target_character = session_mgr.get_target_character()
        is_correct = character_name.lower() == target_character["name"].lower()

        # Get stats before ending game
        questions_asked = session_mgr.get_questions_asked()
        guesses_made = session_mgr.get_guess_count() + 1  # +1 for current guess

        # Record the guess
        session_mgr.add_guess(character_name, is_correct)

        if is_correct:
            # End game and return full results
            session_mgr.end_game()
            return {
                "is_correct": True,
                "character": target_character,
                "questions_asked": questions_asked,
                "guesses_made": guesses_made
            }
        else:
            return {
                "is_correct": False
            }

    except Exception as e:
        raise ValueError(f"Error processing guess: {str(e)}")


def create_game_prompt(character: Character, last_arc: Arc) -> str:
    """Create the initial prompt for the LLM"""
    # Build appearance info from character object
    appearance_parts = []

    if character.chapter:
        appearance_parts.append(f"Chapter: {character.chapter}")
    if character.episode:
        appearance_parts.append(f"Episode: {character.episode}")

    appearance_info = "; ".join(appearance_parts) if appearance_parts else "No specific appearance info"

    if last_arc.name != "All":
        # add here to not add spoilers beyond session
        pass

    instructions = """
You are playing a character guessing game. You are roleplaying as a specific One Piece character.
The user will ask you yes/no questions to try to guess who you are.

RULES:
1. Only answer with "Yes", "No", or "I can't answer that"
2. Be helpful but don't make it too easy
3. Don't reveal your name directly
4. Stay in character
5. If asked about spoilers beyond the user's arc limit, say "I can't answer that"

"""

    character_prompt = f"""
<character_profile>
## SECRET CHARACTER: {character.name}

### CORE INFORMATION
- APPEARANCE INFO: {appearance_info}
- CHARACTER TYPE: {character.filler_status}

</character_profile>

Remember to follow the game instructions exactly. Wait for the user's first question before responding.
"""

    return instructions + character_prompt
