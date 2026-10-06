const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'myxina',
  password: process.env.PGPASSWORD || 'postgres',
  port: Number(process.env.PGPORT) || 5432,
});

pool.on('error', (err) => {
  console.error('Необработанная ошибка пула PostgreSQL:', err);
});

module.exports = pool;
