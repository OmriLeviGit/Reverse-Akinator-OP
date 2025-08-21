# server/routes/game.py
from fastapi import APIRouter, Depends, HTTPException

from server import game_service
from server.SessionManager import SessionManager
from server.dependencies import get_session_manager, get_repository, get_llm
from server.pydantic_schemas.character_schemas import Character
from server.pydantic_schemas.game_schemas import (
    GameStartResponse, GameStartRequest,
    GameQuestionResponse, GameQuestionRequest,
    GameGuessResponse, GameGuessRequest,
    GameRevealResponse
)

router = APIRouter(prefix="/api/game", tags=["game"])


@router.post("/start", response_model=GameStartResponse)
def start_game_route(request: GameStartRequest, session_mgr: SessionManager = Depends(get_session_manager),
                     repository = Depends(get_repository)):
    try:
        character_pool = game_service.start_game(request, session_mgr, repository)

        return GameStartResponse(
            message="Game started successfully",
            gameId=session_mgr.get_game_id(),
            characterPool=character_pool
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/question", response_model=GameQuestionResponse)
def ask_question_route(request: GameQuestionRequest, session_mgr: SessionManager = Depends(get_session_manager),
                       llm = Depends(get_llm)):
    try:
        if not session_mgr.has_active_game():
            raise HTTPException(status_code=400, detail="No active game session")

        answer = game_service.ask_question(request.question, session_mgr, llm)

        return GameQuestionResponse(
            answer=answer,
            questionsAsked=session_mgr.get_questions_asked()
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/guess", response_model=GameGuessResponse)
def make_guess_route(request: GameGuessRequest, session_mgr: SessionManager = Depends(get_session_manager)):
    try:
        if not session_mgr.has_active_game():
            raise HTTPException(status_code=400, detail="No active game session")

        result = game_service.make_guess(request.character_name, session_mgr)

        return GameGuessResponse(
            isCorrect=result["is_correct"],
            message=result["message"],
            targetCharacter=result.get("character")
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/reveal", response_model=GameRevealResponse)
def reveal_character_route(session_mgr: SessionManager = Depends(get_session_manager)):
    try:
        if not session_mgr.has_active_game():
            raise HTTPException(status_code=400, detail="No active game session")

        character_data = session_mgr.get_target_character()
        questions_asked = session_mgr.get_questions_asked()
        guesses_made = session_mgr.get_guess_count()

        session_mgr.end_game()

        character = Character(**character_data)

        return GameRevealResponse(
            character=character,
            questionsAsked=questions_asked,
            guessesMade=guesses_made
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))