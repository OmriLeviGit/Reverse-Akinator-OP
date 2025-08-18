import uvicorn
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
from starlette.middleware.sessions import SessionMiddleware

from server.routes import session
from server.routes.game import router as game_router
from server.routes.characters import router as characters_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SessionMiddleware, secret_key="key")

app.include_router(session.router)
app.include_router(game_router)
app.include_router(characters_router)

@app.get("/{path:path}")
def catch_all_get(path: str):
    raise HTTPException(status_code=404, detail=f"GET endpoint /{path} not found")

@app.post("/{path:path}")
def catch_all_post(path: str):
    raise HTTPException(status_code=404, detail=f"POST endpoint /{path} not found")

@app.put("/{path:path}")
def catch_all_put(path: str):
    raise HTTPException(status_code=404, detail=f"PUT endpoint /{path} not found")

@app.delete("/{path:path}")
def catch_all_delete(path: str):
    raise HTTPException(status_code=404, detail=f"DELETE endpoint /{path} not found")

if __name__ == '__main__':
    uvicorn.run("server.server:app", host="0.0.0.0", port=3001, reload=True)