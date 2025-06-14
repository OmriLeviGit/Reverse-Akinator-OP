from fastapi import APIRouter, Query

from schemas.game_schemas import (
   GameStartRequest, GameStartResponse,
   GameQuestionRequest, GameQuestionResponse,
   GameHintRequest, GameHintResponse,
   GameRevealRequest, GameRevealResponse,
   GameGuessRequest, GameGuessResponse,
)

from schemas.character_schemas import (
    CharactersResponse,
   AllCharactersWithStatusResponse,
   CharacterSearchResponse, AvailableCharactersRequest,
   AvailableCharactersResponse
)

from schemas.user_schemas import (
    IgnoreCharacterRequest, IgnoreCharacterResponse,
    UnignoreCharacterResponse, IgnoredCharactersResponse,
    RateCharacterRequest, RateCharacterResponse,
    CharacterRatingsResponse
)

from schemas.data_schemas import (
    DataResponse
)

game_router = APIRouter(prefix="/api/game", tags=["game"])
characters_router = APIRouter(prefix="/api/characters", tags=["characters"])
user_router = APIRouter(prefix="/api/user", tags=["user"])
data_router = APIRouter(prefix="/api/data", tags=["data"])

# Game Management Routes
@game_router.post("/start", response_model=GameStartResponse)  # Remove /game prefix
def start_game(request: GameStartRequest):
   return {"game_session_id": "session_123", "message": "Game started"}

@game_router.post("/question", response_model=GameQuestionResponse)
def ask_question(request: GameQuestionRequest):
   return {"answer": "Yes, the character is from this arc"}

@game_router.post("/hint", response_model=GameHintResponse)
def get_hint(request: GameHintRequest):
   return {"hint": "This character has spiky hair"}

@game_router.post("/reveal", response_model=GameRevealResponse)
def reveal_character(request: GameRevealRequest):
   return {"character_info": "This character is the main protagonist"}

@game_router.post("/guess", response_model=GameGuessResponse)
def make_guess(request: GameGuessRequest):
   return {"is_correct": True, "message": "Correct guess!"}

# Character Data Routes - Fixed to use characters_router
@characters_router.get("/", response_model=CharactersResponse)
def get_characters():
   return {"characters": []}

@characters_router.get("/all-with-status", response_model=AllCharactersWithStatusResponse)
def get_all_characters_with_status():
   return {"characters": []}

@characters_router.get("/search", response_model=CharacterSearchResponse)
def search_characters(
   query: str | None = Query(None),
   arc: str | None = Query(None),
   filler: str | None = Query(None),
   difficulty: str | None = Query(None)
):
   return {"characters": [], "total_count": 0}

@characters_router.post("/available", response_model=AvailableCharactersResponse)
def get_available_characters(request: AvailableCharactersRequest):
   return {"characters": [], "total_available": 0}

# User Routes
@user_router.get("/ignored-characters", response_model=IgnoredCharactersResponse)
def get_ignored_characters():
    return {"ignored_characters": []}

@user_router.post("/ignore-character", response_model=IgnoreCharacterResponse)
def ignore_character(request: IgnoreCharacterRequest):
    return {
        "message": "Character ignored successfully",
        "character_id": request.character_id
    }

@user_router.delete("/ignore-character/{character_id}", response_model=UnignoreCharacterResponse)
def unignore_character(character_id: str):
    return {
        "message": "Character unignored successfully",
        "character_id": character_id
    }

@user_router.get("/character-ratings", response_model=CharacterRatingsResponse)
def get_character_ratings():
    return {"character_ratings": []}

@user_router.post("/rate-character", response_model=RateCharacterResponse)
def rate_character(request: RateCharacterRequest):
    return {
        "message": "Character rated successfully",
        "character_id": request.character_id,
        "rating": request.rating
    }

@data_router.post("/arcs", response_model=DataResponse)
def arc_list():
    return {
        "arc_names": ["arc list"],
        "last_arc_chapter": [3],
    }