const pool = require("../db");

exports.getMovies = async (req, res) => {
    try{
        const {genre, year, search} = req.query;

        let query = "SELECT * FROM movies WHERE 1=1";
        let values = [];

        if (genre){
            values.push(genre);
            query += ` AND genre=$${values.length}`;
        }

        if(year){
            values.push(year);
            query += ` AND year=$${values.length}`;
        }

        if(search){
            values.push(`%${search}%`);
            query += ` AND title ILIKE $${values.length}`
        }

        query += " ORDER BY title ASC";

        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({message: "Erreur serveur."});
    }
};

exports.getMovieById = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM movies WHERE id=$1",
            [req.params.id]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ message: "Film introuvable." });
 
        const movie = result.rows[0];
 
        // Calculer la note moyenne
        const ratingResult = await pool.query(
            "SELECT AVG(rating)::NUMERIC(3,1) as average, COUNT(*) as count FROM reviews WHERE movie_id=$1",
            [req.params.id]
        );
        movie.average_rating = parseFloat(ratingResult.rows[0].average) || null;
        movie.ratings_count  = parseInt(ratingResult.rows[0].count) || 0;
 
        res.json(movie);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};
 
exports.addMovie = async (req, res) => {
    try {
        const { title, director, genre, year, image_url, description } = req.body;
        if (!title || !director || !genre || !year)
            return res.status(400).json({ message: "Champs obligatoires manquants." });
 
        const result = await pool.query(
            `INSERT INTO movies (title, director, genre, year, image_url, description)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [title, director, genre, year, image_url || null, description || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};
 
exports.updateMovie = async (req, res) => {
    try {
        const { title, director, genre, year, image_url, description } = req.body;
        const result = await pool.query(
            `UPDATE movies SET title=$1, director=$2, genre=$3, year=$4,
             image_url=$5, description=$6 WHERE id=$7 RETURNING *`,
            [title, director, genre, year, image_url, description, req.params.id]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ message: "Film introuvable." });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};
 

exports.deleteMovie = async (req, res) => {
    try {
        await pool.query("DELETE FROM reviews WHERE movie_id=$1", [req.params.id]);
        const result = await pool.query(
            "DELETE FROM movies WHERE id=$1 RETURNING id",
            [req.params.id]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ message: "Film introuvable." });
        res.json({ message: "Film supprimé." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};