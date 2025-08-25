# server/routes/game.py - Updated to use GameManager
from fastapi import APIRouter, Depends, HTTPException

from server import game_service
from server.SessionManager import SessionManager
from server.GameManager import GameManager
from server.dependencies import get_session_manager, get_repository, get_llm, get_game_manager
from server.pydantic_schemas.character_schemas import Character
from server.pydantic_schemas.game_schemas import (
    GameStartResponse, GameStartRequest,
    GameQuestionResponse, GameQuestionRequest,
    GameGuessResponse, GameGuessRequest,
    GameRevealResponse, GameRevealRequest, GameStatusResponse, GameStatusRequest,
)

router = APIRouter(prefix="/api/game", tags=["game"])


def validate_game_session(session_mgr: SessionManager, game_mgr: GameManager, game_id: str):
    """Helper function to validate game session across both managers"""
    print(f"\n🔍 === VALIDATING GAME SESSION ===")
    print(f"Requested game_id: {game_id}")

    has_active = session_mgr.has_active_game()
    print(f"Step 1 - Has active game: {has_active}")

    if not has_active:
        print("❌ SHOULD FAIL HERE - No active game session")
        raise HTTPException(status_code=400, detail="No active game session")

    is_valid_session = session_mgr.is_valid_game_session(game_id)
    print(f"Step 2 - Valid game session: {is_valid_session}")

    if not is_valid_session:
        print("❌ SHOULD FAIL HERE - Game ID mismatch with session")
        raise HTTPException(status_code=400, detail="Game ID mismatch with session")

    game_exists = game_mgr.game_exists(game_id)
    print(f"Step 3 - Game exists in Redis: {game_exists}")

    if not game_exists:
        print("❌ SHOULD FAIL HERE - Game data not found")
        raise HTTPException(status_code=400, detail="Game data not found")

    print("✅ All validations passed")


@router.post("/start", response_model=GameStartResponse)
def start_game_route(request: GameStartRequest,
                     session_mgr: SessionManager = Depends(get_session_manager),
                     game_mgr: GameManager = Depends(get_game_manager),
                     repository=Depends(get_repository)):
    try:
        character_pool = game_service.start_game(request, session_mgr, game_mgr, repository)

        return GameStartResponse(
            message="Game started successfully",
            gameId=session_mgr.get_game_id(),
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
        # Use our existing validation helper
        validate_game_session(session_mgr, game_mgr, request.game_id)
        return GameStatusResponse(isValidGame=True)
    except HTTPException:
        # If validation fails, return false instead of raising exception
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
            questionsAsked=session_mgr.get_questions_asked()
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


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
                character=Character(**result["character"]),
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

        game_id = session_mgr.get_game_id()
        character_data = game_mgr.get_target_character(game_id)
        questions_asked = session_mgr.get_questions_asked()
        guesses_made = session_mgr.get_guess_count()

        # Clean up - delete from both Redis and session
        game_mgr.delete_game(game_id)
        session_mgr.end_game()

        character = Character(**character_data)

        return GameRevealResponse(
            character=character,
            questionsAsked=questions_asked,
            guessesMade=guesses_made
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))