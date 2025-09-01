# guessing_game/dependencies.py
import redis
from fastapi import Request

from guessing_game.services.arc_service import ArcService
from guessing_game.services.game_manager import GameManager
from guessing_game.services.session_manager import SessionManager
from guessing_game.services.character_service import CharacterService
from guessing_game.services.llm_service import LLMService
from guessing_game.services.prompt_service import PromptService

def get_session_manager(request: Request) -> SessionManager:
    return SessionManager(request)

def get_character_service(request: Request) -> CharacterService:
    return request.app.state.repository

def get_arc_service():
    return ArcService()

def get_redis_client(request: Request) -> redis.Redis:
    return request.app.state.redis_client

def get_game_manager() -> GameManager:
    return GameManager()

def get_llm_service(request: Request) -> LLMService:
    return request.app.state.llm

def get_prompt_service() -> PromptService:
    return PromptService()