from pydantic import BaseModel, Field

from server.pydantic_schemas.character_schemas import Character


class GameStartRequest(BaseModel):
   arc_selection: str = Field(alias="arcSelection")
   filler_percentage: int = Field(alias="fillerPercentage")
   include_non_tv_fillers: bool = Field(alias="includeNonTVFillers")
   difficulty_level: str = Field(alias="difficultyLevel")
   include_unrated: bool = Field(alias="includeUnrated")

   class Config:
      populate_by_name = True

class GameQuestionRequest(BaseModel):
   question: str

class GameGuessRequest(BaseModel):
   guessed_character_id: str = Field(alias="guessedCharacterId")

# Responses
class GameStartResponse(BaseModel):
   message: str = "Game started successfully"

class GameQuestionResponse(BaseModel):
   answer: str
   is_correct: bool = Field(alias="isCorrect")

class GameGuessResponse(BaseModel):
   result: str
   character: Character
   message: str