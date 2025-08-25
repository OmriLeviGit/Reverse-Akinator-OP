# server/GameManager.py
import json
import redis
from datetime import datetime
from typing import Optional, Dict, Any


class GameManager:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.game_ttl = 3600  # 1 hour TTL for games

    def create_game(self, game_id: str, target_character: Dict[str, Any], prompt: str) -> None:
        """Store sensitive game data in Redis"""
        game_data = {
            "target_character": target_character,
            "conversation": [{"role": "system", "content": prompt}],
            "guesses_made": [],
            "created_at": datetime.now().isoformat()
        }

        self.redis.setex(
            f"game:{game_id}",
            self.game_ttl,
            json.dumps(game_data)
        )

    def get_game_data(self, game_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve game data from Redis"""
        data = self.redis.get(f"game:{game_id}")
        return json.loads(data) if data else None

    def game_exists(self, game_id: str) -> bool:
        """Check if game exists in Redis"""
        return self.redis.exists(f"game:{game_id}") > 0

    def get_target_character(self, game_id: str) -> Dict[str, Any]:
        """Get the target character for a game"""
        game_data = self.get_game_data(game_id)
        if not game_data:
            raise ValueError("Game not found in Redis")
        return game_data["target_character"]

    def add_conversation_message(self, game_id: str, role: str, content: str):
        """Add message to conversation"""
        game_data = self.get_game_data(game_id)
        if not game_data:
            raise ValueError("Game not found in Redis")

        game_data["conversation"].append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })

        self.redis.setex(f"game:{game_id}", self.game_ttl, json.dumps(game_data))

    def get_conversation(self, game_id: str) -> list[Dict[str, Any]]:
        """Get conversation history"""
        game_data = self.get_game_data(game_id)
        if not game_data:
            raise ValueError("Game not found in Redis")
        return game_data["conversation"]

    def add_guess(self, game_id: str, guess: str, is_correct: bool):
        """Add a guess to the game"""
        game_data = self.get_game_data(game_id)
        if not game_data:
            raise ValueError("Game not found in Redis")

        game_data["guesses_made"].append({
            "guess": guess,
            "is_correct": is_correct,
            "timestamp": datetime.now().isoformat()
        })

        self.redis.setex(f"game:{game_id}", self.game_ttl, json.dumps(game_data))

    def get_guesses_made(self, game_id: str) -> list[Dict[str, Any]]:
        """Get all guesses made in game"""
        game_data = self.get_game_data(game_id)
        return game_data["guesses_made"] if game_data else []

    def delete_game(self, game_id: str):
        """Delete game data"""
        self.redis.delete(f"game:{game_id}")