# server/dependencies.py
import redis
from fastapi import Request, Depends

from server.GameManager import GameManager
from server.SessionManager import SessionManager
from server.Repository import Repository
from server.llm.llm_interface import LLMInterface


def get_session_manager(request: Request) -> SessionManager:
    return SessionManager(request)

def get_llm(request: Request) -> LLMInterface:
    return request.app.state.llm

def get_repository(request: Request) -> Repository:
    return request.app.state.repository


def get_redis_client(request: Request) -> redis.Redis:
    return request.app.state.redis_client

def get_game_manager(redis_client: redis.Redis = Depends(get_redis_client)) -> GameManager:
    return GameManager(redis_client)