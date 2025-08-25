# server/routes/game.py
from fastapi import APIRouter, Depends, HTTPException

from server import game_service
from server.SessionManager import SessionManager
from server.GameManager import GameManager
from server.dependencies import get_session_manager, get_repository, get_llm, get_game_manager
from server.pydantic_schemas.game_schemas import (
    GameStartResponse, GameStartRequest,
    GameQuestionResponse, GameQuestionRequest,
    GameGuessResponse, GameGuessRequest,
    GameRevealResponse, GameRevealRequest,
    GameStatusResponse, GameStatusRequest
)

router = APIRouter(prefix="/api/game", tags=["game"])


def validate_game_session(session_mgr: SessionManager, game_mgr: GameManager, game_id: str):
    """Helper function to validate game session across both managers"""
    if not session_mgr.has_active_game():
        raise HTTPException(status_code=400, detail="No active game session")

    if not session_mgr.is_valid_game_session(game_id):
        raise HTTPException(status_code=400, detail="Game ID mismatch with session")

    if not game_mgr.game_exists(game_id):
        raise HTTPException(status_code=400, detail="Game data not found")


@router.post("/start", response_model=GameStartResponse)
def start_game_route(request: GameStartRequest,
                     session_mgr: SessionManager = Depends(get_session_manager),
                     game_mgr: GameManager = Depends(get_game_manager),
                     repository=Depends(get_repository)):
    try:
        character_pool = game_service.start_game(request, session_mgr, game_mgr, repository)

        return GameStartResponse(
            message="Game started successfully",
            gameId=session_mgr.get_current_game_id(),
            characterPool=character_pool
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/validate", response_model=GameStatusResponse)
def validate_game_session_route(request: GameStatusRequest,
                                session_mgr: SessionManager = Depends(get_session_manager),
                                game_mgr: GameManager = Depends(get_game_manager)):
    """Validate if game session is still active across both session and Redis"""
    try:
        validate_game_session(session_mgr, game_mgr, request.game_id)
        return GameStatusResponse(isValidGame=True)
    except HTTPException:
        return GameStatusResponse(isValidGame=False)


@router.post("/question", response_model=GameQuestionResponse)
def ask_question_route(request: GameQuestionRequest,
                       session_mgr: SessionManager = Depends(get_session_manager),
                       game_mgr: GameManager = Depends(get_game_manager),
                       llm=Depends(get_llm)):
    try:
        validate_game_session(session_mgr, game_mgr, request.game_id)

        answer = game_service.ask_question(request.question, session_mgr, game_mgr, llm)

        return GameQuestionResponse(
            answer=answer,
            questionsAsked=game_mgr.get_questions_asked(session_mgr.get_current_game_id())
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# server/routes/game.py
@router.post("/guess", response_model=GameGuessResponse)
def make_guess_route(request: GameGuessRequest,
                     session_mgr: SessionManager = Depends(get_session_manager),
                     game_mgr: GameManager = Depends(get_game_manager)):
    try:
        validate_game_session(session_mgr, game_mgr, request.game_id)

        result = game_service.make_guess(request.character_name, session_mgr, game_mgr)

        if result["is_correct"]:
            return GameGuessResponse(
                isCorrect=True,
                character=result["character"],
                questionsAsked=result["questions_asked"],
                guessesMade=result["guesses_made"]
            )
        else:
            return GameGuessResponse(
                isCorrect=False
            )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/reveal", response_model=GameRevealResponse)
def reveal_character_route(request: GameRevealRequest,
                           session_mgr: SessionManager = Depends(get_session_manager),
                           game_mgr: GameManager = Depends(get_game_manager)):
    try:
        validate_game_session(session_mgr, game_mgr, request.game_id)

        game_id = session_mgr.get_current_game_id()
        character = game_mgr.get_target_character(game_id)
        questions_asked = game_mgr.get_questions_asked(game_id)
        guesses_made = game_mgr.get_guess_count(game_id)

        game_mgr.delete_game(game_id)
        session_mgr.clear_current_game()

        return GameRevealResponse(
            character=character,
            questionsAsked=questions_asked,
            guessesMade=guesses_made
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))