import json

from fastapi import APIRouter, HTTPException

from character_controller import CharacterController

from schemas.game_schemas import (
   GameStartRequest, GameStartResponse,
   GameQuestionRequest, GameQuestionResponse,
   GameHintRequest, GameHintResponse,
   GameRevealRequest, GameRevealResponse,
   GameGuessRequest, GameGuessResponse,
)

from schemas.character_schemas import (
    CharactersResponse
)

from schemas.user_schemas import (
    IgnoreCharacterRequest, IgnoreCharacterResponse,
    UnignoreCharacterResponse,
    RateCharacterRequest, RateCharacterResponse,
)

from schemas.data_schemas import (
    DataResponse
)


def create_routers(game_controller):
    game_router = APIRouter(prefix="/api/game", tags=["game"])
    characters_router = APIRouter(prefix="/api/characters", tags=["characters"])
    user_router = APIRouter(prefix="/api/user", tags=["user"])
    data_router = APIRouter(prefix="/api/data", tags=["data"])

    character_controller = CharacterController()

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

    # Character Data Routes - Fixed to use characters_router

    @characters_router.get("", response_model=CharactersResponse)
    def get_characters():
        return character_controller.get_all_characters()

    @user_router.post("/ignore-character", response_model=IgnoreCharacterResponse)
    def ignore_character(request: IgnoreCharacterRequest):
        try:
            return character_controller.ignore_character(request)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))

    @user_router.delete("/ignore-character/{character_id}", response_model=UnignoreCharacterResponse)
    def unignore_character(character_id: str):
        try:
            return character_controller.unignore_character(character_id)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))

    @user_router.post("/rate-character", response_model=RateCharacterResponse)
    def rate_character(request: RateCharacterRequest):
        try:
            return character_controller.rate_character(request)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    @data_router.post("/arcs", response_model=DataResponse)
    def arc_list():
        with open('data/arc_list.json', 'r') as file:
            data = json.load(file)

            return DataResponse(**data)

    return game_router, characters_router, user_router, data_router