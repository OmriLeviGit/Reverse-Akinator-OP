from schemas.character_schemas import (
    CharactersResponse,
    ToggleCharacterRequest, ToggleCharacterResponse,
    ChangeCharacterRatingRequest, ChangeCharacterRatingResponse, Character
)
from mockData import mock_characters


class CharacterController:

    def get_all_characters(self) -> CharactersResponse:
        """Get all characters"""
        return CharactersResponse(characters=mock_characters)

    def get_character_by_name(self, character_name: str) -> Character | None:
        """Get a specific character by name"""
        for character in mock_characters:
            if character.name == character_name:
                return character
        return None

    def toggle_ignore_character(self, request: ToggleCharacterRequest) -> ToggleCharacterResponse:
        """Add character to ignored list"""
        character = self.get_character_by_name(request.characterName)
        if not character:
            raise ValueError(f"Character with name {request.characterName} not found")

        character.isIgnored = not character.isIgnored
        print("character is ", character.isIgnored)
        return ToggleCharacterResponse(
            message="Character ignored successfully",
            characterName=request.characterName
        )

    def rate_character(self, request: ChangeCharacterRatingRequest) -> ChangeCharacterRatingResponse:
        """Rate a character's difficulty (0 = unrated, 1-5 = difficulty scale)"""
        character = self.get_character_by_name(request.characterName)
        if not character:
            raise ValueError(f"Character with name {request.characterName} not found")

        if not (0 <= request.difficulty <= 5):
            raise ValueError("Difficulty must be between 0 (unrated) and 5")

        character.difficulty = request.difficulty

        message = "Updated character difficulty rating"

        response = ChangeCharacterRatingResponse(
            message=message,
            characterName=request.characterName,
            difficulty=request.difficulty
        )
        return response