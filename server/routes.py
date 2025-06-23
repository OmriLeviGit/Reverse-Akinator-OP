from fastapi import APIRouter, HTTPException, Depends

from server import GameService
from server.SessionManager import SessionManager, get_session_manager
from server.schemas.game_schemas import (
    GameStartRequest, GameStartResponse,
    GameQuestionRequest, GameQuestionResponse,
    GameRevealResponse,
    GameGuessRequest, GameGuessResponse,
)
from server.schemas.character_schemas import (
    CharactersResponse, UpdateCharacterRequest, UpdateCharacterResponse
)

from server.Repository import Repository


def create_game_router():
    game_router = APIRouter(prefix="/api/game", tags=["game"])

    @game_router.post("/start", response_model=GameStartResponse)
    def start_game_route(request: GameStartRequest, session_mgr: SessionManager = Depends(get_session_manager)):
        return GameService.start_game(request, session_mgr)

    @game_router.post("/question", response_model=GameQuestionResponse)
    def ask_question_route(request: GameQuestionRequest, session_mgr: SessionManager = Depends(get_session_manager)):
        return GameService.ask_question(request, session_mgr)

    @game_router.post("/reveal", response_model=GameRevealResponse)
    def reveal_character_route(session_mgr: SessionManager = Depends(get_session_manager)):
        response = GameRevealResponse(session_mgr.get_target_character())
        session_mgr.end_game()

        return response

    @game_router.post("/guess", response_model=GameGuessResponse)
    def make_guess_route(request: GameGuessRequest, session_mgr: SessionManager = Depends(get_session_manager)):
        character = session_mgr.get_target_character()

        if request.guessedCharacterId == character.id:
            response = GameGuessResponse(character)
        else:
            response = GameGuessResponse()

        session_mgr.end_game()

        return response

    return game_router

def create_characters_router():
    characters_router = APIRouter(prefix="/api/characters", tags=["characters"])
    r = Repository()

    @characters_router.get("/up-to", response_model=CharactersResponse)
    def get_characters(session_mgr: SessionManager = Depends(get_session_manager)):
        arc = session_mgr.get_global_arc_limit()
        try:
            return r.get_characters_up_to(arc=arc)
        except ValueError as e:
            raise HTTPException(status_code=404, detail="Character not found")

    @characters_router.patch("/{character_id}", response_model=UpdateCharacterResponse)
    def update_character(character_id: int, request: UpdateCharacterRequest):
        try:
            return r.update_character(character_id, request)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))

    return characters_router