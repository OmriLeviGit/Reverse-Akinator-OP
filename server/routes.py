from fastapi import APIRouter, HTTPException
from character_controller import CharacterController
from game_controller import GameController

from schemas.game_schemas import (
    GameStartRequest, GameStartResponse,
    GameQuestionRequest, GameQuestionResponse,
    GameHintRequest, GameHintResponse,
    GameRevealRequest, GameRevealResponse,
    GameGuessRequest, GameGuessResponse,
)
from schemas.character_schemas import (
    CharactersResponse, ToggleCharacterResponse, ToggleCharacterRequest,
    ChangeCharacterRatingResponse, ChangeCharacterRatingRequest
)
from schemas.data_schemas import (
    DataResponse
)
from DataManager import DataManager


def create_game_router():
    game_router = APIRouter(prefix="/api/game", tags=["game"])
    game_controller = GameController()

    @game_router.post("/start", response_model=GameStartResponse)
    def start_game_route(request: GameStartRequest):
        return game_controller.start_game(request)

    @game_router.post("/question", response_model=GameQuestionResponse)
    def ask_question_route(request: GameQuestionRequest):
        return game_controller.ask_question(request)

    @game_router.post("/hint", response_model=GameHintResponse)
    def get_hint_route(request: GameHintRequest):
        return game_controller.get_hint(request)

    @game_router.post("/reveal", response_model=GameRevealResponse)
    def reveal_character_route(request: GameRevealRequest):
        return game_controller.reveal_character(request)

    @game_router.post("/guess", response_model=GameGuessResponse)
    def make_guess_route(request: GameGuessRequest):
        return game_controller.make_guess(request)

    return game_router


def create_characters_router():
    characters_router = APIRouter(prefix="/api/characters", tags=["characters"])
    character_controller = CharacterController()

    @characters_router.get("", response_model=CharactersResponse)
    def get_characters():
        return character_controller.get_all_characters()

    @characters_router.post("/toggle-ignore", response_model=ToggleCharacterResponse)
    def toggle_ignore_character(request: ToggleCharacterRequest):
        try:
            return character_controller.toggle_ignore_character(request)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))

    @characters_router.post("/rate-character", response_model=ChangeCharacterRatingResponse)
    def rate_character(request: ChangeCharacterRatingRequest):
        try:
            return character_controller.rate_character(request)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    return characters_router


def create_data_router():
    data_router = APIRouter(prefix="/api/data", tags=["data"])

    @data_router.get("/arcs", response_model=DataResponse)
    def arc_list():
        data_manager = DataManager.get_instance()
        return DataResponse(arcList=data_manager.arc_list)

    return data_router
