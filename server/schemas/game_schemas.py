from pydantic import BaseModel

# Request models
class GameStartRequest(BaseModel):
   arc_selection: str
   filler_percentage: int
   include_non_tv_fillers: bool
   difficulty_level: str

class GameQuestionRequest(BaseModel):
   game_session_id: str
   question_text: str

class GameHintRequest(BaseModel):
   game_session_id: str

class GameRevealRequest(BaseModel):
   game_session_id: str

class GameGuessRequest(BaseModel):
   game_session_id: str
   guessed_character: str

# Response models
class GameStartResponse(BaseModel):
   game_session_id: str
   message: str

class GameQuestionResponse(BaseModel):
   answer: str

class GameHintResponse(BaseModel):
   hint: str

class GameRevealResponse(BaseModel):
   character_info: str

class GameGuessResponse(BaseModel):
   is_correct: bool
   message: str