# server/game_service.py - Pass Character objects directly
import random
import os
from datetime import datetime

from guessing_game.services.arc_service import ArcService
from guessing_game.services.session_manager import SessionManager
from guessing_game.services.game_manager import GameManager
from guessing_game.services.prompt_service import PromptService
from guessing_game.schemas.character_schemas import BasicCharacter
from guessing_game.schemas.game_schemas import GameStartRequest
from guessing_game.services.character_service import CharacterService


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


def start_game(request: GameStartRequest, session_mgr: SessionManager, game_mgr: GameManager,
               character_service: CharacterService, arc_service: ArcService, prompt_service: PromptService
               ) -> list[BasicCharacter]:
    """Initialize a new game session"""

    # Extract request parameters
    selected_arc, include_unrated, difficulty_level, filler_percentage, include_non_tv_fillers = (
        request.arc_selection, request.include_unrated, request.difficulty_level,
        request.filler_percentage, request.include_non_tv_fillers
    )

    arc = arc_service.get_arc_by_name(selected_arc)
    
    difficulty_range = get_difficulty_range(difficulty_level)

    # Get all possible characters based on filters
    canon_characters = character_service.get_canon_characters(arc, difficulty_range, include_unrated)

    filler_characters = []
    if filler_percentage > 0:
        if include_non_tv_fillers:
            filler_characters = character_service.get_non_canon_characters(arc, difficulty_range, include_unrated)
        else:
            filler_characters = character_service.get_filler_characters(arc, difficulty_range, include_unrated)

    # Validate we have characters available
    if not canon_characters and not filler_characters:
        raise ValueError(
            f"No characters found for arc '{selected_arc}' at difficulty {difficulty_level}")

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

    # Combine and sort all possible characters
    all_characters = canon_characters + filler_characters
    character_list = sorted(all_characters, key=lambda char: char.name)

    # Check for environment variable override
    override_character = os.getenv('FORCE_CHARACTER')
    if override_character:
        for c in character_list:
            if override_character.lower() in c.name.lower():
                chosen_character = c
                print(f"Character overridden to: {chosen_character.name}")
                break

    chosen_character = character_service.get_full_character_by_id(chosen_character.id)

    game_settings = {
        "arc_selection": selected_arc,
        "filler_percentage": filler_percentage,
        "include_non_tv_fillers": include_non_tv_fillers,
        "difficulty_level": difficulty_level,
        "include_unrated": include_unrated,
    }

    # Create game ID and prompt
    game_id = f"game_{datetime.now().timestamp()}"

    # Get forbidden arcs for spoiler protection
    forbidden_arcs = arc_service.get_forbidden_arcs(session_mgr.get_global_arc_limit())

    prompt = prompt_service.create_game_prompt(chosen_character, forbidden_arcs)

    # Pass Character object directly - GameManager will handle serialization
    game_mgr.create_game(game_id, chosen_character, prompt, game_settings)

    # Store ONLY the game ID in session
    session_mgr.set_current_game_id(game_id)

    print(f"Game ID: {game_id}, character: {chosen_character.name}")
    return character_list


def ask_question(question: str, session_mgr: SessionManager, game_mgr: GameManager, llm, prompt_service: PromptService, arc_service: ArcService) -> str:
    """Process a question about the character"""
    try:
        if not session_mgr.has_active_game():
            raise ValueError("No active game session")

        game_id = session_mgr.get_current_game_id()

        # Get target character and system prompt
        target_character = game_mgr.get_target_character(game_id)
        system_prompt = game_mgr.get_system_prompt(game_id)

        # Get forbidden arcs for spoiler protection
        forbidden_arcs = arc_service.get_forbidden_arcs(session_mgr.get_global_arc_limit())

        # Get relevant character context from vector database with arc restrictions
        character_context = prompt_service.get_character_context(target_character.id, question, forbidden_arcs=forbidden_arcs)

        # Get conversation memory
        memory = game_mgr.get_memory(game_id)
        chat_history = memory.messages


        # Build the complete dynamic prompt
        updated_prompt = prompt_service.build_dynamic_prompt(
            system_prompt, character_context, chat_history, question
        )

        response = llm.query(updated_prompt)

        # Now add both question and response to memory8
        game_mgr.add_user_question(game_id, question)
        game_mgr.add_assistant_response(game_id, response)
        
        return response

    except Exception as e:
        raise ValueError(f"Error processing question: {str(e)}")


def _get_game_end_data(session_mgr: SessionManager, game_mgr: GameManager) -> dict:
    """Helper function to get character and stats data when a game ends"""
    game_id = session_mgr.get_current_game_id()
    character = game_mgr.get_target_character(game_id)
    questions_asked = game_mgr.get_questions_asked(game_id)
    guesses_made = game_mgr.get_guess_count(game_id)
    
    return {
        "character": character,
        "questions_asked": questions_asked,
        "guesses_made": guesses_made,
        "game_id": game_id
    }

def make_guess(character_name: str, session_mgr: SessionManager, game_mgr: GameManager) -> dict:
    """Process a character guess"""
    try:
        if not session_mgr.has_active_game():
            raise ValueError("No active game session")

        game_id = session_mgr.get_current_game_id()

        # Get target character as Character object
        target_character = game_mgr.get_target_character(game_id)
        is_correct = character_name.lower() == target_character.name.lower()

        # Add guess messages to UI (not LLM context)
        game_mgr.add_ui_message(game_id, f"I guess it's {character_name}!", True)

        # GameManager handles guess recording and counter increment
        game_mgr.add_guess(game_id, character_name, is_correct)

        if is_correct:
            # Get data before cleaning up game
            game_data = _get_game_end_data(session_mgr, game_mgr)
            # Add 1 to guesses_made since we just recorded the current guess
            game_data["guesses_made"] += 1
            
            game_mgr.delete_game(game_id)
            session_mgr.clear_current_game()

            return {
                "is_correct": True,
                "character": game_data["character"],
                "questions_asked": game_data["questions_asked"],
                "guesses_made": game_data["guesses_made"]
            }
        else:
            # Add incorrect guess response as UI message
            game_mgr.add_ui_message(game_id, f"Sorry, that's not correct. The character is not {character_name}. Try asking more questions!", False)
            return {
                "is_correct": False
            }

    except Exception as e:
        raise ValueError(f"Error processing guess: {str(e)}")

def reveal_character(session_mgr: SessionManager, game_mgr: GameManager) -> dict:
    """Reveal the character when user gives up"""
    try:
        if not session_mgr.has_active_game():
            raise ValueError("No active game session")

        # Get data before cleaning up game
        game_data = _get_game_end_data(session_mgr, game_mgr)
        
        game_mgr.delete_game(game_data["game_id"])
        session_mgr.clear_current_game()

        return {
            "character": game_data["character"],
            "questions_asked": game_data["questions_asked"],
            "guesses_made": game_data["guesses_made"]
        }
        
    except Exception as e:
        raise ValueError(f"Error revealing character: {str(e)}")

