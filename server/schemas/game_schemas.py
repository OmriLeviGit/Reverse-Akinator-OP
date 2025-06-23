from pydantic import BaseModel


# Request models
class GameStartRequest(BaseModel):
   arcSelection: str
   fillerPercentage: float
   includeNonTVFillers: bool
   difficultyLevel: str | None

class GameQuestionRequest(BaseModel):
   gameSessionId: str
   questionText: str

class GameHintRequest(BaseModel):
   gameSessionId: str

class GameHintResponse(BaseModel):
   hint: str

class GameRevealRequest(BaseModel):
   gameSessionId: str

class GameGuessRequest(BaseModel):
   guessedCharacterId: str

# Response models
class GameStartResponse(BaseModel):
   message: str

class GameQuestionResponse(BaseModel):
   answer: str

class GameRevealResponse(BaseModel):
   character: str

class GameGuessResponse(BaseModel):
   isCorrect: bool
   message: str