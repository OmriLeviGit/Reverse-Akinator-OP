# server/routes/session.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from server.Repository import Repository
from server.SessionManager import SessionManager, get_session_manager

router = APIRouter(prefix="/api/session", tags=["session"])


class UpdateArcLimitRequest(BaseModel):
    arc_limit: str


@router.get("/")
def get_session_data(session_mgr: SessionManager = Depends(get_session_manager)):
    session_mgr.clear_session()  # While in development
    if not session_mgr.has_session_data():
        # Create new session
        session_mgr.create_initial_session()
        status = "created"
    else:
        # Update existing session
        session_mgr.update_last_activity()
        status = "existing"

    r = Repository()
    all_arcs = r.get_arcs_before(r.get_arc_by_name("All"))

    return {
        "message": "API is running",
        "session_status": status,
        "session_data": session_mgr.get_safe_session_data(),
        "available_arcs": all_arcs,
    }


@router.post("/update-arc-limit")
def update_arc_limit(request: UpdateArcLimitRequest, session_mgr: SessionManager = Depends(get_session_manager)):
    try:
        session_mgr.set_global_arc_limit(request.arc_limit)

        r = Repository()
        all_arcs = r.get_arcs_before(r.get_arc_by_name("All"))

        return {
            "success": True,
            "session_data": session_mgr.get_safe_session_data(),
            "available_arcs": all_arcs,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))