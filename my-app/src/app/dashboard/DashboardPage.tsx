'use client';

import { useState } from 'react';
import { api, clearToken } from '@/lib/api';
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

const boolCol = (label: string, key = 'is_active'): ColumnConfig => ({
  key,
  label,
  render: (row) => (row[key] ? 'Да' : 'Нет'),
});

const short = (key: string, max = 60): ColumnConfig['render'] => (row) => {
  const text = String(row[key] ?? '');
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

// ============================================================
// РАЗДЕЛЫ ПРАЙС-ЛИСТА
// ============================================================

const priceSectionsSection: SectionDef = {
  key: 'priceSections',
  label: 'Разделы прайса',
  make: () => api.priceSections,
  searchPlaceholder: 'Поиск по названию раздела...',
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'section_name', label: 'Название' },
    { key: 'min_price', label: 'Мин. цена' },
    { key: 'sort_order', label: 'Порядок' },
    boolCol('Активен'),
  ],
  fields: [
    { name: 'section_name', label: 'Название раздела', type: 'text', required: true },
    { name: 'min_price', label: 'Минимальная цена, ₽', type: 'number' },
    { name: 'sort_order', label: 'Порядок сортировки', type: 'number' },
    { name: 'is_active', label: 'Активен', type: 'bool' },
  ],
  defaults: { is_active: true, sort_order: 0 },
};

const pricesSection: SectionDef = {
  key: 'prices',
  label: 'Цены на услуги',
  make: () => api.prices,
  searchPlaceholder: 'Поиск по наименованию, коду, категории...',
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'service_code', label: 'Код' },
    { key: 'mics_code', label: 'Код МИС' },
    { key: 'service_name', label: 'Наименование', render: short('service_name', 70) },
    { key: 'category', label: 'Категория' },
    {
      key: 'price_single',
      label: 'Цена, ₽',
      render: (row) => {
        if (row.price_single !== null && row.price_single !== undefined) return String(row.price_single);
        const cats = [row.price_category_1, row.price_category_2, row.price_category_3]
          .filter((v) => v !== null && v !== undefined)
          .join(' / ');
        return cats || '—';
      },
    },
    boolCol('Активен'),
  ],
  fields: [
    { name: 'section_id', label: 'ID раздела прайса', type: 'number' },
    { name: 'service_code', label: 'Код номенклатуры', type: 'text' },
    { name: 'mics_code', label: 'Код МИС', type: 'text' },
    { name: 'service_name', label: 'Наименование медицинской услуги', type: 'textarea', required: true, wide: true },
    { name: 'category', label: 'Категория', type: 'text' },
    { name: 'duration_min', label: 'Длительность, мин', type: 'number' },
    { name: 'price_category_1', label: 'Цена, категория I, ₽', type: 'number' },
    { name: 'price_category_2', label: 'Цена, категория II, ₽', type: 'number' },
    { name: 'price_category_3', label: 'Цена, категория III, ₽', type: 'number' },
    { name: 'price_single', label: 'Единая цена, ₽', type: 'number' },
    { name: 'price_note', label: 'Примечание к цене', type: 'text' },
    { name: 'section_name', label: 'Раздел прайса (текст)', type: 'text' },
    { name: 'section_min_price', label: 'Мин. цена раздела, ₽', type: 'number' },
    { name: 'sort_order', label: 'Порядок сортировки', type: 'number' },
    { name: 'is_active', label: 'Активен', type: 'bool' },
  ],
  defaults: { is_active: true, sort_order: 0 },
};

// ============================================================
// УСЛУГИ И КАТЕГОРИИ
// ============================================================

const serviceCategoriesSection: SectionDef = {
  key: 'serviceCategories',
  label: 'Категории услуг',
  make: () => api.serviceCategories,
  searchPlaceholder: 'Поиск по названию категории...',
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Название' },
    { key: 'parent_id', label: 'Родитель (ID)' },
    { key: 'sort_order', label: 'Порядок' },
    boolCol('Активна'),
  ],
  fields: [
    { name: 'name', label: 'Название категории', type: 'text', required: true },
    { name: 'parent_id', label: 'Родительская категория (ID)', type: 'number' },
    { name: 'sort_order', label: 'Порядок сортировки', type: 'number' },
    { name: 'is_active', label: 'Активна', type: 'bool' },
  ],
  defaults: { is_active: true, sort_order: 0 },
};

const servicesSection: SectionDef = {
  key: 'services',
  label: 'Услуги',
  make: () => api.services,
  searchPlaceholder: 'Поиск по названию, категории, описанию...',
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'category', label: 'Категория' },
    { key: 'subcategory', label: 'Подкатегория' },
    { key: 'service_name', label: 'Услуга' },
    { key: 'photo_path', label: 'Фото', render: short('photo_path', 30) },
    { key: 'sort_order', label: 'Порядок' },
    boolCol('Активна'),
  ],
  fields: [
    { name: 'category_id', label: 'ID категории из справочника', type: 'number' },
    { name: 'category', label: 'Категория', type: 'text', required: true },
    { name: 'subcategory', label: 'Подкатегория', type: 'text', required: true },
    { name: 'service_name', label: 'Название услуги', type: 'text', required: true, wide: true },
    { name: 'description', label: 'Описание', type: 'textarea', wide: true },
    { name: 'photo_path', label: 'Фото', type: 'file', folder: 'services' },
    { name: 'photo_alt', label: 'Alt фото', type: 'text' },
    { name: 'sort_order', label: 'Порядок сортировки', type: 'number' },
    { name: 'is_active', label: 'Активна', type: 'bool' },
  ],
  defaults: { is_active: true, sort_order: 0 },
};

// ============================================================
// АКЦИИ
// ============================================================

const promotionsSection: SectionDef = {
  key: 'promotions',
  label: 'Акции',
  make: () => api.promotions,
  searchPlaceholder: 'Поиск по заголовку, категории, описанию...',
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Заголовок', render: short('title', 50) },
    { key: 'category', label: 'Категория' },
    { key: 'discount_percent', label: 'Скидка, %' },
    { key: 'start_date', label: 'С' },
    { key: 'end_date', label: 'По' },
    boolCol('Активна'),
  ],
  fields: [
    { name: 'title', label: 'Заголовок акции', type: 'text', required: true, wide: true },
    { name: 'category', label: 'Категория', type: 'text' },
    { name: 'description', label: 'Описание', type: 'textarea', wide: true },
    { name: 'discount_percent', label: 'Процент скидки', type: 'number' },
    { name: 'photo_path', label: 'Фото', type: 'file', folder: 'promotions' },
    { name: 'photo_alt', label: 'Alt фото', type: 'text' },
    { name: 'start_date', label: 'Дата начала', type: 'date' },
    { name: 'end_date', label: 'Дата окончания', type: 'date' },
    { name: 'sort_order', label: 'Порядок сортировки', type: 'number' },
    { name: 'is_active', label: 'Активна', type: 'bool' },
  ],
  defaults: { is_active: true, sort_order: 0 },
};

// ============================================================
// ПРОЕКТЫ + вложенные таблицы
// ============================================================

const projectChildren: ChildSection[] = [
  {
    key: 'partners',
    label: 'Партнёры',
    make: (id) => api.projectPartners(id),
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'partner_name', label: 'Партнёр' },
      { key: 'partner_type', label: 'Тип' },
      { key: 'sort_order', label: 'Порядок' },
    ],
    fields: [
      { name: 'partner_name', label: 'Название партнёра', type: 'text', required: true },
      { name: 'partner_description', label: 'Описание', type: 'textarea', wide: true },
      { name: 'partner_logo_path', label: 'Логотип', type: 'file', folder: 'projects' },
      { name: 'partner_type', label: 'Тип партнёра', type: 'text' },
      { name: 'sort_order', label: 'Порядок сортировки', type: 'number' },
      { name: 'is_active', label: 'Активен', type: 'bool' },
    ],
    defaults: { is_active: true, sort_order: 0 },
  },
  {
    key: 'stages',
    label: 'Этапы',
    make: (id) => api.projectStages(id),
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'stage_number', label: '№' },
      { key: 'stage_name', label: 'Этап', render: short('stage_name', 60) },
    ],
    fields: [
      { name: 'stage_number', label: 'Номер этапа', type: 'number', required: true },
      { name: 'stage_name', label: 'Название этапа', type: 'text', required: true, wide: true },
      { name: 'stage_description', label: 'Описание этапа', type: 'textarea', wide: true },
      { name: 'sort_order', label: 'Порядок сортировки', type: 'number' },
      { name: 'is_active', label: 'Активен', type: 'bool' },
    ],
    defaults: { is_active: true, sort_order: 0 },
  },
  {
    key: 'gallery',
    label: 'Галерея',
    make: (id) => api.projectGallery(id),
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'photo_path', label: 'Фото', render: short('photo_path', 40) },
      { key: 'photo_caption', label: 'Подпись', render: short('photo_caption', 40) },
      { key: 'photo_type', label: 'Тип' },
    ],
    fields: [
      { name: 'photo_path', label: 'Путь к фото', type: 'file', folder: 'projects', required: true },
      { name: 'photo_alt', label: 'Alt', type: 'text' },
      { name: 'photo_caption', label: 'Подпись', type: 'text', wide: true },
      { name: 'photo_type', label: 'Тип фото', type: 'text' },
      { name: 'sort_order', label: 'Порядок сортировки', type: 'number' },
      { name: 'is_active', label: 'Активно', type: 'bool' },
    ],
    defaults: { is_active: true, sort_order: 0 },
  },
  {
    key: 'team',
    label: 'Команда',
    make: (id) => api.projectTeam(id),
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'full_name', label: 'ФИО' },
      { key: 'role', label: 'Роль' },
      { key: 'role_category', label: 'Категория роли' },
    ],
    fields: [
      { name: 'full_name', label: 'ФИО', type: 'text', required: true },
      { name: 'role', label: 'Роль в проекте', type: 'text', required: true },
      { name: 'role_category', label: 'Категория роли', type: 'text' },
      { name: 'photo_path', label: 'Фото', type: 'file', folder: 'projects' },
      { name: 'sort_order', label: 'Порядок сортировки', type: 'number' },
      { name: 'is_active', label: 'Активен', type: 'bool' },
    ],
    defaults: { is_active: true, sort_order: 0 },
  },
];

const projectsSection: SectionDef = {
  key: 'projects',
  label: 'Проекты',
  make: () => api.projects,
  searchPlaceholder: 'Поиск по названию, описанию, slug...',
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Название', render: short('title', 50) },
    { key: 'slug', label: 'Slug' },
    { key: 'project_date', label: 'Дата' },
    {
      key: 'stats',
      label: 'Сезоны / Участницы / Эксперты / Победители',
      render: (row) =>
        `${row.seasons_count ?? '—'} / ${row.participants_count ?? '—'} / ${row.experts_count ?? '—'} / ${row.winners_count ?? '—'}`,
    },
    boolCol('Активен'),
  ],
  fields: [
    { name: 'title', label: 'Название проекта', type: 'text', required: true, wide: true },
    { name: 'slug', label: 'Slug (URL)', type: 'text' },
    { name: 'description', label: 'Краткое описание', type: 'textarea', wide: true },
    { name: 'full_description', label: 'Полное описание', type: 'textarea', wide: true },
    { name: 'context_description', label: 'Контекст и НКО', type: 'textarea', wide: true },
    { name: 'project_description', label: 'Описание проекта', type: 'textarea', wide: true },
    { name: 'seasons_count', label: 'Количество сезонов', type: 'number' },
    { name: 'participants_count', label: 'Количество участниц', type: 'number' },
    { name: 'experts_count', label: 'Количество экспертов', type: 'number' },
    { name: 'winners_count', label: 'Количество победителей', type: 'number' },
    { name: 'photo_path', label: 'Фото', type: 'file', folder: 'projects' },
    { name: 'photo_alt', label: 'Alt фото', type: 'text' },
    { name: 'project_date', label: 'Дата проекта', type: 'date' },
    { name: 'meta_title', label: 'Meta title', type: 'text', wide: true },
    { name: 'meta_description', label: 'Meta description', type: 'textarea', wide: true },
    { name: 'sort_order', label: 'Порядок сортировки', type: 'number' },
    { name: 'is_active', label: 'Активен', type: 'bool' },
  ],
  defaults: { is_active: true, sort_order: 0 },
  children: projectChildren,
};

// ============================================================
// НОВОСТИ
// ============================================================

const newsSection: SectionDef = {
  key: 'news',
  label: 'Новости',
  make: () => api.news,
  searchPlaceholder: 'Поиск по заголовку, тексту, категории...',
  columns: [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Заголовок', render: short('title', 60) },
    { key: 'category', label: 'Категория' },
    { key: 'news_date', label: 'Дата' },
    { key: 'views_count', label: 'Просмотры' },
    boolCol('Главная', 'is_featured'),
    boolCol('Активна'),
  ],
  fields: [
    { name: 'title', label: 'Заголовок новости', type: 'text', required: true, wide: true },
    { name: 'subtitle', label: 'Подзаголовок', type: 'text', wide: true },
    { name: 'full_text', label: 'Полный текст', type: 'textarea', wide: true },
    { name: 'category', label: 'Категория', type: 'text' },
    { name: 'photo_path', label: 'Фото', type: 'file', folder: 'news' },
    { name: 'photo_alt', label: 'Alt фото', type: 'text' },
    { name: 'news_date', label: 'Дата публикации', type: 'date' },
    { name: 'views_count', label: 'Просмотры', type: 'number' },
    { name: 'slug', label: 'Slug (URL)', type: 'text' },
    { name: 'meta_title', label: 'Meta title', type: 'text', wide: true },
    { name: 'meta_description', label: 'Meta description', type: 'textarea', wide: true },
    { name: 'sort_order', label: 'Порядок сортировки', type: 'number' },
    { name: 'is_featured', label: 'Главная новость', type: 'bool' },
    { name: 'is_active', label: 'Активна', type: 'bool' },
  ],
  defaults: { is_active: true, is_featured: false, sort_order: 0, views_count: 0 },
};

// ============================================================
// СПЕЦИАЛИСТЫ + вложенные таблицы
// ============================================================

const specialistChildren: ChildSection[] = [
  {
    key: 'directions',
    label: 'Направления',
    make: (id) => api.specialistDirections(id),
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'direction_name', label: 'Направление', render: short('direction_name', 60) },
      { key: 'direction_category', label: 'Категория' },
    ],
    fields: [
      { name: 'direction_name', label: 'Направление деятельности', type: 'textarea', required: true, wide: true },
      { name: 'direction_category', label: 'Категория направления', type: 'text' },
      { name: 'sort_order', label: 'Порядок сортировки', type: 'number' },
      { name: 'is_active', label: 'Активно', type: 'bool' },
    ],
    defaults: { is_active: true, sort_order: 0 },
  },
  {
    key: 'education',
    label: 'Образование',
    make: (id) => api.specialistEducation(id),
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'education_type', label: 'Тип' },
      { key: 'organization', label: 'Учреждение', render: short('organization', 50) },
      { key: 'year_obtained', label: 'Год' },
      { key: 'qualification', label: 'Квалификация' },
    ],
    fields: [
      { name: 'education_type', label: 'Тип образования', type: 'text', required: true },
      { name: 'organization', label: 'Учреждение', type: 'text', required: true, wide: true },
      { name: 'year_obtained', label: 'Год окончания', type: 'year', required: true },
      { name: 'qualification', label: 'Квалификация', type: 'text', required: true },
      { name: 'document_number', label: 'Номер документа', type: 'text' },
      { name: 'sort_order', label: 'Порядок сортировки', type: 'number' },
      { name: 'is_active', label: 'Активно', type: 'bool' },
    ],
    defaults: { is_active: true, sort_order: 0 },
  },
  {
    key: 'certifications',
    label: 'Сертификаты',
    make: (id) => api.specialistCertifications(id),
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'document_type', label: 'Тип документа' },
      { key: 'specialty', label: 'Специальность' },
      { key: 'issue_date', label: 'Выдан' },
      { key: 'expiry_date', label: 'Действует до' },
      { key: 'note', label: 'Примечание', render: short('note', 40) },
    ],
    fields: [
      { name: 'document_type', label: 'Тип документа', type: 'text', required: true },
      { name: 'specialty', label: 'Специальность', type: 'text', required: true, wide: true },
      { name: 'position_title', label: 'Должность по документу', type: 'text', wide: true },
      { name: 'issue_date', label: 'Дата выдачи', type: 'date', required: true },
      { name: 'expiry_date', label: 'Дата окончания действия', type: 'date', required: true },
      { name: 'note', label: 'Примечание', type: 'text', wide: true },
      { name: 'document_scan_path', label: 'Скан документа', type: 'file', folder: 'specialists' },
      { name: 'is_active', label: 'Активен', type: 'bool' },
    ],
    defaults: { is_active: true, sort_order: 0 },
  },
  {
    key: 'photos',
    label: 'Фото',
    make: (id) => api.specialistPhotos(id),
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'photo_path', label: 'Фото', render: short('photo_path', 40) },
      { key: 'photo_type', label: 'Тип' },
    ],
    fields: [
      { name: 'photo_path', label: 'Путь к фото', type: 'file', folder: 'specialists', required: true },
      { name: 'photo_alt', label: 'Alt', type: 'text' },
      { name: 'photo_type', label: 'Тип фото', type: 'text' },
      { name: 'sort_order', label: 'Порядок сортировки', type: 'number' },
      { name: 'is_active', label: 'Активно', type: 'bool' },
    ],
    defaults: { is_active: true, sort_order: 0 },
  },
  {
    key: 'reviews',
    label: 'Отзывы',
    make: (id) => api.specialistReviews(id),
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'patient_name', label: 'Пациент' },
      { key: 'review_text', label: 'Отзыв', render: short('review_text', 60) },
      { key: 'rating', label: 'Оценка' },
      { key: 'review_date', label: 'Дата' },
      boolCol('Подтверждён', 'is_verified'),
    ],
    fields: [
      { name: 'patient_name', label: 'Имя пациента', type: 'text' },
      { name: 'review_text', label: 'Текст отзыва', type: 'textarea', required: true, wide: true },
      { name: 'rating', label: 'Оценка (1-5)', type: 'number' },
      { name: 'review_date', label: 'Дата отзыва', type: 'date' },
      { name: 'is_verified', label: 'Подтверждён', type: 'bool' },
      { name: 'sort_order', label: 'Порядок сортировки', type: 'number' },
      { name: 'is_active', label: 'Активен', type: 'bool' },
    ],
    defaults: { rating: 5, is_verified: false, is_active: true, sort_order: 0 },
  },
  {
    key: 'services',
    label: 'Услуги специалиста',
    make: (id) => api.specialistServices(id),
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'service_id', label: 'ID услуги' },
      boolCol('Основная', 'is_primary'),
    ],
    fields: [
      { name: 'service_id', label: 'ID услуги (из таблицы services)', type: 'number', required: true },
      { name: 'is_primary', label: 'Основная услуга', type: 'bool' },
      { name: 'sort_order', label: 'Порядок сортировки', type: 'number' },
      { name: 'is_active', label: 'Активна', type: 'bool' },
    ],
    defaults: { is_primary: false, is_active: true, sort_order: 0 },
  },
  {
    key: 'achievements',
    label: 'Достижения',
    make: (id) => api.specialistAchievements(id),
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'achievement_type', label: 'Тип' },
      { key: 'title', label: 'Название', render: short('title', 50) },
      { key: 'year', label: 'Год' },
    ],
    fields: [
      { name: 'achievement_type', label: 'Тип достижения', type: 'text' },
      { name: 'title', label: 'Название', type: 'text', required: true, wide: true },
      { name: 'description', label: 'Описание', type: 'textarea', wide: true },
      { name: 'year', label: 'Год', type: 'year' },
      { name: 'document_path', label: 'Документ', type: 'file', folder: 'specialists' },
      { name: 'sort_order', label: 'Порядок сортировки', type: 'number' },
      { name: 'is_active', label: 'Активно', type: 'bool' },
    ],
    defaults: { is_active: true, sort_order: 0 },
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
    { key: 'position', label: 'Должность' },
    { key: 'experience_since', label: 'Стаж с' },
    { key: 'operations_count', label: 'Операций' },
    { key: 'positive_reviews_percent', label: 'Полож. отзывы, %' },
    boolCol('Рекомендуемый', 'is_featured'),
    boolCol('Активен'),
  ],
  fields: [
    { name: 'last_name', label: 'Фамилия', type: 'text', required: true },
    { name: 'first_name', label: 'Имя', type: 'text', required: true },
    { name: 'middle_name', label: 'Отчество', type: 'text' },
    { name: 'full_name', label: 'ФИО полностью', type: 'text', required: true, wide: true },
    { name: 'position', label: 'Должность', type: 'text', required: true, wide: true },
    { name: 'short_description', label: 'Краткое описание', type: 'textarea', wide: true },
    { name: 'description', label: 'Основное описание', type: 'textarea', wide: true },
    { name: 'full_description', label: 'Полное описание', type: 'textarea', wide: true },
    { name: 'full_biography', label: 'Биография', type: 'textarea', wide: true },
    { name: 'achievements', label: 'Достижения и регалии', type: 'textarea', wide: true },
    { name: 'education_summary', label: 'Резюме образования', type: 'textarea', wide: true },
    { name: 'experience_since', label: 'Год начала стажа', type: 'year' },
    { name: 'operations_count', label: 'Количество операций', type: 'number' },
    { name: 'photo_path', label: 'Фото', type: 'file', folder: 'specialists' },
    { name: 'photo_alt', label: 'Alt фото', type: 'text', wide: true },
    { name: 'gallery_photo_paths', label: 'Галерея фото (JSON)', type: 'json', wide: true },
    { name: 'email', label: 'Email', type: 'text' },
    { name: 'phone', label: 'Телефон', type: 'text' },
    { name: 'schedule', label: 'График приёма', type: 'textarea', wide: true },
    { name: 'slug', label: 'Slug (URL)', type: 'text' },
    { name: 'meta_title', label: 'Meta title', type: 'text', wide: true },
    { name: 'meta_description', label: 'Meta description', type: 'textarea', wide: true },
    { name: 'schema_markup', label: 'JSON-LD разметка', type: 'json', wide: true },
    { name: 'sort_order', label: 'Порядок сортировки', type: 'number' },
    { name: 'is_featured', label: 'Рекомендуемый', type: 'bool' },
    { name: 'is_active', label: 'Активен', type: 'bool' },
  ],
  defaults: { is_active: true, is_featured: false, sort_order: 0, operations_count: 0 },
  children: specialistChildren,
};

const SECTIONS: SectionDef[] = [
  servicesSection,
  serviceCategoriesSection,
  pricesSection,
  priceSectionsSection,
  promotionsSection,
  projectsSection,
  newsSection,
  specialistsSection,
];

// ============================================================
// Страница админ-панели
// ============================================================

export default function DashboardPage({ onLogout }: Props) {
  const [tab, setTab] = useState(SECTIONS[0].key);
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
        {SECTIONS.map((section) => (
          <button
            key={section.key}
            type="button"
            className={`${styles.navBtn} ${tab === section.key ? styles.navBtnActive : ''}`}
            onClick={() => setTab(section.key)}
          >
            {section.label}
          </button>
        ))}
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
