const pool = require('../db/pool');
const { ok, notFound, serverError, badRequest, serializeRow } = require('./utils');

async function childrenByParent(table, parentColumn, parentId, orderBy = 'sort_order, id') {
  const { rows } = await pool.query(
    `SELECT * FROM ${table} WHERE ${parentColumn} = $1 ORDER BY ${orderBy}`,
    [parentId],
  );
  return rows.map(serializeRow);
}

class PublicController {
  // GET /projects/:slug — полная карточка проекта со всеми вложенными данными
  static async getProjectBySlug(req, res) {
    try {
      const slug = String(req.params.slug || '').trim();
      if (!slug) return badRequest(res, 'Не передан slug проекта');

      const { rows } = await pool.query(
        `SELECT * FROM projects WHERE slug = $1 AND is_active = true`,
        [slug],
      );
      if (rows.length === 0) return notFound(res, 'Проект не найден');

      const project = serializeRow(rows[0]);

      const [partners, stages, gallery, team] = await Promise.all([
        childrenByParent('project_partners', 'project_id', project.id),
        childrenByParent('project_stages', 'project_id', project.id),
        childrenByParent('project_gallery', 'project_id', project.id),
        childrenByParent('project_team', 'project_id', project.id),
      ]);

      ok(res, { ...project, partners, stages, gallery, team });
    } catch (err) {
      serverError(res, err, 'Ошибка при чтении проекта');
    }
  }

  // GET /specialists/:slug — полная карточка специалиста со всеми вложенными данными
  static async getSpecialistBySlug(req, res) {
    try {
      const slug = String(req.params.slug || '').trim();
      if (!slug) return badRequest(res, 'Не передан slug специалиста');

      const { rows } = await pool.query(
        `SELECT * FROM specialists WHERE slug = $1 AND is_active = true`,
        [slug],
      );
      if (rows.length === 0) return notFound(res, 'Специалист не найден');

      const specialist = serializeRow(rows[0]);

      const [directions, education, certifications, photos, reviews, achievements, servicesResult] =
        await Promise.all([
          childrenByParent('specialist_directions', 'specialist_id', specialist.id),
          childrenByParent('specialist_education', 'specialist_id', specialist.id),
          childrenByParent('specialist_certifications', 'specialist_id', specialist.id, 'expiry_date DESC'),
          childrenByParent('specialist_photos', 'specialist_id', specialist.id),
          childrenByParent('specialist_reviews', 'specialist_id', specialist.id, 'review_date DESC'),
          childrenByParent('specialist_achievements', 'specialist_id', specialist.id),
          pool.query(
            `SELECT ss.id, ss.service_id, ss.is_primary, ss.sort_order, ss.is_active,
                    s.service_name, s.category, s.subcategory
             FROM specialist_services ss
             LEFT JOIN services s ON s.id = ss.service_id
             WHERE ss.specialist_id = $1
             ORDER BY ss.sort_order, ss.id`,
            [specialist.id],
          ),
        ]);

      const services = servicesResult.rows.map(serializeRow);
      const reviewsCount = reviews.length;
      const avgRating = reviewsCount
        ? Math.round((reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviewsCount) * 100) / 100
        : null;

      ok(res, {
        ...specialist,
        directions,
        education,
        certifications,
        photos,
        reviews,
        achievements_list: achievements,
        services,
        reviews_count: reviewsCount,
        avg_rating: avgRating,
      });
    } catch (err) {
      serverError(res, err, 'Ошибка при чтении специалиста');
    }
  }

  // GET /news/:slug — новость + инкремент счётчика просмотров
  static async getNewsBySlug(req, res) {
    try {
      const slug = String(req.params.slug || '').trim();
      if (!slug) return badRequest(res, 'Не передан slug новости');

      const { rows } = await pool.query(
        `UPDATE news SET views_count = views_count + 1
         WHERE slug = $1 AND is_active = true
         RETURNING *`,
        [slug],
      );
      if (rows.length === 0) return notFound(res, 'Новость не найдена');

      ok(res, serializeRow(rows[0]));
    } catch (err) {
      serverError(res, err, 'Ошибка при чтении новости');
    }
  }

  // GET /promotions/active — акции, действующие на текущую дату
  static async getActivePromotions(req, res) {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM promotions
         WHERE is_active = true
           AND (start_date IS NULL OR start_date <= CURRENT_DATE)
           AND (end_date IS NULL OR end_date >= CURRENT_DATE)
         ORDER BY start_date DESC, sort_order ASC, id DESC`,
      );

      ok(res, rows.map(serializeRow), { count: rows.length });
    } catch (err) {
      serverError(res, err, 'Ошибка при чтении акций');
    }
  }

  // GET /serviceCategories/tree — дерево категорий услуг
  static async getServiceCategoriesTree(req, res) {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM service_categories WHERE is_active = true ORDER BY sort_order ASC, id ASC`,
      );

      const items = rows.map(serializeRow);
      const byParent = new Map();

      for (const item of items) {
        const key = item.parent_id ?? null;
        if (!byParent.has(key)) byParent.set(key, []);
        byParent.get(key).push(item);
      }

      const build = (parentId) =>
        (byParent.get(parentId) ?? []).map((item) => ({
          ...item,
          children: build(item.id),
        }));

      ok(res, build(null));
    } catch (err) {
      serverError(res, err, 'Ошибка при чтении категорий услуг');
    }
  }
}

module.exports = PublicController;
