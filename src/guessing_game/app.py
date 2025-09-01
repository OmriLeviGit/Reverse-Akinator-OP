# guessing_game/app.py
import os
import secrets
from contextlib import asynccontextmanager
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.middleware.sessions import SessionMiddleware

load_dotenv()

from guessing_game.config import get_redis
from guessing_game.services.character_service import CharacterService
from guessing_game.services.llm_service import LLMService
from guessing_game.routes import session
from guessing_game.routes.game import router as game_router
from guessing_game.routes.characters import router as characters_router



@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Application starting up...")

    # Initialize LLM service
    service = LLMService()
    service.set_model('gemini', model='gemini-1.5-flash')
    app.state.llm = service

    # Initialize repository
    app.state.repository = CharacterService()

    # Use Redis from config
    try:
        app.state.redis_client = get_redis()
        app.state.redis_client.ping()
        print("Connected to Redis successfully")
    except Exception as e:
        print(f"WARNING: Could not connect to Redis: {e}")
        print("Game functionality will not work.")

    yield

    print("Application shutting down...")
    if hasattr(app.state, 'redis_client'):
        app.state.redis_client.close()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SessionMiddleware, secret_key=secrets.token_urlsafe(32))

# Include API routes
app.include_router(session.router)
app.include_router(game_router)
app.include_router(characters_router)

# Serve static files from the built frontend
if os.path.exists("client/dist"):
    app.mount("/assets", StaticFiles(directory="client/dist/assets"), name="assets")
    app.mount("/img", StaticFiles(directory="client/dist/img"), name="images")


@app.get("/")
def serve_frontend():
    if os.path.exists("client/dist/index.html"):
        return FileResponse("client/dist/index.html")
    raise HTTPException(status_code=404, detail="Frontend not found")


@app.get("/{path:path}")
def serve_spa_or_404(path: str):
    if path.startswith("api/") or path in ["docs", "openapi.json", "redoc"]:
        raise HTTPException(status_code=404, detail=f"GET endpoint /{path} not found")

    if os.path.exists("client/dist/index.html"):
        return FileResponse("client/dist/index.html")

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
    uvicorn.run("guessing_game.app:app", host="0.0.0.0", port=3000, reload=True)