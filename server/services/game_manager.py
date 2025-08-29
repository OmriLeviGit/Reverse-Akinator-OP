# server/game_manager.py
import json
from datetime import datetime

from langchain.memory import ConversationBufferMemory
from langchain.memory.chat_message_histories import RedisChatMessageHistory

from server.config import GAME_TTL, REDIS_URL, get_redis
from server.schemas.character_schemas import Character


class GameManager:
    def __init__(self):
        self.redis = get_redis()
        self.game_ttl = GAME_TTL

    def create_game(self, game_id: str, target_character: Character, prompt: str, game_settings: dict) -> None:
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

    def get_game_data(self, game_id: str) -> dict | None:
        """Retrieve game data from Redis"""
        data = self.redis.get(f"game:{game_id}")
        return json.loads(data) if data else None

    def game_exists(self, game_id: str) -> bool:
        """Check if game exists in Redis"""
        return self.redis.exists(f"game:{game_id}") > 0

    def get_target_character(self, game_id: str) -> Character:
        """Get the target character for a game as Character object"""
        game_data = self.get_game_data(game_id)
        if not game_data:
            raise ValueError("Game not found in Redis")

        # Convert dict back to Character object
        return Character(**game_data["target_character"])

    def get_game_settings(self, game_id: str) -> dict:
        """Get game settings"""
        game_data = self.get_game_data(game_id)
        if not game_data:
            raise ValueError("Game not found in Redis")
        return game_data["game_settings"]

    def _get_or_create_memory(self, game_id: str) -> ConversationBufferMemory:
        """Get or create LangChain memory for a game"""
        message_history = RedisChatMessageHistory(
            session_id=f"chat:{game_id}",
            url=REDIS_URL,
            ttl=self.game_ttl
        )
        
        return ConversationBufferMemory(
            chat_memory=message_history,
            return_messages=True
        )
    
    def get_memory(self, game_id: str) -> ConversationBufferMemory:
        """Get LangChain memory for a game"""
        return self._get_or_create_memory(game_id)
    
    def add_user_question(self, game_id: str, question: str):
        """Add user question and increment counter"""
        memory = self._get_or_create_memory(game_id)
        memory.chat_memory.add_user_message(question)
        
        # Increment question counter
        game_data = self.get_game_data(game_id)
        if game_data:
            game_data["questions_asked"] += 1
            self.redis.setex(f"game:{game_id}", self.game_ttl, json.dumps(game_data))
    
    def add_assistant_response(self, game_id: str, response: str):
        """Add assistant response to memory"""
        memory = self._get_or_create_memory(game_id)
        memory.chat_memory.add_ai_message(response)

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

    def delete_game(self, game_id: str):
        """Delete game data"""
        self.redis.delete(f"game:{game_id}")