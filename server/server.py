import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from game_controller import GameController
from routes import create_routers

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

config = {
    'arc_to_chapter' : "fe",
    "scheme" : "f",
    "instruction_prompt" : "f"
}
game_controller = GameController(config=config)

game_router, characters_router, user_router, data_router = create_routers(game_controller)

app.include_router(game_router)
app.include_router(characters_router)
app.include_router(user_router)
app.include_router(data_router)

@app.get("/")
def root():
    return {"message": "API is running"}

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
    uvicorn.run("server:app", host="0.0.0.0", port=3001, reload=True)
