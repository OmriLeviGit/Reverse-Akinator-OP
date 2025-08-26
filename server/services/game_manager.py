# server/game_manager.py
import json
from datetime import datetime

from server.config import GAME_TTL
from server.config.redis import get_redis
from server.schemas.character_schemas import Character


class GameManager:
    def __init__(self):
        self.redis = get_redis()
        self.game_ttl = GAME_TTL

    def create_game(self, game_id: str, target_character: Character, prompt: str,
game_settings: dict) -> None:
        """Store sensitive game data in Redis"""
        game_data = {
            "target_character": target_character.model_dump(),  # Only serialize when storing in Redis
            "conversation": [{"role": "system", "content": prompt}],
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

    def add_conversation_message(self, game_id: str, role: str, content: str):
        """Add message to conversation and increment question counter if user message"""
        game_data = self.get_game_data(game_id)
        if not game_data:
            raise ValueError("Game not found in Redis")

        game_data["conversation"].append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })

        # Increment question counter for user messages
        if role == "user":
            game_data["questions_asked"] += 1

        self.redis.setex(f"game:{game_id}", self.game_ttl, json.dumps(game_data))

    def get_conversation(self, game_id: str) -> list[dict]:
        """Get conversation history"""
        game_data = self.get_game_data(game_id)
        if not game_data:
            raise ValueError("Game not found in Redis")
        return game_data["conversation"]

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