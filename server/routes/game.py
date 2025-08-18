# server/routes/game.py
from fastapi import APIRouter, Depends, HTTPException

from server import game_service
from server.SessionManager import SessionManager, get_session_manager
from server.pydantic_schemas.character_schemas import Character
from server.pydantic_schemas.game_schemas import GameStartResponse, GameStartRequest, GameQuestionResponse, \
    GameQuestionRequest, GameGuessResponse, GameGuessRequest

router = APIRouter(prefix="/api/game", tags=["game"])

@router.post("/start", response_model=GameStartResponse)
def start_game_route(request: GameStartRequest, session_mgr: SessionManager = Depends(get_session_manager)):
    try:
        game_service.start_game(request, session_mgr)
        return GameStartResponse(message="Game started successfully")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/question", response_model=GameQuestionResponse)
def ask_question_route(request: GameQuestionRequest, session_mgr: SessionManager = Depends(get_session_manager)):
    return game_service.ask_question(request, session_mgr)

@router.post("/reveal", response_model=Character)
def reveal_character_route(session_mgr: SessionManager = Depends(get_session_manager)):
    character = session_mgr.get_target_character()
    session_mgr.end_game()
    return character

@router.post("/guess", response_model=GameGuessResponse)
def make_guess_route(request: GameGuessRequest, session_mgr: SessionManager = Depends(get_session_manager)):
    character = session_mgr.get_target_character()

    if request.guessed_character_id == character.id:
        result = "correct"
    else:
        result = "incorrect"

    session_mgr.end_game()
    return GameGuessResponse(result=result, character=character, message="Game ended")
