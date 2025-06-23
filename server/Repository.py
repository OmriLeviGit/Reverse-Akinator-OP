from server.data.database import DatabaseManager
from server.models import Character, Arc


class Repository:
    def __init__(self):
        self.db_manager = DatabaseManager()
        self.large_images = self.db_manager.data_dir / "img" / "lg_avatars"
        self.small_images = self.db_manager.data_dir / "img" / "sm_avatars"

    def _get_character_image_paths(self, character_id: str) -> tuple[str | None, str | None]:
        """Helper function to get image paths for a character"""
        small_image_path = self.small_images / f"{character_id}.webp"
        large_image_path = self.large_images / f"{character_id}.webp"

        small_image = f"img/sm_avatars/{character_id}.webp" if small_image_path.exists() else None
        large_image = f"img/lg_avatars/{character_id}.webp" if large_image_path.exists() else None

        return small_image, large_image

    def _get_character_episode(self, character: Character) -> int | None:
        """Get the effective episode number (higher of episode or number)"""
        if character.episode is None and character.number is None:
            return None
        if character.episode is None:
            return character.number
        if character.number is None:
            return character.episode
        return max(character.episode, character.number)

    def _character_to_summary(self, character: Character) -> dict:
        """Convert Character model to CharacterSummary dict"""
        small_image, _ = self._get_character_image_paths(character.id)

        return {
            "id": character.id,
            "name": character.name,
            "smallImage": small_image,
            "chapter": character.chapter,
            "episode": self._get_character_episode(character),
            "type": character.type,
            "difficulty": character.difficulty,
            "isIgnored": character.is_ignored,
            "wikiLink": character.wiki_link
        }

    def _character_to_detail(self, character: Character) -> dict:
        """Convert Character model to CharacterDetail dict"""
        small_image, large_image = self._get_character_image_paths(character.id)

        return {
            "id": character.id,
            "name": character.name,
            "description": character.description,
            "smallImage": small_image,
            "largeImage": large_image,
            "chapter": character.chapter,
            "episode": self._get_character_episode(character),
            "type": character.type,
            "difficulty": character.difficulty,
            "isIgnored": character.is_ignored,
            "wikiLink": character.wiki_link
        }

    def get_characters_up_to(self, arc: str) -> dict:
        """
        Get all characters up to a specific arc
        """
        session = self.db_manager.get_session()
        try:
            # Special case for "All"
            if arc == "All":
                all_characters = session.query(Character).all()
                return {"characters": [self._character_to_summary(char) for char in all_characters]}

            # Get the arc details
            arc_obj = session.query(Arc).filter(Arc.name == arc).first()
            all_arcs = session.query(Arc).all()
            print(f"Available arcs: {[a.name for a in all_arcs]}")
            print(f"Looking for arc: '{arc}'")
            if not arc_obj:
                raise ValueError(f"Arc '{arc}' not found")

            # Get all characters
            all_characters = session.query(Character).all()
            valid_characters = []

            for character in all_characters:
                is_valid = True

                # Check chapter constraint
                if character.chapter is not None and arc_obj.last_chapter is not None:
                    if character.chapter > arc_obj.last_chapter:
                        is_valid = False

                # Check episode constraint (using the higher of episode/number)
                character_episode = self._get_character_episode(character)
                if character_episode is not None and arc_obj.last_episode is not None:
                    if character_episode > arc_obj.last_episode:
                        is_valid = False

                if is_valid:
                    valid_characters.append(self._character_to_summary(character))

            return {"characters": valid_characters}

        finally:
            self.db_manager.close_session(session)

    def get_character_by_id(self, character_id: str) -> dict:
        """
        Returns a single character with full details
        """
        session = self.db_manager.get_session()
        try:
            character = session.query(Character).filter(Character.id == character_id).first()
            if not character:
                raise ValueError(f"Character with id '{character_id}' not found")

            return self._character_to_detail(character)

        finally:
            self.db_manager.close_session(session)

    def update_character(self, character_id: str, request: dict) -> dict:
        """
        The only 2 fields that should be able to be updated are the ignore and the difficulty
        Expected request format: {"difficulty": str, "isIgnored": bool}
        """
        session = self.db_manager.get_session()
        try:
            character = session.query(Character).filter(Character.id == character_id).first()
            if not character:
                raise ValueError(f"Character with id '{character_id}' not found")

            if "difficulty" in request:
                character.difficulty = request["difficulty"]
            if "isIgnored" in request:
                character.is_ignored = request["isIgnored"]

            session.commit()

            return self._character_to_detail(character)

        finally:
            self.db_manager.close_session(session)

    def get_arcs(self) -> dict[str, dict[str, int | None]]:
        """
        Return all arcs as dict where key is name and value contains chapter/episode info
        """
        session = self.db_manager.get_session()
        try:
            arcs = session.query(Arc).all()

            return {
                arc.name: {
                    "chapter": arc.last_chapter,
                    "episode": arc.last_episode
                }
                for arc in arcs
            }

        finally:
            self.db_manager.close_session(session)

    def get_arcs_before(self, last_arc) -> dict[str, dict[str, int | None]]:
        """
        Return all arcs as dict where key is name and value contains chapter/episode info
        """
        session = self.db_manager.get_session()
        try:
            arcs = session.query(Arc).all()

            return {
                arc.name: {
                    "chapter": arc.last_chapter,
                    "episode": arc.last_episode
                }
                for arc in arcs
            }

        finally:
            self.db_manager.close_session(session)

    def get_filtered_characters(self, last_arc: str, difficulty_level: str | None) -> list:
        """
        Get characters filtered by arc and difficulty
        """
        session = self.db_manager.get_session()
        try:
            # Start with characters up to the arc
            characters_data = self.get_characters_up_to(last_arc)
            characters = characters_data["characters"]

            filtered_characters = []

            for character in characters:
                # Filter by difficulty
                if difficulty_level is not None and character["difficulty"] != difficulty_level:
                    continue

                filtered_characters.append(character)

            return filtered_characters

        finally:
            self.db_manager.close_session(session)

    def get_filler_characters(self, last_arc: str, difficulty_level: str | None) -> list:
        """
        Get filler characters filtered by arc and difficulty
        """
        all_characters = self.get_filtered_characters(last_arc, difficulty_level)
        return [char for char in all_characters if char["type"].lower() == "filler"]

    def get_canon_characters(self, last_arc: str, difficulty_level: str | None) -> list:
        """
        Get canon characters filtered by arc and difficulty
        """
        all_characters = self.get_filtered_characters(last_arc, difficulty_level)
        return [char for char in all_characters if char["type"].lower() == "canon"]

    def get_non_canon_characters(self, last_arc: str, difficulty_level: str | None) -> list:
        """
        Get non-canon characters (everything except canon) filtered by arc and difficulty
        """
        all_characters = self.get_filtered_characters(last_arc, difficulty_level)
        return [char for char in all_characters if char["type"].lower() != "canon"]