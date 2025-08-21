# server/dependencies.py
from fastapi import Request
from server.SessionManager import SessionManager
from server.Repository import Repository
from server.llm.llm_interface import LLMInterface


def get_session_manager(request: Request) -> SessionManager:
    return SessionManager(request)

def get_llm(request: Request) -> LLMInterface:
    return request.app.state.llm

def get_repository(request: Request) -> Repository:
    return request.app.state.repository