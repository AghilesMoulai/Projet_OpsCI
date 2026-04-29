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
const { getMovies } = require("../controllers/movieController");

describe("getMovies pagination", () => {
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it("retourne les films avec les metadonnees de pagination", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ total: 23 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 11,
            title: "Film page 2",
            genre: "Drame",
            year: 2020,
            average_rating: "4.0",
            ratings_count: 3
          }
        ]
      });

    await getMovies(
      {
        query: {
          page: "2",
          limit: "10"
        }
      },
      res
    );

    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(pool.query.mock.calls[1][0]).toContain("LIMIT $1 OFFSET $2");
    expect(pool.query.mock.calls[1][1]).toEqual([10, 10]);
    expect(res.json).toHaveBeenCalledWith({
      data: [
        {
          id: 11,
          title: "Film page 2",
          genre: "Drame",
          year: 2020,
          average_rating: "4.0",
          ratings_count: 3
        }
      ],
      pagination: {
        page: 2,
        limit: 10,
        total: 23,
        totalPages: 3
      }
    });
  });
});
