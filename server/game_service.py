import json
import random

from server.SessionManager import SessionManager
from server.database.db_models import Arc
from server.pydantic_schemas.character_schemas import Character
import google.generativeai as genai

from server.pydantic_schemas.game_schemas import GameStartRequest, GameQuestionRequest

from server.Repository import Repository


def start_game(request: GameStartRequest, session_mgr: SessionManager):
    """Initialize a new game session"""

    r = Repository()
    arc = r.get_arc_by_name(request.arc_selection)

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
            filler_characters = r.get_non_canon_characters(
                arc,
                request.difficulty_level,
                include_unrated=request.include_unrated
            )
        else:
            filler_characters = r.get_filler_characters(
                arc,
                request.difficulty_level,
                include_unrated=request.include_unrated
            )

        if not filler_characters:
            raise ValueError(
                f"No filler characters found for arc limit '{request.arc_selection}' at difficulty {request.difficulty_level}")

        chosen_character = random.choice(filler_characters)

    print(f"Chosen character: {chosen_character.name}")

    prompt = create_game_prompt(chosen_character, session_mgr.get_global_arc_limit())
    session_mgr.start_new_game(chosen_character, prompt)


def create_game_prompt(character: Character, last_arc: Arc):
    """Create the initial prompt for the LLM"""
    # Build appearance info from character object
    appearance_parts = []

    # if character.arc:
    #     appearance_parts.append(f"Arc: {character.arc}")
    if character.chapter:
        appearance_parts.append(f"Chapter: {character.chapter}")
    if character.episode:
        appearance_parts.append(f"Episode: {character.episode}")

    appearance_info = "; ".join(appearance_parts) if appearance_parts else "No specific appearance info"

    if last_arc.name != "All":
        # add here to not add spoilers beyond session
        pass

    instructions = ""

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


def ask_question(request: GameQuestionRequest, session_mgr: SessionManager) -> str:
    """Process a yes/no question about the character"""
    try:
        question = request.questionText

        if session_mgr.has_active_game():
            return "Game not found. Please start a new game."

        game = session_mgr.get_current_game()

        # Generate response using LLM
        response_dict = generate_llm_response(question, game['conversation'])

        return response_dict.get("response", "I didn't understand that question.")


    except Exception as e:
        return f"Error processing question: {str(e)}"


# ignore bugs here
def generate_llm_response(user_input, conversation, debug=True):
    if debug:
        return {"response": "yes" if "yes" in user_input.lower() else "no"}

    conversation.append({"role": "user", "content": user_input})
    full_prompt = "\n".join([f"{msg['role']}: {msg['content']}" for msg in conversation])

    model = genai.GenerativeModel("gemini-2.0-flash-exp")
    generation_config = {
        "response_mime_type": "application/json",
        "response_schema": schema
    }

    response = model.generate_content(full_prompt, generation_config=generation_config)
    response_dict = json.loads(response.candidates[0].content.parts[0].text)

    conversation.append({"role": "system", "content": response_dict.get("response", "")})
    return response_dict
