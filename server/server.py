from contextlib import asynccontextmanager
import os

import uvicorn
from dotenv import load_dotenv, find_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.middleware.sessions import SessionMiddleware

from server.Repository import Repository
from server.llm.gemini import GeminiLLM
from server.routes import session
from server.routes.game import router as game_router
from server.routes.characters import router as characters_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Application starting up...")
    app.state.llm = GeminiLLM('gemini-1.5-flash')  # type: ignore
    app.state.repository = Repository()  # type: ignore

    yield

    print("Application shutting down...")


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SessionMiddleware, secret_key="key")

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