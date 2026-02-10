from http.client import HTTPException
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import json
from pathlib import Path
import os

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
IMAGES_PATH = Path(__file__).parent / "images"

@app.get("/hello")
def hello():
    return {"message": "Hello World"}

@app.get("/movies")
def get_movies(limit : int = None):
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        movies = json.load(f)
    return movies[:limit]

@app.get("/images/{image_name}")
def get_image(image_name : str):
    image_path = IMAGES_PATH / image_name

    #verifier si l'image existe
    if not image_path.exists():
        raise HTTPException(404, detail="Image not Found")
    
    return FileResponse(image_path)