# server/routes/session.py
from fastapi import APIRouter, Depends, HTTPException

from server.Repository import Repository
from server.SessionManager import SessionManager
from server.dependencies import get_session_manager, get_repository
from server.pydantic_schemas.session_schemas import SessionResponse, UpdateArcLimitResponse, UpdateArcLimitRequest, \
    SessionDataResponse

router = APIRouter(prefix="/api/session", tags=["session"])


@router.get("/", response_model=SessionResponse)
def get_session_data(session_mgr: SessionManager = Depends(get_session_manager),
                     repository: Repository = Depends(get_repository)):
    # Ensure session exists (create if needed)
    if not session_mgr.has_session_data():
        session_mgr.create_initial_session()

    session_mgr.update_last_activity()

    all_arcs = repository.get_arcs_before(repository.get_arc_by_name("All"))

    # Use model_validate with the raw session data
    raw_session_data = session_mgr.get_safe_session_data()

    return SessionResponse(
        message="API is running",
        sessionData=SessionDataResponse.model_validate(raw_session_data),
        availableArcs=all_arcs,
    )


@router.post("/update-arc-limit", response_model=UpdateArcLimitResponse)
def update_arc_limit(request: UpdateArcLimitRequest, session_mgr: SessionManager = Depends(get_session_manager),
                     repository: Repository = Depends(get_repository)):
    try:
        session_mgr.set_global_arc_limit(request.arc_limit)

        all_arcs = repository.get_arcs_before(repository.get_arc_by_name("All"))

        # Use the same approach for consistency
        raw_session_data = session_mgr.get_safe_session_data()

        return UpdateArcLimitResponse(
            success=True,
            sessionData=SessionDataResponse.model_validate(raw_session_data),
            availableArcs=all_arcs,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))