from datetime import datetime
from typing import Optional, Dict, List
from fastapi import Request

from server.Repository import Repository
from server.pydantic_schemas.arc_schemas import Arc
from server.pydantic_schemas.character_schemas import Character


from datetime import datetime
from typing import Optional, Dict, List
from fastapi import Request

from server.Repository import Repository
from server.pydantic_schemas.arc_schemas import Arc
from server.pydantic_schemas.character_schemas import Character


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

        self.update_last_activity()

    def get_safe_session_data(self) -> Dict:
        """Get all session database EXCEPT secret target_character"""
        session_copy = dict(self.request.session)

        print("ses", session_copy)

        # Remove sensitive database from current_game
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

    # ===== GAME STATE MANAGEMENT =====
    def has_active_game(self) -> bool:
        """Check if user has an active game"""
        return "current_game" in self.request.session

    def get_current_game(self) -> Optional[Dict]:
        """Get current game database (returns None if no active game)"""
        return self.request.session.get("current_game")

    def start_new_game(self, target_character, game_settings: Dict, prompt):
        """Start a new game with given character, game settings, and prompt"""
        target_dict = target_character.model_dump()
        print(f"Starting a new game for character: {target_dict}")

        self.request.session["current_game"] = {
            "target_character": target_dict,
            "game_settings": game_settings,  # All user preferences for this game
            "conversation": [{"role": "system", "content": prompt}],
            "game_started_at": datetime.now().isoformat(),
            "guesses_made": []
        }

    def add_guess(self, question: str, answer: str):
        """Add a guess and answer to current game"""
        if not self.has_active_game():
            raise ValueError("No active game")

        self.request.session["current_game"]["guesses_made"].append({
            "question": question,
            "answer": answer,
            "timestamp": datetime.now().isoformat()
        })

    def get_target_character(self) -> Character:
        """Get the target character ID for current game (server use only!)"""
        current_game = self.get_current_game()
        return current_game["target_character"]

    def get_game_settings(self) -> Optional[Dict]:
        """Get the game settings used for current game"""
        current_game = self.get_current_game()
        return current_game["game_settings"] if current_game else None

    def get_guesses_made(self) -> List[Dict]:
        """Get all guesses made in current game"""
        current_game = self.get_current_game()
        return current_game["guesses_made"] if current_game else []

    def get_guess_count(self) -> int:
        """Get number of guesses made"""
        return len(self.get_guesses_made())

    def end_game(self):
        """End current game and clear game database"""
        self.request.session.pop("current_game", None)

    # ===== SESSION METADATA =====
    def update_last_activity(self):
        """Update last activity timestamp"""
        self.request.session["last_activity"] = datetime.now().isoformat()

    def get_session_age(self) -> Optional[str]:
        """Get when session was created"""
        return self.request.session.get("session_created")

    def initialize_session(self):
        """Initialize session with default metadata"""
        if "session_created" not in self.request.session:
            self.request.session["session_created"] = datetime.now().isoformat()
        self.update_last_activity()

    # ===== UTILITY METHODS =====
    def clear_session(self):
        """Clear entire session (logout/reset)"""
        self.request.session.clear()

    def get_session_summary(self) -> Dict:
        """Get overview of current session state"""
        pass


def get_session_manager(request: Request) -> SessionManager:
    return SessionManager(request)