const { createCrud, createChildCrud, uniqueSlug, slugify, pool } = require('./utils');

const COMMON = [
  { name: 'sort_order', type: 'int', default: 0, min: 0 },
];

const CHILD_COMMON = [
  { name: 'sort_order', type: 'int', default: 0, min: 0 },
];

// Варианты сортировки для списков
function dateSort(column, label) {
  return [
    { key: 'date_desc', label: `${label}: новые → старые`, orderBy: `${column} DESC, id DESC` },
    { key: 'date_asc', label: `${label}: старые → новые`, orderBy: `${column} ASC, id ASC` },
  ];
}

function idSort() {
  return [
    { key: 'id_asc', label: 'По id (возр.)', orderBy: 'id ASC' },
    { key: 'id_desc', label: 'По id (убыв.)', orderBy: 'id DESC' },
  ];
}

function childSort(order = 'sort_order, id') {
  return [
    { key: 'default', label: 'По порядку сортировки', orderBy: order },
    ...idSort(),
  ];
}

// ============================================================
// Цены на услуги (price_lists)
// ============================================================

const PriceListsCrud = createCrud({
  table: 'price_lists',
  fields: [
    { name: 'name', type: 'text', required: true, max: 255, label: 'Наименование' },
    { name: 'price_from', type: 'number', min: 0, label: 'Цена от, ₽' },
    ...COMMON,
  ],
  orderBy: 'sort_order ASC, id ASC',
  sortOptions: [
    { key: 'default', label: 'По порядку сортировки', orderBy: 'sort_order ASC, id ASC' },
    { key: 'name_asc', label: 'По наименованию (А-Я)', orderBy: 'name ASC' },
    { key: 'name_desc', label: 'По наименованию (Я-А)', orderBy: 'name DESC' },
    ...idSort(),
  ],
  searchFields: ['name'],
  listFilterFields: [
    { name: 'is_active', type: 'bool' },
  ],
});

// ============================================================
// Категории цены на услуги (service_prices)
// ============================================================

const PriceCategoriesCrud = createCrud({
  table: 'service_prices',
  fields: [
    { name: 'price_id', type: 'int', required: true, min: 1, label: 'Цена на услуги' },
    { name: 'service_code', type: 'text', max: 50, label: 'Код Номенклатуры мед услуг' },
    { name: 'mics_code', type: 'text', max: 20, label: 'Код МИС' },
    { name: 'service_name', type: 'text', required: true, max: 500, label: 'Наименование медицинской услуги' },
    { name: 'category', type: 'text', max: 150, label: 'Категория' },
    { name: 'duration_min', type: 'int', min: 0, label: 'Время, мин' },
    { name: 'price', type: 'number', min: 0, label: 'Цена, ₽' },
    { name: 'price_category_1', type: 'number', min: 0, label: 'Цена, категория I, ₽' },
    { name: 'price_category_2', type: 'number', min: 0, label: 'Цена, категория II, ₽' },
    { name: 'price_category_3', type: 'number', min: 0, label: 'Цена, категория III, ₽' },
    { name: 'price_single', type: 'number', min: 0, label: 'Единая цена, ₽' },
    ...COMMON,
  ],
  publicColumns:
    '*, (SELECT pl.name FROM price_lists pl WHERE pl.id = service_prices.price_id) AS price_name',
  orderBy: 'price_id ASC, sort_order ASC, id ASC',
  sortOptions: [
    { key: 'default', label: 'По цене и порядку', orderBy: 'price_id ASC, sort_order ASC, id ASC' },
    { key: 'name_asc', label: 'По наименованию (А-Я)', orderBy: 'service_name ASC' },
    { key: 'name_desc', label: 'По наименованию (Я-А)', orderBy: 'service_name DESC' },
    { key: 'price_asc', label: 'По цене (возр.)', orderBy: 'price_single ASC NULLS LAST, id ASC' },
    { key: 'price_desc', label: 'По цене (убыв.)', orderBy: 'price_single DESC NULLS LAST, id ASC' },
    ...idSort(),
  ],
  searchFields: [
    'service_name',
    'service_code',
    'mics_code',
    'category',
    '(SELECT pl.name FROM price_lists pl WHERE pl.id = service_prices.price_id)',
  ],
  listFilterFields: [
    { name: 'price_id', type: 'int' },
    { name: 'category', type: 'text' },
    { name: 'is_active', type: 'bool' },
  ],
});

// ============================================================
// РАЗДЕЛЫ УСЛУГ (service_sections)
// ============================================================

const ServiceSectionsCrud = createCrud({
  table: 'service_sections',
  fields: [
    { name: 'name', type: 'text', required: true, max: 255, label: 'Название раздела' },
    ...COMMON,
  ],
  orderBy: 'sort_order ASC, id ASC',
  sortOptions: [
    { key: 'default', label: 'По порядку сортировки', orderBy: 'sort_order ASC, id ASC' },
    { key: 'name_asc', label: 'По названию (А-Я)', orderBy: 'name ASC' },
    { key: 'name_desc', label: 'По названию (Я-А)', orderBy: 'name DESC' },
    ...idSort(),
  ],
  searchFields: ['name'],
  listFilterFields: [
    { name: 'is_active', type: 'bool' },
  ],
});

// ============================================================
// ПОДРАЗДЕЛЫ УСЛУГ (service_subsections)
// ============================================================

const ServiceSubsectionsCrud = createCrud({
  table: 'service_subsections',
  fields: [
    { name: 'section_id', type: 'int', required: true, min: 1, label: 'Раздел (id)' },
    { name: 'name', type: 'text', required: true, max: 255, label: 'Название подраздела' },
    { name: 'photo_path', type: 'text', max: 500, label: 'Фотография' },
    { name: 'photo_alt', type: 'text', max: 255, label: 'Alt фотографии' },
    ...COMMON,
  ],
  orderBy: 'section_id ASC, sort_order ASC, id ASC',
  sortOptions: [
    { key: 'default', label: 'По разделам и порядку', orderBy: 'section_id ASC, sort_order ASC, id ASC' },
    { key: 'name_asc', label: 'По названию (А-Я)', orderBy: 'name ASC' },
    { key: 'name_desc', label: 'По названию (Я-А)', orderBy: 'name DESC' },
    ...idSort(),
  ],
  publicColumns:
    '*, (SELECT sec.name FROM service_sections sec WHERE sec.id = service_subsections.section_id) AS section_name',
  searchFields: ['name'],
  listFilterFields: [
    { name: 'section_id', type: 'int' },
    { name: 'is_active', type: 'bool' },
  ],
});

// ============================================================
// УСЛУГИ (services) — ссылка на подраздел
// ============================================================

const ServicesCrud = createCrud({
  table: 'services',
  fields: [
    { name: 'subsection_id', type: 'int', required: true, min: 1, label: 'Подраздел (id)' },
    { name: 'name', type: 'text', required: true, max: 255, label: 'Название' },
    { name: 'slug', type: 'text', max: 200, label: 'Slug (URL)' },
    { name: 'description', type: 'text', label: 'Описание процедуры' },
    { name: 'preparation', type: 'text', label: 'Подготовка к операции' },
    { name: 'execution', type: 'text', label: 'Способ выполнения' },
    ...COMMON,
  ],
  orderBy: 'subsection_id ASC, sort_order ASC, id ASC',
  sortOptions: [
    { key: 'default', label: 'По подразделам и порядку', orderBy: 'subsection_id ASC, sort_order ASC, id ASC' },
    { key: 'name_asc', label: 'По названию (А-Я)', orderBy: 'name ASC' },
    { key: 'name_desc', label: 'По названию (Я-А)', orderBy: 'name DESC' },
    ...idSort(),
  ],
  publicColumns:
    '*, (SELECT sub.name FROM service_subsections sub WHERE sub.id = services.subsection_id) AS subsection_name, ' +
    '(SELECT sec.name FROM service_sections sec JOIN service_subsections sub ON sub.section_id = sec.id WHERE sub.id = services.subsection_id) AS section_name',
  searchFields: ['name', 'description', 'slug'],
  listFilterFields: [
    { name: 'subsection_id', type: 'int' },
    { name: 'is_active', type: 'bool' },
  ],
  beforeCreate: async (values) => {
    if (!values.slug) values.slug = await uniqueSlug('services', slugify(values.name));
    return { values };
  },
  beforeUpdate: async (values, _body, id) => {
    if (values.slug) values.slug = await uniqueSlug('services', values.slug, id);
    return { values };
  },
});

const SERVICE_PROBLEM_FIELDS = [
  { name: 'title', type: 'text', required: true, max: 255, label: 'Название проблемы' },
  { name: 'description', type: 'text', label: 'Описание проблемы' },
];

const SERVICE_TYPE_FIELDS = [
  { name: 'description', type: 'text', label: 'Описание вида' },
  { name: 'photo_before_1_path', type: 'text', max: 500, label: 'Фото до (1)' },
  { name: 'photo_after_1_path', type: 'text', max: 500, label: 'Фото после (1)' },
  { name: 'photo_before_2_path', type: 'text', max: 500, label: 'Фото до (2)' },
  { name: 'photo_after_2_path', type: 'text', max: 500, label: 'Фото после (2)' },
];

const SERVICE_RESULT_FIELDS = [
  { name: 'photo_before_path', type: 'text', max: 500, label: 'Фото до' },
  { name: 'photo_after_path', type: 'text', max: 500, label: 'Фото после' },
];

// Список проблем, которые решает услуга
const ServiceProblems = createChildCrud({
  table: 'service_problems',
  parentField: 'service_id',
  orderBy: 'id ASC',
  sortOptions: childSort('id'),
  fields: SERVICE_PROBLEM_FIELDS,
});

// Виды услуги: описание + 4 фото (до/после, до/после)
const ServiceTypes = createChildCrud({
  table: 'service_types',
  parentField: 'service_id',
  sortOptions: childSort(),
  fields: SERVICE_TYPE_FIELDS,
});

// Результаты процедуры: 2 фото до/после
const ServiceResults = createChildCrud({
  table: 'service_results',
  parentField: 'service_id',
  sortOptions: childSort(),
  fields: SERVICE_RESULT_FIELDS,
});

// Плоские CRUD-контроллеры для редактирования вложенных таблиц
// отдельным разделом админ-панели (с выбором услуги).
function createServiceChildAdmin({
  table,
  fields,
  orderBy,
  sortOptions,
  searchFields,
  publicColumns,
}) {
  return createCrud({
    table,
    fields: [
      { name: 'service_id', type: 'int', min: 1, label: 'Услуга (id)' },
      ...fields,
    ],
    publicColumns,
    orderBy,
    sortOptions,
    searchFields,
    listFilterFields: [
      { name: 'service_id', type: 'int' },
      { name: 'is_active', type: 'bool' },
    ],
    beforeCreate: async (values) => {
      if (!values.service_id) return { error: 'Поле «Услуга» обязательно' };
      return { values };
    },
  });
}

function serviceNameSearch(table) {
  return `(SELECT s.name FROM services s WHERE s.id = ${table}.service_id)`;
}

const ServiceProblemsAdmin = createServiceChildAdmin({
  table: 'service_problems',
  fields: SERVICE_PROBLEM_FIELDS,
  orderBy: 'service_id ASC, id ASC',
  sortOptions: [
    { key: 'default', label: 'По услуге и порядку', orderBy: 'service_id ASC, id ASC' },
    ...idSort(),
  ],
  searchFields: [serviceNameSearch('service_problems'), 'title', 'description'],
  publicColumns:
    '*, (SELECT s.name FROM services s WHERE s.id = service_problems.service_id) AS service_name',
});

const ServiceTypesAdmin = createServiceChildAdmin({
  table: 'service_types',
  fields: SERVICE_TYPE_FIELDS,
  orderBy: 'service_id ASC, sort_order ASC, id ASC',
  sortOptions: [
    { key: 'default', label: 'По услуге и порядку', orderBy: 'service_id ASC, sort_order ASC, id ASC' },
    ...idSort(),
  ],
  searchFields: [serviceNameSearch('service_types'), 'description'],
  publicColumns:
    '*, (SELECT s.name FROM services s WHERE s.id = service_types.service_id) AS service_name',
});

const ServiceResultsAdmin = createServiceChildAdmin({
  table: 'service_results',
  fields: SERVICE_RESULT_FIELDS,
  orderBy: 'service_id ASC, sort_order ASC, id ASC',
  sortOptions: [
    { key: 'default', label: 'По услуге и порядку', orderBy: 'service_id ASC, sort_order ASC, id ASC' },
    ...idSort(),
  ],
  searchFields: [serviceNameSearch('service_results'), 'photo_before_path', 'photo_after_path'],
  publicColumns:
    '*, (SELECT s.name FROM services s WHERE s.id = service_results.service_id) AS service_name',
});

// Специалисты, выполняющие процедуру
const ServiceSpecialists = createChildCrud({
  table: 'specialist_services',
  parentField: 'service_id',
  sortOptions: childSort(),
  orderBy: 'sort_order, id',
  listColumns:
    '*, (SELECT sp.full_name FROM specialists sp WHERE sp.id = specialist_services.specialist_id) AS specialist_name',
  fields: [
    { name: 'specialist_id', type: 'int', required: true, min: 1, label: 'ID специалиста' },
    ...CHILD_COMMON,
  ],
});

// ============================================================
// АКЦИИ (promotions)
// ============================================================

const PromotionsCrud = createCrud({
  table: 'promotions',
  fields: [
    { name: 'title', type: 'text', required: true, max: 255, label: 'Название акции' },
    { name: 'short_description', type: 'text', label: 'Краткое описание' },
    { name: 'full_description', type: 'text', label: 'Полное описание' },
    { name: 'promotion_date', type: 'date', label: 'Дата акции' },
    { name: 'photo_path', type: 'text', max: 500 },
    { name: 'photo_alt', type: 'text', max: 255 },
    { name: 'slug', type: 'text', max: 200, label: 'Slug (URL)' },
    ...COMMON,
  ],
  orderBy: 'promotion_date DESC, sort_order ASC, id DESC',
  sortOptions: [
    { key: 'default', label: 'По дате акции: новые → старые', orderBy: 'promotion_date DESC, sort_order ASC, id DESC' },
    ...dateSort('promotion_date', 'По дате акции'),
    { key: 'title_asc', label: 'По названию (А-Я)', orderBy: 'title ASC' },
    { key: 'title_desc', label: 'По названию (Я-А)', orderBy: 'title DESC' },
    ...idSort(),
  ],
  searchFields: ['title', 'short_description', 'full_description'],
  listFilterFields: [
    { name: 'is_active', type: 'bool' },
  ],
  beforeCreate: async (values) => {
    if (!values.slug) values.slug = await uniqueSlug('promotions', slugify(values.title));
    return { values };
  },
  beforeUpdate: async (values, _body, id) => {
    if (values.slug) values.slug = await uniqueSlug('promotions', values.slug, id);
    return { values };
  },
});

// ============================================================
// ПРОЕКТЫ (projects) + связанные таблицы
// ============================================================

const ProjectsCrud = createCrud({
  table: 'projects',
  fields: [
    { name: 'title', type: 'text', required: true, max: 255, label: 'Название проекта' },
    { name: 'slug', type: 'text', max: 200, label: 'Slug (URL)' },
    { name: 'description', type: 'text', label: 'Краткое описание' },
    { name: 'project_date', type: 'date', label: 'Дата проекта' },
    { name: 'seasons_count', type: 'int', default: 0, min: 0, label: 'Количество сезонов' },
    { name: 'participants_count', type: 'int', default: 0, min: 0, label: 'Количество участников' },
    { name: 'experts_count', type: 'int', default: 0, min: 0, label: 'Количество экспертов' },
    { name: 'partners_count', type: 'int', default: 0, min: 0, label: 'Количество партнёров' },
    { name: 'photo_path', type: 'text', max: 500 },
    { name: 'photo_alt', type: 'text', max: 255 },
    { name: 'photo_2_path', type: 'text', max: 500 },
    { name: 'photo_2_alt', type: 'text', max: 255 },
    { name: 'photo_3_path', type: 'text', max: 500 },
    { name: 'photo_3_alt', type: 'text', max: 255 },
    ...COMMON,
  ],
  orderBy: 'project_date DESC, sort_order ASC, id DESC',
  sortOptions: [
    { key: 'default', label: 'По дате проекта: новые → старые', orderBy: 'project_date DESC, sort_order ASC, id DESC' },
    ...dateSort('project_date', 'По дате проекта'),
    { key: 'title_asc', label: 'По названию (А-Я)', orderBy: 'title ASC' },
    { key: 'title_desc', label: 'По названию (Я-А)', orderBy: 'title DESC' },
    ...idSort(),
  ],
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

// Большое описание проекта: два блока текста
const PROJECT_DETAIL_FIELDS = [
  { name: 'context_description', type: 'text', label: 'Описание 1' },
  { name: 'project_description', type: 'text', label: 'Описание 2' },
];

const ProjectDetails = createChildCrud({
  table: 'project_details',
  parentField: 'project_id',
  sortOptions: [
    { key: 'default', label: 'По умолчанию', orderBy: 'id' },
    ...idSort(),
  ],
  fields: PROJECT_DETAIL_FIELDS,
});

// Сезоны проекта
const PROJECT_SEASON_FIELDS = [
  { name: 'title', type: 'text', required: true, max: 255, label: 'Название' },
  { name: 'description', type: 'text', label: 'Описание' },
  ...CHILD_COMMON,
];

const ProjectSeasons = createChildCrud({
  table: 'project_seasons',
  parentField: 'project_id',
  sortOptions: childSort(),
  fields: PROJECT_SEASON_FIELDS,
});

// Участники проекта
const PROJECT_PARTICIPANT_FIELDS = [
  { name: 'title', type: 'text', required: true, max: 255, label: 'Название' },
  { name: 'description', type: 'text', label: 'Описание' },
  ...CHILD_COMMON,
];

const ProjectParticipants = createChildCrud({
  table: 'project_participants',
  parentField: 'project_id',
  sortOptions: childSort(),
  fields: PROJECT_PARTICIPANT_FIELDS,
});

// Эксперты проекта
const PROJECT_EXPERT_FIELDS = [
  { name: 'title', type: 'text', required: true, max: 255, label: 'Название' },
  { name: 'description', type: 'text', label: 'Описание' },
  ...CHILD_COMMON,
];

const ProjectExperts = createChildCrud({
  table: 'project_experts',
  parentField: 'project_id',
  sortOptions: childSort(),
  fields: PROJECT_EXPERT_FIELDS,
});

// Партнёры проекта
const PROJECT_PARTNER_FIELDS = [
  { name: 'title', type: 'text', required: true, max: 255, label: 'Название партнёра' },
  { name: 'description', type: 'text', label: 'Описание' },
  ...CHILD_COMMON,
];

const ProjectPartners = createChildCrud({
  table: 'project_partners',
  parentField: 'project_id',
  sortOptions: childSort(),
  fields: PROJECT_PARTNER_FIELDS,
});

// Форматы работ проекта
const PROJECT_WORK_FORMAT_FIELDS = [
  { name: 'title', type: 'text', required: true, max: 255, label: 'Название формата' },
  { name: 'description', type: 'text', label: 'Описание' },
  { name: 'photo_path', type: 'text', max: 500, label: 'Фотография' },
  { name: 'photo_alt', type: 'text', max: 255 },
  ...CHILD_COMMON,
];

const ProjectWorkFormats = createChildCrud({
  table: 'project_work_formats',
  parentField: 'project_id',
  sortOptions: childSort(),
  fields: PROJECT_WORK_FORMAT_FIELDS,
});

// Этапы проекта
const PROJECT_STAGE_FIELDS = [
  { name: 'stage_number', type: 'int', required: true, min: 1, label: 'Номер этапа' },
  { name: 'description', type: 'text', label: 'Описание этапа' },
  ...CHILD_COMMON,
];

const ProjectStages = createChildCrud({
  table: 'project_stages',
  parentField: 'project_id',
  sortOptions: childSort(),
  fields: PROJECT_STAGE_FIELDS,
});

// Плоские CRUD-контроллеры для редактирования вложенных таблиц
// отдельным разделом админ-панели (с выбором проекта).
function projectNameSearch(table) {
  return `(SELECT p.title FROM projects p WHERE p.id = ${table}.project_id)`;
}

function createProjectChildAdmin({
  table,
  fields,
  orderBy,
  sortOptions,
  searchFields,
  publicColumns,
}) {
  return createCrud({
    table,
    fields: [
      { name: 'project_id', type: 'int', min: 1, label: 'Проект (id)' },
      ...fields,
    ],
    publicColumns,
    orderBy,
    sortOptions,
    searchFields,
    listFilterFields: [
      { name: 'project_id', type: 'int' },
    ],
    beforeCreate: async (values) => {
      if (!values.project_id) return { error: 'Поле «Проект» обязательно' };
      return { values };
    },
  });
}

function projectAdminSort(orderBy) {
  return [
    { key: 'default', label: 'По проекту и порядку', orderBy },
    ...idSort(),
  ];
}

async function FillProjectPartnersCount(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: 'Некорректный id проекта' });
    }

    const { rows } = await pool.query(
      `UPDATE projects p
       SET partners_count = (
         SELECT COUNT(*)::int FROM project_partners pp WHERE pp.project_id = p.id
       ),
       updated_at = CURRENT_TIMESTAMP
       WHERE p.id = $1
       RETURNING partners_count`,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Проект не найден' });
    }

    return res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Ошибка при заполнении количества партнёров', err);
    return res.status(500).json({
      success: false,
      message: `Ошибка при заполнении количества партнёров: ${err.message}`,
    });
  }
}

const ProjectDetailsAdmin = createProjectChildAdmin({
  table: 'project_details',
  fields: PROJECT_DETAIL_FIELDS,
  orderBy: 'project_id ASC, id ASC',
  sortOptions: projectAdminSort('project_id ASC, id ASC'),
  searchFields: [projectNameSearch('project_details'), 'context_description', 'project_description'],
  publicColumns:
    '*, (SELECT p.title FROM projects p WHERE p.id = project_details.project_id) AS project_name',
});

const ProjectSeasonsAdmin = createProjectChildAdmin({
  table: 'project_seasons',
  fields: PROJECT_SEASON_FIELDS,
  orderBy: 'project_id ASC, sort_order ASC, id ASC',
  sortOptions: projectAdminSort('project_id ASC, sort_order ASC, id ASC'),
  searchFields: [projectNameSearch('project_seasons'), 'title', 'description'],
  publicColumns:
    '*, (SELECT p.title FROM projects p WHERE p.id = project_seasons.project_id) AS project_name',
});

const ProjectParticipantsAdmin = createProjectChildAdmin({
  table: 'project_participants',
  fields: PROJECT_PARTICIPANT_FIELDS,
  orderBy: 'project_id ASC, sort_order ASC, id ASC',
  sortOptions: projectAdminSort('project_id ASC, sort_order ASC, id ASC'),
  searchFields: [projectNameSearch('project_participants'), 'title', 'description'],
  publicColumns:
    '*, (SELECT p.title FROM projects p WHERE p.id = project_participants.project_id) AS project_name',
});

const ProjectExpertsAdmin = createProjectChildAdmin({
  table: 'project_experts',
  fields: PROJECT_EXPERT_FIELDS,
  orderBy: 'project_id ASC, sort_order ASC, id ASC',
  sortOptions: projectAdminSort('project_id ASC, sort_order ASC, id ASC'),
  searchFields: [projectNameSearch('project_experts'), 'title', 'description'],
  publicColumns:
    '*, (SELECT p.title FROM projects p WHERE p.id = project_experts.project_id) AS project_name',
});

const ProjectPartnersAdmin = createProjectChildAdmin({
  table: 'project_partners',
  fields: PROJECT_PARTNER_FIELDS,
  orderBy: 'project_id ASC, sort_order ASC, id ASC',
  sortOptions: projectAdminSort('project_id ASC, sort_order ASC, id ASC'),
  searchFields: [projectNameSearch('project_partners'), 'title', 'description'],
  publicColumns:
    '*, (SELECT p.title FROM projects p WHERE p.id = project_partners.project_id) AS project_name',
});

const ProjectWorkFormatsAdmin = createProjectChildAdmin({
  table: 'project_work_formats',
  fields: PROJECT_WORK_FORMAT_FIELDS,
  orderBy: 'project_id ASC, sort_order ASC, id ASC',
  sortOptions: projectAdminSort('project_id ASC, sort_order ASC, id ASC'),
  searchFields: [projectNameSearch('project_work_formats'), 'title', 'description'],
  publicColumns:
    '*, (SELECT p.title FROM projects p WHERE p.id = project_work_formats.project_id) AS project_name',
});

const ProjectStagesAdmin = createProjectChildAdmin({
  table: 'project_stages',
  fields: PROJECT_STAGE_FIELDS,
  orderBy: 'project_id ASC, stage_number ASC, id ASC',
  sortOptions: projectAdminSort('project_id ASC, stage_number ASC, id ASC'),
  searchFields: [projectNameSearch('project_stages'), 'description'],
  publicColumns:
    '*, (SELECT p.title FROM projects p WHERE p.id = project_stages.project_id) AS project_name',
});

// ============================================================
// НОВОСТИ (news)
// ============================================================

const NewsCrud = createCrud({
  table: 'news',
  fields: [
    { name: 'title', type: 'text', required: true, max: 255, label: 'Заголовок новости' },
    { name: 'full_text', type: 'text', label: 'Большое описание' },
    { name: 'photo_path', type: 'text', max: 500 },
    { name: 'photo_alt', type: 'text', max: 255 },
    { name: 'news_date', type: 'date', label: 'Дата публикации' },
    { name: 'slug', type: 'text', max: 200, label: 'Slug (URL)' },
    ...COMMON,
  ],
  orderBy: 'news_date DESC, sort_order DESC, id DESC',
  sortOptions: [
    { key: 'default', label: 'По дате новости: новые → старые', orderBy: 'news_date DESC, sort_order DESC, id DESC' },
    ...dateSort('news_date', 'По дате новости'),
    { key: 'title_asc', label: 'По заголовку (А-Я)', orderBy: 'title ASC' },
    { key: 'title_desc', label: 'По заголовку (Я-А)', orderBy: 'title DESC' },
    ...idSort(),
  ],
  searchFields: ['title', 'full_text', 'slug'],
  listFilterFields: [
    { name: 'is_active', type: 'bool' },
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
// СПЕЦИАЛИСТЫ (specialists) + связанные таблицы
// ============================================================

const SpecialistsCrud = createCrud({
  table: 'specialists',
  fields: [
    { name: 'last_name', type: 'text', required: true, max: 150, label: 'Фамилия' },
    { name: 'first_name', type: 'text', required: true, max: 150, label: 'Имя' },
    { name: 'middle_name', type: 'text', max: 150, label: 'Отчество' },
    { name: 'full_name', type: 'text', max: 400, label: 'ФИО полностью' },
    { name: 'position', type: 'text', max: 255, label: 'Должность' },
    { name: 'short_description', type: 'text', label: 'Краткое описание' },
    { name: 'description', type: 'text', label: 'Основное описание' },
    { name: 'operations_result', type: 'text', label: 'Результат операций' },
    { name: 'experience_since', type: 'year', label: 'Год начала стажа' },
    { name: 'operations_count', type: 'int', default: 0, min: 0, label: 'Количество операций' },
    { name: 'positive_reviews_percent', type: 'int', default: 0, min: 0, max: 100, label: 'Положительные отзывы, %' },
    { name: 'photo_path', type: 'text', max: 500 },
    { name: 'photo_alt', type: 'text', max: 255 },
    { name: 'slug', type: 'text', max: 200, label: 'Slug (URL)' },
    ...COMMON,
  ],
  // experience_years считается триггером БД
  orderBy: 'is_featured DESC, sort_order ASC, last_name ASC',
  sortOptions: [
    { key: 'default', label: 'По умолчанию (рекомендуемые, А-Я)', orderBy: 'is_featured DESC, sort_order ASC, last_name ASC' },
    { key: 'name_asc', label: 'По ФИО (А-Я)', orderBy: 'full_name ASC' },
    { key: 'name_desc', label: 'По ФИО (Я-А)', orderBy: 'full_name DESC' },
    { key: 'experience_desc', label: 'По стажу (больше → меньше)', orderBy: 'experience_since ASC NULLS LAST' },
    { key: 'operations_desc', label: 'По числу операций (убыв.)', orderBy: 'operations_count DESC NULLS LAST' },
    ...idSort(),
  ],
  searchFields: ['full_name', 'last_name', 'first_name', 'middle_name', 'position'],
  listFilterFields: [
    { name: 'position', type: 'text' },
    { name: 'is_active', type: 'bool' },
    { name: 'is_featured', type: 'bool' },
  ],
  beforeCreate: async (values) => {
    if (!values.full_name) {
      values.full_name = [values.last_name, values.first_name, values.middle_name]
        .filter(Boolean)
        .join(' ');
    }
    if (values.position === undefined) values.position = '';
    if (!values.slug) values.slug = await uniqueSlug('specialists', slugify(values.full_name));
    return { values };
  },
  beforeUpdate: async (values, _body, id) => {
    if (!values.full_name && (values.last_name || values.first_name)) {
      values.full_name = [values.last_name, values.first_name, values.middle_name]
        .filter(Boolean)
        .join(' ');
    }
    if (values.slug) values.slug = await uniqueSlug('specialists', values.slug, id);
    return { values };
  },
});

// Стаж
const SPECIALIST_EXPERIENCE_FIELDS = [
  { name: 'title', type: 'text', required: true, max: 255, label: 'Название' },
  { name: 'description', type: 'text', label: 'Описание' },
  ...CHILD_COMMON,
];

const SpecialistExperience = createChildCrud({
  table: 'specialist_experience',
  parentField: 'specialist_id',
  sortOptions: childSort(),
  fields: SPECIALIST_EXPERIENCE_FIELDS,
});

// Операции за время работы в клинике
const SPECIALIST_OPERATION_FIELDS = [
  { name: 'title', type: 'text', required: true, max: 255, label: 'Название операции' },
  { name: 'description', type: 'text', label: 'Описание' },
  ...CHILD_COMMON,
];

const SpecialistOperations = createChildCrud({
  table: 'specialist_operations',
  parentField: 'specialist_id',
  sortOptions: childSort(),
  fields: SPECIALIST_OPERATION_FIELDS,
});

// Положительные отзывы
const SPECIALIST_POSITIVE_REVIEW_FIELDS = [
  { name: 'title', type: 'text', required: true, max: 255, label: 'Заголовок отзыва' },
  { name: 'description', type: 'text', label: 'Текст отзыва' },
  ...CHILD_COMMON,
];

const SpecialistPositiveReviews = createChildCrud({
  table: 'specialist_positive_reviews',
  parentField: 'specialist_id',
  sortOptions: childSort(),
  fields: SPECIALIST_POSITIVE_REVIEW_FIELDS,
});

// Направления деятельности = ссылки на услуги
const SPECIALIST_SERVICE_FIELDS = [
  { name: 'service_id', type: 'int', required: true, min: 1, label: 'ID услуги' },
  ...CHILD_COMMON,
];

const SpecialistServices = createChildCrud({
  table: 'specialist_services',
  parentField: 'specialist_id',
  sortOptions: childSort(),
  orderBy: 'sort_order, id',
  listColumns:
    '*, (SELECT s.name FROM services s WHERE s.id = specialist_services.service_id) AS service_name',
  fields: SPECIALIST_SERVICE_FIELDS,
});

// Образование
const SPECIALIST_EDUCATION_FIELDS = [
  { name: 'education_level', type: 'text', required: true, max: 100, label: 'Уровень образования' },
  { name: 'organization', type: 'text', required: true, max: 500, label: 'Образовательная организация' },
  { name: 'year_issued', type: 'year', required: true, label: 'Год выдачи' },
  { name: 'qualification', type: 'text', required: true, max: 255, label: 'Квалификация' },
  ...CHILD_COMMON,
];

const SpecialistEducation = createChildCrud({
  table: 'specialist_education',
  parentField: 'specialist_id',
  sortOptions: childSort(),
  fields: SPECIALIST_EDUCATION_FIELDS,
});

// Аккредитация
const SPECIALIST_ACCREDITATION_FIELDS = [
  { name: 'document_type', type: 'text', required: true, max: 100, label: 'Тип документа' },
  { name: 'specialty', type: 'text', required: true, max: 255, label: 'Специальность' },
  { name: 'position_title', type: 'text', max: 255, label: 'Должность' },
  { name: 'issue_date', type: 'date', required: true, label: 'Дата выдачи' },
  { name: 'expiry_date', type: 'date', required: true, label: 'Срок действия' },
  { name: 'note', type: 'text', max: 500, label: 'Примечание' },
  ...CHILD_COMMON,
];

const SpecialistAccreditations = createChildCrud({
  table: 'specialist_accreditations',
  parentField: 'specialist_id',
  sortOptions: childSort(),
  orderBy: 'expiry_date DESC, id DESC',
  fields: SPECIALIST_ACCREDITATION_FIELDS,
});

function specialistNameSearch(table) {
  return `(SELECT sp.full_name FROM specialists sp WHERE sp.id = ${table}.specialist_id)`;
}

function createSpecialistChildAdmin({
  table,
  fields,
  orderBy,
  sortOptions,
  searchFields,
  publicColumns,
}) {
  return createCrud({
    table,
    fields: [
      { name: 'specialist_id', type: 'int', min: 1, label: 'Специалист (id)' },
      ...fields,
    ],
    publicColumns,
    orderBy,
    sortOptions,
    searchFields,
    listFilterFields: [
      { name: 'specialist_id', type: 'int' },
      { name: 'is_active', type: 'bool' },
    ],
    beforeCreate: async (values) => {
      if (!values.specialist_id) return { error: 'Поле «Специалист» обязательно' };
      return { values };
    },
  });
}

const SpecialistExperienceAdmin = createSpecialistChildAdmin({
  table: 'specialist_experience',
  fields: SPECIALIST_EXPERIENCE_FIELDS,
  orderBy: 'specialist_id ASC, sort_order ASC, id ASC',
  sortOptions: [
    { key: 'default', label: 'По специалисту и порядку', orderBy: 'specialist_id ASC, sort_order ASC, id ASC' },
    ...idSort(),
  ],
  searchFields: [
    specialistNameSearch('specialist_experience'),
    'title',
    'description',
  ],
  publicColumns:
    '*, (SELECT sp.full_name FROM specialists sp WHERE sp.id = specialist_experience.specialist_id) AS specialist_name',
});

const SpecialistOperationsAdmin = createSpecialistChildAdmin({
  table: 'specialist_operations',
  fields: SPECIALIST_OPERATION_FIELDS,
  orderBy: 'specialist_id ASC, sort_order ASC, id ASC',
  sortOptions: [
    { key: 'default', label: 'По специалисту и порядку', orderBy: 'specialist_id ASC, sort_order ASC, id ASC' },
    ...idSort(),
  ],
  searchFields: [
    specialistNameSearch('specialist_operations'),
    'title',
    'description',
  ],
  publicColumns:
    '*, (SELECT sp.full_name FROM specialists sp WHERE sp.id = specialist_operations.specialist_id) AS specialist_name',
});

const SpecialistPositiveReviewsAdmin = createSpecialistChildAdmin({
  table: 'specialist_positive_reviews',
  fields: SPECIALIST_POSITIVE_REVIEW_FIELDS,
  orderBy: 'specialist_id ASC, sort_order ASC, id ASC',
  sortOptions: [
    { key: 'default', label: 'По специалисту и порядку', orderBy: 'specialist_id ASC, sort_order ASC, id ASC' },
    ...idSort(),
  ],
  searchFields: [
    specialistNameSearch('specialist_positive_reviews'),
    'title',
    'description',
  ],
  publicColumns:
    '*, (SELECT sp.full_name FROM specialists sp WHERE sp.id = specialist_positive_reviews.specialist_id) AS specialist_name',
});

const SpecialistEducationAdmin = createSpecialistChildAdmin({
  table: 'specialist_education',
  fields: SPECIALIST_EDUCATION_FIELDS,
  orderBy: 'specialist_id ASC, sort_order ASC, id ASC',
  sortOptions: [
    { key: 'default', label: 'По специалисту и порядку', orderBy: 'specialist_id ASC, sort_order ASC, id ASC' },
    ...idSort(),
  ],
  searchFields: [
    specialistNameSearch('specialist_education'),
    'education_level',
    'organization',
    'qualification',
  ],
  publicColumns:
    '*, (SELECT sp.full_name FROM specialists sp WHERE sp.id = specialist_education.specialist_id) AS specialist_name',
});

const SpecialistServicesAdmin = createSpecialistChildAdmin({
  table: 'specialist_services',
  fields: SPECIALIST_SERVICE_FIELDS,
  orderBy: 'specialist_id ASC, sort_order ASC, id ASC',
  sortOptions: [
    { key: 'default', label: 'По специалисту и порядку', orderBy: 'specialist_id ASC, sort_order ASC, id ASC' },
    ...idSort(),
  ],
  searchFields: [
    specialistNameSearch('specialist_services'),
    '(SELECT s.name FROM services s WHERE s.id = specialist_services.service_id)',
  ],
  publicColumns:
    '*, (SELECT sp.full_name FROM specialists sp WHERE sp.id = specialist_services.specialist_id) AS specialist_name, ' +
    '(SELECT s.name FROM services s WHERE s.id = specialist_services.service_id) AS service_name',
});

const SpecialistAccreditationsAdmin = createSpecialistChildAdmin({
  table: 'specialist_accreditations',
  fields: SPECIALIST_ACCREDITATION_FIELDS,
  orderBy: 'specialist_id ASC, expiry_date DESC, id DESC',
  sortOptions: [
    { key: 'default', label: 'По специалисту и сроку действия', orderBy: 'specialist_id ASC, expiry_date DESC, id DESC' },
    ...idSort(),
  ],
  searchFields: [
    specialistNameSearch('specialist_accreditations'),
    'document_type',
    'specialty',
    'note',
  ],
  publicColumns:
    '*, (SELECT sp.full_name FROM specialists sp WHERE sp.id = specialist_accreditations.specialist_id) AS specialist_name',
});

module.exports = {
  PriceListsCrud,
  PriceCategoriesCrud,
  ServiceSectionsCrud,
  ServiceSubsectionsCrud,
  ServicesCrud,
  ServiceProblems,
  ServiceTypes,
  ServiceResults,
  ServiceProblemsAdmin,
  ServiceTypesAdmin,
  ServiceResultsAdmin,
  ServiceSpecialists,
  PromotionsCrud,
  ProjectsCrud,
  ProjectDetails,
  ProjectSeasons,
  ProjectParticipants,
  ProjectExperts,
  ProjectPartners,
  ProjectWorkFormats,
  ProjectStages,
  FillProjectPartnersCount,
  ProjectDetailsAdmin,
  ProjectSeasonsAdmin,
  ProjectParticipantsAdmin,
  ProjectExpertsAdmin,
  ProjectPartnersAdmin,
  ProjectWorkFormatsAdmin,
  ProjectStagesAdmin,
  NewsCrud,
  SpecialistsCrud,
  SpecialistExperience,
  SpecialistOperations,
  SpecialistPositiveReviews,
  SpecialistServices,
  SpecialistEducation,
  SpecialistAccreditations,
  SpecialistExperienceAdmin,
  SpecialistOperationsAdmin,
  SpecialistPositiveReviewsAdmin,
  SpecialistEducationAdmin,
  SpecialistServicesAdmin,
  SpecialistAccreditationsAdmin,
};
