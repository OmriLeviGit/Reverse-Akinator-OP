import random

from server.SessionManager import SessionManager
from server.pydantic_schemas.arc_schemas import Arc
from server.pydantic_schemas.character_schemas import Character

from server.pydantic_schemas.game_schemas import GameStartRequest

from server.Repository import Repository


def start_game(request: GameStartRequest, session_mgr: SessionManager):
    """Initialize a new game session"""

    r = Repository()
    arc = r.get_arc_by_name(request.arc_selection)

    # Game logic stays the same...
    random_num = random.random() * 100
    choose_canon = request.filler_percentage < random_num

    if choose_canon:
        canon_characters = r.get_canon_characters(
            arc,
            request.difficulty_level,
            include_unrated=request.include_unrated
        )
        if not canon_characters:
            raise ValueError(
                f"No canon characters found for arc limit '{request.arc_selection}' at difficulty {request.difficulty_level}")
        chosen_character = random.choice(canon_characters)
    else:
        if request.include_non_tv_fillers:
            filler_characters = r.get_non_canon_characters(arc, request.difficulty_level,
                                                           include_unrated=request.include_unrated)
        else:
            filler_characters = r.get_filler_characters(arc, request.difficulty_level,
                                                        include_unrated=request.include_unrated)

        if not filler_characters:
            raise ValueError(
                f"No filler characters found for arc limit '{request.arc_selection}' at difficulty {request.difficulty_level}")

        chosen_character = random.choice(filler_characters)

    print(f"Chosen character: {chosen_character.name}")

    # Convert request to game settings dict
    game_settings = {
        "arc_selection": request.arc_selection,
        "filler_percentage": request.filler_percentage,
        "include_non_tv_fillers": request.include_non_tv_fillers,
        "difficulty_level": request.difficulty_level,
        "include_unrated": request.include_unrated,
    }

    prompt = create_game_prompt(chosen_character, session_mgr.get_global_arc_limit())
    session_mgr.start_new_game(chosen_character, game_settings, prompt)


def ask_question(question: str, session_mgr: SessionManager) -> str:
    """Process a question about the character"""
    try:
        if not session_mgr.has_active_game():
            raise ValueError("No active game session")

        # Add user question to conversation
        session_mgr.add_conversation_message("user", question)

        # Get current conversation for context
        conversation = session_mgr.get_conversation()

        # Generate response using LLM (currently mocked)
        response = generate_llm_response(question, conversation)

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

        # Record the guess
        session_mgr.add_guess(character_name, is_correct)

        if is_correct:
            message = f"Congratulations! You guessed correctly - it was {target_character['name']}!"
            return {
                "is_correct": True,
                "message": message,
                "character": target_character
            }
        else:
            message = f"Sorry, that's not correct. The character is not {character_name}. Try asking more questions!"
            return {
                "is_correct": False,
                "message": message
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


def generate_llm_response(user_input: str, conversation: list, debug=True) -> str:
    """Generate LLM response (currently mocked)"""

    # Mock responses for testing
    if debug:
        responses = [
            "Yes, that's correct!",
            "No, that's not right.",
            "I can't answer that question.",
            "That's partially correct.",
            "Yes, you're on the right track!",
            "No, try a different approach."
        ]
        return random.choice(responses)

    # TODO: Implement actual LLM integration here
    # conversation_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in conversation])
    # model = genai.GenerativeModel("gemini-2.0-flash-exp")
    # response = model.generate_content(conversation_text)
    # return response.text

    return "I'm not sure how to answer that."