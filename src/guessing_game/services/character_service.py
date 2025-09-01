# server/services/character_service.py
from sqlalchemy import or_, func
from guessing_game.config.database import get_db_session
from guessing_game.models.db_character import DBCharacter
from guessing_game.models.db_arc import DBArc
from guessing_game.schemas.character_schemas import FullCharacter, BasicCharacter
from guessing_game.schemas.arc_schemas import Arc

class CharacterService:
    def __init__(self):
        self.excluded_character_ids = [
            "Imu",
            "Bjorn",
            "joyboy",
            "Rocks_D._Xebec",
            "Monkey_D._Garp",

            # gorosei
            "Marcus_Mars",
            "Topman_Warcury",
            "Ethanbaron_V._Nusjuro",
            "Shepherd_Ju_Peter",
            "Figarland_Garling",
            "Jaygarcia_Saturn",

            # black beard
            "Marshall_D._Teach",
            "Shiryu",
            "Jesus_Burgess",
            "Vasco_Shot",
            "Sanjuan_Wolf",
            "Doc_Q",
            "Laffitte"
            "Avalo_Pizarro",
            "Catarina_Devon",
            "Van_Augur",

            # other
            "zunesha"
        ]

    def _build_base_query(self, session, arc: Arc | None = None, difficulty_range: list[str] | None = None,
                          include_unrated: bool = False, include_ignored: bool = True):
        """
        Build base query with common filters applied at database level
        If a parameter is None, don't apply that filter (show everything for that criteria)
        """
        query = session.query(DBCharacter)

        # Filter ignored characters - None means show all (ignored and non-ignored)
        if not include_ignored:  # Only filter if explicitly set to False
            query = query.filter(DBCharacter.is_ignored == False)

        # Filter by difficulty range - None means show all difficulties
        if difficulty_range is not None:
            difficulty_conditions = [DBCharacter.difficulty.in_(difficulty_range)]

            if include_unrated:
                # Also include unrated (empty/null) characters
                difficulty_conditions.extend([
                    DBCharacter.difficulty.is_(None),
                    DBCharacter.difficulty == "unrated"
                ])

            # Combine all difficulty conditions with OR
            query = query.filter(or_(*difficulty_conditions))

        # Arc filtering - None means show all characters regardless of arc
        if arc is not None and arc.name != "All":
            # Get the actual arc from database
            db_arc = session.query(DBArc).filter(DBArc.name == arc.name).first()
            if not db_arc:
                # If arc not found in DB, create a temporary one with the Pydantic values
                db_arc = DBArc(name=arc.name, last_chapter=arc.chapter, last_episode=arc.episode)

            # Apply arc filtering
            if db_arc.last_chapter is not None:
                query = query.filter(
                    (DBCharacter.chapter.is_(None)) |
                    (DBCharacter.chapter <= db_arc.last_chapter)
                )

            if db_arc.last_episode is not None:
                query = query.filter(
                    (DBCharacter.effective_episode.is_(None)) |
                    (DBCharacter.effective_episode <= db_arc.last_episode)
                )

        # Apply character exclusion filter (case-insensitive)
        if self.excluded_character_ids:
            # Convert exclusion list to lowercase for case-insensitive comparison
            excluded_ids_lower = [char_id.lower() for char_id in self.excluded_character_ids]
            query = query.filter(~func.lower(DBCharacter.id).in_(excluded_ids_lower))

        return query

    def get_characters_until(self, arc: Arc = None, include_ignored: bool = False) -> list[BasicCharacter]:
        """Get all characters up to a specific arc"""
        with get_db_session() as session:
            query = self._build_base_query(session, arc=arc, include_ignored=include_ignored)
            characters = query.all()
            return [char.to_basic_pydantic() for char in characters]

    def get_canon_characters(self, arc: Arc = None, difficulty_range: list[str] = None, include_unrated: bool = False,
                             include_ignored: bool = False) -> list[BasicCharacter]:
        """Get canon characters filtered by arc and difficulty using database-level filtering"""
        with get_db_session() as session:
            query = self._build_base_query(session, arc, difficulty_range, include_unrated=include_unrated,
                                           include_ignored=include_ignored)
            query = query.filter(DBCharacter.filler_status.ilike("canon"))
            characters = query.all()
            return [char.to_basic_pydantic() for char in characters]

    def get_filler_characters(self, arc: Arc = None, difficulty_range: list[str] = None, include_unrated: bool = False,
                              include_ignored: bool = False) -> list[BasicCharacter]:
        """Get filler characters filtered by arc and difficulty using database-level filtering"""
        with get_db_session() as session:
            query = self._build_base_query(session, arc, difficulty_range, include_unrated=include_unrated,
                                           include_ignored=include_ignored)
            query = query.filter(DBCharacter.filler_status.ilike("filler"))
            characters = query.all()
            return [char.to_basic_pydantic() for char in characters]

    def get_non_canon_characters(self, arc: Arc = None, difficulty_range: list[str] = None,
                                 include_unrated: bool = False, include_ignored: bool = False) -> list[BasicCharacter]:
        """Get non-canon characters (everything except canon) filtered by arc and difficulty"""
        with get_db_session() as session:
            query = self._build_base_query(session, arc, difficulty_range, include_unrated=include_unrated,
                                           include_ignored=include_ignored)
            query = query.filter(~DBCharacter.filler_status.ilike("canon"))
            characters = query.all()
            return [char.to_basic_pydantic() for char in characters]

    def toggle_character_ignore(self, character_id: str) -> FullCharacter:
        """Toggle the ignore status of a character"""
        with get_db_session() as session:
            character = session.query(DBCharacter).filter(DBCharacter.id == character_id).first()
            if not character:
                raise ValueError(f"Character with id '{character_id}' not found")

            # Toggle the current ignore status
            character.is_ignored = not character.is_ignored
            return character.to_pydantic()

    def update_character_difficulty(self, character_id: str, difficulty: str) -> FullCharacter:
        """
        Update the difficulty rating of a character
        difficulty can be: "unrated", "very easy", "easy", "medium", "hard", "really hard"
        """
        with get_db_session() as session:
            character = session.query(DBCharacter).filter(DBCharacter.id == character_id).first()
            if not character:
                raise ValueError(f"Character with id '{character_id}' not found")

            character.difficulty = difficulty
            return character.to_pydantic()

    def get_full_character_by_id(self, character_id: str) -> FullCharacter | None:
        """Get a character by their ID - returns full character"""
        with get_db_session() as session:
            character = session.query(DBCharacter).filter(DBCharacter.id == character_id).first()
            
            if character:
                return character.to_pydantic()
            return None

    def get_character_by_name(self, character_name: str) -> FullCharacter | None:
        """Get a character by their name (case-insensitive) - returns full character for game reveals"""
        with get_db_session() as session:
            character = session.query(DBCharacter).filter(
                DBCharacter.name.ilike(f"%{character_name}%")
            ).first()
            
            if character:
                return character.to_pydantic()
            return None