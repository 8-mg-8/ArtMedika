const pool = require('../db/pool');
const { ok, notFound, serverError, badRequest, serializeRow } = require('./utils');

async function childrenByParent(table, parentColumn, parentId, orderBy = 'sort_order, id') {
  const { rows } = await pool.query(
    `SELECT * FROM ${table} WHERE ${parentColumn} = $1 ORDER BY ${orderBy}`,
    [parentId],
  );
  return rows.map(serializeRow);
}

async function loadServiceCard(service) {
  const [problems, types, results, specialistsResult] = await Promise.all([
    childrenByParent('service_problems', 'service_id', service.id, 'id'),
    childrenByParent('service_types', 'service_id', service.id),
    childrenByParent('service_results', 'service_id', service.id),
    pool.query(
      `SELECT ss.id, ss.specialist_id, ss.is_primary, ss.sort_order,
              sp.full_name, sp.position, sp.photo_path, sp.slug
       FROM specialist_services ss
       JOIN specialists sp ON sp.id = ss.specialist_id
       WHERE ss.service_id = $1 AND ss.is_active = true AND sp.is_active = true
       ORDER BY ss.sort_order, ss.id`,
      [service.id],
    ),
  ]);

  const breadcrumbs = [];
  if (service.section_id) {
    breadcrumbs.push({ id: service.section_id, name: service.section_name, type: 'section' });
  }
  if (service.subsection_id) {
    breadcrumbs.push({
      id: service.subsection_id,
      name: service.subsection_name,
      type: 'subsection',
    });
  }

  return {
    ...service,
    breadcrumbs,
    problems,
    types,
    results,
    specialists: specialistsResult.rows.map(serializeRow),
  };
}

class PublicController {
  // GET /services/tree — дерево каталога услуг: раздел → подраздел → услуга
  static async getServicesTree(req, res) {
    try {
      const [sectionsResult, subsectionsResult, servicesResult] = await Promise.all([
        pool.query(
          `SELECT * FROM service_sections WHERE is_active = true ORDER BY sort_order ASC, id ASC`,
        ),
        pool.query(
          `SELECT * FROM service_subsections WHERE is_active = true ORDER BY sort_order ASC, id ASC`,
        ),
        pool.query(
          `SELECT * FROM services WHERE is_active = true ORDER BY sort_order ASC, id ASC`,
        ),
      ]);

      const servicesBySubsection = new Map();
      for (const service of servicesResult.rows.map(serializeRow)) {
        if (!servicesBySubsection.has(service.subsection_id)) {
          servicesBySubsection.set(service.subsection_id, []);
        }
        servicesBySubsection.get(service.subsection_id).push(service);
      }

      const subsectionsBySection = new Map();
      for (const subsection of subsectionsResult.rows.map(serializeRow)) {
        if (!subsectionsBySection.has(subsection.section_id)) {
          subsectionsBySection.set(subsection.section_id, []);
        }
        subsectionsBySection.get(subsection.section_id).push({
          ...subsection,
          services: servicesBySubsection.get(subsection.id) ?? [],
        });
      }

      const tree = sectionsResult.rows.map((row) => {
        const section = serializeRow(row);
        return {
          ...section,
          subsections: subsectionsBySection.get(section.id) ?? [],
        };
      });

      ok(res, tree, { count: tree.length });
    } catch (err) {
      serverError(res, err, 'Ошибка при чтении каталога услуг');
    }
  }

  // GET /services/:slug — карточка услуги со всеми связанными данными
  static async getServiceBySlug(req, res) {
    try {
      const slug = String(req.params.slug || '').trim();
      if (!slug) return badRequest(res, 'Не передан slug услуги');

      const { rows } = await pool.query(
        `SELECT s.*, sub.name AS subsection_name, sub.photo_path AS subsection_photo_path,
                sec.id AS section_id, sec.name AS section_name
         FROM services s
         JOIN service_subsections sub ON sub.id = s.subsection_id
         JOIN service_sections sec ON sec.id = sub.section_id
         WHERE s.slug = $1 AND s.is_active = true`,
        [slug],
      );
      if (rows.length === 0) return notFound(res, 'Услуга не найдена');

      ok(res, await loadServiceCard(serializeRow(rows[0])));
    } catch (err) {
      serverError(res, err, 'Ошибка при чтении услуги');
    }
  }

  // GET /services/:id/detail — карточка услуги по id
  static async getServiceDetail(req, res) {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) return badRequest(res, 'Некорректный id услуги');

      const { rows } = await pool.query(
        `SELECT s.*, sub.name AS subsection_name, sub.photo_path AS subsection_photo_path,
                sec.id AS section_id, sec.name AS section_name
         FROM services s
         JOIN service_subsections sub ON sub.id = s.subsection_id
         JOIN service_sections sec ON sec.id = sub.section_id
         WHERE s.id = $1`,
        [id],
      );
      if (rows.length === 0) return notFound(res, 'Услуга не найдена');

      ok(res, await loadServiceCard(serializeRow(rows[0])));
    } catch (err) {
      serverError(res, err, 'Ошибка при чтении услуги');
    }
  }

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

      const [details, seasons, participants, experts, partners, workFormats, stages] =
        await Promise.all([
          childrenByParent('project_details', 'project_id', project.id, 'id ASC'),
          childrenByParent('project_seasons', 'project_id', project.id),
          childrenByParent('project_participants', 'project_id', project.id),
          childrenByParent('project_experts', 'project_id', project.id),
          childrenByParent('project_partners', 'project_id', project.id),
          childrenByParent('project_work_formats', 'project_id', project.id),
          childrenByParent('project_stages', 'project_id', project.id),
        ]);

      const photos = [
        { path: project.photo_path, alt: project.photo_alt, caption: null },
        { path: project.photo_2_path, alt: project.photo_2_alt, caption: null },
        { path: project.photo_3_path, alt: project.photo_3_alt, caption: null },
      ].filter((photo) => photo.path);

      ok(res, {
        ...project,
        details: details[0] || null,
        context_description: details[0]?.context_description ?? null,
        project_description: details[0]?.project_description ?? null,
        seasons,
        participants,
        experts,
        partners,
        work_formats: workFormats,
        stages,
        photos,
      });
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

      const [experience, operations, positiveReviews, education, accreditations, servicesResult] =
        await Promise.all([
          childrenByParent('specialist_experience', 'specialist_id', specialist.id),
          childrenByParent('specialist_operations', 'specialist_id', specialist.id),
          childrenByParent('specialist_positive_reviews', 'specialist_id', specialist.id),
          childrenByParent('specialist_education', 'specialist_id', specialist.id),
          childrenByParent('specialist_accreditations', 'specialist_id', specialist.id, 'expiry_date DESC'),
          pool.query(
            `SELECT ss.id, ss.service_id, ss.is_primary, ss.sort_order,
                    s.name AS name, s.slug, sub.photo_path AS photo_path
             FROM specialist_services ss
             JOIN services s ON s.id = ss.service_id
             LEFT JOIN service_subsections sub ON sub.id = s.subsection_id
             WHERE ss.specialist_id = $1 AND ss.is_active = true AND s.is_active = true
             ORDER BY ss.sort_order, ss.id`,
            [specialist.id],
          ),
        ]);

      ok(res, {
        ...specialist,
        experience,
        operations,
        positive_reviews: positiveReviews,
        education,
        accreditations,
        services: servicesResult.rows.map(serializeRow),
        reviews_count: positiveReviews.length,
      });
    } catch (err) {
      serverError(res, err, 'Ошибка при чтении специалиста');
    }
  }

  // GET /news/:slug — новость
  static async getNewsBySlug(req, res) {
    try {
      const slug = String(req.params.slug || '').trim();
      if (!slug) return badRequest(res, 'Не передан slug новости');

      const { rows } = await pool.query(
        `SELECT * FROM news
         WHERE slug = $1 AND is_active = true`,
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
           AND (promotion_date IS NULL OR promotion_date <= CURRENT_DATE)
         ORDER BY promotion_date DESC, sort_order ASC, id DESC`,
      );

      ok(res, rows.map(serializeRow), { count: rows.length });
    } catch (err) {
      serverError(res, err, 'Ошибка при чтении акций');
    }
  }
}

module.exports = PublicController;
