const router = require("express").Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const {
    getMovies,
    getGenres,
    getMovieById,
    getMovieSuggestions,
    addMovie,
    updateMovie,
    deleteMovie,
} = require("../controllers/movieController");

router.get("/", getMovies);
router.get("/genres", getGenres);
router.get("/:id/suggestions", getMovieSuggestions);
router.get("/:id", getMovieById);
router.post("/", auth, admin, addMovie);
router.put("/:id", auth, admin, updateMovie);
router.delete("/:id", auth, admin, deleteMovie);

module.exports = router;
