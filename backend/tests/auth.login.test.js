jest.mock("../db", () => ({
  query: jest.fn()
}));

jest.mock("bcrypt", () => ({
  compare: jest.fn()
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn()
}));

const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { login } = require("../controllers/authController");

describe("login", () => {
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

  it("connecte un utilisateur avec des identifiants valides", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          email: "test@example.com",
          password: "hashed-password",
          role: "user"
        }
      ]
    });

    bcrypt.compare.mockResolvedValueOnce(true);
    jwt.sign.mockReturnValueOnce("fake-jwt-token");

    await login(req, res);

    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(bcrypt.compare).toHaveBeenCalledWith("secret123", "hashed-password");
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: 1, role: "user" },
      expect.any(String),
      { expiresIn: "1h" }
    );
    expect(res.json).toHaveBeenCalledWith({
      token: "fake-jwt-token",
      user: {
        id: 1,
        email: "test@example.com",
        role: "user"
      }
    });
  });

  it("refuse la connexion si l'utilisateur est introuvable", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
    
      await login(req, res);
    
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Email ou mot de passe incorrect."
      });
    });
    
    it("refuse la connexion si le mot de passe est incorrect", async () => {
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            email: "test@example.com",
            password: "hashed-password",
            role: "user"
          }
        ]
      });
  
      bcrypt.compare.mockResolvedValueOnce(false);
  
      await login(req, res);
  
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(bcrypt.compare).toHaveBeenCalledWith("secret123", "hashed-password");
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Email ou mot de passe incorrect."
      });
    });

});
