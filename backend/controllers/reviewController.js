const pool = require("../db");
const { publishEvent } = require("../services/eventBus");

exports.getReviews = async (req, res) => {
    try {
        // JOIN pour récupérer l'email de l'auteur
        const result = await pool.query(
            `SELECT r.*, u.email as author_email
             FROM reviews r
             LEFT JOIN users u ON u.id = r.user_id
             WHERE r.movie_id=$1
             ORDER BY r.id DESC`,
            [req.params.movieId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

exports.addReview = async (req, res) => {
    try {
        // BUG CORRIGÉ : movie_id.id → movie_id (c'est déjà un entier)
        const { movie_id, rating, comment } = req.body;

        if (!movie_id || !rating)
            return res.status(400).json({ message: "movie_id et rating sont requis." });

        if (rating < 1 || rating > 5)
            return res.status(400).json({ message: "La note doit être entre 1 et 5." });

        // Vérifier que le film existe
        const movieCheck = await pool.query("SELECT id FROM movies WHERE id=$1", [movie_id]);
        if (movieCheck.rows.length === 0)
            return res.status(404).json({ message: "Film introuvable." });

        const result = await pool.query(
            "INSERT INTO reviews (user_id, movie_id, rating, comment) VALUES ($1,$2,$3,$4) RETURNING *",
            [req.user.id, movie_id, rating, comment || null]
        );

        await publishEvent("review.created", {
            reviewId: result.rows[0].id,
            movieId: result.rows[0].movie_id,
            userId: result.rows[0].user_id,
            rating: result.rows[0].rating,
        });

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

exports.deleteReview = async (req, res) => {
    try {
        const result = await pool.query(
            "DELETE FROM reviews WHERE id=$1 RETURNING id, user_id, movie_id, rating",
            [req.params.id]
        );

        if (result.rows.length > 0) {
            await publishEvent("review.deleted", {
                reviewId: result.rows[0].id,
                movieId: result.rows[0].movie_id,
                userId: result.rows[0].user_id,
                rating: result.rows[0].rating,
                actorId: req.user?.id,
            });
        }

        res.json({ message: "Avis supprimé." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};
