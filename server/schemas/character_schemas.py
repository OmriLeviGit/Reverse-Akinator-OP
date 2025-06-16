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

class ToggleCharacterRequest(BaseModel):
    characterId: str

class ToggleCharacterResponse(BaseModel):
    message: str
    characterId: str

class ChangeCharacterRatingRequest(BaseModel):
    characterId: str
    difficulty: int

class ChangeCharacterRatingResponse(BaseModel):
    message: str
    characterId: str
    difficulty: int