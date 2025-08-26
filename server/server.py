import secrets
from contextlib import asynccontextmanager
import os

import redis
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.middleware.sessions import SessionMiddleware

from server.Repository import Repository
from server.LLMService import LLMService
from server.routes import session
from server.routes.game import router as game_router
from server.routes.characters import router as characters_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Application starting up...")
    service = LLMService()
    service.set_model('gemini', model='gemini-1.5-flash')

    app.state.llm = service
    app.state.repository = Repository()

    # Use environment variables for Redis connection
    redis_host = os.getenv('REDIS_HOST', 'localhost')
    redis_port = int(os.getenv('REDIS_PORT', 6379))

    app.state.redis_client = redis.Redis(
        host=redis_host,
        port=redis_port,
        db=0,
        decode_responses=True
    )

    try:
        app.state.redis_client.ping()
        print(f"Connected to Redis at {redis_host}:{redis_port}")
    except redis.ConnectionError:
        print("WARNING: Could not connect to Redis. Game functionality will not work.")

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
    app.mount("/assets", StaticFiles(directory="client/dist/assets"), name="assets")  # JS/CSS
    app.mount("/img", StaticFiles(directory="client/dist/img"), name="images")        # Your images


# Serve index.html for root
@app.get("/")
def serve_frontend():
    if os.path.exists("client/dist/index.html"):
        return FileResponse("client/dist/index.html")
    raise HTTPException(status_code=404, detail="Frontend not found")


# Handle SPA routing and API 404s
@app.get("/{path:path}")
def serve_spa_or_404(path: str):
    # If it's an API route, return 404
    if path.startswith("api/") or path in ["docs", "openapi.json", "redoc"]:
        raise HTTPException(status_code=404, detail=f"GET endpoint /{path} not found")

    # For frontend routes, serve index.html (SPA routing)
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
    uvicorn.run("server.server:app", host="0.0.0.0", port=3000, reload=True)