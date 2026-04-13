const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", require("./routes/auth"));
app.use("/movies", require("./routes/movies"));
app.use("/reviews", require("./routes/reviews"));

app.listen(3000, () => console.log("Server running on port 3000"));