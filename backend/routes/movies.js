const router = require("express").Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const {
    getMovies,
    addMovie,
    deleteMovie,
} = require("../controllers/movieController");

router.get("/", getMovies);
router.post("/", auth, admin, addMovie);
router.delete("/:id", auth, admin, deleteMovie);

console.log("auth =", auth);
console.log("admin =", admin);
console.log("getMovies =", getMovies);
console.log("addMovie =", addMovie);
console.log("deleteMovie =", deleteMovie);

module.exports = router;