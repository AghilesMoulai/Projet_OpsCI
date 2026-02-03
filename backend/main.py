from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
from pathlib import Path

app = FastAPI()

origins = [
    "http://localhost:0000",
    "http://localhost:3000",  # React (autre port)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],   # GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],
)

DATA_PATH = Path(__file__).parent / "movies.json"

@app.get("/hello")
def hello():
    return {"message": "Hello World"}

@app.get("/movies")
def get_movies(limit : int = None):
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        movies = json.load(f)
    return movies[:limit]

