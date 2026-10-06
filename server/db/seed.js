const fs = require('fs');
const path = require('path');
const pool = require('./pool');
const services = require('../data/dataPriceYslyga.js');

const schemaPath = path.join(__dirname, 'schema.sql');
const shouldReset = process.argv.includes('--reset');

const COLUMNS = [
  'code_nomenclature',
  'code_mis',
  'service_name',
  'service_type',
  'duration_text',
  'duration_min',
  'price_rub',
  'price_category_i',
  'price_category_ii',
  'price_category_iii',
];

async function main() {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(schema);
  console.log('✅ Схема таблицы medical_services готова');

  const before = await pool.query('SELECT COUNT(*)::int AS c FROM medical_services');
  const existing = before.rows[0].c;
  console.log(`ℹ️  Записей в таблице до загрузки: ${existing}`);

  if (shouldReset) {
    await pool.query('TRUNCATE TABLE medical_services');
    console.log('🗑️  Таблица очищена (--reset)');
  } else if (existing > 0) {
    console.log('ℹ️  Таблица не пуста — существующие записи будут обновлены. Для полной очистки используйте --reset.');
  }

  const client = await pool.connect();
  const updateParts = COLUMNS.filter((c) => c !== 'code_nomenclature' && c !== 'code_mis').map(
    (c) => `${c} = EXCLUDED.${c}`,
  );

  const query = `
    INSERT INTO medical_services (${COLUMNS.join(', ')})
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (code_nomenclature, code_mis) DO UPDATE SET ${updateParts.join(', ')}
  `;

  let inserted = 0;
  try {
    await client.query('BEGIN');
    for (const item of services) {
      const missing = ['code_nomenclature', 'code_mis', 'service_name', 'service_type'].filter(
        (key) => !item[key],
      );
      if (missing.length > 0) {
        throw new Error(`Запись без ${missing.join(', ')}: ${JSON.stringify(item)}`);
      }
      if (!['consultation', 'surgery'].includes(item.service_type)) {
        throw new Error(`Некорректный service_type "${item.service_type}" у ${item.code_mis}`);
      }
      await client.query(query, [
        item.code_nomenclature,
        item.code_mis,
        item.service_name,
        item.service_type,
        item.duration_text ?? null,
        item.duration_min ?? null,
        item.price_rub ?? null,
        item.price_category_i ?? null,
        item.price_category_ii ?? null,
        item.price_category_iii ?? null,
      ]);
      inserted += 1;
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const after = await pool.query('SELECT COUNT(*)::int AS c FROM medical_services');
  console.log(`✅ Обработано записей: ${inserted}, всего в таблице: ${after.rows[0].c}`);
}

main()
  .catch((err) => {
    console.error('❌ Ошибка заполнения БД:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());