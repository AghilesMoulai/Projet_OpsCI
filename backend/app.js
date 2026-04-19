const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
app.use(express.json({ limit: "15mb" }));
app.use("/images", express.static(path.join(__dirname, "images")));

app.use("/auth", require("./routes/auth"));
app.use("/movies", require("./routes/movies"));
app.use("/reviews", require("./routes/reviews"));

module.exports = app;
