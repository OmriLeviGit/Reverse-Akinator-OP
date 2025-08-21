# server/routes/characters.py
from fastapi import APIRouter, Depends, HTTPException

from server.Repository import Repository
from server.SessionManager import SessionManager
from server.dependencies import get_session_manager, get_repository
from server.pydantic_schemas.character_schemas import CharactersResponse, ToggleIgnoreRequest, ToggleIgnoreResponse, \
    RateCharacterRequest, RateCharacterResponse

router = APIRouter(prefix="/api/characters", tags=["characters"])

@router.get("/until", response_model=CharactersResponse)
def get_characters_until(session_mgr: SessionManager = Depends(get_session_manager),
                         repository: Repository = Depends(get_repository)):
    arc = session_mgr.get_global_arc_limit()
    try:
        characters = repository.get_characters_until(arc, include_ignored=True)
        return CharactersResponse(
            characters=characters,
            count=len(characters),
            arc=arc.name
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail="Characters not found")

@router.post("/toggle-ignore")
def toggle_ignore_character(request: ToggleIgnoreRequest, repository: Repository = Depends(get_repository)):
    try:
        character = repository.toggle_character_ignore(request.character_id)
        return ToggleIgnoreResponse(
            success=True,
            characterId=character.id,
            isIgnored=character.is_ignored
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/rate-character")
def rate_character(request: RateCharacterRequest, repository: Repository = Depends(get_repository)):
    try:
        character = repository.update_character_difficulty(request.character_id, request.difficulty)

        return RateCharacterResponse(
            success=True,
            characterId=character.id,
            difficulty=character.difficulty
        )

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))