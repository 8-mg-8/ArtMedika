'use client';

import { useState } from 'react';
import { api, clearToken, lookups } from '@/lib/api';
import {
  Crud,
  ChildrenPanel,
  type ChildSection,
  type ColumnConfig,
  type CrudApi,
  type FieldConfig,
} from '@/components/Crud';
import styles from '../dashboard.module.css';

type Props = {
  onLogout: () => void;
};

type SectionDef = {
  key: string;
  label: string;
  make: () => CrudApi;
  columns: ColumnConfig[];
  fields: FieldConfig[];
  defaults?: Record<string, unknown>;
  searchPlaceholder?: string;
  children?: ChildSection[];
};

type NavGroup = {
  key: string;
  label: string;
  sections: SectionDef[];
};

const boolCol = (label: string, key: string): ColumnConfig => ({
  key,
  label,
  render: (row) => (row[key] ? 'Да' : 'Нет'),
});

const short = (key: string, max = 60): ColumnConfig['render'] => (row) => {
  const text = String(row[key] ?? '');
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

const textCol = (key: string, label: string, max = 60): ColumnConfig => ({
  key,
  label,
  render: short(key, max),
});

// Фото: показываем миниатюру вместо пути к файлу
const photoCol = (key: string, label: string): ColumnConfig => ({
  key,
  label,
  render: (row) => {
    const path = row[key] ? String(row[key]) : '';
    if (!path) return '—';
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/${path}`}
        alt={String(row.photo_alt ?? '')}
        className={styles.thumb}
        loading="lazy"
      />
    );
  },
});

// ============================================================
// РАЗДЕЛЫ И ПОДРАЗДЕЛЫ УСЛУГ
// ============================================================

const serviceSectionsSection: SectionDef = {
  key: 'serviceSections',
  label: 'Разделы услуг',
  make: () => api.serviceSections,
  searchPlaceholder: 'Поиск по названию раздела...',
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Название' },
  ],
  fields: [
    { name: 'name', label: 'Название раздела', type: 'text', required: true, wide: true },
  ],
  defaults: {},
};

const serviceSubsectionsSection: SectionDef = {
  key: 'serviceSubsections',
  label: 'Подразделы услуг',
  make: () => api.serviceSubsections,
  searchPlaceholder: 'Поиск по названию подраздела...',
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'section_name', label: 'Раздел', render: (row) => String(row.section_name ?? '—') },
    { key: 'name', label: 'Название' },
    photoCol('photo_path', 'Фото'),
  ],
  fields: [
    {
      name: 'section_id',
      label: 'Раздел',
      type: 'select',
      required: true,
      optionsLoad: lookups.serviceSections,
    },
    { name: 'name', label: 'Название подраздела', type: 'text', required: true, wide: true },
    { name: 'photo_path', label: 'Фотография', type: 'file', folder: 'services' },
    { name: 'photo_alt', label: 'Alt фотографии', type: 'text', wide: true },
  ],
  defaults: {},
};

// ============================================================
// УСЛУГИ + вложенные таблицы
// ============================================================

const serviceChildren: ChildSection[] = [
  {
    key: 'problems',
    label: 'Проблемы позволяет решить',
    make: (id) => api.serviceProblems(id),
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'title', label: 'Название' },
      textCol('description', 'Описание проблемы', 60),
    ],
    fields: [
      { name: 'title', label: 'Название проблемы', type: 'text', required: true, wide: true },
      { name: 'description', label: 'Описание проблемы', type: 'textarea', wide: true },
      ],
    defaults: {},
  },
  {
    key: 'types',
    label: 'Виды',
    make: (id) => api.serviceTypes(id),
    columns: [
      { key: 'id', label: 'ID' },
      textCol('description', 'Описание', 50),
      photoCol('photo_before_1_path', 'До (1)'),
      photoCol('photo_after_1_path', 'После (1)'),
      photoCol('photo_before_2_path', 'До (2)'),
      photoCol('photo_after_2_path', 'После (2)'),
    ],
    fields: [
      { name: 'description', label: 'Описание', type: 'textarea', wide: true },
      { name: 'photo_before_1_path', label: 'Фото до (1)', type: 'file', folder: 'services' },
      { name: 'photo_after_1_path', label: 'Фото после (1)', type: 'file', folder: 'services' },
      { name: 'photo_before_2_path', label: 'Фото до (2)', type: 'file', folder: 'services' },
      { name: 'photo_after_2_path', label: 'Фото после (2)', type: 'file', folder: 'services' },
      ],
    defaults: {},
  },
  {
    key: 'results',
    label: 'Результаты процедуры',
    make: (id) => api.serviceResults(id),
    columns: [
      { key: 'id', label: 'ID' },
      photoCol('photo_before_path', 'Фото до'),
      photoCol('photo_after_path', 'Фото после'),
    ],
    fields: [
      { name: 'photo_before_path', label: 'Фото до', type: 'file', folder: 'services' },
      { name: 'photo_after_path', label: 'Фото после', type: 'file', folder: 'services' },
      ],
    defaults: {},
  },
  {
    key: 'specialists',
    label: 'Специалисты',
    make: (id) => api.serviceSpecialists(id),
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'specialist_name', label: 'Специалист' },
    ],
    fields: [
      {
        name: 'specialist_id',
        label: 'Специалист',
        type: 'select',
        required: true,
        optionsLoad: lookups.specialists,
      },
      ],
    defaults: {},
  },
];

const servicesSection: SectionDef = {
  key: 'services',
  label: 'Услуги',
  make: () => api.services,
  searchPlaceholder: 'Поиск по названию, описанию...',
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Название' },
    { key: 'slug', label: 'Slug' },
    { key: 'section_name', label: 'Раздел', render: (row) => String(row.section_name ?? '—') },
    {
      key: 'subsection_name',
      label: 'Подраздел',
      render: (row) => String(row.subsection_name ?? '—'),
    },
  ],
  fields: [
    {
      name: 'subsection_id',
      label: 'Подраздел',
      type: 'select',
      required: true,
      optionsLoad: lookups.serviceSubsections,
    },
    { name: 'name', label: 'Название', type: 'text', required: true, wide: true },
    { name: 'description', label: 'Описание процедуры', type: 'textarea', wide: true },
    { name: 'preparation', label: 'Подготовка к операции', type: 'textarea', wide: true },
    { name: 'execution', label: 'Способ выполнения', type: 'textarea', wide: true },
  ],
  defaults: {},
  children: serviceChildren,
};

// ============================================================
// ПРОБЛЕМЫ, ВИДЫ И РЕЗУЛЬТАТЫ УСЛУГ
// ============================================================

const serviceProblemsSection: SectionDef = {
  key: 'serviceProblems',
  label: 'Проблемы услуг',
  make: () => api.serviceProblemsAdmin,
  searchPlaceholder: 'Поиск по услуге, названию, описанию...',
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'service_name', label: 'Услуга', render: (row) => String(row.service_name ?? '—') },
    textCol('title', 'Название', 50),
    textCol('description', 'Описание', 60),
  ],
  fields: [
    {
      name: 'service_id',
      label: 'Услуга',
      type: 'select',
      required: true,
      optionsLoad: lookups.services,
    },
    { name: 'title', label: 'Название проблемы', type: 'text', required: true, wide: true },
    { name: 'description', label: 'Описание проблемы', type: 'textarea', wide: true },
  ],
  defaults: {},
};

const serviceTypesSection: SectionDef = {
  key: 'serviceTypes',
  label: 'Виды услуг',
  make: () => api.serviceTypesAdmin,
  searchPlaceholder: 'Поиск по услуге, описанию...',
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'service_name', label: 'Услуга', render: (row) => String(row.service_name ?? '—') },
    textCol('description', 'Описание', 50),
    photoCol('photo_before_1_path', 'До (1)'),
    photoCol('photo_after_1_path', 'После (1)'),
    photoCol('photo_before_2_path', 'До (2)'),
    photoCol('photo_after_2_path', 'После (2)'),
  ],
  fields: [
    {
      name: 'service_id',
      label: 'Услуга',
      type: 'select',
      required: true,
      optionsLoad: lookups.services,
    },
    { name: 'description', label: 'Описание', type: 'textarea', wide: true },
    { name: 'photo_before_1_path', label: 'Фото до (1)', type: 'file', folder: 'services' },
    { name: 'photo_after_1_path', label: 'Фото после (1)', type: 'file', folder: 'services' },
    { name: 'photo_before_2_path', label: 'Фото до (2)', type: 'file', folder: 'services' },
    { name: 'photo_after_2_path', label: 'Фото после (2)', type: 'file', folder: 'services' },
  ],
  defaults: {},
};

const serviceResultsSection: SectionDef = {
  key: 'serviceResults',
  label: 'Результаты процедур',
  make: () => api.serviceResultsAdmin,
  searchPlaceholder: 'Поиск по услуге, фото...',
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'service_name', label: 'Услуга', render: (row) => String(row.service_name ?? '—') },
    photoCol('photo_before_path', 'Фото до'),
    photoCol('photo_after_path', 'Фото после'),
  ],
  fields: [
    {
      name: 'service_id',
      label: 'Услуга',
      type: 'select',
      required: true,
      optionsLoad: lookups.services,
    },
    { name: 'photo_before_path', label: 'Фото до', type: 'file', folder: 'services' },
    { name: 'photo_after_path', label: 'Фото после', type: 'file', folder: 'services' },
  ],
  defaults: {},
};

// ============================================================
// АКЦИИ
// ============================================================

const promotionsSection: SectionDef = {
  key: 'promotions',
  label: 'Акции',
  make: () => api.promotions,
  searchPlaceholder: 'Поиск по названию, описанию...',
  columns: [
    { key: 'id', label: 'ID' },
    textCol('title', 'Название', 50),
    { key: 'slug', label: 'Slug' },
    textCol('short_description', 'Краткое описание', 50),
    { key: 'promotion_date', label: 'Дата акции' },
    photoCol('photo_path', 'Фото'),
  ],
  fields: [
    { name: 'title', label: 'Название акции', type: 'text', required: true, wide: true },
    { name: 'short_description', label: 'Краткое описание', type: 'textarea', wide: true },
    { name: 'full_description', label: 'Полное описание', type: 'textarea', wide: true },
    { name: 'promotion_date', label: 'Дата акции', type: 'date' },
    { name: 'photo_path', label: 'Фото', type: 'file', folder: 'promotions' },
    { name: 'photo_alt', label: 'Alt фото', type: 'text' },
  ],
  defaults: {},
};

// ============================================================
// ПРОЕКТЫ + вложенные таблицы
// ============================================================

const projectChildren: ChildSection[] = [
  {
    key: 'details',
    label: 'Описание проекта',
    make: (id) => api.projectDetails(id),
    columns: [
      { key: 'id', label: 'ID' },
      textCol('context_description', 'Описание 1', 60),
      textCol('project_description', 'Описание 2', 60),
    ],
    fields: [
      { name: 'context_description', label: 'Описание 1', type: 'textarea', wide: true },
      { name: 'project_description', label: 'Описание 2', type: 'textarea', wide: true },
    ],
  },
  {
    key: 'partners',
    label: 'Партнёры',
    make: (id) => api.projectPartners(id),
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'title', label: 'Партнёр' },
      textCol('description', 'Описание', 50),
    ],
    fields: [
      { name: 'title', label: 'Название партнёра', type: 'text', required: true, wide: true },
      { name: 'description', label: 'Описание', type: 'textarea', wide: true },
      ],
    defaults: {},
  },
  {
    key: 'workFormats',
    label: 'Форматы работ',
    make: (id) => api.projectWorkFormats(id),
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'title', label: 'Название' },
      textCol('description', 'Описание', 50),
      photoCol('photo_path', 'Фото'),
    ],
    fields: [
      { name: 'title', label: 'Название формата', type: 'text', required: true, wide: true },
      { name: 'description', label: 'Описание', type: 'textarea', wide: true },
      { name: 'photo_path', label: 'Фотография', type: 'file', folder: 'projects' },
      { name: 'photo_alt', label: 'Alt фото', type: 'text' },
      ],
    defaults: {},
  },
  {
    key: 'stages',
    label: 'Этапы',
    make: (id) => api.projectStages(id),
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'stage_number', label: '№' },
      textCol('description', 'Описание', 60),
    ],
    fields: [
      { name: 'stage_number', label: 'Номер этапа', type: 'number', required: true, wide: true },
      { name: 'description', label: 'Описание этапа', type: 'textarea', wide: true },
      ],
    defaults: {},
  },
];

const projectsSection: SectionDef = {
  key: 'projects',
  label: 'Проекты',
  make: () => api.projects,
  searchPlaceholder: 'Поиск по названию, описанию, slug...',
  columns: [
    { key: 'id', label: 'ID' },
    textCol('title', 'Название', 50),
    { key: 'slug', label: 'Slug' },
    { key: 'project_date', label: 'Дата' },
    { key: 'seasons_count', label: 'Сезоны' },
    { key: 'participants_count', label: 'Участники' },
    { key: 'experts_count', label: 'Эксперты' },
    { key: 'partners_count', label: 'Партнёры' },
    photoCol('photo_path', 'Фото'),
    photoCol('photo_2_path', 'Доп. фото 1'),
    photoCol('photo_3_path', 'Доп. фото 2'),
  ],
  fields: [
    { name: 'title', label: 'Название проекта', type: 'text', required: true, wide: true },
    { name: 'description', label: 'Краткое описание', type: 'textarea', wide: true },
    { name: 'project_date', label: 'Дата проекта', type: 'date' },
    { name: 'seasons_count', label: 'Количество сезонов', type: 'number' },
    { name: 'participants_count', label: 'Количество участников', type: 'number' },
    { name: 'experts_count', label: 'Количество экспертов', type: 'number' },
    {
      name: 'partners_count',
      label: 'Количество партнёров',
      type: 'number',
      action: {
        label: 'Заполнить автоматически',
        onClick: async ({ row, setValue }) => {
          if (!row || typeof row.id !== 'number') {
            throw new Error('Сначала сохраните проект');
          }
          const count = await api.fillProjectPartnersCount(row.id);
          setValue('partners_count', count);
        },
      },
    },
    { name: 'photo_path', label: 'Фото', type: 'file', folder: 'projects' },
    { name: 'photo_alt', label: 'Alt фото', type: 'text' },
    { name: 'photo_2_path', label: 'Доп. фотография 1', type: 'file', folder: 'projects' },
    { name: 'photo_2_alt', label: 'Alt доп. фото 1', type: 'text' },
    { name: 'photo_3_path', label: 'Доп. фотография 2', type: 'file', folder: 'projects' },
    { name: 'photo_3_alt', label: 'Alt доп. фото 2', type: 'text' },
  ],
  defaults: {
    seasons_count: 0,
    participants_count: 0,
    experts_count: 0,
    partners_count: 0,
  },
  children: projectChildren,
};

function buildProjectAdminSection({
  key,
  label,
  make,
  childKey,
  searchPlaceholder,
}: {
  key: string;
  label: string;
  make: () => CrudApi;
  childKey: string;
  searchPlaceholder: string;
}): SectionDef {
  const child = projectChildren.find((section) => section.key === childKey);
  if (!child) throw new Error(`Не найден раздел проекта: ${childKey}`);

  return {
    key,
    label,
    make,
    searchPlaceholder,
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'project_name', label: 'Проект', render: (row) => String(row.project_name ?? '—') },
      ...child.columns.filter((column) => column.key !== 'id'),
    ],
    fields: [
      {
        name: 'project_id',
        label: 'Проект',
        type: 'select',
        required: true,
        optionsLoad: lookups.projects,
      },
      ...child.fields,
    ],
    defaults: child.defaults,
  };
}

const projectDetailsSection = buildProjectAdminSection({
  key: 'projectDetailsAdmin',
  label: 'Описание проекта',
  make: () => api.projectDetailsAdmin,
  childKey: 'details',
  searchPlaceholder: 'Поиск по проекту, описанию...',
});

const projectPartnersSection = buildProjectAdminSection({
  key: 'projectPartnersAdmin',
  label: 'Партнёры проектов',
  make: () => api.projectPartnersAdmin,
  childKey: 'partners',
  searchPlaceholder: 'Поиск по проекту, партнёру, описанию...',
});

const projectWorkFormatsSection = buildProjectAdminSection({
  key: 'projectWorkFormatsAdmin',
  label: 'Форматы работ проектов',
  make: () => api.projectWorkFormatsAdmin,
  childKey: 'workFormats',
  searchPlaceholder: 'Поиск по проекту, названию, описанию...',
});

const projectStagesSection = buildProjectAdminSection({
  key: 'projectStagesAdmin',
  label: 'Этапы проектов',
  make: () => api.projectStagesAdmin,
  childKey: 'stages',
  searchPlaceholder: 'Поиск по проекту, номеру этапа, описанию...',
});

// ============================================================
// НОВОСТИ
// ============================================================

const newsSection: SectionDef = {
  key: 'news',
  label: 'Новости',
  make: () => api.news,
  searchPlaceholder: 'Поиск по заголовку, тексту, slug...',
  columns: [
    { key: 'id', label: 'ID' },
    textCol('title', 'Заголовок', 60),
    { key: 'slug', label: 'Slug' },
    { key: 'news_date', label: 'Дата' },
    photoCol('photo_path', 'Фото'),
  ],
  fields: [
    { name: 'title', label: 'Заголовок новости', type: 'text', required: true, wide: true },
    { name: 'full_text', label: 'Большое описание', type: 'textarea', wide: true },
    { name: 'photo_path', label: 'Фото', type: 'file', folder: 'news' },
    { name: 'photo_alt', label: 'Alt фото', type: 'text' },
    { name: 'news_date', label: 'Дата публикации', type: 'date' },
  ],
  defaults: {},
};

// ============================================================
// СПЕЦИАЛИСТЫ + вложенные таблицы
// ============================================================

const specialistChildren: ChildSection[] = [
  {
    key: 'services',
    label: 'Направления (услуги)',
    make: (id) => api.specialistServices(id),
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'service_name', label: 'Услуга' },
    ],
    fields: [
      {
        name: 'service_id',
        label: 'Услуга',
        type: 'select',
        required: true,
        optionsLoad: lookups.services,
      },
    ],
    defaults: { is_primary: false },
  },
  {
    key: 'education',
    label: 'Образование',
    make: (id) => api.specialistEducation(id),
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'education_level', label: 'Уровень' },
      textCol('organization', 'Организация', 50),
      { key: 'year_issued', label: 'Год' },
      { key: 'qualification', label: 'Квалификация' },
    ],
    fields: [
      { name: 'education_level', label: 'Уровень образования', type: 'text', required: true },
      { name: 'organization', label: 'Образовательная организация', type: 'text', required: true, wide: true },
      { name: 'year_issued', label: 'Год выдачи', type: 'year', required: true },
      { name: 'qualification', label: 'Квалификация', type: 'text', required: true },
    ],
    defaults: {},
  },
  {
    key: 'accreditations',
    label: 'Аккредитация',
    make: (id) => api.specialistAccreditations(id),
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'document_type', label: 'Тип документа' },
      { key: 'specialty', label: 'Специальность' },
      { key: 'issue_date', label: 'Выдан' },
      { key: 'expiry_date', label: 'Действует до' },
      textCol('note', 'Примечание', 40),
    ],
    fields: [
      { name: 'document_type', label: 'Тип документа', type: 'text', required: true },
      { name: 'specialty', label: 'Специальность', type: 'text', required: true, wide: true },
      { name: 'position_title', label: 'Должность', type: 'text', wide: true },
      { name: 'issue_date', label: 'Дата выдачи', type: 'date', required: true },
      { name: 'expiry_date', label: 'Срок действия', type: 'date', required: true },
      { name: 'note', label: 'Примечание', type: 'text', wide: true },
    ],
    defaults: {},
  },
];

const specialistsSection: SectionDef = {
  key: 'specialists',
  label: 'Специалисты',
  make: () => api.specialists,
  searchPlaceholder: 'Поиск по ФИО, должности...',
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'full_name', label: 'ФИО' },
    { key: 'slug', label: 'Slug' },
    photoCol('photo_path', 'Фото'),
    { key: 'position', label: 'Должность' },
    { key: 'experience_since', label: 'Стаж с' },
    { key: 'operations_count', label: 'Операций' },
    { key: 'positive_reviews_percent', label: 'Полож. отзывы, %' },
    boolCol('Рекомендуемый', 'is_featured'),
  ],
  fields: [
    { name: 'last_name', label: 'Фамилия', type: 'text', required: true },
    { name: 'first_name', label: 'Имя', type: 'text', required: true },
    { name: 'middle_name', label: 'Отчество', type: 'text' },
    { name: 'short_description', label: 'Краткое описание', type: 'textarea', wide: true },
    { name: 'description', label: 'Основное описание', type: 'textarea', wide: true },
    { name: 'operations_result', label: 'Результат операций', type: 'textarea', wide: true },
    { name: 'experience_since', label: 'Год начала стажа', type: 'year' },
    { name: 'operations_count', label: 'Количество операций', type: 'number' },
    { name: 'positive_reviews_percent', label: 'Положительные отзывы, %', type: 'number' },
    { name: 'photo_path', label: 'Фото', type: 'file', folder: 'specialists' },
    { name: 'photo_alt', label: 'Alt фото', type: 'text', wide: true },
  ],
  defaults: { operations_count: 0 },
  children: specialistChildren,
};

// ============================================================
// ОБРАЗОВАНИЕ, УСЛУГИ И АККРЕДИТАЦИИ СПЕЦИАЛИСТОВ
// ============================================================

const specialistExperienceSection: SectionDef = {
  key: 'specialistExperienceAdmin',
  label: 'Стаж',
  make: () => api.specialistExperienceAdmin,
  searchPlaceholder: 'Поиск по специалисту, названию, описанию...',
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'specialist_name', label: 'Специалист', render: (row) => String(row.specialist_name ?? '-') },
    { key: 'title', label: 'Название' },
    textCol('description', 'Описание', 50),
  ],
  fields: [
    {
      name: 'specialist_id',
      label: 'Специалист',
      type: 'select',
      required: true,
      optionsLoad: lookups.specialists,
    },
    { name: 'title', label: 'Название', type: 'text', required: true, wide: true },
    { name: 'description', label: 'Описание', type: 'textarea', wide: true },
  ],
  defaults: {},
};

const specialistOperationsSection: SectionDef = {
  key: 'specialistOperationsAdmin',
  label: 'Операции в клинике',
  make: () => api.specialistOperationsAdmin,
  searchPlaceholder: 'Поиск по специалисту, названию, описанию...',
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'specialist_name', label: 'Специалист', render: (row) => String(row.specialist_name ?? '-') },
    { key: 'title', label: 'Название' },
    textCol('description', 'Описание', 50),
  ],
  fields: [
    {
      name: 'specialist_id',
      label: 'Специалист',
      type: 'select',
      required: true,
      optionsLoad: lookups.specialists,
    },
    { name: 'title', label: 'Название операции', type: 'text', required: true, wide: true },
    { name: 'description', label: 'Описание', type: 'textarea', wide: true },
  ],
  defaults: {},
};

const specialistPositiveReviewsSection: SectionDef = {
  key: 'specialistPositiveReviewsAdmin',
  label: 'Положительные отзывы',
  make: () => api.specialistPositiveReviewsAdmin,
  searchPlaceholder: 'Поиск по специалисту, заголовку, тексту...',
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'specialist_name', label: 'Специалист', render: (row) => String(row.specialist_name ?? '-') },
    { key: 'title', label: 'Заголовок' },
    textCol('description', 'Текст', 50),
  ],
  fields: [
    {
      name: 'specialist_id',
      label: 'Специалист',
      type: 'select',
      required: true,
      optionsLoad: lookups.specialists,
    },
    { name: 'title', label: 'Заголовок отзыва', type: 'text', required: true, wide: true },
    { name: 'description', label: 'Текст отзыва', type: 'textarea', wide: true },
  ],
  defaults: {},
};

const specialistEducationSection: SectionDef = {
  key: 'specialistEducationAdmin',
  label: 'Образование специалистов',
  make: () => api.specialistEducationAdmin,
  searchPlaceholder: 'Поиск по специалисту, организации, квалификации...',
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'specialist_name', label: 'Специалист', render: (row) => String(row.specialist_name ?? '—') },
    { key: 'education_level', label: 'Уровень' },
    textCol('organization', 'Организация', 50),
    { key: 'year_issued', label: 'Год' },
    { key: 'qualification', label: 'Квалификация' },
  ],
  fields: [
    {
      name: 'specialist_id',
      label: 'Специалист',
      type: 'select',
      required: true,
      optionsLoad: lookups.specialists,
    },
    { name: 'education_level', label: 'Уровень образования', type: 'text', required: true },
    { name: 'organization', label: 'Образовательная организация', type: 'text', required: true, wide: true },
    { name: 'year_issued', label: 'Год выдачи', type: 'year', required: true },
    { name: 'qualification', label: 'Квалификация', type: 'text', required: true },
  ],
  defaults: {},
};

const specialistServicesSection: SectionDef = {
  key: 'specialistServicesAdmin',
  label: 'Услуги специалистов',
  make: () => api.specialistServicesAdmin,
  searchPlaceholder: 'Поиск по специалисту, услуге...',
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'specialist_name', label: 'Специалист', render: (row) => String(row.specialist_name ?? '—') },
    { key: 'service_name', label: 'Услуга', render: (row) => String(row.service_name ?? '—') },
  ],
  fields: [
    {
      name: 'specialist_id',
      label: 'Специалист',
      type: 'select',
      required: true,
      optionsLoad: lookups.specialists,
    },
    {
      name: 'service_id',
      label: 'Услуга',
      type: 'select',
      required: true,
      optionsLoad: lookups.services,
    },
  ],
  defaults: { is_primary: false },
};

const specialistAccreditationsSection: SectionDef = {
  key: 'specialistAccreditationsAdmin',
  label: 'Аккредитации специалистов',
  make: () => api.specialistAccreditationsAdmin,
  searchPlaceholder: 'Поиск по специалисту, специальности, документу...',
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'specialist_name', label: 'Специалист', render: (row) => String(row.specialist_name ?? '—') },
    { key: 'document_type', label: 'Тип документа' },
    { key: 'specialty', label: 'Специальность' },
    { key: 'issue_date', label: 'Выдан' },
    { key: 'expiry_date', label: 'Действует до' },
    textCol('note', 'Примечание', 40),
  ],
  fields: [
    {
      name: 'specialist_id',
      label: 'Специалист',
      type: 'select',
      required: true,
      optionsLoad: lookups.specialists,
    },
    { name: 'document_type', label: 'Тип документа', type: 'text', required: true },
    { name: 'specialty', label: 'Специальность', type: 'text', required: true, wide: true },
    { name: 'position_title', label: 'Должность', type: 'text', wide: true },
    { name: 'issue_date', label: 'Дата выдачи', type: 'date', required: true },
    { name: 'expiry_date', label: 'Срок действия', type: 'date', required: true },
    { name: 'note', label: 'Примечание', type: 'text', wide: true },
  ],
  defaults: {},
};

// ============================================================
// ЦЕНЫ НА УСЛУГИ (БЕЗ ИЗМЕНЕНИЙ)
// ============================================================

const pricesSection: SectionDef = {
  key: 'prices',
  label: 'Цены на услуги',
  make: () => api.priceLists,
  searchPlaceholder: 'Поиск по наименованию...',
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Наименование' },
    { key: 'price_from', label: 'Цена от, ₽' },
  ],
  fields: [
    { name: 'name', label: 'Наименование', type: 'text', required: true, wide: true },
    { name: 'price_from', label: 'Цена от, ₽', type: 'number' },
  ],
  defaults: {},
};

const priceCategoriesSection: SectionDef = {
  key: 'priceCategories',
  label: 'Категории цены на услуги',
  make: () => api.priceCategories,
  searchPlaceholder: 'Поиск по цене, коду, наименованию...',
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'price_name', label: 'Цены на услуги', render: (row) => String(row.price_name ?? '-') },
    { key: 'service_code', label: 'Код Номенклатуры мед услуг' },
    { key: 'mics_code', label: 'Код МИС' },
    textCol('service_name', 'Наименование медицинской услуги', 70),
    { key: 'category', label: 'Категория' },
    { key: 'duration_min', label: 'Время, мин' },
    { key: 'price', label: 'Цена, ₽' },
    { key: 'price_category_1', label: 'Цена, категория I, ₽' },
    { key: 'price_category_2', label: 'Цена, категория II, ₽' },
    { key: 'price_category_3', label: 'Цена, категория III, ₽' },
    { key: 'price_single', label: 'Единая цена, ₽' },
  ],
  fields: [
    {
      name: 'price_id',
      label: 'Цены на услуги',
      type: 'select',
      required: true,
      optionsLoad: lookups.priceLists,
    },
    { name: 'service_code', label: 'Код Номенклатуры мед услуг', type: 'text' },
    { name: 'mics_code', label: 'Код МИС', type: 'text' },
    { name: 'service_name', label: 'Наименование медицинской услуги', type: 'textarea', required: true, wide: true },
    { name: 'category', label: 'Категория', type: 'text' },
    { name: 'duration_min', label: 'Время, мин', type: 'number' },
    { name: 'price', label: 'Цена, ₽', type: 'number' },
    { name: 'price_category_1', label: 'Цена, категория I, ₽', type: 'number' },
    { name: 'price_category_2', label: 'Цена, категория II, ₽', type: 'number' },
    { name: 'price_category_3', label: 'Цена, категория III, ₽', type: 'number' },
    { name: 'price_single', label: 'Единая цена, ₽', type: 'number' },
  ],
  defaults: {},
};

// ============================================================

const NAV_GROUPS: NavGroup[] = [
  {
    key: 'services',
    label: 'Услуги',
    sections: [
      serviceSectionsSection,
      serviceSubsectionsSection,
      servicesSection,
      serviceProblemsSection,
      serviceTypesSection,
      serviceResultsSection,
    ],
  },
  {
    key: 'projects',
    label: 'Проекты',
    sections: [
      projectsSection,
      projectDetailsSection,
      projectPartnersSection,
      projectWorkFormatsSection,
      projectStagesSection,
    ],
  },
  {
    key: 'specialists',
    label: 'Специалисты',
    sections: [
      specialistsSection,
      specialistExperienceSection,
      specialistOperationsSection,
      specialistPositiveReviewsSection,
      specialistEducationSection,
      specialistServicesSection,
      specialistAccreditationsSection,
    ],
  },
  {
    key: 'content',
    label: 'Новости и акции',
    sections: [promotionsSection, newsSection],
  },
  {
    key: 'prices',
    label: 'Цены',
    sections: [pricesSection, priceCategoriesSection],
  },
];

const SECTIONS: SectionDef[] = NAV_GROUPS.flatMap((group) => group.sections);

// ============================================================
// Страница админ-панели
// ============================================================

export default function DashboardPage({ onLogout }: Props) {
  const [tab, setTab] = useState(SECTIONS[0].key);
  const [openGroup, setOpenGroup] = useState<string | null>(() => {
    const group = NAV_GROUPS.find((item) =>
      item.sections.some((section) => section.key === SECTIONS[0].key),
    );
    return group?.key ?? null;
  });
  const current = SECTIONS.find((s) => s.key === tab) ?? SECTIONS[0];

  const handleLogout = () => {
    clearToken();
    onLogout();
  };

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <h1 className={styles.sidebarTitle}>Арт-Медика</h1>
        <p className={styles.muted}>Админ-панель</p>
        {NAV_GROUPS.map((group) => {
          if (group.sections.length === 1) {
            const section = group.sections[0];
            return (
              <button
                key={section.key}
                type="button"
                className={`${styles.navBtn} ${tab === section.key ? styles.navBtnActive : ''}`}
                onClick={() => setTab(section.key)}
              >
                {section.label}
              </button>
            );
          }

          const isOpen = openGroup === group.key;
          const isActive = group.sections.some((section) => section.key === tab);

          return (
            <div key={group.key} className={styles.navGroup}>
              <button
                type="button"
                className={`${styles.navGroupBtn} ${isActive ? styles.navGroupBtnActive : ''}`}
                onClick={() => setOpenGroup(isOpen ? null : group.key)}
                aria-expanded={isOpen}
              >
                <span>{group.label}</span>
                <span
                  className={`${styles.navChevron} ${isOpen ? styles.navChevronOpen : ''}`}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>
              {isOpen ? (
                <div className={styles.navGroupItems}>
                  {group.sections.map((section) => (
                    <button
                      key={section.key}
                      type="button"
                      className={`${styles.navBtn} ${tab === section.key ? styles.navBtnActive : ''}`}
                      onClick={() => setTab(section.key)}
                    >
                      {section.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
        <button type="button" className={`${styles.navBtn} ${styles.navLogout}`} onClick={handleLogout}>
          Выйти
        </button>
      </aside>

      <main className={styles.content}>
        <Crud
          key={current.key}
          api={current.make()}
          title={current.label}
          columns={current.columns}
          fields={current.fields}
          defaults={current.defaults}
          searchPlaceholder={current.searchPlaceholder}
          details={
            current.children
              ? (parentId) => <ChildrenPanel sections={current.children!} parentId={parentId} />
              : undefined
          }
        />
      </main>
    </div>
  );
}
