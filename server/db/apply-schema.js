const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const SCHEMA_FILE = path.join(__dirname, 'schema.sql');

const connectionOptions = {
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  password: process.env.PGPASSWORD || 'postgres',
  port: Number(process.env.PGPORT) || 5432,
};

const DB_NAME = process.env.PGDATABASE || 'art_medica';

async function ensureDatabase() {
  const client = new Client({ ...connectionOptions, database: 'postgres' });
  await client.connect();
  try {
    const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [DB_NAME]);
    if (exists.rowCount === 0) {
      await client.query(`CREATE DATABASE "${DB_NAME}"`);
      console.log(`Создана база данных ${DB_NAME}`);
    }
  } finally {
    await client.end();
  }
}

async function applySchema() {
  const client = new Client({ ...connectionOptions, database: DB_NAME });
  await client.connect();
  try {
    const schema = fs.readFileSync(SCHEMA_FILE, 'utf8');
    await client.query(schema);
    console.log(`Схема применена к базе ${DB_NAME}: таблицы, данные и представления.`);
  } finally {
    await client.end();
  }
}

async function main() {
  await ensureDatabase();
  await applySchema();
}

main().catch((err) => {
  console.error('Ошибка применения схемы:', err.message);
  process.exitCode = 1;
});
