from pydantic import BaseModel, Field

from server.pydantic_schemas.character_schemas import Character


# Request models
class GameStartRequest(BaseModel):
   arc_selection: str = Field(alias="arcSelection")
   filler_percentage: float = Field(alias="fillerPercentage")
   include_non_tv_fillers: bool = Field(alias="includeNonTVFillers")
   include_unrated: bool = Field(alias="includeUnrated")
   difficulty_level: str = Field(alias="difficultyLevel")

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