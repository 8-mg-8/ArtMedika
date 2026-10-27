const pool = require('../db/pool');

const DB_ERROR_STATUS = {
  '23505': 409, // unique_violation
  '23503': 400, // foreign_key_violation
  '23514': 400, // check_violation
  '22P02': 400, // invalid_text_representation
  '22001': 400, // string_data_right_truncation
  '22003': 400, // numeric_value_out_of_range
};

function fail(res, status, message, extra = {}) {
  return res.status(status).json({ success: false, message, ...extra });
}

function ok(res, data, extra = {}) {
  return res.status(200).json({ success: true, data, ...extra });
}

function created(res, data, extra = {}) {
  return res.status(201).json({ success: true, data, ...extra });
}

function notFound(res, message = 'Запись не найдена') {
  return fail(res, 404, message);
}

function badRequest(res, message) {
  return fail(res, 400, message);
}

function serverError(res, err, fallback) {
  console.error(fallback, err);
  return fail(res, 500, `${fallback}: ${err.message}`);
}

function sendDbError(res, err, fallback) {
  const status = DB_ERROR_STATUS[err?.code];
  if (!status) return serverError(res, err, fallback);

  let message = err.message;
  if (err.code === '23505') message = 'Запись с такими уникальными полями уже существует';
  if (err.code === '23503') message = 'Указан несуществующий родительский объект или есть связанные записи';
  if (err.code === '23514') message = 'Значение поля нарушает ограничение базы данных';

  return fail(res, status, message);
}

function coerceValue(field, raw) {
  if (raw === undefined) return { skip: true };

  const label = field.label || field.name;

  if (raw === null) {
    if (field.required) return { error: `Поле «${label}» обязательно` };
    return { value: null };
  }

  if (field.type === 'text') {
    const text = typeof raw === 'string' ? raw.trim() : String(raw).trim();
    if (text === '') {
      if (field.required) return { error: `Поле «${label}» обязательно` };
      return { value: null };
    }
    if (field.max && text.length > field.max) {
      return { error: `Поле «${label}» не длиннее ${field.max} символов` };
    }
    return { value: text };
  }

  if (field.type === 'int' || field.type === 'number') {
    if (raw === '') {
      if (field.required) return { error: `Поле «${label}» обязательно` };
      return { value: null };
    }
    if (typeof raw === 'boolean') return { error: `Поле «${label}» должно быть числом` };

    const text = String(raw).trim().replace(/\s/g, '').replace(',', '.');
    const parsed = Number(text);

    if (!Number.isFinite(parsed)) return { error: `Поле «${label}» должно быть числом` };
    if (field.type === 'int' && !Number.isInteger(parsed)) {
      return { error: `Поле «${label}» должно быть целым числом` };
    }
    if (field.min !== undefined && parsed < field.min) {
      return { error: `Поле «${label}» не может быть меньше ${field.min}` };
    }
    if (field.max !== undefined && parsed > field.max) {
      return { error: `Поле «${label}» не может быть больше ${field.max}` };
    }
    return { value: parsed };
  }

  if (field.type === 'bool') {
    if (typeof raw === 'boolean') return { value: raw };
    if (raw === 'true' || raw === 1 || raw === '1') return { value: true };
    if (raw === 'false' || raw === 0 || raw === '0') return { value: false };
    return { error: `Поле «${label}» должно быть true/false или 1/0` };
  }

  if (field.type === 'date') {
    const text = String(raw).trim();
    if (text === '') {
      if (field.required) return { error: `Поле «${label}» обязательно` };
      return { value: null };
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return { error: `Поле «${label}» должно быть датой в формате ГГГГ-ММ-ДД` };
    }
    return { value: text };
  }

  if (field.type === 'year') {
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < 1900 || parsed > 2100) {
      return { error: `Поле «${label}» должно быть годом (1900-2100)` };
    }
    return { value: parsed };
  }

  if (field.type === 'json') {
    if (raw === null || raw === '') {
      if (field.required) return { error: `Поле «${label}» обязательно` };
      return { value: null };
    }
    if (typeof raw === 'object') return { value: raw };
    const text = String(raw).trim();
    try {
      return { value: JSON.parse(text) };
    } catch {
      return { error: `Поле «${label}» должно быть корректным JSON` };
    }
  }

  return { error: `Неизвестный тип поля «${label}»` };
}

function parseFields(body, fields, { partial }) {
  const errors = [];
  const values = {};

  for (const field of fields) {
    const present = Object.prototype.hasOwnProperty.call(body, field.name);

    if (!present) {
      if (partial) continue;
      if (field.required && field.default === undefined) {
        errors.push(`Поле «${field.label || field.name}» обязательно`);
      } else if (field.default !== undefined) {
        values[field.name] = field.default;
      }
      continue;
    }

    const result = coerceValue(field, body[field.name]);
    if (result.skip) continue;
    if (result.error) errors.push(result.error);
    else values[field.name] = result.value;
  }

  return { errors, values };
}

function idParam(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    badRequest(res, 'Некорректный id записи');
    return null;
  }
  return id;
}

function parentIdParam(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    badRequest(res, 'Некорректный id родительской записи');
    return null;
  }
  return id;
}

function readQueryFilters(req, fields, { searchFields = [] } = {}) {
  const params = [];
  const conditions = [];

  const addCondition = (sql, value) => {
    params.push(value);
    conditions.push(sql.replace('?', `$${params.length}`));
  };

  for (const field of fields) {
    const raw = req.query[field.name];
    if (raw === undefined || raw === '') continue;
    if (field.type === 'bool') {
      addCondition(`${field.name} = ?`, raw === 'true' || raw === '1' || raw === true);
    } else {
      addCondition(`${field.name} = ?`, String(raw).trim());
    }
  }

  const search = String(req.query.search || '').trim();
  if (search && searchFields.length > 0) {
    const pattern = `%${search}%`;
    params.push(pattern);
    const n = `$${params.length}`;
    conditions.push(`(${searchFields.map((field) => `${field} ILIKE ${n}`).join(' OR ')})`);
  }

  return { params, conditions };
}

function readPagination(req, { defaultLimit = 200, maxLimit = 500 } = {}) {
  let limit = Number.parseInt(req.query.limit, 10);
  let offset = Number.parseInt(req.query.offset, 10);

  if (!Number.isInteger(limit) || limit <= 0) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;
  if (!Number.isInteger(offset) || offset < 0) offset = 0;

  return { limit, offset };
}

function slugify(text) {
  const map = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
    х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };

  return String(text || '')
    .toLowerCase()
    .split('')
    .map((char) => (map[char] !== undefined ? map[char] : char))
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

async function uniqueSlug(table, base, excludeId = null) {
  const root = base || 'item';
  let candidate = root;
  let counter = 1;

  for (;;) {
    const params = [candidate];
    let sql = `SELECT id FROM ${table} WHERE slug = $1`;
    if (excludeId) {
      params.push(excludeId);
      sql += ` AND id <> $2`;
    }

    const { rows } = await pool.query(sql, params);
    if (rows.length === 0) return candidate;

    counter += 1;
    candidate = `${root}-${counter}`;
  }
}

function serializeRow(row) {
  if (!row) return null;
  return { ...row };
}

function resolveSort(sortOptions, sortKey, fallbackOrderBy) {
  const options = Array.isArray(sortOptions) ? sortOptions : [];
  const found = options.find((option) => option.key === sortKey);
  if (found && found.orderBy) return { orderBy: found.orderBy, key: found.key };
  return { orderBy: fallbackOrderBy, key: null };
}

function sortOptionsMeta(sortOptions) {
  const options = Array.isArray(sortOptions) ? sortOptions : [];
  return options.map((option) => ({ key: option.key, label: option.label }));
}

function createCrud({
  table,
  fields,
  publicColumns = '*',
  orderBy = 'id DESC',
  publicOrderBy = null,
  searchFields = [],
  listFilterFields = null,
  sortOptions = [],
  beforeCreate = null,
  beforeUpdate = null,
}) {
  const fieldNames = fields.map((field) => field.name);
  const filterFields = listFilterFields || fields.filter((field) => field.type !== 'json');
  const adminOrderBy = publicOrderBy || orderBy;

  class CrudController {
    static async list(req, res) {
      try {
        const { params, conditions } = readQueryFilters(req, filterFields, { searchFields });
        const { limit, offset } = readPagination(req);
        const sort = resolveSort(sortOptions, req.query.sort, adminOrderBy);

        const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
        const total = await pool.query(`SELECT COUNT(*) AS total FROM ${table}${where}`, params);

        params.push(limit, offset);
        const rows = await pool.query(
          `SELECT ${publicColumns} FROM ${table}${where} ORDER BY ${sort.orderBy} LIMIT $${params.length - 1} OFFSET $${params.length}`,
          params,
        );

        ok(res, rows.rows.map(serializeRow), {
          count: Number(total.rows[0].total),
          limit,
          offset,
          sort: sort.key,
          sort_options: sortOptionsMeta(sortOptions),
        });
      } catch (err) {
        serverError(res, err, `Ошибка при чтении списка «${table}»`);
      }
    }

    static async getOne(req, res) {
      try {
        const id = idParam(req, res);
        if (id === null) return;

        const { rows } = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
        if (rows.length === 0) return notFound(res);

        ok(res, serializeRow(rows[0]));
      } catch (err) {
        serverError(res, err, `Ошибка при чтении записи «${table}»`);
      }
    }

    static async create(req, res) {
      try {
        const body = req.body ?? {};
        const { errors, values } = parseFields(body, fields, { partial: false });
        if (errors.length > 0) return badRequest(res, errors.join('; '));

        if (beforeCreate) {
          const extra = await beforeCreate(values, body);
          if (extra && extra.error) return badRequest(res, extra.error);
          if (extra && extra.values) Object.assign(values, extra.values);
        }

        const names = Object.keys(values);
        if (names.length === 0) return badRequest(res, 'Нет полей для создания');

        const placeholders = names.map((_, index) => `$${index + 1}`).join(', ');
        const { rows } = await pool.query(
          `INSERT INTO ${table} (${names.join(', ')}) VALUES (${placeholders}) RETURNING *`,
          names.map((name) => values[name]),
        );

        created(res, serializeRow(rows[0]));
      } catch (err) {
        sendDbError(res, err, `Ошибка при создании записи «${table}»`);
      }
    }

    static async update(req, res) {
      try {
        const id = idParam(req, res);
        if (id === null) return;

        const body = req.body ?? {};
        const { errors, values } = parseFields(body, fields, { partial: false });
        if (errors.length > 0) return badRequest(res, errors.join('; '));

        if (beforeUpdate) {
          const extra = await beforeUpdate(values, body, id);
          if (extra && extra.error) return badRequest(res, extra.error);
          if (extra && extra.values) Object.assign(values, extra.values);
        }

        const names = Object.keys(values).filter((name) => fieldNames.includes(name));
        if (names.length === 0) return badRequest(res, 'Нет полей для обновления');

        const setParts = names.map((name, index) => `${name} = $${index + 1}`);
        const params = names.map((name) => values[name]);
        params.push(id);

        const { rows } = await pool.query(
          `UPDATE ${table} SET ${setParts.join(', ')} WHERE id = $${params.length} RETURNING *`,
          params,
        );

        if (rows.length === 0) return notFound(res);
        ok(res, serializeRow(rows[0]));
      } catch (err) {
        sendDbError(res, err, `Ошибка при обновлении записи «${table}»`);
      }
    }

    static async patch(req, res) {
      try {
        const id = idParam(req, res);
        if (id === null) return;

        const body = req.body ?? {};
        const { errors, values } = parseFields(body, fields, { partial: true });
        if (errors.length > 0) return badRequest(res, errors.join('; '));

        const names = Object.keys(values).filter((name) => fieldNames.includes(name));
        if (names.length === 0) {
          return badRequest(res, 'Не передано ни одного поля для изменения');
        }

        const setParts = names.map((name, index) => `${name} = $${index + 1}`);
        const params = names.map((name) => values[name]);
        params.push(id);

        const { rows } = await pool.query(
          `UPDATE ${table} SET ${setParts.join(', ')} WHERE id = $${params.length} RETURNING *`,
          params,
        );

        if (rows.length === 0) return notFound(res);
        ok(res, serializeRow(rows[0]));
      } catch (err) {
        sendDbError(res, err, `Ошибка при обновлении записи «${table}»`);
      }
    }

    static async remove(req, res) {
      try {
        const id = idParam(req, res);
        if (id === null) return;

        const { rows } = await pool.query(`DELETE FROM ${table} WHERE id = $1 RETURNING *`, [id]);
        if (rows.length === 0) return notFound(res);

        ok(res, serializeRow(rows[0]), { message: 'Запись удалена' });
      } catch (err) {
        sendDbError(res, err, `Ошибка при удалении записи «${table}»`);
      }
    }
  }

  return CrudController;
}

function createChildCrud({
  table,
  parentField,
  fields,
  orderBy = 'sort_order, id',
  listColumns = '*',
  sortOptions = [],
}) {
  const fieldNames = fields.map((field) => field.name);

  class ChildCrudController {
    static async listChildren(parentId, order) {
      const { rows } = await pool.query(
        `SELECT ${listColumns} FROM ${table} WHERE ${parentField} = $1 ORDER BY ${order || orderBy}`,
        [parentId],
      );
      return rows.map(serializeRow);
    }

    static async list(req, res) {
      try {
        const parentId = parentIdParam(req, res);
        if (parentId === null) return;

        const sort = resolveSort(sortOptions, req.query.sort, orderBy);
        const items = await ChildCrudController.listChildren(parentId, sort.orderBy);
        ok(res, items, {
          count: items.length,
          sort: sort.key,
          sort_options: sortOptionsMeta(sortOptions),
        });
      } catch (err) {
        serverError(res, err, `Ошибка при чтении списка «${table}»`);
      }
    }

    static async getOne(req, res) {
      try {
        const id = idParam(req, res);
        if (id === null) return;

        const { rows } = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
        if (rows.length === 0) return notFound(res);

        ok(res, serializeRow(rows[0]));
      } catch (err) {
        serverError(res, err, `Ошибка при чтении записи «${table}»`);
      }
    }

    static async create(req, res) {
      try {
        const parentId = parentIdParam(req, res);
        if (parentId === null) return;

        const body = req.body ?? {};
        const { errors, values } = parseFields(body, fields, { partial: false });
        if (errors.length > 0) return badRequest(res, errors.join('; '));

        const record = { [parentField]: parentId, ...values };
        const names = Object.keys(record);
        const placeholders = names.map((_, index) => `$${index + 1}`).join(', ');

        const { rows } = await pool.query(
          `INSERT INTO ${table} (${names.join(', ')}) VALUES (${placeholders}) RETURNING *`,
          names.map((name) => record[name]),
        );

        created(res, serializeRow(rows[0]));
      } catch (err) {
        sendDbError(res, err, `Ошибка при создании записи «${table}»`);
      }
    }

    static async update(req, res) {
      try {
        const id = idParam(req, res);
        if (id === null) return;

        const body = req.body ?? {};
        const { errors, values } = parseFields(body, fields, { partial: false });
        if (errors.length > 0) return badRequest(res, errors.join('; '));

        const names = Object.keys(values).filter((name) => fieldNames.includes(name));
        if (names.length === 0) return badRequest(res, 'Нет полей для обновления');

        const setParts = names.map((name, index) => `${name} = $${index + 1}`);
        const params = names.map((name) => values[name]);
        params.push(id);

        const { rows } = await pool.query(
          `UPDATE ${table} SET ${setParts.join(', ')} WHERE id = $${params.length} RETURNING *`,
          params,
        );

        if (rows.length === 0) return notFound(res);
        ok(res, serializeRow(rows[0]));
      } catch (err) {
        sendDbError(res, err, `Ошибка при обновлении записи «${table}»`);
      }
    }

    static async patch(req, res) {
      try {
        const id = idParam(req, res);
        if (id === null) return;

        const body = req.body ?? {};
        const { errors, values } = parseFields(body, fields, { partial: true });
        if (errors.length > 0) return badRequest(res, errors.join('; '));

        const names = Object.keys(values).filter((name) => fieldNames.includes(name));
        if (names.length === 0) {
          return badRequest(res, 'Не передано ни одного поля для изменения');
        }

        const setParts = names.map((name, index) => `${name} = $${index + 1}`);
        const params = names.map((name) => values[name]);
        params.push(id);

        const { rows } = await pool.query(
          `UPDATE ${table} SET ${setParts.join(', ')} WHERE id = $${params.length} RETURNING *`,
          params,
        );

        if (rows.length === 0) return notFound(res);
        ok(res, serializeRow(rows[0]));
      } catch (err) {
        sendDbError(res, err, `Ошибка при обновлении записи «${table}»`);
      }
    }

    static async remove(req, res) {
      try {
        const id = idParam(req, res);
        if (id === null) return;

        const { rows } = await pool.query(`DELETE FROM ${table} WHERE id = $1 RETURNING *`, [id]);
        if (rows.length === 0) return notFound(res);

        ok(res, serializeRow(rows[0]), { message: 'Запись удалена' });
      } catch (err) {
        sendDbError(res, err, `Ошибка при удалении записи «${table}»`);
      }
    }
  }

  return ChildCrudController;
}

module.exports = {
  pool,
  ok,
  created,
  fail,
  notFound,
  badRequest,
  serverError,
  sendDbError,
  coerceValue,
  parseFields,
  serializeRow,
  idParam,
  parentIdParam,
  readPagination,
  slugify,
  uniqueSlug,
  createCrud,
  createChildCrud,
};
