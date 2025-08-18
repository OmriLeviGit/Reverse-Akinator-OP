# server/routes/main.py
from fastapi import APIRouter, Depends
from server.Repository import Repository
from server.SessionManager import SessionManager, get_session_manager

router = APIRouter()

@router.get("/")
def root(session_mgr: SessionManager = Depends(get_session_manager)):
    session_mgr.clear_session() # While in development
    if not session_mgr.has_session_data():
        # Create new session
        session_mgr.create_initial_session()
        status = "created"

    else:
        # Update existing session
        session_mgr.update_last_activity()
        status = "existing"

    r = Repository()
    arc_limit = session_mgr.get_global_arc_limit()
    available_arcs = r.get_arcs_before(arc_limit)

    return {
        "message": "API is running",
        "session_status": status,
        "session_data": session_mgr.get_safe_session_data(),
        "available_arcs": available_arcs,
    }
