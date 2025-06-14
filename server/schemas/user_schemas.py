from pydantic import BaseModel

# Request models
class IgnoreCharacterRequest(BaseModel):
    character_id: str

class RateCharacterRequest(BaseModel):
    character_id: str
    rating: int | None

# Response models
class IgnoredCharacter(BaseModel):
    character_id: str
    character_name: str
    ignored_at: str  # or datetime if you prefer

class IgnoredCharactersResponse(BaseModel):
    ignored_characters: list[IgnoredCharacter]

class IgnoreCharacterResponse(BaseModel):
    message: str
    character_id: str

class UnignoreCharacterResponse(BaseModel):
    message: str
    character_id: str

class CharacterRating(BaseModel):
    character_id: str
    character_name: str
    rating: int | None
    rated_at: str  # or datetime if you prefer

class CharacterRatingsResponse(BaseModel):
    character_ratings: list[CharacterRating]

class RateCharacterResponse(BaseModel):
    message: str
    character_id: str
    rating: int | None