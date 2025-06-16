import csv
import os
import random
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


class GameController:
    def __init__(self, api_key=None, config=None):
        self.games_file = "data/games.csv"
        self.characters_file = "data/characters.csv"
        self.user_ignored_file = "data/user_ignored.csv"
        self.user_ratings_file = "data/user_ratings.csv"

        # Initialize CSV files
        self._init_csv_files()

        # Game configuration
        if api_key:
            # genai.configure(api_key=api_key)
            pass

        if config:
            # genai.configure(api_key=api_key)
            self.config = config
            self.arc_chapter_mapping = config.get('arc_to_chapter', [])
            self.schema = config.get('scheme', {})
            self.instructions = config.get('instruction_prompt', "")

        # Active games storage
        self.active_games = {}

    def _init_csv_files(self):
        """Initialize CSV files with headers if they don't exist"""
        os.makedirs("data", exist_ok=True)

        # Games CSV
        if not os.path.exists(self.games_file):
            with open(self.games_file, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(
                    ['game_session_id', 'character_name', 'is_canon', 'status', 'created_at', 'conversation',
                     'arc_selection', 'filler_percentage', 'include_non_tv_fillers', 'difficulty_level'])

        # Characters CSV
        if not os.path.exists(self.characters_file):
            with open(self.characters_file, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(['name', 'is_canon', 'first_chapter', 'first_episode', 'source', 'first_appearance'])

        # User ignored characters
        if not os.path.exists(self.user_ignored_file):
            with open(self.user_ignored_file, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(['character_name', 'reason', 'ignored_at'])

        # User ratings
        if not os.path.exists(self.user_ratings_file):
            with open(self.user_ratings_file, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(['character_name', 'rating', 'rated_at'])

    def start_game(self, request: GameStartRequest) -> GameStartResponse:
        """Initialize a new game session"""
        try:
            # Generate unique game session ID
            game_session_id = str(uuid.uuid4())

            # Select random character based on request parameters
            character_data = self._select_random_character(
                request.arc_selection,
                request.filler_percentage,
                request.include_non_tv_fillers,
                request.difficulty_level
            )

            if not character_data:
                return GameStartResponse(
                    game_session_id="",
                    message="No characters available for the selected criteria"
                )

            character_name, is_canon, additional_info = character_data

            # Create game prompt
            prompt = self._create_game_prompt(character_name, is_canon, additional_info)

            # Store active game
            self.active_games[game_session_id] = {
                'character_name': character_name,
                'is_canon': is_canon,
                'conversation': [{"role": "system", "content": prompt}],
                'status': 'active',
                'arc_selection': request.arc_selection,
                'filler_percentage': request.filler_percentage,
                'include_non_tv_fillers': request.include_non_tv_fillers,
                'difficulty_level': request.difficulty_level
            }

            # Save to CSV
            self._save_game_to_csv(game_session_id, character_name, is_canon, 'active', request)

            return GameStartResponse(
                game_session_id=game_session_id,
                message="Game started successfully! Ask yes/no questions to guess the character."
            )

        except Exception as e:
            return GameStartResponse(
                game_session_id="",
                message=f"Error starting game: {str(e)}"
            )

    def ask_question(self, request: GameQuestionRequest) -> GameQuestionResponse:
        """Process a yes/no question about the character"""
        try:
            game_session_id = request.game_session_id
            question = request.question_text

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
            game_session_id = request.game_session_id

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
        """Reveal information about the character"""
        try:
            game_session_id = request.game_session_id

            if game_session_id not in self.active_games:
                return GameRevealResponse(character_info="Game not found.")

            game = self.active_games[game_session_id]
            character_name = game['character_name']

            # Generate character summary
            character_info = self._get_character_summary(character_name)

            # End game
            game['status'] = 'revealed'
            self._update_game_status(game_session_id, 'revealed')

            return GameRevealResponse(character_info=character_info)

        except Exception as e:
            return GameRevealResponse(character_info=f"Error revealing character: {str(e)}")

    def make_guess(self, request: GameGuessRequest) -> GameGuessResponse:
        """Process a character guess and validate if correct"""
        try:
            game_session_id = request.game_session_id
            guessed_character = request.guessed_character

            if game_session_id not in self.active_games:
                return GameGuessResponse(is_correct=False, message="Game not found.")

            game = self.active_games[game_session_id]
            if game['status'] != 'active':
                return GameGuessResponse(is_correct=False, message="Game is not active.")

            character_name = game['character_name']

            # Check if guess is correct (case-insensitive)
            is_correct = guessed_character.lower().strip() == character_name.lower().strip()

            if is_correct:
                game['status'] = 'won'
                self._update_game_status(game_session_id, 'won')

                return GameGuessResponse(
                    is_correct=True,
                    message=f"Congratulations! You correctly guessed {character_name}!"
                )
            else:
                return GameGuessResponse(
                    is_correct=False,
                    message=f"Wrong guess! '{guessed_character}' is not the correct character. Keep trying!"
                )

        except Exception as e:
            return GameGuessResponse(is_correct=False, message=f"Error processing guess: {str(e)}")

    def _select_random_character(self, arc_selection, filler_percentage, include_non_tv_fillers, difficulty_level):
        """Select a random character based on criteria"""
        # This is where you'll integrate your data_fetcher logic
        # For now, returning a mock character
        mock_characters = [
            ("Monkey D. Luffy", True, ["Romance Dawn", "Chapter 1", "Episode 1"]),
            ("Roronoa Zoro", True, ["Romance Dawn", "Chapter 3", "Episode 2"]),
            ("Nami", True, ["Orange Town", "Chapter 8", "Episode 4"]),
        ]

        if mock_characters:
            return random.choice(mock_characters)
        return None

    def _create_game_prompt(self, character_name, is_canon, additional_info):
        """Create the initial prompt for the LLM"""
        appearance_info = f"First appeared in: {additional_info[0]}; Chapter: {additional_info[1]}; Episode: {additional_info[2]}" if len(
            additional_info) >= 3 else ""

        character_prompt = f"""
<character_profile>
## SECRET CHARACTER: {character_name}

### CORE INFORMATION
- APPEARANCE INFO: {appearance_info}
- CHARACTER TYPE: {'Canon' if is_canon else 'Filler'}

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
                request.arc_selection,
                request.filler_percentage,
                request.include_non_tv_fillers,
                request.difficulty_level
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