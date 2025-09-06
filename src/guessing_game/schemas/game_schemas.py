# server/schemas/game_schemas.py
from pydantic import BaseModel, Field

from guessing_game.schemas.character_schemas import FullCharacter, BasicCharacter


class GameStartRequest(BaseModel):
    arc_selection: str = Field(alias="arcSelection")
    filler_percentage: int = Field(alias="fillerPercentage")
    include_non_tv_fillers: bool = Field(alias="includeNonTVFillers")
    difficulty_level: str = Field(alias="difficultyLevel")
    include_unrated: bool = Field(alias="includeUnrated")

    class Config:
        populate_by_name = True


class GameStartResponse(BaseModel):
    message: str
    game_id: str = Field(alias="gameId")
    character_pool: list[BasicCharacter] = Field(alias="characterPool")

    class Config:
        populate_by_name = True


class GameQuestionRequest(BaseModel):
    game_id: str = Field(alias="gameId")
    question: str

    class Config:
        populate_by_name = True


class GameQuestionResponse(BaseModel):
    answer: str

    class Config:
        populate_by_name = True


class GameGuessRequest(BaseModel):
    game_id: str = Field(alias="gameId")
    character_name: str = Field(alias="characterName")

    class Config:
        populate_by_name = True


class GameGuessResponse(BaseModel):
    is_correct: bool = Field(alias="isCorrect")
    character: FullCharacter | None = None
    questions_asked: int | None = Field(None, alias="questionsAsked")
    guesses_made: int | None = Field(None, alias="guessesMade")

    class Config:
        populate_by_name = True


class GameRevealRequest(BaseModel):
    game_id: str = Field(alias="gameId")

    class Config:
        populate_by_name = True


class GameRevealResponse(BaseModel):
    character: FullCharacter
    questions_asked: int = Field(alias="questionsAsked")
    guesses_made: int = Field(alias="guessesMade")

    class Config:
        populate_by_name = True

class ChatMessage(BaseModel):
    id: str
    text: str
    is_user: bool = Field(alias="isUser")

    class Config:
        populate_by_name = True

class GameStatusRequest(BaseModel):
    game_id: str = Field(alias="gameId")

    class Config:
        populate_by_name = True

class GameStatusResponse(BaseModel):
    is_valid_game: bool = Field(alias="isValidGame")
    messages: list[ChatMessage] | None = None

    class Config:
        populate_by_name = True


class LLMResponse(BaseModel):
    reasoning: str
    answer: str  # Should be one of: "yes", "no", "I don't know", "I can't answer that"

    class Config:
        populate_by_name = True


