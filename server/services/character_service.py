# server/services/character_service.py
from sqlalchemy import or_
from server.config.database import get_db_session
from server.models.db_character import DBCharacter
from server.models.db_arc import DBArc
from server.schemas.character_schemas import Character
from server.schemas.arc_schemas import Arc

class CharacterService:
    def __init__(self):
        pass  # No need for database manager anymore

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

        return query

    def get_characters_until(self, arc: Arc, include_ignored: bool = False) -> list[Character]:
        """Get all characters up to a specific arc"""
        with get_db_session() as session:
            query = self._build_base_query(session, arc=arc, include_ignored=include_ignored)
            characters = query.all()
            return [char.to_pydantic() for char in characters]

    def get_canon_characters(self, arc: Arc, difficulty_range: list[str], include_unrated: bool,
                             include_ignored: bool = False) -> list[Character]:
        """Get canon characters filtered by arc and difficulty using database-level filtering"""
        with get_db_session() as session:
            query = self._build_base_query(session, arc, difficulty_range, include_unrated=include_unrated,
                                           include_ignored=include_ignored)
            query = query.filter(DBCharacter.filler_status.ilike("canon"))
            characters = query.all()
            return [char.to_pydantic() for char in characters]

    def get_filler_characters(self, arc: Arc, difficulty_range: list[str], include_unrated: bool,
                              include_ignored: bool = False) -> list[Character]:
        """Get filler characters filtered by arc and difficulty using database-level filtering"""
        with get_db_session() as session:
            query = self._build_base_query(session, arc, difficulty_range, include_unrated=include_unrated,
                                           include_ignored=include_ignored)
            query = query.filter(DBCharacter.filler_status.ilike("filler"))
            characters = query.all()
            return [char.to_pydantic() for char in characters]

    def get_non_canon_characters(self, arc: Arc, difficulty_range: list[str], include_unrated: bool,
                                 include_ignored: bool = False) -> list[Character]:
        """Get non-canon characters (everything except canon) filtered by arc and difficulty"""
        with get_db_session() as session:
            query = self._build_base_query(session, arc, difficulty_range, include_unrated=include_unrated,
                                           include_ignored=include_ignored)
            query = query.filter(~DBCharacter.filler_status.ilike("canon"))
            characters = query.all()
            return [char.to_pydantic() for char in characters]

    def toggle_character_ignore(self, character_id: str) -> Character:
        """Toggle the ignore status of a character"""
        with get_db_session() as session:
            character = session.query(DBCharacter).filter(DBCharacter.id == character_id).first()
            if not character:
                raise ValueError(f"Character with id '{character_id}' not found")

            # Toggle the current ignore status
            character.is_ignored = not character.is_ignored
            return character.to_pydantic()

    def update_character_difficulty(self, character_id: str, difficulty: str) -> Character:
        """
        Update the difficulty rating of a character
        difficulty can be: "unrated", "very easy", "easy", "medium", "hard", "really hard"
        """
        with get_db_session() as session:
            character = session.query(DBCharacter).filter(DBCharacter.id == character_id).first()
            if not character:
                raise ValueError(f"Character with id '{character_id}' not found")

            character.difficulty = difficulty
            print(character.difficulty)
            return character.to_pydantic()