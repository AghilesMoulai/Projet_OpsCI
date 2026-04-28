jest.mock("../db", () => ({
  query: jest.fn()
}));

jest.mock("../services/eventBus", () => ({
  publishEvent: jest.fn()
}));

const pool = require("../db");
const { publishEvent } = require("../services/eventBus");
const { addReview } = require("../controllers/reviewController");

describe("addReview", () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: { id: 1, role: "user" },
      body: {
        movie_id: 10,
        rating: 5,
        comment: "Excellent film"
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it("cree un avis si les donnees sont valides et le film existe", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 10 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            user_id: 1,
            movie_id: 10,
            rating: 5,
            comment: "Excellent film"
          }
        ]
      });

    await addReview(req, res);

    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(publishEvent).toHaveBeenCalledWith("review.created", {
      reviewId: 1,
      movieId: 10,
      userId: 1,
      rating: 5
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      id: 1,
      user_id: 1,
      movie_id: 10,
      rating: 5,
      comment: "Excellent film"
    });
  });

  it("refuse un avis si la note est hors limites", async () => {
      req.body.rating = 6;
    
      await addReview(req, res);
    
      expect(pool.query).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "La note doit être entre 1 et 5."
      });
    });
    
    it("refuse un avis si le film est introuvable", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
    
      await addReview(req, res);
    
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Film introuvable."
      });
    });

});
