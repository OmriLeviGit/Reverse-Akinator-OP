from pydantic import BaseModel

# Request models
class CharacterSearchRequest(BaseModel):
   query: str | None = None
   arc: str | None = None
   filler: str | None = None
   difficulty: str | None = None

class FillerSettings(BaseModel):
   filler_percentage: int
   include_non_tv_fillers: bool

class AvailableCharactersRequest(BaseModel):
   arc_selection: str
   filler_settings: FillerSettings
   difficulty: str
   ignored_character_ids: list[str]

# Response models
class Character(BaseModel):
   id: str
   name: str
   arc: str
   is_filler: bool
   difficulty: str
   # Add other character fields as needed

class CharactersResponse(BaseModel):
   characters: list[Character]

class CharacterWithStatus(BaseModel):
   id: str
   name: str
   arc: str
   is_filler: bool
   difficulty: str
   status: str  # or whatever status field you have
   # Add other fields as needed

class AllCharactersWithStatusResponse(BaseModel):
   characters: list[CharacterWithStatus]

class CharacterSearchResponse(BaseModel):
   characters: list[Character]
   total_count: int

class AvailableCharactersResponse(BaseModel):
   characters: list[Character]
   total_available: int