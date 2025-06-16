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
                description="The main protagonist and captain of the Straw Hat Pirates",
                image=None,
                arc="East Blue",
                chapter=1,
                episode=1,
                fillerStatus="canon",
                source="manga",
                difficulty=2,
                isIgnored=False,
                wikiLink="https://onepiece.fandom.com/wiki/Monkey_D._Luffy"
            ),
            Character(
                id="char_004",
                name="Condoriano",
                description="A mysterious inspector from the G-8 arc",
                image=None,
                arc="G-8",
                chapter=None,
                episode=196,
                fillerStatus="filler",
                source="anime",
                difficulty=1,
                isIgnored=False,
                wikiLink="https://onepiece.fandom.com/wiki/Condoriano"
            ),
            Character(
                id="char_005",
                name="Shiki",
                description="The Golden Lion, captain of the Flying Pirates",
                image=None,
                arc="Strong World",
                chapter=None,
                episode=None,
                fillerStatus="canon",
                source="movie",
                difficulty=3,
                isIgnored=False,
                wikiLink="https://onepiece.fandom.com/wiki/Shiki"
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