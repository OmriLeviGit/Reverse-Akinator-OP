from server.data.database import DatabaseManager
from server.db_models import DBCharacter, Arc
from server.schemas.character_schemas import UpdateCharacterRequest, Character


class Repository:
    def __init__(self):
        self.db_manager = DatabaseManager()

    def _get_character_episode(self, character: Character) -> int | None:
        """Get the effective episode number (higher of episode or number)"""
        if character.episode is None and character.number is None:
            return None
        if character.episode is None:
            return character.number
        if character.number is None:
            return character.episode

        return max(character.episode, character.number)


    def get_characters_up_to(self, arc: Arc, include_ignored: bool = False) -> list[Character]:
        """
        Get all characters up to a specific arc
        """
        session = self.db_manager.get_session()
        try:
            # Special case for "All"
            if arc.name == "All":
                all_characters = session.query(DBCharacter).all()
                if not include_ignored:
                    all_characters = [char for char in all_characters if not char.is_ignored]
                return [char.to_pydantic() for char in all_characters]

            # Get all characters
            all_characters = session.query(DBCharacter).all()
            valid_characters = []

            for character in all_characters:
                is_valid = True

                # Check if character should be ignored
                if not include_ignored and character.is_ignored:
                    continue

                # Check chapter constraint
                if character.chapter is not None and arc.last_chapter is not None:
                    if character.chapter > arc.last_chapter:
                        is_valid = False

                # Check episode constraint
                character_episode = self._get_character_episode(character)
                if character_episode is not None and arc.last_episode is not None:
                    if character_episode > arc.last_episode:
                        is_valid = False

                if is_valid:
                    valid_characters.append(character.to_pydantic())

            return valid_characters

        finally:
            self.db_manager.close_session(session)

    def get_character_by_id(self, character_id: str) -> Character:
        """
        Returns a single character with full details
        """
        session = self.db_manager.get_session()
        try:
            character = session.query(DBCharacter).filter(DBCharacter.id == character_id).first()
            if not character:
                raise ValueError(f"Character with id '{character_id}' not found")

            return character.to_pydantic()

        finally:
            self.db_manager.close_session(session)

    def update_character(self, character_id: str, request: UpdateCharacterRequest) -> Character:
        """
        The only 2 fields that should be able to be updated are the ignore and the difficulty
        """
        session = self.db_manager.get_session()
        try:
            character = session.query(DBCharacter).filter(DBCharacter.id == character_id).first()
            if not character:
                raise ValueError(f"Character with id '{character_id}' not found")

            if request.difficulty is not None:
                character.difficulty = request.difficulty
            if request.is_ignored is not None:
                character.is_ignored = request.is_ignored

            session.commit()

            return character.to_pydantic()

        finally:
            self.db_manager.close_session(session)

    def get_filtered_characters(self, arc: Arc, difficulty_level: str | None) -> list[Character]:
        """
        Get characters filtered by arc and difficulty
        """
        session = self.db_manager.get_session()
        try:
            # Start with characters up to the arc
            characters = self.get_characters_up_to(arc)

            filtered_characters = []

            for character in characters:
                # Filter by difficulty
                if difficulty_level is not None and character["difficulty"] != difficulty_level:
                    continue

                filtered_characters.append(character)

            return filtered_characters

        finally:
            self.db_manager.close_session(session)


    def get_filler_characters(self, arc: Arc, difficulty_level: str | None) -> list[Character]:
        """
        Get filler characters filtered by arc and difficulty
        """
        all_characters = self.get_filtered_characters(arc, difficulty_level)
        return [char for char in all_characters if char["type"].lower() == "filler"]


    def get_canon_characters(self, arc: Arc, difficulty_level: str | None) -> list[Character]:
        """
        Get canon characters filtered by arc and difficulty
        """
        all_characters = self.get_filtered_characters(arc, difficulty_level)
        return [char for char in all_characters if char["type"].lower() == "canon"]


    def get_non_canon_characters(self, arc: Arc, difficulty_level: str | None) -> list[Character]:
        """
        Get non-canon characters (everything except canon) filtered by arc and difficulty
        """
        all_characters = self.get_filtered_characters(arc, difficulty_level)
        return [char for char in all_characters if char["type"].lower() != "canon"]


    def get_arc_by_name(self, arc_name) -> Arc:
        """Return the Arc object, not just the name"""
        session = self.db_manager.get_session()

        try:
            # Assuming you store the arc name somewhere and need to fetch the object
            return session.query(Arc).filter(Arc.name == arc_name).first()
        finally:
            self.db_manager.close_session(session)