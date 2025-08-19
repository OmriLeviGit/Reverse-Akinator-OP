from datetime import datetime
from typing import Optional, Dict, List
from fastapi import Request

from server.Repository import Repository
from server.pydantic_schemas.arc_schemas import Arc


class SessionManager:
    def __init__(self, request: Request):
        self.request = request

    def has_session_data(self) -> bool:
        """Check if session has been initialized with our app database"""
        return "session_created" in self.request.session

    def create_initial_session(self):
        """Create initial session with defaults"""
        now = datetime.now().isoformat()

        self.request.session.update({
            "global_arc_limit": "All",
            "session_created": now,
            "last_activity": now
        })

    def get_safe_session_data(self) -> Dict:
        """Get all session data EXCEPT secret target_character"""
        session_copy = dict(self.request.session)

        # Remove sensitive data from current_game
        if "current_game" in session_copy:
            game_copy = dict(session_copy["current_game"])
            # Remove the secret target character
            game_copy.pop("target_character", None)
            session_copy["current_game"] = game_copy

        return session_copy

    # ===== GLOBAL SPOILER SETTINGS =====
    def get_global_arc_limit(self) -> Arc:
        """Get user's global spoiler arc limit"""
        return Repository().get_arc_by_name(self.request.session.get("global_arc_limit", "All"))

    def set_global_arc_limit(self, arc: str):
        """Set user's global spoiler arc limit"""
        self.request.session["global_arc_limit"] = arc
        self.update_last_activity()

    def has_arc_preference(self) -> bool:
        """Check if user has set a spoiler preference"""
        return "global_arc_limit" in self.request.session

    # ===== GAME STATE MANAGEMENT =====
    def has_active_game(self) -> bool:
        """Check if user has an active game"""
        return "current_game" in self.request.session

    def get_current_game(self) -> Optional[Dict]:
        """Get current game data (returns None if no active game)"""
        return self.request.session.get("current_game")

    def start_new_game(self, target_character, game_settings: Dict, prompt: str):
        """Start a new game with given character, game settings, and prompt"""
        target_dict = target_character.model_dump()
        print(f"Starting a new game for character: {target_dict}")

        self.request.session["current_game"] = {
            "game_id": f"game_{datetime.now().timestamp()}",  # Simple game ID
            "target_character": target_dict,
            "game_settings": game_settings,
            "conversation": [{"role": "system", "content": prompt}],
            "game_started_at": datetime.now().isoformat(),
            "guesses_made": [],
            "questions_asked": 0
        }

    def get_target_character(self) -> Dict:
        """Get the target character for current game (server use only!)"""
        current_game = self.get_current_game()
        if not current_game:
            raise ValueError("No active game session")
        return current_game["target_character"]

    def get_game_settings(self) -> Dict:
        """Get the game settings used for current game"""
        current_game = self.get_current_game()
        if not current_game:
            raise ValueError("No active game session")
        return current_game["game_settings"]

    def get_game_id(self) -> str:
        """Get the current game ID"""
        current_game = self.get_current_game()
        if not current_game:
            raise ValueError("No active game session")
        return current_game["game_id"]

    # ===== CONVERSATION MANAGEMENT =====
    def add_conversation_message(self, role: str, content: str):
        """Add a message to the current game conversation"""
        if not self.has_active_game():
            raise ValueError("No active game session")

        self.request.session["current_game"]["conversation"].append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })

        if role == "user":
            self.request.session["current_game"]["questions_asked"] += 1

    def get_conversation(self) -> List[Dict]:
        """Get the full conversation history"""
        current_game = self.get_current_game()
        if not current_game:
            raise ValueError("No active game session")
        return current_game["conversation"]

    def add_guess(self, guess: str, is_correct: bool):
        """Add a guess to current game"""
        if not self.has_active_game():
            raise ValueError("No active game session")

        self.request.session["current_game"]["guesses_made"].append({
            "guess": guess,
            "is_correct": is_correct,
            "timestamp": datetime.now().isoformat()
        })

    def get_guesses_made(self) -> List[Dict]:
        """Get all guesses made in current game"""
        current_game = self.get_current_game()
        return current_game["guesses_made"] if current_game else []

    def get_guess_count(self) -> int:
        """Get number of guesses made"""
        return len(self.get_guesses_made())

    def get_questions_asked(self) -> int:
        """Get number of questions asked"""
        current_game = self.get_current_game()
        return current_game["questions_asked"] if current_game else 0

    def end_game(self):
        """End current game and clear game data"""
        self.request.session.pop("current_game", None)

    # ===== SESSION METADATA =====
    def update_last_activity(self):
        """Update last activity timestamp"""
        self.request.session["last_activity"] = datetime.now().isoformat()

    def get_session_age(self) -> Optional[str]:
        """Get when session was created"""
        return self.request.session.get("session_created")

    def clear_session(self):
        """Clear entire session (logout/reset)"""
        self.request.session.clear()


def get_session_manager(request: Request) -> SessionManager:
    return SessionManager(request)