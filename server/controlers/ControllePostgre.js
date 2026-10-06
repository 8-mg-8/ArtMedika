const pool = require('../db/pool');

const TABLE = 'medical_services';

const SERVICE_TYPES = ['consultation', 'surgery'];

const EDITABLE_FIELDS = [
  'service_name',
  'service_type',
  'duration_text',
  'duration_min',
  'price_rub',
  'price_category_i',
  'price_category_ii',
  'price_category_iii',
];

const CATEGORY_FIELDS = ['price_category_i', 'price_category_ii', 'price_category_iii'];

const DB_ERROR_STATUS = {
  '23505': 409,
  '23503': 400,
  '23514': 400,
  '22P02': 400,
};

function toText(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
}

function toCode(value, field) {
  const text = toText(value);
  if (text === null) return { error: `Поле «${field}» обязательно` };
  if (text.length > 20) return { error: `Поле «${field}» не длиннее 20 символов` };
  return { value: text };
}

function toNumber(value, field, { integer = false, min = 0 } = {}) {
  if (value === null || value === undefined || value === '') return { value: null };
  if (typeof value === 'boolean') return { error: `Поле «${field}» должно быть числом` };

  const raw = typeof value === 'number' ? value : String(value).trim().replace(/\s/g, '').replace(',', '.');
  const parsed = Number(raw);

  if (!Number.isFinite(parsed)) return { error: `Поле «${field}» должно быть числом` };
  if (integer && !Number.isInteger(parsed)) return { error: `Поле «${field}» должно быть целым числом` };
  if (parsed < min) return { error: `Поле «${field}» не может быть меньше ${min}` };

  return { value: parsed };
}

function collect(result, field, errors, values) {
  if (result.error) errors.push(result.error);
  else values[field] = result.value;
}

function normalizeForType(values, serviceType) {
  if (serviceType === 'consultation') {
    if (Object.hasOwn(values, 'duration_min')) values.duration_min = null;
    return values;
  }
  if (serviceType === 'surgery') {
    if (Object.hasOwn(values, 'duration_text')) values.duration_text = null;
    if (Object.hasOwn(values, 'price_rub')) values.price_rub = null;
    return values;
  }
  return values;
}

function parse(body, { partial }) {
  const errors = [];
  const values = {};
  const has = (field) => Object.hasOwn(body, field);

  const serviceTypeRequired = !partial || has('service_type');
  if (serviceTypeRequired) {
    const type = toText(body.service_type)?.toLowerCase();
    if (!type) errors.push('Поле «service_type» (тип услуги) обязательно');
    else if (!SERVICE_TYPES.includes(type)) {
      errors.push(`Поле «service_type» должно быть «${SERVICE_TYPES.join('» или «')}»`);
    } else {
      values.service_type = type;
    }
  }

  if (!partial || has('service_name')) {
    const name = toText(body.service_name);
    if (!name) errors.push('Поле «service_name» (наименование услуги) обязательно');
    else values.service_name = name;
  }

  if (has('duration_text')) {
    const text = toText(body.duration_text);
    if (text && text.length > 50) errors.push('Поле «duration_text» не длиннее 50 символов');
    else values.duration_text = text;
  } else if (!partial && values.service_type === 'consultation') {
    errors.push('Для консультации обязательно поле «duration_text» (например, «до 40»)');
  }

  if (has('duration_min')) {
    collect(toNumber(body.duration_min, 'duration_min', { integer: true }), 'duration_min', errors, values);
  } else if (!partial && values.service_type === 'surgery') {
    errors.push('Для операции обязательно поле «duration_min» (длительность в минутах)');
  }

  if (has('price_rub')) {
    collect(toNumber(body.price_rub, 'price_rub'), 'price_rub', errors, values);
  } else if (!partial && values.service_type === 'consultation') {
    errors.push('Для консультации обязательно поле «price_rub»');
  }

  for (const field of CATEGORY_FIELDS) {
    if (has(field)) collect(toNumber(body[field], field), field, errors, values);
  }

  const serviceType = values.service_type ?? (partial ? null : undefined);
  if (!partial) {
    const hasPrice =
      values.price_rub !== null && values.price_rub !== undefined
        ? true
        : CATEGORY_FIELDS.some((field) => values[field] !== null && values[field] !== undefined);

    if (serviceType === 'consultation' && !hasPrice) {
      errors.push('Для консультации обязательно поле «price_rub»');
    }
    if (serviceType === 'surgery' && !hasPrice) {
      errors.push('Для операции обязательна хотя бы одна цена по категории сложности');
    }
  }

  normalizeForType(values, serviceType);

  return { errors, values };
}

function serialize(row) {
  if (!row) return null;
  const result = { ...row };
  for (const field of ['price_rub', ...CATEGORY_FIELDS]) {
    result[field] = row[field] === null ? null : Number(row[field]);
  }
  result.duration_min = row.duration_min === null ? null : Number(row.duration_min);
  return result;
}

function sendDbError(res, err, fallbackMessage) {
  const status = DB_ERROR_STATUS[err?.code];
  if (!status) {
    console.error(fallbackMessage, err);
    return res.status(500).json({ success: false, message: `${fallbackMessage}: ${err.message}` });
  }

  const message =
    err.code === 23505
      ? 'Запись с таким кодом номенклатуры и кодом МИС уже существует'
      : err.message;

  return res.status(status).json({ success: false, message });
}

function readKeys(req, res) {
  const nomenclature = toCode(req.params.codeNomenclature, 'codeNomenclature');
  const mis = toCode(req.params.codeMis, 'codeMis');

  if (nomenclature.error || mis.error) {
    res.status(400).json({ success: false, message: nomenclature.error ?? mis.error });
    return null;
  }

  return { nomenclature: nomenclature.value, mis: mis.value };
}

class PostgreSQL {
  // GET /priceYslyga, GET /admin/priceYslyga
  static async getPriceYslyga(req, res) {
    try {
      const params = [];
      const conditions = [];

      const add = (sql, value) => {
        params.push(value);
        conditions.push(sql.replace('?', `$${params.length}`));
      };

      const { serviceType, codeNomenclature, search } = req.query;

      if (serviceType) add('service_type = ?', String(serviceType).trim().toLowerCase());
      if (codeNomenclature) add('code_nomenclature = ?', String(codeNomenclature).trim());

      if (search) {
        const pattern = `%${String(search).trim()}%`;
        params.push(pattern);
        const n = `$${params.length}`;
        conditions.push(
          `(service_name ILIKE ${n} OR code_mis ILIKE ${n} OR code_nomenclature ILIKE ${n})`,
        );
      }

      const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
      const query = `SELECT * FROM ${TABLE}${where} ORDER BY service_type ASC, code_mis ASC`;

      const result = await pool.query(query, params);

      res.status(200).json({
        success: true,
        count: result.rowCount,
        data: result.rows.map(serialize),
      });
    } catch (err) {
      console.error('Ошибка при чтении услуг:', err);
      res.status(500).json({
        success: false,
        message: 'Ошибка сервера при чтении данных: ' + err.message,
      });
    }
  }

  // GET /priceYslyga/:codeNomenclature/:codeMis
  static async getOnePriceYslyga(req, res) {
    try {
      const keys = readKeys(req, res);
      if (!keys) return;

      const result = await pool.query(
        `SELECT * FROM ${TABLE} WHERE code_nomenclature = $1 AND code_mis = $2`,
        [keys.nomenclature, keys.mis],
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'Запись не найдена' });
      }

      res.status(200).json({ success: true, data: serialize(result.rows[0]) });
    } catch (err) {
      console.error('Ошибка при чтении услуги:', err);
      res.status(500).json({
        success: false,
        message: 'Ошибка сервера при чтении данных: ' + err.message,
      });
    }
  }

  // POST /admin/priceYslyga
  static async addPriceYslyga(req, res) {
    try {
      const body = req.body ?? {};
      const { errors, values } = parse(body, { partial: false });

      if (errors.length > 0) {
        return res.status(400).json({ success: false, message: errors.join('; ') });
      }

      const nomenclature = toCode(body.code_nomenclature, 'code_nomenclature');
      const mis = toCode(body.code_mis, 'code_mis');
      if (nomenclature.error || mis.error) {
        return res.status(400).json({ success: false, message: nomenclature.error ?? mis.error });
      }

      const result = await pool.query(
        `INSERT INTO ${TABLE} (code_nomenclature, code_mis, service_name, service_type,
           duration_text, duration_min, price_rub, price_category_i, price_category_ii, price_category_iii)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          nomenclature.value,
          mis.value,
          values.service_name,
          values.service_type,
          values.duration_text ?? null,
          values.duration_min ?? null,
          values.price_rub ?? null,
          values.price_category_i ?? null,
          values.price_category_ii ?? null,
          values.price_category_iii ?? null,
        ],
      );

      res.status(201).json({
        success: true,
        message: 'Услуга успешно добавлена',
        data: serialize(result.rows[0]),
      });
    } catch (err) {
      sendDbError(res, err, 'Ошибка при добавлении услуги');
    }
  }

  // PUT /admin/priceYslyga/:codeNomenclature/:codeMis
  static async updatePriceYslyga(req, res) {
    try {
      const keys = readKeys(req, res);
      if (!keys) return;

      const body = req.body ?? {};
      const { errors, values } = parse(body, { partial: false });

      if (errors.length > 0) {
        return res.status(400).json({ success: false, message: errors.join('; ') });
      }

      const result = await pool.query(
        `UPDATE ${TABLE}
         SET service_name = $1, service_type = $2, duration_text = $3, duration_min = $4,
             price_rub = $5, price_category_i = $6, price_category_ii = $7, price_category_iii = $8
         WHERE code_nomenclature = $9 AND code_mis = $10
         RETURNING *`,
        [
          values.service_name,
          values.service_type,
          values.duration_text ?? null,
          values.duration_min ?? null,
          values.price_rub ?? null,
          values.price_category_i ?? null,
          values.price_category_ii ?? null,
          values.price_category_iii ?? null,
          keys.nomenclature,
          keys.mis,
        ],
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'Запись не найдена' });
      }

      res.status(200).json({
        success: true,
        message: 'Услуга успешно обновлена',
        data: serialize(result.rows[0]),
      });
    } catch (err) {
      sendDbError(res, err, 'Ошибка при обновлении услуги');
    }
  }

  // PATCH /admin/priceYslyga/:codeNomenclature/:codeMis
  static async patchPriceYslyga(req, res) {
    try {
      const keys = readKeys(req, res);
      if (!keys) return;

      const body = req.body ?? {};
      const { errors, values } = parse(body, { partial: true });

      const present = EDITABLE_FIELDS.filter((field) => Object.hasOwn(values, field));

      if (present.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Не передано ни одного поля для изменения',
        });
      }

      if (errors.length > 0) {
        return res.status(400).json({ success: false, message: errors.join('; ') });
      }

      const setParts = present.map((field, index) => `${field} = $${index + 1}`);

      const valuesList = present.map((field) => values[field]);
      valuesList.push(keys.nomenclature, keys.mis);

      const query =
        `UPDATE ${TABLE} SET ${setParts.join(', ')} ` +
        `WHERE code_nomenclature = $${valuesList.length - 1} AND code_mis = $${valuesList.length} RETURNING *`;

      const result = await pool.query(query, valuesList);

      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'Запись не найдена' });
      }

      res.status(200).json({
        success: true,
        message: 'Услуга успешно обновлена',
        data: serialize(result.rows[0]),
      });
    } catch (err) {
      sendDbError(res, err, 'Ошибка при обновлении услуги');
    }
  }

  // DELETE /admin/priceYslyga/:codeNomenclature/:codeMis
  static async deletePriceYslyga(req, res) {
    try {
      const keys = readKeys(req, res);
      if (!keys) return;

      const result = await pool.query(
        `DELETE FROM ${TABLE} WHERE code_nomenclature = $1 AND code_mis = $2 RETURNING *`,
        [keys.nomenclature, keys.mis],
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'Запись не найдена' });
      }

      res.status(200).json({
        success: true,
        message: 'Услуга успешно удалена',
        data: serialize(result.rows[0]),
      });
    } catch (err) {
      sendDbError(res, err, 'Ошибка при удалении услуги');
    }
  }
}

module.exports = PostgreSQL;