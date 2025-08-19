# server/pydantic_schemas/game_schemas.py
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

from server.pydantic_schemas.character_schemas import Character


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

    class Config:
        populate_by_name = True


class GameQuestionRequest(BaseModel):
    question: str

    class Config:
        populate_by_name = True


class GameQuestionResponse(BaseModel):
    answer: str
    questions_asked: int = Field(alias="questionsAsked")

    class Config:
        populate_by_name = True


class GameGuessRequest(BaseModel):
    character_name: str = Field(alias="characterName")

    class Config:
        populate_by_name = True


class GameGuessResponse(BaseModel):
    is_correct: bool = Field(alias="isCorrect")
    message: str
    target_character: Optional[Dict[str, Any]] = Field(None, alias="targetCharacter")

    class Config:
        populate_by_name = True


class GameRevealResponse(BaseModel):
    character: Character
    questions_asked: int = Field(alias="questionsAsked")
    guesses_made: int = Field(alias="guessesMade")

    class Config:
        populate_by_name = True