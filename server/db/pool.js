const { Pool, types } = require('pg');

// DATE -> 'YYYY-MM-DD' строкой
types.setTypeParser(1082, (value) => value);
// NUMERIC/DECIMAL -> Number
types.setTypeParser(1700, (value) => (value === null ? null : Number(value)));

const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'art_medica',
  password: process.env.PGPASSWORD || 'postgres',
  port: Number(process.env.PGPORT) || 5432,
  max: Number(process.env.PG_POOL_LIMIT) || 10,
});

pool.on('error', (err) => {
  console.error('Неожиданная ошибка пула PostgreSQL:', err.message);
});

module.exports = pool;
