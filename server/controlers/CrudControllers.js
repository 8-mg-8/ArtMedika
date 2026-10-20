const { createCrud, createChildCrud, uniqueSlug, slugify } = require('./utils');

const COMMON = [
  { name: 'is_active', type: 'bool', default: true },
  { name: 'sort_order', type: 'int', default: 0, min: 0 },
];

// ============================================================
// РАЗДЕЛЫ ПРАЙС-ЛИСТА (price_sections)
// ============================================================

const PriceSectionsCrud = createCrud({
  table: 'price_sections',
  fields: [
    { name: 'section_name', type: 'text', required: true, max: 200, label: 'Название раздела' },
    { name: 'min_price', type: 'number', min: 0, label: 'Минимальная цена раздела' },
    ...COMMON,
  ],
  orderBy: 'sort_order ASC, id ASC',
  searchFields: ['section_name'],
});

// ============================================================
// ЦЕНЫ НА УСЛУГИ (service_prices)
// ============================================================

const PricesCrud = createCrud({
  table: 'service_prices',
  fields: [
    { name: 'section_id', type: 'int', min: 1, label: 'Раздел прайса (id)' },
    { name: 'service_code', type: 'text', max: 50 },
    { name: 'mics_code', type: 'text', max: 20 },
    { name: 'service_name', type: 'text', required: true, max: 500, label: 'Наименование медицинской услуги' },
    { name: 'category', type: 'text', max: 150 },
    { name: 'duration_min', type: 'int', min: 0 },
    { name: 'price_category_1', type: 'number', min: 0, label: 'Цена, категория I' },
    { name: 'price_category_2', type: 'number', min: 0, label: 'Цена, категория II' },
    { name: 'price_category_3', type: 'number', min: 0, label: 'Цена, категория III' },
    { name: 'price_single', type: 'number', min: 0, label: 'Единая цена' },
    { name: 'price_note', type: 'text', max: 255 },
    { name: 'section_name', type: 'text', max: 200, label: 'Раздел прайса (текст)' },
    { name: 'section_min_price', type: 'number', min: 0 },
    ...COMMON,
  ],
  orderBy: 'section_name ASC, sort_order ASC, id ASC',
  searchFields: ['service_name', 'service_code', 'mics_code', 'category'],
  listFilterFields: [
    { name: 'section_id', type: 'int' },
    { name: 'category', type: 'text' },
    { name: 'section_name', type: 'text' },
    { name: 'is_active', type: 'bool' },
  ],
});

// ============================================================
// УСЛУГИ (services) + СПРАВОЧНИК КАТЕГОРИЙ (service_categories)
// ============================================================

const ServicesCrud = createCrud({
  table: 'services',
  fields: [
    { name: 'category_id', type: 'int', min: 1, label: 'Категория (id из справочника)' },
    { name: 'category', type: 'text', required: true, max: 100, label: 'Категория' },
    { name: 'subcategory', type: 'text', required: true, max: 150, label: 'Подкатегория' },
    { name: 'service_name', type: 'text', required: true, max: 255, label: 'Название услуги' },
    { name: 'description', type: 'text', label: 'Описание услуги' },
    { name: 'photo_path', type: 'text', max: 500 },
    { name: 'photo_alt', type: 'text', max: 255 },
    ...COMMON,
  ],
  orderBy: 'category ASC, subcategory ASC, sort_order ASC, id ASC',
  searchFields: ['service_name', 'category', 'subcategory', 'description'],
  listFilterFields: [
    { name: 'category', type: 'text' },
    { name: 'subcategory', type: 'text' },
    { name: 'category_id', type: 'int' },
    { name: 'is_active', type: 'bool' },
  ],
});

const ServiceCategoriesCrud = createCrud({
  table: 'service_categories',
  fields: [
    { name: 'name', type: 'text', required: true, max: 150, label: 'Название категории' },
    { name: 'parent_id', type: 'int', min: 1, label: 'Родительская категория (id)' },
    ...COMMON,
  ],
  orderBy: 'sort_order ASC, id ASC',
});

// ============================================================
// АКЦИИ (promotions)
// ============================================================

const PromotionsCrud = createCrud({
  table: 'promotions',
  fields: [
    { name: 'title', type: 'text', required: true, max: 255, label: 'Заголовок акции' },
    { name: 'category', type: 'text', max: 100 },
    { name: 'description', type: 'text', label: 'Описание акции' },
    { name: 'discount_percent', type: 'int', min: 0, max: 100, label: 'Процент скидки' },
    { name: 'photo_path', type: 'text', max: 500 },
    { name: 'photo_alt', type: 'text', max: 255 },
    { name: 'start_date', type: 'date', label: 'Дата начала' },
    { name: 'end_date', type: 'date', label: 'Дата окончания' },
    ...COMMON,
  ],
  orderBy: 'start_date DESC, sort_order ASC, id DESC',
  searchFields: ['title', 'category', 'description'],
  listFilterFields: [
    { name: 'category', type: 'text' },
    { name: 'is_active', type: 'bool' },
  ],
});

// ============================================================
// ПРОЕКТЫ (projects) + children
// ============================================================

const ProjectsCrud = createCrud({
  table: 'projects',
  fields: [
    { name: 'title', type: 'text', required: true, max: 255, label: 'Название проекта' },
    { name: 'description', type: 'text', label: 'Краткое описание' },
    { name: 'full_description', type: 'text', label: 'Полное описание' },
    { name: 'context_description', type: 'text', label: 'Контекст и НКО' },
    { name: 'project_description', type: 'text', label: 'Описание проекта' },
    { name: 'seasons_count', type: 'int', min: 0, label: 'Количество сезонов' },
    { name: 'participants_count', type: 'int', min: 0, label: 'Количество участниц' },
    { name: 'experts_count', type: 'int', min: 0, label: 'Количество экспертов' },
    { name: 'winners_count', type: 'int', min: 0, label: 'Количество победителей' },
    { name: 'photo_path', type: 'text', max: 500 },
    { name: 'photo_alt', type: 'text', max: 255 },
    { name: 'project_date', type: 'date', label: 'Дата проекта' },
    { name: 'meta_title', type: 'text', max: 255 },
    { name: 'meta_description', type: 'text', max: 500 },
    { name: 'slug', type: 'text', max: 200 },
    ...COMMON,
  ],
  orderBy: 'project_date DESC, sort_order ASC, id DESC',
  searchFields: ['title', 'description', 'slug'],
  listFilterFields: [
    { name: 'is_active', type: 'bool' },
  ],
  beforeCreate: async (values) => {
    if (!values.slug) values.slug = await uniqueSlug('projects', slugify(values.title));
    return { values };
  },
  beforeUpdate: async (values, _body, id) => {
    if (values.slug) values.slug = await uniqueSlug('projects', values.slug, id);
    return { values };
  },
});

const ProjectPartners = createChildCrud({
  table: 'project_partners',
  parentField: 'project_id',
  fields: [
    { name: 'partner_name', type: 'text', required: true, max: 255, label: 'Название партнёра' },
    { name: 'partner_description', type: 'text' },
    { name: 'partner_logo_path', type: 'text', max: 500 },
    { name: 'partner_type', type: 'text', max: 100 },
    ...COMMON,
  ],
});

const ProjectStages = createChildCrud({
  table: 'project_stages',
  parentField: 'project_id',
  fields: [
    { name: 'stage_number', type: 'int', required: true, min: 1, label: 'Номер этапа' },
    { name: 'stage_name', type: 'text', required: true, max: 500, label: 'Название этапа' },
    { name: 'stage_description', type: 'text' },
    ...COMMON,
  ],
});

const ProjectGallery = createChildCrud({
  table: 'project_gallery',
  parentField: 'project_id',
  fields: [
    { name: 'photo_path', type: 'text', required: true, max: 500, label: 'Путь к фото' },
    { name: 'photo_alt', type: 'text', max: 255 },
    { name: 'photo_caption', type: 'text', max: 500 },
    { name: 'photo_type', type: 'text', max: 50, default: 'event' },
    ...COMMON,
  ],
});

const ProjectTeam = createChildCrud({
  table: 'project_team',
  parentField: 'project_id',
  fields: [
    { name: 'full_name', type: 'text', required: true, max: 255, label: 'ФИО' },
    { name: 'role', type: 'text', required: true, max: 255, label: 'Роль' },
    { name: 'role_category', type: 'text', max: 100 },
    { name: 'photo_path', type: 'text', max: 500 },
    ...COMMON,
  ],
});

// ============================================================
// НОВОСТИ (news)
// ============================================================

const NewsCrud = createCrud({
  table: 'news',
  fields: [
    { name: 'title', type: 'text', required: true, max: 255, label: 'Заголовок новости' },
    { name: 'subtitle', type: 'text', max: 255, label: 'Подзаголовок' },
    { name: 'full_text', type: 'text', label: 'Полный текст' },
    { name: 'category', type: 'text', max: 100 },
    { name: 'photo_path', type: 'text', max: 500 },
    { name: 'photo_alt', type: 'text', max: 255 },
    { name: 'news_date', type: 'date', label: 'Дата публикации' },
    { name: 'is_featured', type: 'bool', default: false, label: 'Главная новость' },
    { name: 'views_count', type: 'int', default: 0, min: 0 },
    { name: 'meta_title', type: 'text', max: 255 },
    { name: 'meta_description', type: 'text', max: 500 },
    { name: 'slug', type: 'text', max: 200 },
    ...COMMON,
  ],
  orderBy: 'news_date DESC, sort_order DESC, id DESC',
  searchFields: ['title', 'subtitle', 'full_text', 'category', 'slug'],
  listFilterFields: [
    { name: 'category', type: 'text' },
    { name: 'is_active', type: 'bool' },
    { name: 'is_featured', type: 'bool' },
  ],
  beforeCreate: async (values) => {
    if (!values.slug) values.slug = await uniqueSlug('news', slugify(values.title));
    return { values };
  },
  beforeUpdate: async (values, _body, id) => {
    if (values.slug) values.slug = await uniqueSlug('news', values.slug, id);
    return { values };
  },
});

// ============================================================
// СПЕЦИАЛИСТЫ (specialists) + children
// ============================================================

const SpecialistsCrud = createCrud({
  table: 'specialists',
  fields: [
    { name: 'last_name', type: 'text', required: true, max: 150, label: 'Фамилия' },
    { name: 'first_name', type: 'text', required: true, max: 150, label: 'Имя' },
    { name: 'middle_name', type: 'text', max: 150, label: 'Отчество' },
    { name: 'full_name', type: 'text', required: true, max: 400, label: 'ФИО полностью' },
    { name: 'position', type: 'text', required: true, max: 255, label: 'Должность' },
    { name: 'short_description', type: 'text', label: 'Краткое описание' },
    { name: 'description', type: 'text', label: 'Основное описание' },
    { name: 'full_description', type: 'text', label: 'Полное описание' },
    { name: 'full_biography', type: 'text', label: 'Биография' },
    { name: 'achievements', type: 'text', label: 'Достижения и регалии' },
    { name: 'education_summary', type: 'text', label: 'Резюме образования' },
    { name: 'experience_since', type: 'year', label: 'Год начала стажа' },
    { name: 'operations_count', type: 'int', default: 0, min: 0, label: 'Количество операций' },
    { name: 'photo_path', type: 'text', max: 500 },
    { name: 'photo_alt', type: 'text', max: 255 },
    { name: 'gallery_photo_paths', type: 'json', label: 'Галерея фото (JSON)' },
    { name: 'email', type: 'text', max: 255 },
    { name: 'phone', type: 'text', max: 50 },
    { name: 'schedule', type: 'text', label: 'График приёма' },
    { name: 'is_featured', type: 'bool', default: false, label: 'Рекомендуемый' },
    { name: 'slug', type: 'text', max: 200 },
    { name: 'meta_title', type: 'text', max: 255 },
    { name: 'meta_description', type: 'text', max: 500 },
    { name: 'schema_markup', type: 'json', label: 'JSON-LD разметка' },
    ...COMMON,
  ],
  // positive_reviews_percent и experience_years считаются триггерами БД
  orderBy: 'is_featured DESC, sort_order ASC, last_name ASC',
  searchFields: ['full_name', 'last_name', 'first_name', 'middle_name', 'position'],
  listFilterFields: [
    { name: 'position', type: 'text' },
    { name: 'is_active', type: 'bool' },
    { name: 'is_featured', type: 'bool' },
  ],
  beforeCreate: async (values) => {
    if (!values.slug) values.slug = await uniqueSlug('specialists', slugify(values.full_name));
    return { values };
  },
  beforeUpdate: async (values, _body, id) => {
    if (values.slug) values.slug = await uniqueSlug('specialists', values.slug, id);
    return { values };
  },
});

const SpecialistDirections = createChildCrud({
  table: 'specialist_directions',
  parentField: 'specialist_id',
  fields: [
    { name: 'direction_name', type: 'text', required: true, max: 500, label: 'Направление' },
    { name: 'direction_category', type: 'text', max: 100, label: 'Категория' },
    ...COMMON,
  ],
});

const SpecialistEducation = createChildCrud({
  table: 'specialist_education',
  parentField: 'specialist_id',
  fields: [
    { name: 'education_type', type: 'text', required: true, max: 100, label: 'Тип образования' },
    { name: 'organization', type: 'text', required: true, max: 500, label: 'Учреждение' },
    { name: 'year_obtained', type: 'year', required: true, label: 'Год окончания' },
    { name: 'qualification', type: 'text', required: true, max: 255, label: 'Квалификация' },
    { name: 'document_number', type: 'text', max: 100 },
    ...COMMON,
  ],
});

const SpecialistCertifications = createChildCrud({
  table: 'specialist_certifications',
  parentField: 'specialist_id',
  orderBy: 'expiry_date DESC, id DESC',
  fields: [
    { name: 'document_type', type: 'text', required: true, max: 100, label: 'Тип документа' },
    { name: 'specialty', type: 'text', required: true, max: 255, label: 'Специальность' },
    { name: 'position_title', type: 'text', max: 255 },
    { name: 'issue_date', type: 'date', required: true, label: 'Дата выдачи' },
    { name: 'expiry_date', type: 'date', required: true, label: 'Дата окончания' },
    { name: 'note', type: 'text', max: 500 },
    { name: 'document_scan_path', type: 'text', max: 500 },
    ...COMMON,
  ],
});

const SpecialistPhotos = createChildCrud({
  table: 'specialist_photos',
  parentField: 'specialist_id',
  fields: [
    { name: 'photo_path', type: 'text', required: true, max: 500, label: 'Путь к фото' },
    { name: 'photo_alt', type: 'text', max: 255 },
    { name: 'photo_type', type: 'text', max: 50, default: 'gallery' },
    ...COMMON,
  ],
});

const SpecialistReviews = createChildCrud({
  table: 'specialist_reviews',
  parentField: 'specialist_id',
  orderBy: 'review_date DESC, id DESC',
  fields: [
    { name: 'patient_name', type: 'text', max: 255, label: 'Имя пациента' },
    { name: 'review_text', type: 'text', required: true, label: 'Текст отзыва' },
    { name: 'rating', type: 'int', default: 5, min: 1, max: 5, label: 'Оценка' },
    { name: 'review_date', type: 'date', label: 'Дата отзыва' },
    { name: 'is_verified', type: 'bool', default: false },
    ...COMMON,
  ],
});

const SpecialistServices = createChildCrud({
  table: 'specialist_services',
  parentField: 'specialist_id',
  fields: [
    { name: 'service_id', type: 'int', required: true, min: 1, label: 'ID услуги' },
    { name: 'is_primary', type: 'bool', default: false },
    ...COMMON,
  ],
});

const SpecialistAchievements = createChildCrud({
  table: 'specialist_achievements',
  parentField: 'specialist_id',
  fields: [
    { name: 'achievement_type', type: 'text', max: 100, label: 'Тип достижения' },
    { name: 'title', type: 'text', required: true, max: 500, label: 'Название' },
    { name: 'description', type: 'text' },
    { name: 'year', type: 'year', label: 'Год' },
    { name: 'document_path', type: 'text', max: 500 },
    ...COMMON,
  ],
});

module.exports = {
  PriceSectionsCrud,
  PricesCrud,
  ServicesCrud,
  ServiceCategoriesCrud,
  PromotionsCrud,
  ProjectsCrud,
  ProjectPartners,
  ProjectStages,
  ProjectGallery,
  ProjectTeam,
  NewsCrud,
  SpecialistsCrud,
  SpecialistDirections,
  SpecialistEducation,
  SpecialistCertifications,
  SpecialistPhotos,
  SpecialistReviews,
  SpecialistServices,
  SpecialistAchievements,
};
