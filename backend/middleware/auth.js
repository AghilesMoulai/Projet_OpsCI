const jwt = require("jsonwebtoken");
const SECRET = process.env.SECRET_KEY || "secret";

module.exports = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) return res.sendStatus(403);

    // BUG CORRIGÉ : support "Bearer <token>" ET token brut
    const token = header.startsWith("Bearer ") ? header.slice(7) : header;

    try {
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded;
        next();
    } catch {
        res.sendStatus(403);
    }
};