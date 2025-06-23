from pydantic import BaseModel, Field


class Character(BaseModel):
    id: str
    name: str
    description: str | None = None
    chapter: int | None = None
    episode: int | None = None
    fillerStatus: str
    difficulty: str | None
    is_ignored: bool = Field(None, alias="isIgnored")
    wiki_link: str | None = Field(None, alias="wikiLink")

    class Config:
        populate_by_name = True  # Accept both snake_case and camelCase

class UpdateCharacterRequest(BaseModel):
    characterId: str  # Move from URL to body
    difficulty: str | None = None
    isIgnored: bool | None = None

# Responses
class CharactersResponse(BaseModel):
    characters: list[Character]
    count: int | None = None
    arc: str | None = None