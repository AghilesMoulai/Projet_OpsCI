const DEFAULT_DB_PORT = 5432;

function parseBoolean(value, defaultValue = false) {
    if (value === undefined) return defaultValue;

    return ["true", "1", "yes", "on"].includes(String(value).toLowerCase());
}

function getSslConfig() {
    const isProduction = process.env.NODE_ENV === "production";
    const useSsl = parseBoolean(process.env.DB_SSL, isProduction);

    if (!useSsl) return false;

    return {
        rejectUnauthorized: parseBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED, false),
    };
}

function getDatabaseConfig() {
    if (process.env.DATABASE_URL) {
        const config = {
            connectionString: process.env.DATABASE_URL,
        };

        // Keep provider-specific SSL settings from the URL unless explicitly overridden.
        if (process.env.DB_SSL !== undefined || process.env.NODE_ENV === "production") {
            config.ssl = getSslConfig();
        }

        return config;
    }

    return {
        user: process.env.DB_USER || "postgres",
        host: process.env.DB_HOST || "localhost",
        database: process.env.DB_NAME || "cinematheque",
        password: process.env.DB_PASSWORD || "password",
        port: Number(process.env.DB_PORT || DEFAULT_DB_PORT),
        ssl: getSslConfig(),
    };
}

module.exports = {
    getDatabaseConfig,
};
