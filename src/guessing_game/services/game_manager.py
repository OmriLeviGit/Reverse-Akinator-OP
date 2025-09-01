# server/game_manager.py
import json
from datetime import datetime

from langchain_community.chat_message_histories import RedisChatMessageHistory

from guessing_game.config import GAME_TTL, REDIS_URL, get_redis
from guessing_game.schemas.character_schemas import FullCharacter


class GameManager:
    def __init__(self):
        self.redis = get_redis()
        self.game_ttl = GAME_TTL

    def create_game(self, game_id: str, target_character: FullCharacter, prompt: str, game_settings: dict) -> None:
        """Store sensitive game data in Redis"""
        game_data = {
            "target_character": target_character.model_dump(),
            "system_prompt": prompt,  # Store prompt separately
            "guesses_made": [],
            "game_settings": game_settings,
            "questions_asked": 0,
            "guesses_count": 0,
            "created_at": datetime.now().isoformat()
        }

        self.redis.setex(
            f"game:{game_id}",
            self.game_ttl,
            json.dumps(game_data)
        )
        
        # Initialize LangChain memory for this game
        self._get_or_create_memory(game_id)
        
        # Initialize UI messages with welcome message
        welcome_message = {
            "id": "welcome",
            "text": "Welcome to the One Piece Character Guessing Game! I'm thinking of a character. Try to guess who it is!",
            "isUser": False
        }
        self.redis.setex(
            f"ui_messages:{game_id}",
            self.game_ttl,
            json.dumps([welcome_message])
        )

    def get_game_data(self, game_id: str) -> dict | None:
        """Retrieve game data from Redis"""
        data = self.redis.get(f"game:{game_id}")
        return json.loads(data) if data else None

    def game_exists(self, game_id: str) -> bool:
        """Check if game exists in Redis"""
        return self.redis.exists(f"game:{game_id}") > 0

    def get_target_character(self, game_id: str) -> FullCharacter:
        """Get the target character for a game as Character object"""
        game_data = self.get_game_data(game_id)
        if not game_data:
            raise ValueError("Game not found in Redis")

        # Convert dict back to Character object
        return FullCharacter(**game_data["target_character"])

    def get_game_settings(self, game_id: str) -> dict:
        """Get game settings"""
        game_data = self.get_game_data(game_id)
        if not game_data:
            raise ValueError("Game not found in Redis")
        return game_data["game_settings"]

    def _get_or_create_memory(self, game_id: str) -> RedisChatMessageHistory:
        """Get or create LangChain chat message history for a game"""
        return RedisChatMessageHistory(
            session_id=f"chat:{game_id}",
            url=REDIS_URL,
            ttl=self.game_ttl
        )
    
    def get_memory(self, game_id: str) -> RedisChatMessageHistory:
        """Get LangChain chat message history for a game"""
        return self._get_or_create_memory(game_id)
    
    def add_user_question(self, game_id: str, question: str):
        """Add user question and increment counter"""
        memory = self._get_or_create_memory(game_id)
        memory.add_user_message(question)
        
        # Increment question counter
        game_data = self.get_game_data(game_id)
        if game_data:
            game_data["questions_asked"] += 1
            self.redis.setex(f"game:{game_id}", self.game_ttl, json.dumps(game_data))
    
    def add_assistant_response(self, game_id: str, response: str):
        """Add assistant response to memory"""
        memory = self._get_or_create_memory(game_id)
        memory.add_ai_message(response)

    def get_system_prompt(self, game_id: str) -> str:
        """Get the system prompt for a game"""
        game_data = self.get_game_data(game_id)
        if not game_data:
            raise ValueError("Game not found in Redis")
        return game_data["system_prompt"]

    def add_guess(self, game_id: str, guess: str, is_correct: bool):
        """Add a guess to the game and increment guess counter"""
        game_data = self.get_game_data(game_id)
        if not game_data:
            raise ValueError("Game not found in Redis")

        game_data["guesses_made"].append({
            "guess": guess,
            "is_correct": is_correct,
            "timestamp": datetime.now().isoformat()
        })

        # Increment guess counter
        game_data["guesses_count"] += 1

        self.redis.setex(f"game:{game_id}", self.game_ttl, json.dumps(game_data))

    def get_guesses_made(self, game_id: str) -> list[dict[str, dict]]:
        """Get all guesses made in game"""
        game_data = self.get_game_data(game_id)
        return game_data["guesses_made"] if game_data else []

    def get_questions_asked(self, game_id: str) -> int:
        """Get number of questions asked"""
        game_data = self.get_game_data(game_id)
        return game_data["questions_asked"] if game_data else 0

    def get_guess_count(self, game_id: str) -> int:
        """Get number of guesses made"""
        game_data = self.get_game_data(game_id)
        return game_data["guesses_count"] if game_data else 0

    def add_ui_message(self, game_id: str, text: str, is_user: bool):
        """Add a UI-only message (not sent to LLM)"""
        ui_messages = self.get_ui_messages(game_id)
        new_message = {
            "id": f"ui_{len(ui_messages)}_{datetime.now().timestamp()}",
            "text": text,
            "isUser": is_user
        }
        ui_messages.append(new_message)
        self.redis.setex(f"ui_messages:{game_id}", self.game_ttl, json.dumps(ui_messages))

    def get_ui_messages(self, game_id: str) -> list[dict]:
        """Get UI-only messages"""
        data = self.redis.get(f"ui_messages:{game_id}")
        return json.loads(data) if data else []

    def get_chat_messages(self, game_id: str) -> list[dict]:
        """Get all chat messages (UI messages + LLM messages combined in order)"""
        ui_messages = self.get_ui_messages(game_id)
        llm_messages = []
        
        # Get LLM messages and convert to our format
        memory = self._get_or_create_memory(game_id)
        for i, message in enumerate(memory.messages):
            message_id = f"llm_{i}"
            is_user = message.type == "human"
            llm_messages.append({
                "id": message_id,
                "text": message.content,
                "isUser": is_user
            })
        
        # Combine messages - UI messages first (welcome + guesses), then LLM messages in order
        # This preserves chronological order since UI messages are added at specific points
        # and LLM messages are added in sequence
        return ui_messages + llm_messages

    def delete_game(self, game_id: str):
        """Delete game data"""
        self.redis.delete(f"game:{game_id}")
        self.redis.delete(f"ui_messages:{game_id}")