const pool = require("../db");
const fs = require("fs/promises");
const path = require("path");

const imagesDir = path.join(__dirname, "..", "images");

function slugifyFilename(value) {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || "movie";
}

function buildImageUrl(filename) {
    return `/images/${filename}`;
}

function extensionFromMimeType(mimeType) {
    const map = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
    };
    return map[mimeType] || null;
}

async function saveBase64Image({ imageBase64, imageName, title }) {
    const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) {
        throw new Error("Format image_base64 invalide.");
    }

    const mimeType = match[1];
    const base64Data = match[2];
    const extension = extensionFromMimeType(mimeType);

    if (!extension) {
        throw new Error("Format d'image non supporte.");
    }

    const baseName = slugifyFilename(imageName || title);
    const filename = `${Date.now()}_${baseName}${extension}`;
    const filePath = path.join(imagesDir, filename);

    await fs.writeFile(filePath, Buffer.from(base64Data, "base64"));
    return buildImageUrl(filename);
}

async function downloadImage({ imageUrl, title }) {
    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error("Impossible de telecharger l'image distante.");
    }

    const mimeType = response.headers.get("content-type")?.split(";")[0] || "";
    const extension = extensionFromMimeType(mimeType);
    if (!extension) {
        throw new Error("Format d'image distante non supporte.");
    }

    const filename = `${Date.now()}_${slugifyFilename(title)}${extension}`;
    const filePath = path.join(imagesDir, filename);
    const arrayBuffer = await response.arrayBuffer();

    await fs.writeFile(filePath, Buffer.from(arrayBuffer));
    return buildImageUrl(filename);
}

async function resolveImageUrl({ title, image_url, image_base64, image_name }) {
    if (image_base64) {
        return saveBase64Image({ imageBase64: image_base64, imageName: image_name, title });
    }

    if (image_url && /^https?:\/\//i.test(image_url)) {
        return downloadImage({ imageUrl: image_url, title });
    }

    return image_url || null;
}

exports.getMovies = async (req, res) => {
    try{
        const {genre, year, search, minRating, limit} = req.query;

        let query = `
            SELECT
                m.*,
                AVG(r.rating)::NUMERIC(3,1) AS average_rating,
                COUNT(r.id)::INT AS ratings_count
            FROM movies m
            LEFT JOIN reviews r ON r.movie_id = m.id
            WHERE 1=1
        `;
        let values = [];

        if (genre){
            values.push(genre);
            query += ` AND m.genre=$${values.length}`;
        }

        if(year){
            values.push(year);
            query += ` AND m.year=$${values.length}`;
        }

        if(search){
            values.push(`%${search}%`);
            query += ` AND m.title ILIKE $${values.length}`;
        }

        query += " GROUP BY m.id";

        if (minRating) {
            values.push(minRating);
            query += ` HAVING COALESCE(AVG(r.rating), 0) >= $${values.length}`;
        }

        query += " ORDER BY m.title ASC";

        if (limit) {
            const parsedLimit = Number.parseInt(limit, 10);
            if ([10, 20, 50].includes(parsedLimit)) {
                values.push(parsedLimit);
                query += ` LIMIT $${values.length}`;
            }
        }

        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({message: "Erreur serveur."});
    }
};

exports.getGenres = async (_req, res) => {
    try {
        const result = await pool.query(
            `SELECT DISTINCT genre
             FROM movies
             WHERE genre IS NOT NULL AND TRIM(genre) <> ''
             ORDER BY genre ASC`
        );
        res.json(result.rows.map((row) => row.genre));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur." });
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
        const { title, director, genre, year, image_url, description, image_base64, image_name } = req.body;
        if (!title || !director || !genre || !year)
            return res.status(400).json({ message: "Champs obligatoires manquants." });

        const storedImageUrl = await resolveImageUrl({ title, image_url, image_base64, image_name });
 
        const result = await pool.query(
            `INSERT INTO movies (title, director, genre, year, image_url, description)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [title, director, genre, year, storedImageUrl, description || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};
 
exports.updateMovie = async (req, res) => {
    try {
        const { title, director, genre, year, image_url, description, image_base64, image_name } = req.body;
        const storedImageUrl = await resolveImageUrl({ title, image_url, image_base64, image_name });
        const result = await pool.query(
            `UPDATE movies SET title=$1, director=$2, genre=$3, year=$4,
             image_url=$5, description=$6 WHERE id=$7 RETURNING *`,
            [title, director, genre, year, storedImageUrl, description, req.params.id]
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
