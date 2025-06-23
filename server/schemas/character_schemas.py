from pydantic import BaseModel

class CharacterDetail(BaseModel):
    id: str
    name: str
    description: str | None = None
    small_image: str | None = None
    large_image: str | None = None
    chapter: int | None = None
    episode: int | None = None
    type: str
    difficulty: int
    isIgnored: bool | None = None
    wikiLink: str | None = None

class CharacterSummary(BaseModel):
    id: str
    name: str
    small_image: str | None = None
    chapter: int | None = None
    episode: int | None = None
    type: str
    difficulty: int
    isIgnored: bool | None = None
    wikiLink: str | None = None

class CharactersResponse(BaseModel):
    characters: list[CharacterSummary]

class CharacterDetailResponse(BaseModel):
    character: CharacterDetail

class UpdateCharacterRequest(BaseModel):
    difficulty: str | None = None
    isIgnored: bool | None = None

class UpdateCharacterResponse(BaseModel):
    character_id: str
    message: str = "Character updated successfully"