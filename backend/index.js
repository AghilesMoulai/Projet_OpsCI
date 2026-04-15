require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = require("./app");

const port = Number(process.env.PORT || 3000);

app.listen(port, () => console.log(`Server running on port ${port}`));
