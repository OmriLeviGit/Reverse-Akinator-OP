# server/SessionManager.py - Updated version
from datetime import datetime
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

    def get_safe_session_data(self) -> dict:
        """Get all session data - now truly safe since no sensitive data stored"""
        return dict(self.request.session)

    # ===== GLOBAL SPOILER SETTINGS =====
    def get_global_arc_limit(self) -> Arc:
        """Get user's global spoiler arc limit"""
        return Repository().get_arc_by_name(self.request.session.get("global_arc_limit", "All"))

    def set_global_arc_limit(self, arc: str):
        """Set user's global spoiler arc limit"""
        self.request.session["global_arc_limit"] = arc
        self.update_last_activity()

    # ===== SIMPLE GAME STATE MANAGEMENT =====
    def has_active_game(self) -> bool:
        """Check if user has an active game"""
        return "current_game" in self.request.session

    def is_valid_game_session(self, game_id: str) -> bool:
        """Check if the provided game_id matches the current active game"""
        if not self.has_active_game():
            return False
        current_game = self.request.session["current_game"]
        return current_game.get("game_id") == game_id

    def get_current_game_metadata(self) -> dict | None:
        """Get current game metadata (non-sensitive data only)"""
        return self.request.session.get("current_game")

    def start_new_game_session(self, game_id: str, game_settings: dict):
        """Store only non-sensitive game metadata in session"""
        self.request.session["current_game"] = {
            "game_id": game_id,
            "game_settings": game_settings,
            "game_started_at": datetime.now().isoformat(),
            "questions_asked": 0,
            "guesses_count": 0
        }

    def get_game_id(self) -> str:
        """Get the current game ID"""
        current_game = self.get_current_game_metadata()
        if not current_game:
            raise ValueError("No active game session")
        return current_game["game_id"]

    def get_game_settings(self) -> dict:
        """Get the game settings used for current game"""
        current_game = self.get_current_game_metadata()
        if not current_game:
            raise ValueError("No active game session")
        return current_game["game_settings"]

    def increment_questions_asked(self):
        """Increment question counter in session"""
        if self.has_active_game():
            self.request.session["current_game"]["questions_asked"] += 1

    def increment_guesses_made(self):
        """Increment guess counter in session"""
        if self.has_active_game():
            self.request.session["current_game"]["guesses_count"] += 1

    def get_questions_asked(self) -> int:
        """Get number of questions asked from session"""
        current_game = self.get_current_game_metadata()
        return current_game["questions_asked"] if current_game else 0

    def get_guess_count(self) -> int:
        """Get number of guesses made from session"""
        current_game = self.get_current_game_metadata()
        return current_game["guesses_count"] if current_game else 0

    def end_game(self):
        """End current game and clear game metadata from session"""
        self.request.session.pop("current_game", None)

    # ===== SESSION METADATA =====
    def update_last_activity(self):
        """Update last activity timestamp"""
        self.request.session["last_activity"] = datetime.now().isoformat()

    def clear_session(self):
        """Clear entire session (logout/reset)"""
        self.request.session.clear()