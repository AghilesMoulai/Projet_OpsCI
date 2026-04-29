jest.mock("../db", () => ({
  query: jest.fn()
}));

jest.mock("../services/objectStorage", () => ({
  uploadBuffer: jest.fn()
}));

jest.mock("../services/eventBus", () => ({
  publishEvent: jest.fn()
}));

const pool = require("../db");
const { publishEvent } = require("../services/eventBus");
const { addMovie } = require("../controllers/movieController");

describe("addMovie", () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: { id: 7, role: "admin" },
      body: {
        title: "Inception",
        director: "Christopher Nolan",
        genre: "Science-fiction",
        year: 2010,
        image_url: null,
        description: "Un film sur les reves."
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it("cree un film et publie un evenement Kafka", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 42,
          title: "Inception",
          director: "Christopher Nolan",
          genre: "Science-fiction",
          year: 2010,
          image_url: null,
          description: "Un film sur les reves."
        }
      ]
    });

    await addMovie(req, res);

    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(publishEvent).toHaveBeenCalledWith("movie.created", {
      movieId: 42,
      title: "Inception",
      genre: "Science-fiction",
      year: 2010,
      actorId: 7
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      id: 42,
      title: "Inception",
      director: "Christopher Nolan",
      genre: "Science-fiction",
      year: 2010,
      image_url: null,
      description: "Un film sur les reves."
    });
  });

  it("refuse la creation si un champ obligatoire manque", async () => {
    req.body.title = "";

    await addMovie(req, res);

    expect(pool.query).not.toHaveBeenCalled();
    expect(publishEvent).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Champs obligatoires manquants."
    });
  });

  it("normalise plusieurs genres avant l'insertion", async () => {
    req.body.genre = ["Science-fiction", "Thriller", "Science-fiction"];

    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 43,
          title: "Inception",
          director: "Christopher Nolan",
          genre: "Science-fiction, Thriller",
          year: 2010,
          image_url: null,
          description: "Un film sur les reves."
        }
      ]
    });

    await addMovie(req, res);

    expect(pool.query.mock.calls[0][1]).toEqual([
      "Inception",
      "Christopher Nolan",
      "Science-fiction, Thriller",
      2010,
      null,
      "Un film sur les reves."
    ]);
  });
});
