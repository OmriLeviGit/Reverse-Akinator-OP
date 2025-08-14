import time

from fastapi import APIRouter, HTTPException, Depends

from server import game_service
from server.SessionManager import SessionManager, get_session_manager
from server.schemas.game_schemas import (GameStartRequest, GameQuestionResponse, GameQuestionRequest, GameStartResponse,
                                         GameGuessResponse, GameGuessRequest)
from server.schemas.character_schemas import (
    CharactersResponse, Character, ToggleIgnoreRequest, RateCharacterRequest, ToggleIgnoreResponse,
    RateCharacterResponse
)

from server.Repository import Repository


def create_game_router():
    game_router = APIRouter(prefix="/api/game", tags=["game"])

    @game_router.post("/start", response_model=GameStartResponse)
    def start_game_route(request: GameStartRequest, session_mgr: SessionManager = Depends(get_session_manager)):
        try:
            game_service.start_game(request, session_mgr)
            return GameStartResponse(message="Game started successfully")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    @game_router.post("/question", response_model=GameQuestionResponse)
    def ask_question_route(request: GameQuestionRequest, session_mgr: SessionManager = Depends(get_session_manager)):
        return game_service.ask_question(request, session_mgr)

    @game_router.post("/reveal", response_model=Character)
    def reveal_character_route(session_mgr: SessionManager = Depends(get_session_manager)):
        character = session_mgr.get_target_character()
        session_mgr.end_game()
        return character

    @game_router.post("/guess", response_model=GameGuessResponse)
    def make_guess_route(request: GameGuessRequest, session_mgr: SessionManager = Depends(get_session_manager)):
        character = session_mgr.get_target_character()

        if request.guessed_character_id == character.id:
            result = "correct"
        else:
            result = "incorrect"

        session_mgr.end_game()
        return GameGuessResponse(result=result, character=character, message="Game ended")

    return game_router

def create_characters_router():
    characters_router = APIRouter(prefix="/api/characters", tags=["characters"])

    @characters_router.get("/up-to", response_model=CharactersResponse)
    def get_characters_up_to(session_mgr: SessionManager = Depends(get_session_manager)):


        arc = session_mgr.get_global_arc_limit()
        try:
            characters = Repository().get_characters_up_to(arc, include_ignored=True)

            return CharactersResponse(
                characters=characters,
                count=len(characters),
                arc=arc.name
            )

        except ValueError as e:
            raise HTTPException(status_code=404, detail="Characters not found")

    @characters_router.post("/toggle-ignore")
    def toggle_ignore_character(request: ToggleIgnoreRequest):
        try:
            character = Repository().toggle_character_ignore(request.character_id)

            return ToggleIgnoreResponse(
                success=True,
                character_id=character.id,
                is_ignored=character.is_ignored
            )

        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))


    @characters_router.post("/rate-character")
    def rate_character(request: RateCharacterRequest):
        try:
            character = Repository().update_character_difficulty(request.character_id, request.difficulty)

            return RateCharacterResponse(
                success=True,
                character_id=character.id,
                difficulty=character.difficulty
            )

        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))

    return characters_router
