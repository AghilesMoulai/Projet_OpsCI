from fastapi import FastAPI
import json
from pathlib import Path

app = FastAPI()
DATA_PATH = Path(__file__).parent / "movies.json"

@app.get("/hello")
def hello():
 return {"message": "Hello World"}


@app.get("/movies")
def get_movies():
 with open(DATA_PATH, "r", encoding="utf-8") as f:
 movies = json.load(f)
 return movies
