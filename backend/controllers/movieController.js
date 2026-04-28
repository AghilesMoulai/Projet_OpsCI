const pool = require("../db");
const { uploadBuffer } = require("../services/objectStorage");
const { publishEvent } = require("../services/eventBus");

function slugifyFilename(value) {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || "movie";
}

function buildImageUrl(filename) {
    return `/movie-images/${filename}`;
}

function normalizeGenres(value) {
    // Les genres peuvent arriver soit sous forme de tableau depuis le formulaire,
    // soit sous forme de chaîne séparée par des virgules depuis l'API.
    const rawGenres = Array.isArray(value) ? value : String(value || "").split(",");
    const genres = rawGenres
        .map((genre) => genre.trim())
        .filter(Boolean);

    return [...new Set(genres)].join(", ");
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
    
    await uploadBuffer({
        objectName: filename,
        buffer: Buffer.from(base64Data, "base64"),
        mimeType,
    });

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
    const arrayBuffer = await response.arrayBuffer();

    await uploadBuffer({
        objectName: filename,
        buffer: Buffer.from(arrayBuffer),
        mimeType,
    });
    
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
        const {genre, year, search, minRating} = req.query;
        const parsedPage = Number.parseInt(req.query.page, 10);
        const parsedLimit = Number.parseInt(req.query.limit, 10);
        const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
        const limit = [10, 20, 50].includes(parsedLimit) ? parsedLimit : 10;

        // Base commune utilisée deux fois : une fois pour compter le total,
        // puis une fois pour récupérer uniquement la page demandée.
        let baseQuery = `
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
            // Un film peut avoir plusieurs genres stockés dans une même colonne
            // ("Action, Drame"). On découpe donc la chaîne avant de filtrer.
            baseQuery += ` AND EXISTS (
                SELECT 1
                FROM regexp_split_to_table(m.genre, ',') AS movie_genre
                WHERE LOWER(TRIM(movie_genre)) = LOWER($${values.length})
            )`;
        }

        if(year){
            values.push(year);
            baseQuery += ` AND m.year=$${values.length}`;
        }

        if(search){
            values.push(`%${search}%`);
            baseQuery += ` AND m.title ILIKE $${values.length}`;
        }

        baseQuery += " GROUP BY m.id";

        if (minRating) {
            values.push(minRating);
            baseQuery += ` HAVING COALESCE(AVG(r.rating), 0) >= $${values.length}`;
        }

        const countResult = await pool.query(
            `SELECT COUNT(*)::INT AS total FROM (${baseQuery}) filtered_movies`,
            values
        );

        const total = countResult.rows[0]?.total || 0;
        const totalPages = Math.max(Math.ceil(total / limit), 1);
        const currentPage = Math.min(page, totalPages);
        const currentOffset = (currentPage - 1) * limit;

        // Les paramètres LIMIT/OFFSET restent bindés pour éviter de concaténer
        // des valeurs utilisateur directement dans la requête.
        values.push(limit, currentOffset);
        const result = await pool.query(
            `${baseQuery} ORDER BY m.title ASC LIMIT $${values.length - 1} OFFSET $${values.length}`,
            values
        );

        res.json({
            data: result.rows,
            pagination: {
                page: currentPage,
                limit,
                total,
                totalPages,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({message: "Erreur serveur."});
    }
};

exports.getGenres = async (_req, res) => {
    try {
        const result = await pool.query(
            // Les genres multiples sont stockés avec des virgules, donc on les
            // éclate pour alimenter proprement les listes déroulantes.
            `SELECT DISTINCT TRIM(genre_part) AS genre
             FROM movies,
                  regexp_split_to_table(genre, ',') AS genre_part
             WHERE genre IS NOT NULL AND TRIM(genre_part) <> ''
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
        const normalizedGenre = normalizeGenres(genre);

        if (!title || !director || !normalizedGenre || !year)
            return res.status(400).json({ message: "Champs obligatoires manquants." });

        const storedImageUrl = await resolveImageUrl({ title, image_url, image_base64, image_name });
 
        const result = await pool.query(
            `INSERT INTO movies (title, director, genre, year, image_url, description)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [title, director, normalizedGenre, year, storedImageUrl, description || null]
        );

        await publishEvent("movie.created", {
            movieId: result.rows[0].id,
            title: result.rows[0].title,
            genre: result.rows[0].genre,
            year: result.rows[0].year,
            actorId: req.user?.id,
        });

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};
 
exports.updateMovie = async (req, res) => {
    try {
        const { title, director, genre, year, image_url, description, image_base64, image_name } = req.body;
        const normalizedGenre = normalizeGenres(genre);

        if (!title || !director || !normalizedGenre || !year)
            return res.status(400).json({ message: "Champs obligatoires manquants." });

        const storedImageUrl = await resolveImageUrl({ title, image_url, image_base64, image_name });
        const result = await pool.query(
            `UPDATE movies SET title=$1, director=$2, genre=$3, year=$4,
             image_url=$5, description=$6 WHERE id=$7 RETURNING *`,
            [title, director, normalizedGenre, year, storedImageUrl, description, req.params.id]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ message: "Film introuvable." });

        await publishEvent("movie.updated", {
            movieId: result.rows[0].id,
            title: result.rows[0].title,
            genre: result.rows[0].genre,
            year: result.rows[0].year,
            actorId: req.user?.id,
        });

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
            "DELETE FROM movies WHERE id=$1 RETURNING id, title",
            [req.params.id]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ message: "Film introuvable." });

        await publishEvent("movie.deleted", {
            movieId: result.rows[0].id,
            title: result.rows[0].title,
            actorId: req.user?.id,
        });

        res.json({ message: "Film supprimé." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur." });
    }
};

exports.getMovieSuggestions = async (req, res) => {
    try {
        const movieId = req.params.id

        // on récupère le film sélectionné
        const movieResult = await pool.query(
            "SELECT id, title, genre FROM movies WHERE id = $1",
            [movieId]
        );

        if(movieResult.rows.length === 0){
            return res.status(404).json({message: "Film introuvable."});
        }

        const currentMovie = movieResult.rows[0];

        // Chercher des films proches : genres en commun + titre proche.
        // Exemple : "Avatar" doit pouvoir remonter "Avatar: La voie de l'eau".
        const suggestionsResult = await pool.query(
            `WITH current_movie AS (
                SELECT
                    $1::TEXT AS title,
                    $2::TEXT AS genre,
                    regexp_replace(LOWER($1::TEXT), '[^a-z0-9]+', '', 'g') AS normalized_title
            ),
            scored_movies AS (
                SELECT
                    m.*,
                    regexp_replace(LOWER(m.title), '[^a-z0-9]+', '', 'g') AS normalized_title,
                    -- Score simple : plus il y a de genres communs, plus le film remonte.
                    (
                        SELECT COUNT(*)::INT
                        FROM regexp_split_to_table(m.genre, ',') AS suggested_genre
                        WHERE LOWER(TRIM(suggested_genre)) IN (
                            SELECT LOWER(TRIM(current_genre))
                            FROM regexp_split_to_table(current_movie.genre, ',') AS current_genre
                        )
                    ) AS genre_matches
                FROM movies m
                CROSS JOIN current_movie
                WHERE m.id <> $3
            )
            SELECT
                scored_movies.id,
                scored_movies.title,
                scored_movies.director,
                scored_movies.genre,
                scored_movies.year,
                scored_movies.image_url,
                scored_movies.description,
                AVG(r.rating)::NUMERIC(3,1) AS average_rating,
                COUNT(r.id)::INT AS rating_count
            FROM scored_movies
            CROSS JOIN current_movie
            LEFT JOIN reviews r ON r.movie_id = scored_movies.id
            WHERE scored_movies.genre_matches > 0
               OR scored_movies.normalized_title LIKE current_movie.normalized_title || '%'
               OR current_movie.normalized_title LIKE scored_movies.normalized_title || '%'
            GROUP BY scored_movies.id, scored_movies.title, scored_movies.director, scored_movies.genre,
                     scored_movies.year, scored_movies.image_url, scored_movies.description,
                     scored_movies.normalized_title, scored_movies.genre_matches,
                     current_movie.normalized_title
            ORDER BY
                CASE
                    WHEN scored_movies.normalized_title LIKE current_movie.normalized_title || '%'
                      OR current_movie.normalized_title LIKE scored_movies.normalized_title || '%'
                    THEN 1
                    ELSE 0
                END DESC,
                scored_movies.genre_matches DESC,
                average_rating DESC NULLS LAST,
                scored_movies.title ASC
            LIMIT 4`,
            [currentMovie.title, currentMovie.genre, movieId]
        );

        res.json(suggestionsResult.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({message: "Erreur lors de la récupération des suggestions."});        
    }
};
