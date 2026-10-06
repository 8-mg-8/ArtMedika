const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function main() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('✅ Схема medical_services применена (CREATE/ALTER TABLE IF NOT EXISTS + триггер updated_at)');
}

main()
  .catch((err) => {
    console.error('❌ Ошибка применения схемы:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
