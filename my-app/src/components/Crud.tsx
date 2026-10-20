'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { uploadFile } from '@/lib/api';
import styles from '@/app/dashboard.module.css';

export type Row = Record<string, unknown>;

export type FieldConfig = {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'year' | 'bool' | 'select' | 'file' | 'json';
  required?: boolean;
  folder?: string;
  options?: { value: number | string; label: string }[];
  optionsLoad?: () => Promise<{ value: number | string; label: string }[]>;
  wide?: boolean;
};

export type ColumnConfig = {
  key: string;
  label: string;
  render?: (row: Row) => React.ReactNode;
};

export type CrudApi = {
  list: (params?: Record<string, string | number | boolean | undefined>) => Promise<{ data: Row[]; count?: number }>;
  create: (body: Record<string, unknown>) => Promise<unknown>;
  update: (id: number, body: Record<string, unknown>) => Promise<unknown>;
  remove: (id: number) => Promise<unknown>;
};

type CrudProps = {
  api: CrudApi;
  columns: ColumnConfig[];
  fields: FieldConfig[];
  title?: string;
  searchPlaceholder?: string;
  defaults?: Record<string, unknown>;
  compact?: boolean;
  extraToolbar?: React.ReactNode;
  details?: (parentId: number) => React.ReactNode;
};

function boolVal(v: unknown): boolean {
  return v === true || v === 1 || v === '1' || v === 't' || v === 'true';
}

function initialForm(fields: FieldConfig[], defaults?: Record<string, unknown>): Row {
  const f: Row = {};
  for (const field of fields) {
    const d = defaults?.[field.name];
    f[field.name] = d !== undefined ? d : field.type === 'bool' ? false : '';
  }
  return f;
}

export function Crud({
  api,
  columns,
  fields,
  title,
  searchPlaceholder = 'Поиск...',
  defaults,
  compact,
  extraToolbar,
  details,
}: CrudProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Row>(() => initialForm(fields, defaults));
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = useCallback(
    async (q?: string) => {
      try {
        const res = await api.list(q ? { search: q } : {});
        setRows(res.data ?? []);
        setError('');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ошибка загрузки');
      }
    },
    [api]
  );

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm(fields, defaults));
    setShowForm(true);
  };

  const openEdit = (row: Row) => {
    setEditing(row);
    const f = initialForm(fields, defaults);
    for (const field of fields) {
      const v = row[field.name];
      if (v === undefined || v === null) continue;
      if (field.type === 'bool') f[field.name] = boolVal(v);
      else if (field.type === 'json') f[field.name] = JSON.stringify(v, null, 2);
      else f[field.name] = v;
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body: Record<string, unknown> = {};
      for (const field of fields) {
        let v = form[field.name];
        if (v === '' || v === undefined || v === null) {
          if (field.type === 'bool') v = false;
          else continue;
        }
        if (field.type === 'number' || field.type === 'year') {
          const n = Number(v);
          if (!Number.isNaN(n)) v = n;
        }
        if (field.type === 'json' && typeof v === 'string' && v.trim()) {
          try {
            v = JSON.parse(v);
          } catch {
            setError(`Поле «${field.label}»: невалидный JSON`);
            setSaving(false);
            return;
          }
        }
        body[field.name] = v;
      }
      if (editing && typeof editing.id === 'number') {
        await api.update(editing.id as number, body);
      } else {
        await api.create(body);
      }
      closeForm();
      load(search);
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const removeRow = async (row: Row) => {
    if (!confirm('Удалить запись?')) return;
    try {
      await api.remove(row.id as number);
      load(search);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления');
    }
  };

  const setField = (name: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  const onFile = async (field: FieldConfig, file: File | undefined) => {
    if (!file) return;
    try {
      const rec = await uploadFile(file, field.folder || 'misc');
      setField(field.name, rec.file_path);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки файла');
    }
  };

  const formFields = useMemo(() => fields, [fields]);

  return (
    <section className={styles.panel}>
      <div className={styles.toolbar}>
        {title ? <h2 className={styles.panelTitle}>{title}</h2> : null}
        <input
          className={styles.search}
          type="search"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            load(e.target.value);
          }}
        />
        <button type="button" className={`${styles.btnPrimary} ${compact ? styles.btnSmall : ''}`} onClick={openCreate}>
          Добавить
        </button>
        {extraToolbar}
        {showForm ? (
          <button type="button" className={`${styles.btnGhost} ${compact ? styles.btnSmall : ''}`} onClick={closeForm}>
            Закрыть
          </button>
        ) : null}
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      {showForm ? (
        <form className={styles.form} onSubmit={submitForm}>
          <div className={styles.grid}>
            {formFields.map((field) => (
              <div
                key={field.name}
                className={field.wide || field.type === 'textarea' || field.type === 'json' ? styles.gridWide : undefined}
              >
                <label className={styles.label} htmlFor={`f-${field.name}`}>
                  {field.label}
                  {field.required ? ' *' : ''}
                </label>
                {field.type === 'textarea' || field.type === 'json' ? (
                  <textarea
                    id={`f-${field.name}`}
                    rows={field.type === 'json' ? 5 : 3}
                    value={String(form[field.name] ?? '')}
                    onChange={(e) => setField(field.name, e.target.value)}
                    required={field.required}
                  />
                ) : field.type === 'bool' ? (
                  <label className={styles.checkRow}>
                    <input
                      id={`f-${field.name}`}
                      type="checkbox"
                      checked={boolVal(form[field.name])}
                      onChange={(e) => setField(field.name, e.target.checked)}
                    />
                    Да
                  </label>
                ) : field.type === 'select' && field.options ? (
                  <select
                    id={`f-${field.name}`}
                    value={String(form[field.name] ?? '')}
                    onChange={(e) => setField(field.name, e.target.value)}
                    required={field.required}
                  >
                    <option value="">—</option>
                    {field.options.map((o) => (
                      <option key={String(o.value)} value={String(o.value)}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'file' ? (
                  <div className={styles.fileRow}>
                    <input
                      id={`f-${field.name}`}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => onFile(field, e.target.files?.[0])}
                    />
                    <input
                      type="text"
                      value={String(form[field.name] ?? '')}
                      onChange={(e) => setField(field.name, e.target.value)}
                      placeholder="путь к файлу"
                    />
                  </div>
                ) : (
                  <input
                    id={`f-${field.name}`}
                    type={field.type === 'number' || field.type === 'year' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                    value={String(form[field.name] ?? '')}
                    onChange={(e) => setField(field.name, e.target.value)}
                    required={field.required}
                    step="any"
                  />
                )}
              </div>
            ))}
          </div>
          <div className={styles.actions}>
            <button type="submit" className={styles.btnSuccess} disabled={saving}>
              {saving ? 'Сохранение...' : editing ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      ) : null}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className={styles.empty} colSpan={columns.length + 1}>
                  Нет данных
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <Fragment key={String(row.id)}>
                  <tr>
                    {columns.map((c) => (
                      <td key={c.key}>{c.render ? c.render(row) : String(row[c.key] ?? '')}</td>
                    ))}
                    <td className={styles.rowActions}>
                      <button
                        type="button"
                        className={`${styles.btnOutline} ${styles.btnSmall}`}
                        onClick={() => openEdit(row)}
                      >
                        Изм.
                      </button>
                      {details ? (
                        <button
                          type="button"
                          className={`${styles.btnGhost} ${styles.btnSmall}`}
                          onClick={() => setExpanded(expanded === (row.id as number) ? null : (row.id as number))}
                        >
                          Детали
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={`${styles.btnDanger} ${styles.btnSmall}`}
                        onClick={() => removeRow(row)}
                      >
                        Удал.
                      </button>
                    </td>
                  </tr>
                  {details && expanded === (row.id as number) ? (
                    <tr>
                      <td colSpan={columns.length + 1}>{details(row.id as number)}</td>
                    </tr>
                  ) : null}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ============================================================
// Дочерние таблицы (проекты, специалисты)
// ============================================================

export type ChildSection = {
  key: string;
  label: string;
  make: (parentId: number) => CrudApi;
  columns: ColumnConfig[];
  fields: FieldConfig[];
  defaults?: Record<string, unknown>;
};

export function ChildCrud({
  api,
  columns,
  fields,
  label,
  defaults,
}: {
  api: CrudApi;
  columns: ColumnConfig[];
  fields: FieldConfig[];
  label: string;
  defaults?: Record<string, unknown>;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Row>(() => initialForm(fields, defaults));
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.list();
      setRows(res.data ?? []);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    }
  }, [api]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm(fields, defaults));
    setShowForm(true);
  };

  const openEdit = (row: Row) => {
    setEditing(row);
    const f = initialForm(fields, defaults);
    for (const field of fields) {
      const v = row[field.name];
      if (v === undefined || v === null) continue;
      if (field.type === 'bool') f[field.name] = boolVal(v);
      else if (field.type === 'json') f[field.name] = JSON.stringify(v, null, 2);
      else f[field.name] = v;
    }
    setForm(f);
    setShowForm(true);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body: Record<string, unknown> = {};
      for (const field of fields) {
        let v = form[field.name];
        if (v === '' || v === undefined || v === null) {
          if (field.type === 'bool') v = false;
          else continue;
        }
        if (field.type === 'number' || field.type === 'year') {
          const n = Number(v);
          if (!Number.isNaN(n)) v = n;
        }
        if (field.type === 'json' && typeof v === 'string' && v.trim()) {
          try {
            v = JSON.parse(v);
          } catch {
            setError(`Поле «${field.label}»: невалидный JSON`);
            setSaving(false);
            return;
          }
        }
        body[field.name] = v;
      }
      if (editing && typeof editing.id === 'number') {
        await api.update(editing.id as number, body);
      } else {
        await api.create(body);
      }
      setShowForm(false);
      setEditing(null);
      load();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const removeRow = async (row: Row) => {
    if (!confirm('Удалить запись?')) return;
    try {
      await api.remove(row.id as number);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления');
    }
  };

  const setField = (name: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  const onFile = async (field: FieldConfig, file: File | undefined) => {
    if (!file) return;
    try {
      const rec = await uploadFile(file, field.folder || 'misc');
      setField(field.name, rec.file_path);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки файла');
    }
  };

  return (
    <div className={styles.child}>
      <div className={styles.childHeader}>
        <strong>{label}</strong>
        <span className={styles.muted}>({rows.length})</span>
        <button type="button" className={`${styles.btnSuccess} ${styles.btnSmall}`} onClick={openCreate}>
          + Добавить
        </button>
        {showForm ? (
          <button
            type="button"
            className={`${styles.btnGhost} ${styles.btnSmall}`}
            onClick={() => {
              setShowForm(false);
              setEditing(null);
            }}
          >
            Закрыть
          </button>
        ) : null}
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      {showForm ? (
        <form className={styles.form} onSubmit={submitForm}>
          <div className={styles.grid}>
            {fields.map((field) => (
              <div key={field.name} className={field.type === 'textarea' || field.type === 'json' ? styles.gridWide : undefined}>
                <label className={styles.label}>{field.label}{field.required ? ' *' : ''}</label>
                {field.type === 'textarea' || field.type === 'json' ? (
                  <textarea
                    rows={field.type === 'json' ? 5 : 3}
                    value={String(form[field.name] ?? '')}
                    onChange={(e) => setField(field.name, e.target.value)}
                    required={field.required}
                  />
                ) : field.type === 'bool' ? (
                  <label className={styles.checkRow}>
                    <input
                      type="checkbox"
                      checked={boolVal(form[field.name])}
                      onChange={(e) => setField(field.name, e.target.checked)}
                    />
                    Да
                  </label>
                ) : field.type === 'select' && field.options ? (
                  <select
                    value={String(form[field.name] ?? '')}
                    onChange={(e) => setField(field.name, e.target.value)}
                    required={field.required}
                  >
                    <option value="">—</option>
                    {field.options.map((o) => (
                      <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
                    ))}
                  </select>
                ) : field.type === 'file' ? (
                  <div className={styles.fileRow}>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => onFile(field, e.target.files?.[0])}
                    />
                    <input
                      type="text"
                      value={String(form[field.name] ?? '')}
                      onChange={(e) => setField(field.name, e.target.value)}
                      placeholder="путь к файлу"
                    />
                  </div>
                ) : (
                  <input
                    type={field.type === 'number' || field.type === 'year' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                    value={String(form[field.name] ?? '')}
                    onChange={(e) => setField(field.name, e.target.value)}
                    required={field.required}
                    step="any"
                  />
                )}
              </div>
            ))}
          </div>
          <div className={styles.actions}>
            <button type="submit" className={styles.btnSuccess} disabled={saving}>
              {saving ? '...' : editing ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      ) : null}

      <div className={styles.tableWrapper}>
        <table className={`${styles.table} ${styles.tableChild}`}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className={styles.empty} colSpan={columns.length + 1}>Пусто</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={String(row.id)}>
                  {columns.map((c) => (
                    <td key={c.key}>{c.render ? c.render(row) : String(row[c.key] ?? '')}</td>
                  ))}
                  <td className={styles.rowActions}>
                    <button type="button" className={`${styles.btnOutline} ${styles.btnSmall}`} onClick={() => openEdit(row)}>
                      Изм.
                    </button>
                    <button type="button" className={`${styles.btnDanger} ${styles.btnSmall}`} onClick={() => removeRow(row)}>
                      Удал.
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// Раскрывающаяся панель с несколькими child-таблицами
// ============================================================

export function ChildrenPanel({ sections, parentId }: { sections: ChildSection[]; parentId: number }) {
  const [tab, setTab] = useState(sections[0]?.key);
  const current = sections.find((s) => s.key === tab) || sections[0];
  const api = useMemo(() => current?.make(parentId), [current, parentId]);
  if (!current || !api) return null;
  return (
    <div className={styles.children}>
      <div className={styles.childTabs}>
        {sections.map((s) => (
          <button
            key={s.key}
            type="button"
            className={`${styles.childTab} ${tab === s.key ? styles.childTabActive : ''}`}
            onClick={() => setTab(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <ChildCrud key={current.key} api={api} columns={current.columns} fields={current.fields} label={current.label} defaults={current.defaults} />
    </div>
  );
}
