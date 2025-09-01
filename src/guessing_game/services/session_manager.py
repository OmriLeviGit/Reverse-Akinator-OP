# server/session_manager.py
from datetime import datetime
from fastapi import Request

from guessing_game.services.arc_service import ArcService
from guessing_game.schemas.arc_schemas import Arc


class SessionManager:
    def __init__(self, request: Request):
        self.request = request

    def has_session_data(self) -> bool:
        """Check if session has been initialized with our app database"""
        required_fields = {"session_created", "global_arc_limit", "last_activity"}
        return required_fields.issubset(self.request.session.keys())

    def create_initial_session(self, arc_limit: str):
        """Create initial session with provided arc limit"""
        now = datetime.now().isoformat()
        self.request.session.update({
            "global_arc_limit": arc_limit,
            "session_created": now,
            "last_activity": now
        })


    # ===== GLOBAL SPOILER SETTINGS =====
    def get_global_arc_limit(self) -> Arc:
        """Get user's global spoiler arc limit"""
        return ArcService().get_arc_by_name(self.request.session.get("global_arc_limit", "All"))

    def set_global_arc_limit(self, arc: str):
        """Set user's global spoiler arc limit"""
        self.request.session["global_arc_limit"] = arc
        self.update_last_activity()

    # ===== SIMPLE GAME STATE TRACKING =====
    def has_active_game(self) -> bool:
        """Check if user has an active game"""
        return "current_game_id" in self.request.session

    def set_current_game_id(self, game_id: str):
        """Set the current game ID for this session"""
        self.request.session["current_game_id"] = game_id
        self.update_last_activity()

    def get_current_game_id(self) -> str | None:
        """Get the current game ID"""
        return self.request.session.get("current_game_id")

    def clear_current_game(self):
        """Clear the current game ID"""
        self.request.session.pop("current_game_id", None)

    def is_valid_game_session(self, game_id: str) -> bool:
        """Check if the provided game_id matches the current active game"""
        if not self.has_active_game():
            return False
        current_game_id = self.get_current_game_id()
        return current_game_id == game_id

    # ===== SESSION METADATA =====
    def update_last_activity(self):
        """Update last activity timestamp"""
        self.request.session["last_activity"] = datetime.now().isoformat()

    def clear_session(self):
        """Clear entire session (logout/reset)"""
        self.request.session.clear()