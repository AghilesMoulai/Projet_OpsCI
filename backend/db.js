const { Pool } = require("pg");
const { getDatabaseConfig } = require("./config/database");

const pool = new Pool(getDatabaseConfig());

module.exports = pool;
