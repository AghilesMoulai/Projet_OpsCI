const router = require("express").Router();
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const {
    getReviews,
    addReview,
    deleteReview,
} = require("../controllers/reviewController");

router.get("/:movieId", getReviews);
router.post("/", auth, addReview);
router.delete("/:id", auth, admin, deleteReview);

module.exports = router;