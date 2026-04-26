const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

function isAllowedOrigin(origin) {
    if (!origin) return true;

    const explicitOrigin = process.env.FRONTEND_URL;
    if (explicitOrigin && origin === explicitOrigin) return true;

    try {
        const { hostname, protocol } = new URL(origin);
        const isHttp = protocol === "http:" || protocol === "https:";
        const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
        const isPrivateNetwork =
            /^192\.168\./.test(hostname) ||
            /^10\./.test(hostname) ||
            /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);

        return isHttp && (isLocalhost || isPrivateNetwork);
    } catch {
        return false;
    }
}

app.use(cors({
    origin(origin, callback) {
        if (isAllowedOrigin(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Origin non autorisee par CORS"));
    }
}));
app.use(express.json({ limit: "15mb" }));
app.use("/images", express.static(path.join(__dirname, "images")));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});


app.use("/auth", require("./routes/auth"));
app.use("/movies", require("./routes/movies"));
app.use("/reviews", require("./routes/reviews"));

module.exports = app;
