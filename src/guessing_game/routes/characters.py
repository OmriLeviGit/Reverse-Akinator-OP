# server/routes/characters.py
from fastapi import APIRouter, Depends, HTTPException

from guessing_game.services.character_service import CharacterService
from guessing_game.services.session_manager import SessionManager
from guessing_game.dependencies import get_session_manager, get_character_service
from guessing_game.schemas.character_schemas import CharactersResponse, ToggleIgnoreRequest, ToggleIgnoreResponse, \
    RateCharacterRequest, RateCharacterResponse

router = APIRouter(prefix="/api/characters", tags=["characters"])

@router.get("/until", response_model=CharactersResponse)
def get_characters_until(session_mgr: SessionManager = Depends(get_session_manager),
                         character_service: CharacterService = Depends(get_character_service)):
    arc = session_mgr.get_global_arc_limit()
    try:
        characters = character_service.get_characters_until(arc, include_ignored=True)
        return CharactersResponse(
            characters=characters,
            count=len(characters),
            arc=arc.name
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail="Characters not found")

@router.post("/toggle-ignore")
def toggle_ignore_character(request: ToggleIgnoreRequest, character_service: CharacterService = Depends(get_character_service)):
    try:
        character = character_service.toggle_character_ignore(request.character_id)
        return ToggleIgnoreResponse(
            success=True,
            characterId=character.id,
            isIgnored=character.is_ignored
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/rate-character")
def rate_character(request: RateCharacterRequest, character_service: CharacterService = Depends(get_character_service)):
    try:
        character = character_service.update_character_difficulty(request.character_id, request.difficulty)

        return RateCharacterResponse(
            success=True,
            characterId=character.id,
            difficulty=character.difficulty
        )

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))