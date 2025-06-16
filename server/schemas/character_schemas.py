from pydantic import BaseModel


class Character(BaseModel):
    id: str
    name: str
    description: str | None = None
    image: str | None = None
    arc: str | None = None
    chapter: int | None = None
    episode: int | None = None
    fillerStatus: str  # "canon" | "filler" | "filler-non-tv"
    source: str | None = None
    difficulty: int
    isIgnored: bool | None = None
    wikiLink: str | None = None

class CharactersResponse(BaseModel):
    characters: list[Character]

class CharacterByIDResponse(BaseModel):
    character: Character

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
    difficulty: int

class RateCharacterResponse(BaseModel):
    message: str
    character_id: str
    difficulty: int