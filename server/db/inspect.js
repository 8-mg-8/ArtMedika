const pool = require('./pool.js');

(async () => {
  const cols = await pool.query(
    `SELECT column_name, data_type, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_name = 'medical_services'
     ORDER BY ordinal_position`,
  );
  console.table(cols.rows);

  const count = await pool.query(
    `SELECT service_type, COUNT(*)::int AS c FROM medical_services GROUP BY service_type ORDER BY service_type`,
  );
  console.table(count.rows);

  const rows = await pool.query(
    `SELECT code_nomenclature, code_mis, service_type, duration_text, duration_min,
            price_rub, price_category_i, price_category_ii, price_category_iii
     FROM medical_services
     ORDER BY service_type, code_mis`,
  );
  console.table(rows.rows);

  await pool.end();
})().catch((err) => {
  console.error('ERR:', err.message);
  process.exit(1);
});