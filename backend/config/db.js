const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,  // Necessary for cloud databases (Railway, Heroku, etc.)
  }
});

module.exports = pool;