const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use("/images", express.static(path.join(__dirname, "images")));

app.use("/auth", require("./routes/auth"));
app.use("/movies", require("./routes/movies"));
app.use("/reviews", require("./routes/reviews"));

app.listen(port, () => console.log(`Server running on port ${port}`));
