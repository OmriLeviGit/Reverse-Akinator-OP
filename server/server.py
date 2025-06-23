import uvicorn
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from server.Repository import Repository
from server.SessionManager import SessionManager, get_session_manager
from server.routes import create_game_router, create_characters_router

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SessionMiddleware, secret_key="key")

game_router = create_game_router()
characters_router = create_characters_router()

app.include_router(game_router)
app.include_router(characters_router)

#
# def get_earlier_arc(arc1, arc2):
#     if arc1 == "All":
#         return arc2
#     elif arc2 == "All":
#         return arc2
#
#     if not arc1.chapter:
#         return arc2
#
#     if not arc2.chapter:
#         return arc1
#
#     if arc1.chapter < arc2.chapter:
#         return arc1
#
#     return arc2



@app.get("/")
def root(session_mgr: SessionManager = Depends(get_session_manager)):
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
        "available_arcs": available_arcs
    }

@app.get("/{path:path}")
def catch_all_get(path: str):
    return {"error": f"GET endpoint /{path} not found"}

@app.post("/{path:path}")
def catch_all_post(path: str):
    return {"error": f"POST endpoint /{path} not found"}

@app.put("/{path:path}")
def catch_all_put(path: str):
    return {"error": f"PUT endpoint /{path} not found"}

@app.delete("/{path:path}")
def catch_all_delete(path: str):
    return {"error": f"DELETE endpoint /{path} not found"}

if __name__ == '__main__':
    uvicorn.run("server.server:app", host="0.0.0.0", port=3001, reload=True)