from pydantic import BaseModel

from server.schemas.character_schemas import Character


# Request models
class GameStartRequest(BaseModel):
   arcSelection: str
   fillerPercentage: float
   includeNonTVFillers: bool
   difficultyLevel: str | None

class GameQuestionRequest(BaseModel):
   question: str

class GameGuessRequest(BaseModel):
   guessedCharacterId: str

# Responses
class GameStartResponse(BaseModel):
   message: str = "Game started successfully"

class GameQuestionResponse(BaseModel):
   answer: str
   isCorrect: bool

class GameGuessResponse(BaseModel):
   result: str
   character: Character
   message: str