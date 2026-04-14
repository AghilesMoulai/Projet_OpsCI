const { Pool } = require("pg");

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "cinematheque",
    password: process.env.DB_PASSWORD || "password",
    port: Number(process.env.DB_PORT || 5432),
    ssl: isProduction ? { rejectUnauthorized: false } : false,
});

module.exports = pool;
