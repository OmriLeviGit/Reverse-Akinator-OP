# server/dependencies.py
import redis
from fastapi import Request

from server.services.arc_service import ArcService
from server.services.game_manager import GameManager
from server.services.session_manager import SessionManager
from server.services.character_service import CharacterService
from server.services.llm_service import LLMService

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