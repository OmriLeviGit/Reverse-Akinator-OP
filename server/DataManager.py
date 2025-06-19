import os
import csv
import json
from pathlib import Path


class DataManager:
    _instance = None
    _initialized = False

    def __new__(cls, api_key=None):
        if cls._instance is None:
            cls._instance = super(DataManager, cls).__new__(cls)
        return cls._instance

    def __init__(self, api_key=None):
        if DataManager._initialized:
            return

        self.base_path = Path(__file__).parent
        self.data_dir = self.base_path / "data"

        # File paths
        self.games_file = self.data_dir / "games.csv"
        self.characters_file = self.data_dir / "character_data.csv"
        self.user_preferences_file = self.data_dir / "user_preferences.csv"
        self.arc_list_file = self.data_dir / "arc_list.json"
        self.game_prompt_file = self.data_dir / "game_prompt.txt"

        self.data_dir.mkdir(exist_ok=True)

        # Only initialize what's needed for runtime
        self._ensure_games_csv()
        self._load_static_files()

        if api_key:
            # genai.configure(api_key=api_key)
            pass

        DataManager._initialized = True

    def _ensure_games_csv(self):
        """Create games CSV if it doesn't exist (runtime requirement)"""
        if not os.path.exists(self.games_file):
            with open(self.games_file, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([
                    'game_session_id', 'character_name', 'filler_status',
                    'session_status', 'created_at', 'conversation'
                ])

    def _load_static_files(self):
        """Load arc list and game prompt (static files)"""
        try:
            with open(self.arc_list_file, 'r') as file:
                data = json.load(file)
                self.arc_list = data['arc_list']
        except FileNotFoundError:
            print("Arc list file not found")
            self.arc_list = []
        except json.JSONDecodeError:
            print("Error decoding arc list JSON")
            self.arc_list = []

        try:
            with open(self.game_prompt_file, 'r') as f:
                self.instructions = f.read()
        except FileNotFoundError as e:
            print(f"Error loading game prompt: {e}")
            self.instructions = ""

    # Add methods for actual data management
    def get_characters(self):
        """Load character data"""
        # Implementation here
        pass

    def save_game_session(self, session_data):
        """Save game session to CSV"""
        # Implementation here
        pass