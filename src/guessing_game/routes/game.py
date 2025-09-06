# server/routes/game.py
from fastapi import APIRouter, Depends, HTTPException

from guessing_game.services import game_service
from guessing_game.services.arc_service import ArcService
from guessing_game.services.character_service import CharacterService
from guessing_game.services.session_manager import SessionManager
from guessing_game.services.game_manager import GameManager
from guessing_game.services.llm_service import LLMService
from guessing_game.services.prompt_service import PromptService
from guessing_game.dependencies import get_session_manager, get_character_service, get_llm_service, get_game_manager, \
    get_arc_service, get_prompt_service
from guessing_game.schemas.game_schemas import (
    GameStartResponse, GameStartRequest,
    GameQuestionResponse, GameQuestionRequest,
    GameGuessResponse, GameGuessRequest,
    GameRevealResponse, GameRevealRequest,
    GameStatusResponse, GameStatusRequest, ChatMessage
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
                     character_service: CharacterService = Depends(get_character_service),
                     arc_service: ArcService = Depends(get_arc_service),
                     prompt_service: PromptService = Depends(get_prompt_service)):
    try:
        character_pool = game_service.start_game(request, session_mgr, game_mgr, character_service, arc_service, prompt_service)

        return GameStartResponse(
            message="Game started successfully",
            gameId=session_mgr.get_current_game_id(),
            characterPool=character_pool
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail="Service temporarily unavailable")

@router.post("/validate", response_model=GameStatusResponse)
def validate_game_session_route(request: GameStatusRequest,
                                session_mgr: SessionManager = Depends(get_session_manager),
                                game_mgr: GameManager = Depends(get_game_manager)):
    """Validate if game session is still active and return messages"""
    try:
        validate_game_session(session_mgr, game_mgr, request.game_id)
        all_messages = game_mgr.get_chat_messages(request.game_id)

        chat_messages = [ChatMessage(id=msg["id"], text=msg["text"], isUser=msg["is_user"]) for msg in all_messages]

        return GameStatusResponse(isValidGame=True, messages=chat_messages)
    except HTTPException:
        return GameStatusResponse(isValidGame=False)

@router.post("/question", response_model=GameQuestionResponse)
def ask_question_route(request: GameQuestionRequest,
                       session_mgr: SessionManager = Depends(get_session_manager),
                       game_mgr: GameManager = Depends(get_game_manager),
                       llm_service: LLMService = Depends(get_llm_service),
                       prompt_service: PromptService = Depends(get_prompt_service)):
    try:
        validate_game_session(session_mgr, game_mgr, request.game_id)

        answer = game_service.ask_question(request.question, session_mgr, game_mgr, llm_service, prompt_service)

        return GameQuestionResponse(
            answer=answer,
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail="Service temporarily unavailable")

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
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail="Service temporarily unavailable")

@router.post("/reveal", response_model=GameRevealResponse)
def reveal_character_route(request: GameRevealRequest,
                           session_mgr: SessionManager = Depends(get_session_manager),
                           game_mgr: GameManager = Depends(get_game_manager)):
    try:
        validate_game_session(session_mgr, game_mgr, request.game_id)

        result = game_service.reveal_character(session_mgr, game_mgr)

        return GameRevealResponse(
            character=result["character"],
            questionsAsked=result["questions_asked"],
            guessesMade=result["guesses_made"]
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail="Service temporarily unavailable")

