from pydantic import BaseModel, Field


class Character(BaseModel):
    id: str
    name: str
    description: str | None = None
    chapter: int | None = None
    episode: int | None = None
    filler_status: str = Field(alias="fillerStatus")
    difficulty: str
    is_ignored: bool = Field(False, alias="isIgnored")
    wiki_link: str | None = Field(None, alias="wikiLink")

    class Config:
        populate_by_name = True

# Responses
class CharactersResponse(BaseModel):
    characters: list[Character]
    count: int | None = None
    arc: str | None = None

class ToggleIgnoreRequest(BaseModel):
    character_id: str = Field(alias="characterId")


class ToggleIgnoreResponse(BaseModel):
    success: bool
    character_id: str = Field(alias="characterId")
    is_ignored: bool = Field(alias="isIgnored")

    class Config:
        populate_by_name = True

class RateCharacterRequest(BaseModel):
    character_id: str = Field(alias="characterId")
    difficulty: str


class RateCharacterResponse(BaseModel):
    success: bool
    character_id: str = Field(alias="characterId")
    difficulty: str

    class Config:
        populate_by_name = True