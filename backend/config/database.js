const { Pool } = require('pg');
require('dotenv').config();

// Vercel/Neon peut utiliser POSTGRES_URL ou DATABASE_URL
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

// Neon peut fournir une connection string complète
const poolConfig = connectionString
  ? {
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    }
  : {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_HOST && process.env.DB_HOST.includes('neon.tech') ? {
        rejectUnauthorized: false
      } : false
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;

