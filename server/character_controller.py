from schemas.character_schemas import (
    Character, CharactersResponse,
    IgnoreCharacterRequest, IgnoreCharacterResponse,
    UnignoreCharacterResponse,
    RateCharacterRequest, RateCharacterResponse
)


class CharacterController:
    def __init__(self):
        # Mock One Piece character data with all fields
        self.mock_characters = [
            Character(
                id="char_001",
                name="Monkey D. Luffy",
                arc="East Blue",
                is_filler=False,
                difficulty="easy",
                chapter=1,
                episode=1,
                wikiLink="https://onepiece.fandom.com/wiki/Monkey_D._Luffy",
                is_tv=True  # Add this
            ),
            Character(
                id="char_002",
                name="Crocodile",
                arc="Alabasta",
                is_filler=False,
                difficulty="medium",
                chapter=155,
                episode=92,
                wikiLink="https://onepiece.fandom.com/wiki/Crocodile",
                is_tv=True  # Add this
            ),
            Character(
                id="char_003",
                name="Gol D. Roger",
                arc="Loguetown",
                is_filler=False,
                difficulty="hard",
                chapter=506,
                episode=400,
                wikiLink="https://onepiece.fandom.com/wiki/Gol_D._Roger",
                is_tv=True  # Add this
            ),
            Character(
                id="char_004",
                name="Condoriano",
                arc="G-8",
                is_filler=True,
                difficulty="easy",
                chapter=None,
                episode=196,
                wikiLink="https://onepiece.fandom.com/wiki/Condoriano",
                is_tv=True  # TV filler
            ),
            # You could add a non-TV character like:
            Character(
                id="char_005",
                name="Shiki",
                arc="Strong World",
                is_filler=True,
                difficulty="medium",
                chapter=0,
                episode=None,
                wikiLink="https://onepiece.fandom.com/wiki/Shiki",
                is_tv=False  # Movie character
            ),
        ]
        # Mock user preferences storage
        self.ignored_characters = set()
        self.character_ratings = {}

    def get_all_characters(self) -> CharactersResponse:
        """Get all characters"""
        return CharactersResponse(characters=self.mock_characters)

    def get_character_by_id(self, character_id: str) -> Character | None:
        """Get a specific character by ID"""
        for character in self.mock_characters:
            if character.id == character_id:
                return character
        return None

    def ignore_character(self, request: IgnoreCharacterRequest) -> IgnoreCharacterResponse:
        """Add character to ignored list"""
        character = self.get_character_by_id(request.character_id)
        if not character:
            raise ValueError(f"Character with ID {request.character_id} not found")

        self.ignored_characters.add(request.character_id)
        return IgnoreCharacterResponse(
            message="Character ignored successfully",
            character_id=request.character_id
        )

    def unignore_character(self, character_id: str) -> UnignoreCharacterResponse:
        """Remove character from ignored list"""
        character = self.get_character_by_id(character_id)
        if not character:
            raise ValueError(f"Character with ID {character_id} not found")

        self.ignored_characters.discard(character_id)
        return UnignoreCharacterResponse(
            message="Character unignored successfully",
            character_id=character_id
        )

    def rate_character(self, request: RateCharacterRequest) -> RateCharacterResponse:
        """Rate a character (1-5 scale)"""
        character = self.get_character_by_id(request.character_id)
        if not character:
            raise ValueError(f"Character with ID {request.character_id} not found")

        if not 1 <= request.rating <= 5:
            raise ValueError("Rating must be between 1 and 5")

        self.character_ratings[request.character_id] = request.rating
        return RateCharacterResponse(
            message="Character rated successfully",
            character_id=request.character_id,
            rating=request.rating
        )