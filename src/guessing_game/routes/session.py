# server/routes/session.py
from fastapi import APIRouter, Depends, HTTPException

from guessing_game.services.arc_service import ArcService
from guessing_game.services.session_manager import SessionManager
from guessing_game.dependencies import get_session_manager, get_arc_service
from guessing_game.schemas.session_schemas import SessionResponse, UpdateArcLimitResponse, UpdateArcLimitRequest, \
    SessionDataResponse

router = APIRouter(prefix="/api/session", tags=["session"])


@router.post("/", response_model=SessionResponse)
def get_session_data(request: dict, session_mgr: SessionManager = Depends(get_session_manager),
                     arc_service: ArcService = Depends(get_arc_service)):
    arc_limit = request.get("arcLimit")

    # Ensure session exists (create if needed)
    if not session_mgr.has_session_data():
        session_mgr.create_initial_session(arc_limit)

    session_mgr.update_last_activity()

    all_arcs = arc_service.get_arcs_until(arc_service.get_arc_by_name("All"))

    return SessionResponse(
        message="API is running",
        sessionData=SessionDataResponse.model_validate(session_mgr.request.session),
        availableArcs=all_arcs,
    )


@router.post("/update-arc-limit", response_model=UpdateArcLimitResponse)
def update_arc_limit(request: UpdateArcLimitRequest, session_mgr: SessionManager = Depends(get_session_manager),
                     arc_service: ArcService = Depends(get_arc_service)):
    try:
        # Ensure session exists (create if needed)
        if not session_mgr.has_session_data():
            session_mgr.create_initial_session(request.arc_limit)

        session_mgr.set_global_arc_limit(request.arc_limit)

        all_arcs = arc_service.get_arcs_until(arc_service.get_arc_by_name("All"))

        return UpdateArcLimitResponse(
            success=True,
            sessionData=SessionDataResponse.model_validate(session_mgr.request.session),
            availableArcs=all_arcs,
        )
    except Exception as e:
        print(f"Error in update_arc_limit: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))