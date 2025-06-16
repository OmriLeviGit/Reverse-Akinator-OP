from pydantic import BaseModel

class Character(BaseModel):
    id: str
    name: str
    arc: str
    is_filler: bool
    is_tv: bool
    difficulty: str
    chapter: int | None = None
    episode: int | None = None
    wikiLink: str | None = None

class CharactersResponse(BaseModel):
    characters: list[Character]

class IgnoreCharacterRequest(BaseModel):
    character_id: str

class IgnoreCharacterResponse(BaseModel):
    message: str
    character_id: str

class UnignoreCharacterResponse(BaseModel):
    message: str
    character_id: str

class RateCharacterRequest(BaseModel):
    character_id: str
    rating: int

class RateCharacterResponse(BaseModel):
    message: str
    character_id: str
    rating: int