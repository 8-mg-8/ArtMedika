const path = require('path');
const fs = require('fs');
const multer = require('multer');
const pool = require('../db/pool');
const { ok, created, notFound, badRequest, serverError, sendDbError, serializeRow } = require('./utils');

const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');

const FOLDERS = ['services', 'promotions', 'projects', 'news', 'specialists', 'misc'];

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
]);

const TABLES = new Set([
  'service_sections',
  'service_subsections',
  'services',
  'service_problems',
  'service_types',
  'service_results',
  'promotions',
  'projects',
  'project_details',
  'project_seasons',
  'project_participants',
  'project_experts',
  'project_partners',
  'project_work_formats',
  'project_stages',
  'news',
  'specialists',
  'specialist_experience',
  'specialist_operations',
  'specialist_positive_reviews',
  'specialist_services',
  'specialist_education',
  'specialist_accreditations',
  'service_prices',
]);

function sanitizeFolder(raw) {
  const folder = String(raw || 'misc').trim().replace(/^\/+|\/+$/g, '');
  if (!/^[a-z0-9_\/-]+$/i.test(folder) || folder.includes('..')) return null;
  if (!FOLDERS.includes(folder.split('/')[0].toLowerCase())) return null;
  return folder;
}

const storage = multer.diskStorage({
  destination(req, file, callback) {
    const folder = sanitizeFolder(req.query.folder);
    if (!folder) {
      return callback(new Error('Некорректная папка. Допустимые: ' + FOLDERS.join(', ')));
    }

    const target = path.join(UPLOADS_ROOT, folder);
    fs.mkdirSync(target, { recursive: true });
    callback(null, target);
  },
  filename(req, file, callback) {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '');
    const base = path
      .basename(file.originalname, path.extname(file.originalname))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80);

    const name = `${Date.now()}_${base || 'file'}${ext}`;
    callback(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, callback) {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return callback(new Error('Допустимы только изображения (jpg, png, webp, gif, svg) и PDF'));
    }
    callback(null, true);
  },
}).single('file');

class UploadController {
  // POST /admin/upload?folder=services[&table=services&record_id=1]
  static async uploadFile(req, res) {
    upload(req, res, async (err) => {
      if (err) return badRequest(res, err.message);
      if (!req.file) return badRequest(res, 'Файл не получен (поле формы: file)');

      const folder = sanitizeFolder(req.query.folder) || 'misc';
      const table = req.query.table ? String(req.query.table) : null;
      const recordId = req.query.record_id ? Number(req.query.record_id) : null;

      if (table && !TABLES.has(table)) {
        return badRequest(res, 'Недопустимое значение table. Допустимые: ' + [...TABLES].join(', '));
      }
      if (recordId !== null && (!Number.isInteger(recordId) || recordId <= 0)) {
        return badRequest(res, 'Некорректный record_id');
      }

      const filePath = `uploads/${folder}/${req.file.filename}`;

      try {
        const { rows } = await pool.query(
          `INSERT INTO uploads (original_filename, stored_filename, file_path, file_size, mime_type, table_name, record_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [
            req.file.originalname,
            req.file.filename,
            filePath,
            req.file.size,
            req.file.mimetype,
            table,
            recordId,
          ],
        );

        created(res, {
          ...serializeRow(rows[0]),
          url: `/${filePath}`,
        });
      } catch (dbErr) {
        sendDbError(res, dbErr, 'Ошибка при сохранении информации о файле');
      }
    });
  }

  // GET /admin/uploads?table=&record_id=&limit=&offset=
  static async list(req, res) {
    try {
      const params = [];
      const conditions = [];

      if (req.query.table) {
        params.push(String(req.query.table));
        conditions.push(`table_name = $${params.length}`);
      }
      if (req.query.record_id) {
        params.push(Number(req.query.record_id));
        conditions.push(`record_id = $${params.length}`);
      }

      let limit = Number.parseInt(req.query.limit, 10);
      let offset = Number.parseInt(req.query.offset, 10);
      if (!Number.isInteger(limit) || limit <= 0 || limit > 500) limit = 200;
      if (!Number.isInteger(offset) || offset < 0) offset = 0;

      const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';

      const total = await pool.query(`SELECT COUNT(*) AS total FROM uploads${where}`, params);

      params.push(limit, offset);
      const { rows } = await pool.query(
        `SELECT * FROM uploads${where} ORDER BY uploaded_at DESC, id DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params,
      );

      ok(
        res,
        rows.map((row) => ({ ...serializeRow(row), url: `/${row.file_path}` })),
        { count: Number(total.rows[0].total), limit, offset },
      );
    } catch (err) {
      serverError(res, err, 'Ошибка при чтении списка файлов');
    }
  }

  // DELETE /admin/uploads/:id — удаляет запись и файл с диска
  static async remove(req, res) {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) return badRequest(res, 'Некорректный id файла');

      const { rows } = await pool.query(`DELETE FROM uploads WHERE id = $1 RETURNING *`, [id]);
      if (rows.length === 0) return notFound(res, 'Файл не найден');

      const record = rows[0];
      const absolute = path.join(path.dirname(UPLOADS_ROOT), record.file_path);

      if (absolute.startsWith(UPLOADS_ROOT) && fs.existsSync(absolute)) {
        fs.unlinkSync(absolute);
      }

      ok(res, serializeRow(record), { message: 'Файл удалён' });
    } catch (err) {
      serverError(res, err, 'Ошибка при удалении файла');
    }
  }
}

module.exports = UploadController;
