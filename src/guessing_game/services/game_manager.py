# server/game_manager.py
import json
from datetime import datetime
from typing import TypedDict

from redis.exceptions import ConnectionError, TimeoutError

from langchain_community.chat_message_histories import RedisChatMessageHistory
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from guessing_game.config import GAME_TTL, REDIS_URL, get_redis
from guessing_game.schemas.character_schemas import FullCharacter


class GameMessage(TypedDict):
    id: str
    text: str
    is_user: bool           # messages made by the user
    add_to_context: bool    # messages that should be included in llm context
    timestamp: float

class GameManager:
    def __init__(self):
        self.redis = get_redis()
        self.game_ttl = GAME_TTL

    def create_game(self, game_id: str, target_character: FullCharacter, prompt: str, game_settings: dict) -> None:
        """Store sensitive game data in Redis"""
        try:
            game_data = {
                "target_character": target_character.model_dump(),
                "system_prompt": prompt,
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
            self.get_memory(game_id)

            self.add_ui_message(
                game_id,
                "Welcome to the One Piece Character Guessing Game! I'm thinking of a character. Try to guess who it is!",
                False
            )

        except (ConnectionError, TimeoutError) as e:
            print(f"Redis connection error in create_game: {e}")
            raise RuntimeError("Game service unavailable")

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

    def get_memory(self, game_id: str) -> RedisChatMessageHistory:
        """Get or create LangChain chat message history for a game"""
        return RedisChatMessageHistory(
            session_id=f"chat:{game_id}",
            url=REDIS_URL,
            ttl=self.game_ttl
        )

    def add_message(self, game_id: str, text: str, is_user: bool, add_to_context: bool):
        """Add message to unified message storage"""
        # Get existing messages
        messages = self.get_all_messages(game_id)
        
        # Create message dict
        message: GameMessage = {
            "id": str(len(messages)),
            "text": text,
            "is_user": is_user,
            "add_to_context": add_to_context,
            "timestamp": datetime.now().timestamp()
        }
        
        # Add to unified message list
        messages.append(message)
        self._store_messages(game_id, messages)
        
        # If it's a chat message, also add to LangChain memory
        if add_to_context:
            memory = self.get_memory(game_id)
            if is_user:
                memory.add_message(HumanMessage(content=text))
                # Increment question counter
                game_data = self.get_game_data(game_id)
                if game_data:
                    game_data["questions_asked"] += 1
                    self.redis.setex(f"game:{game_id}", self.game_ttl, json.dumps(game_data))
            else:
                memory.add_message(AIMessage(content=text))

    def get_all_messages(self, game_id: str) -> list[GameMessage]:
        """Get all messages in chronological order"""
        data = self.redis.get(f"messages:{game_id}")
        if not data:
            return []
        
        return json.loads(data)

    def _store_messages(self, game_id: str, messages: list[GameMessage]):
        """Store messages to Redis"""
        self.redis.setex(f"messages:{game_id}", self.game_ttl, json.dumps(messages))

    def add_user_question(self, game_id: str, question: str):
        """Add user question and increment counter"""
        self.add_message(game_id, question, True, True)
    
    def add_assistant_response(self, game_id: str, response: str):
        """Add assistant response to memory"""
        self.add_message(game_id, response, False, True)

    def add_ui_message(self, game_id: str, text: str, is_user: bool):
        """Add a UI-only message (not sent to LLM)"""
        self.add_message(game_id, text, is_user, False)

    def get_system_prompt(self, game_id: str) -> str:
        """Get the system prompt for a game"""
        game_data = self.get_game_data(game_id)
        if not game_data:
            raise ValueError("Game not found in Redis")
        return game_data["system_prompt"]

    def add_guess(self, game_id: str):
        """Add a guess to the game and increment guess counter"""
        game_data = self.get_game_data(game_id)
        if not game_data:
            raise ValueError("Game not found in Redis")

        # Increment guess counter
        game_data["guesses_count"] += 1

        self.redis.setex(f"game:{game_id}", self.game_ttl, json.dumps(game_data))

    def get_questions_asked(self, game_id: str) -> int:
        """Get number of questions asked"""
        game_data = self.get_game_data(game_id)
        return game_data["questions_asked"] if game_data else 0

    def get_guess_count(self, game_id: str) -> int:
        """Get number of guesses made"""
        game_data = self.get_game_data(game_id)
        return game_data["guesses_count"] if game_data else 0

    def get_chat_messages(self, game_id: str) -> list[GameMessage]:
        """Get all chat messages in chronological order"""
        return self.get_all_messages(game_id)

    def delete_game(self, game_id: str):
        """Delete game data"""
        self.redis.delete(f"game:{game_id}")
        self.redis.delete(f"messages:{game_id}")
        self.redis.delete(f"chat:{game_id}")