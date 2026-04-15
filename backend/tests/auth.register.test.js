jest.mock("../db", () => ({
  query: jest.fn()
}));

jest.mock("bcrypt", () => ({
  hash: jest.fn()
}));

const pool = require("../db");
const bcrypt = require("bcrypt");
const { register } = require("../controllers/authController");

describe("register", () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {
        email: "test@example.com",
        password: "secret123"
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it("cree un utilisateur si email et mot de passe sont valides", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ id: 1, email: "test@example.com", role: "user" }]
      });

    bcrypt.hash.mockResolvedValueOnce("hashed-password");

    await register(req, res);

    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(bcrypt.hash).toHaveBeenCalledWith("secret123", 10);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      id: 1,
      email: "test@example.com",
      role: "user"
    });
  });

  it("refuse la creation d'un utilisateur car l'email existe déja", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] })

    await register(req, res);

    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
        message: "Email déja utilisé."
    });
  });
});
