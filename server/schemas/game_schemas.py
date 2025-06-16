from pydantic import BaseModel

from schemas.character_schemas import Character


# Request models
class GameStartRequest(BaseModel):
   arcSelection: str
   fillerPercentage: int
   includeNonTVFillers: bool
   difficultyLevel: str

class GameQuestionRequest(BaseModel):
   gameSessionId: str
   questionText: str

class GameHintRequest(BaseModel):
   gameSessionId: str

class GameRevealRequest(BaseModel):
   gameSessionId: str

class GameGuessRequest(BaseModel):
   gameSessionId: str
   guessedCharacter: str

# Response models
class GameStartResponse(BaseModel):
   gameSessionId: str
   message: str

class GameQuestionResponse(BaseModel):
   answer: str

class GameHintResponse(BaseModel):
   hint: str

class GameRevealResponse(BaseModel):
   character: Character

class GameGuessResponse(BaseModel):
   isCorrect: bool
   message: str