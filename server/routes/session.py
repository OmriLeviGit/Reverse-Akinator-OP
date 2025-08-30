# server/routes/session.py
from fastapi import APIRouter, Depends, HTTPException

from server.services.arc_service import ArcService
from server.services.session_manager import SessionManager
from server.dependencies import get_session_manager, get_arc_service
from server.schemas.session_schemas import SessionResponse, UpdateArcLimitResponse, UpdateArcLimitRequest, \
    SessionDataResponse

router = APIRouter(prefix="/api/session", tags=["session"])


@router.get("/", response_model=SessionResponse)
def get_session_data(session_mgr: SessionManager = Depends(get_session_manager),
                     arc_service: ArcService = Depends(get_arc_service)):
    # Ensure session exists (create if needed)
    if not session_mgr.has_session_data():
        session_mgr.create_initial_session()

    session_mgr.update_last_activity()

    all_arcs = arc_service.get_arcs_until(arc_service.get_arc_by_name("All"))

    # Use model_validate with the raw session data
    raw_session_data = session_mgr.get_safe_session_data()

    return SessionResponse(
        message="API is running",
        sessionData=SessionDataResponse.model_validate(raw_session_data),
        availableArcs=all_arcs,
    )


@router.post("/update-arc-limit", response_model=UpdateArcLimitResponse)
def update_arc_limit(request: UpdateArcLimitRequest, session_mgr: SessionManager = Depends(get_session_manager),
                     arc_service: ArcService = Depends(get_arc_service)):
    try:
        session_mgr.set_global_arc_limit(request.arc_limit)

        all_arcs = arc_service.get_arcs_until(arc_service.get_arc_by_name("All"))

        # Use the same approach for consistency
        raw_session_data = session_mgr.get_safe_session_data()

        return UpdateArcLimitResponse(
            success=True,
            sessionData=SessionDataResponse.model_validate(raw_session_data),
            availableArcs=all_arcs,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))