import csv
import json
import random
import uuid
from datetime import datetime

from fastapi import Depends

from server.SessionManager import SessionManager, get_session_manager
# import google.generativeai as genai

from server.schemas.game_schemas import (
    GameStartRequest, GameStartResponse,
    GameQuestionRequest, GameQuestionResponse,
    GameHintRequest, GameHintResponse,
    GameGuessRequest, GameGuessResponse,
)

from server.Repository import Repository



# def start_game(request: GameStartRequest) -> GameStartResponse:
def start_game(request: GameStartRequest, session_mgr):
    """Initialize a new game session"""

    r = Repository()

    canon_characters = r.get_canon_characters(request.arcSelection, request.difficulty_level)

    if request.include_non_tv_fillers:
        filler_characters = r.get_non_canon_characters(request.arcSelection, request.difficulty_level)
    else:
        filler_characters = r.get_filler_characters(request.arcSelection, request.difficulty_level)

    choose_canon = request.fillerPercentage < random.random()

    if choose_canon:
        chosen_character = random.choice(canon_characters)
    else:
        chosen_character = random.choice(filler_characters)

    prompt = create_game_prompt(chosen_character, session_mgr.get_global_arc_limit())
    session_mgr.start_new_game(chosen_character, prompt)

    return


def create_game_prompt(character, last_arc):
    """Create the initial prompt for the LLM"""
    # Build appearance info from character object
    appearance_parts = []
    if character.arc:
        appearance_parts.append(f"Arc: {character.arc}")
    if character.chapter:
        appearance_parts.append(f"Chapter: {character.chapter}")
    if character.episode:
        appearance_parts.append(f"Episode: {character.episode}")

    appearance_info = "; ".join(appearance_parts) if appearance_parts else "No specific appearance info"


    if last_arc != "All":
        # add here to not add spoilers beyond session
        pass

    instructions = ""

    character_prompt = f"""
<character_profile>
## SECRET CHARACTER: {character.name}

### CORE INFORMATION
- APPEARANCE INFO: {appearance_info}
- CHARACTER TYPE: {character.fillerStatus}

</character_profile>

Remember to follow the game instructions exactly. Wait for the user's first question before responding.
"""

    return instructions + character_prompt

def ask_question(request: GameQuestionRequest, session_mgr) -> GameQuestionResponse:
    """Process a yes/no question about the character"""
    try:
        question = request.questionText

        if session_mgr.has_active_game():
            return GameQuestionResponse(answer="Game not found. Please start a new game.")

        game = session_mgr.get_current_game()

        # Generate response using LLM
        response_dict = generate_llm_response(question, game['conversation'])

        return GameQuestionResponse(
            answer=response_dict.get("response", "I didn't understand that question.")
        )

    except Exception as e:
        return GameQuestionResponse(answer=f"Error processing question: {str(e)}")

#
def generate_llm_response(user_input, conversation, debug=True):

    if debug:
        return {"response": "yes" if "yes" in user_input.lower() else "no"}

    conversation.append({"role": "user", "content": user_input})
    full_prompt = "\n".join([f"{msg['role']}: {msg['content']}" for msg in conversation])

    model = genai.GenerativeModel("gemini-2.0-flash-exp")
    generation_config = {
        "response_mime_type": "application/json",
        "response_schema":schema
    }

    response = model.generate_content(full_prompt, generation_config=generation_config)
    response_dict = json.loads(response.candidates[0].content.parts[0].text)

    conversation.append({"role": "system", "content": response_dict.get("response", "")})
    return response_dict


# def _get_character_summary(self, character_name):
#     """Get character summary"""
#     # Basic character info - you can enhance this with your data_fetcher
#     wiki_link = f"https://onepiece.fandom.com/wiki/{character_name.replace(' ', '_')}"
#     return f"The character was {character_name}. Check out more info at: {wiki_link}"

# def _save_game_to_csv(self, game_session_id, character_name, is_canon, status, request: GameStartRequest):
#     """Save game to CSV file"""
#     with open(self.games_file, 'a', newline='') as f:
#         writer = csv.writer(f)
#         writer.writerow([
#             game_session_id,
#             character_name,
#             is_canon,
#             status,
#             datetime.now().isoformat(),
#             json.dumps([]),  # Empty conversation initially
#             request.arcSelection,
#             request.fillerPercentage,
#             request.includeNonTVFillers,
#             request.difficultyLevel
#         ])
#
# def _update_game_status(self, game_session_id, status):
#     """Update game status in CSV"""
#     # Read all games
#     games = []
#     try:
#         with open(self.games_file, 'r') as f:
#             reader = csv.DictReader(f)
#             for row in reader:
#                 if row['game_session_id'] == game_session_id:
#                     row['status'] = status
#                 games.append(row)
#
#         # Write back
#         with open(self.games_file, 'w', newline='') as f:
#             if games:
#                 writer = csv.DictWriter(f, fieldnames=games[0].keys())
#                 writer.writeheader()
#                 writer.writerows(games)
#     except FileNotFoundError:
#         pass  # File doesn't exist yet