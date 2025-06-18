import csv
import json
import uuid
from datetime import datetime
# import google.generativeai as genai

from schemas.game_schemas import (
    GameStartRequest, GameStartResponse,
    GameQuestionRequest, GameQuestionResponse,
    GameHintRequest, GameHintResponse,
    GameRevealRequest, GameRevealResponse,
    GameGuessRequest, GameGuessResponse,
)
from schemas.character_schemas import Character
from mockData import mock_characters


class GameController:
    def __init__(self, api_key=None):
        self.active_games = {}

    def start_game(self, request: GameStartRequest) -> GameStartResponse:
        """Initialize a new game session"""

        try:
            # Generate unique game session ID
            game_session_id = str(uuid.uuid4())

            # Select random character based on request parameters
            character = self._select_random_character(
                request.arcSelection,
                request.fillerPercentage,
                request.includeNonTVFillers,
                request.difficultyLevel
            )

            if not character:
                return GameStartResponse(
                    gameSessionId="",
                    message="No characters available for the selected criteria"
                )

            # Create game prompt
            prompt = self._create_game_prompt(character)

            # Store active game
            self.active_games[game_session_id] = {
                'character_name': character.name,
                'filler_status': character.fillerStatus,  # "canon" | "filler" | "filler-non-tv"
                'conversation': [{"role": "system", "content": prompt}],
                'status': 'active',
                'wiki_link': character.wikiLink
            }

            # Save to CSV
            # self._save_game_to_csv(game_session_id, character_name, is_canon, 'active', request)

            return GameStartResponse(
                gameSessionId=game_session_id,
                message="Game started successfully! Ask yes/no questions to guess the character."
            )

        except Exception as e:
            return GameStartResponse(
                gameSessionId="",
                message=f"Error starting game: {str(e)}"
            )

    def ask_question(self, request: GameQuestionRequest) -> GameQuestionResponse:
        """Process a yes/no question about the character"""
        try:
            game_session_id = request.gameSessionId
            question = request.questionText

            if game_session_id not in self.active_games:
                return GameQuestionResponse(answer="Game not found. Please start a new game.")

            game = self.active_games[game_session_id]
            if game['status'] != 'active':
                return GameQuestionResponse(answer="Game is not active. Please start a new game.")

            # Generate response using LLM
            response_dict = self._generate_llm_response(question, game['conversation'])

            # Handle special responses
            if response_dict.get("response") == "correct":
                game['status'] = 'won'
                self._update_game_status(game_session_id, 'won')
                return GameQuestionResponse(
                    answer=f"Congratulations! You guessed correctly! The character was {game['character_name']}."
                )

            elif response_dict.get("response") == "forfeit":
                game['status'] = 'ended'
                self._update_game_status(game_session_id, 'ended')
                return GameQuestionResponse(
                    answer=f"Game ended. The character was {game['character_name']}."
                )

            return GameQuestionResponse(
                answer=response_dict.get("response", "I didn't understand that question.")
            )

        except Exception as e:
            return GameQuestionResponse(answer=f"Error processing question: {str(e)}")

    def get_hint(self, request: GameHintRequest) -> GameHintResponse:
        """Provide a hint about the character"""
        try:
            game_session_id = request.gameSessionId

            if game_session_id not in self.active_games:
                return GameHintResponse(hint="Game not found. Please start a new game.")

            game = self.active_games[game_session_id]
            if game['status'] != 'active':
                return GameHintResponse(hint="Game is not active. Please start a new game.")

            # Generate hint using LLM
            response_dict = self._generate_llm_response("hint", game['conversation'])

            hint = response_dict.get("hint", "No specific hint available at this time.")

            return GameHintResponse(hint=hint)

        except Exception as e:
            return GameHintResponse(hint=f"Error getting hint: {str(e)}")

    def reveal_character(self, request: GameRevealRequest) -> GameRevealResponse:
        try:
            # game_session_id = request.gameSessionId
            #
            # if game_session_id not in self.active_games:
            #     raise ValueError("Game not found")
            #
            # game = self.active_games[game_session_id]
            # character_name = game['character_name']
            # character = self._get_character_by_name(character_name)

            # For now using mock data, later replace with actual character lookup
            character = mock_characters[0]


            # # End game
            # game['status'] = 'revealed'
            # self._update_game_status(game_session_id, 'revealed')

            return GameRevealResponse(character=character)

        except Exception as e:
            raise ValueError(f"Error revealing character: {str(e)}")

    def make_guess(self, request: GameGuessRequest) -> GameGuessResponse:
        """Process a character guess and validate if correct"""
        try:
            game_session_id = request.gameSessionId
            guessed_character = request.guessedCharacter

            if game_session_id not in self.active_games:
                return GameGuessResponse(isCorrect=False, message="Game not found.")

            game = self.active_games[game_session_id]
            if game['status'] != 'active':
                return GameGuessResponse(isCorrect=False, message="Game is not active.")

            character_name = game['character_name']

            # Check if guess is correct (case-insensitive)
            is_correct = guessed_character.lower().strip() == character_name.lower().strip()

            if is_correct:
                game['status'] = 'won'
                self._update_game_status(game_session_id, 'won')

                return GameGuessResponse(
                    isCorrect=True,
                    message=f"Congratulations! You correctly guessed {character_name}!"
                )
            else:
                return GameGuessResponse(
                    isCorrect=False,
                    message=f"Wrong guess! '{guessed_character}' is not the correct character. Keep trying!"
                )

        except Exception as e:
            return GameGuessResponse(isCorrect=False, message=f"Error processing guess: {str(e)}")

    def _select_random_character(self, arc_selection, filler_percentage, include_non_tv_fillers, difficulty_level):
        """Select a random character based on criteria"""
        # This is where you'll integrate your data_fetcher logic
        # For now, returning a mock character
        return mock_characters[0]

    def _create_game_prompt(self, character: Character):
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

        character_prompt = f"""
    <character_profile>
    ## SECRET CHARACTER: {character.name}

    ### CORE INFORMATION
    - APPEARANCE INFO: {appearance_info}
    - CHARACTER TYPE: {character.fillerStatus}

    </character_profile>

    Remember to follow the game instructions exactly. Wait for the user's first question before responding.
    """
        return self.instructions + character_prompt

    def _generate_llm_response(self, user_input, conversation):
        """Generate response using Gemini"""

            # Mock response for testing
        return {"response": "yes" if "yes" in user_input.lower() else "no"}

        # conversation.append({"role": "user", "content": user_input})
        # full_prompt = "\n".join([f"{msg['role']}: {msg['content']}" for msg in conversation])
        #
        # # model = genai.GenerativeModel("gemini-2.0-flash-exp")
        # generation_config = {
        #     "response_mime_type": "application/json",
        #     "response_schema": self.schema
        # }

        # response = model.generate_content(full_prompt, generation_config=generation_config)
        # response_dict = json.loads(response.candidates[0].content.parts[0].text)

        # conversation.append({"role": "system", "content": response_dict.get("response", "")})
        # return response_dict

        return {}

    def _get_character_summary(self, character_name):
        """Get character summary"""
        # Basic character info - you can enhance this with your data_fetcher
        wiki_link = f"https://onepiece.fandom.com/wiki/{character_name.replace(' ', '_')}"
        return f"The character was {character_name}. Check out more info at: {wiki_link}"

    def _save_game_to_csv(self, game_session_id, character_name, is_canon, status, request: GameStartRequest):
        """Save game to CSV file"""
        with open(self.games_file, 'a', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([
                game_session_id,
                character_name,
                is_canon,
                status,
                datetime.now().isoformat(),
                json.dumps([]),  # Empty conversation initially
                request.arcSelection,
                request.fillerPercentage,
                request.includeNonTVFillers,
                request.difficultyLevel
            ])

    def _update_game_status(self, game_session_id, status):
        """Update game status in CSV"""
        # Read all games
        games = []
        try:
            with open(self.games_file, 'r') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row['game_session_id'] == game_session_id:
                        row['status'] = status
                    games.append(row)

            # Write back
            with open(self.games_file, 'w', newline='') as f:
                if games:
                    writer = csv.DictWriter(f, fieldnames=games[0].keys())
                    writer.writeheader()
                    writer.writerows(games)
        except FileNotFoundError:
            pass  # File doesn't exist yet