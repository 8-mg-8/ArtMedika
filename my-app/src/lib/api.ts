const API_BASE = '/api';

export type Ok<T> = { success: true; data: T; count?: number; message?: string };

export type SortOption = { key: string; label: string };

export type ListResult<T> = Ok<T[]> & {
  count?: number;
  limit?: number;
  offset?: number;
  sort?: string | null;
  sort_options?: SortOption[];
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('art_medica_token');
}

export function setToken(token: string) {
  localStorage.setItem('art_medica_token', token);
}

export function clearToken() {
  localStorage.removeItem('art_medica_token');
}

async function request<T>(path: string, init: RequestInit = {}): Promise<Ok<T>> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok || !body || (body as { success?: boolean }).success === false) {
    const msg =
      (body as { message?: string } | null)?.message || `Ошибка ${res.status}`;
    throw new ApiError(res.status, msg);
  }
  return body as Ok<T>;
}

function crud<T extends Record<string, unknown>>(base: string) {
  return {
    list: (
      params: Record<string, string | number | boolean | undefined> = {}
    ): Promise<ListResult<T>> => {
      const q = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === '' || v === null) continue;
        q.set(k, String(v));
      }
      const qs = q.toString();
      return request<T[]>(`${base}${qs ? `?${qs}` : ''}`) as Promise<ListResult<T>>;
    },
    get: async (id: number) => (await request<T>(`${base}/${id}`)).data,
    create: (body: Record<string, unknown>) =>
      request<T>(base, { method: 'POST', body: JSON.stringify(body) }),
    update: (id: number, body: Record<string, unknown>) =>
      request<T>(`${base}/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    patch: (id: number, body: Record<string, unknown>) =>
      request<T>(`${base}/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    remove: (id: number) =>
      request<unknown>(`${base}/${id}`, { method: 'DELETE' }),
  };
}

function childCrud<T extends Record<string, unknown>>(
  parentBase: string,
  itemBase: string
) {
  const parent = crud<T>(parentBase);
  const item = crud<T>(itemBase);
  return {
    list: parent.list,
    get: item.get,
    create: parent.create,
    update: item.update,
    patch: item.patch,
    remove: item.remove,
  };
}

export type UploadRecord = { id: number; file_path: string; original_name?: string; folder?: string };

export async function uploadFile(file: File, folder: string): Promise<UploadRecord> {
  const fd = new FormData();
  fd.append('file', file);
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(
    `${API_BASE}/admin/upload?folder=${encodeURIComponent(folder)}`,
    {
      method: 'POST',
      headers,
      body: fd,
    }
  );
  const body = await res.json().catch(() => null);
  if (!res.ok || !body || body.success === false) {
    throw new ApiError(res.status, body?.message || 'Ошибка загрузки файла');
  }
  return body.data as UploadRecord;
}

export type Option = { value: number | string; label: string };

// Справочники для выпадающих списков
export const lookups = {
  serviceSections: async (): Promise<Option[]> => {
    const res = await crud<Record<string, unknown>>('/admin/serviceSections').list({ limit: 500 });
    return (res.data ?? [])
      .map((row) => ({ value: Number(row.id), label: String(row.name ?? '') }))
      .filter((option) => option.label !== '');
  },
  serviceSubsections: async (): Promise<Option[]> => {
    const res = await crud<Record<string, unknown>>('/admin/serviceSubsections').list({ limit: 500 });
    return (res.data ?? [])
      .map((row) => {
        const section = row.section_name ? `${String(row.section_name)} — ` : '';
        return { value: Number(row.id), label: `${section}${String(row.name ?? '')}` };
      })
      .filter((option) => option.label !== '');
  },
  services: async (): Promise<Option[]> => {
    const res = await crud<Record<string, unknown>>('/admin/services').list({ limit: 500 });
    return (res.data ?? [])
      .map((row) => ({ value: Number(row.id), label: String(row.name ?? '') }))
      .filter((option) => option.label !== '');
  },
  specialists: async (): Promise<Option[]> => {
    const res = await crud<Record<string, unknown>>('/admin/specialists').list({ limit: 500 });
    return (res.data ?? [])
      .map((row) => ({ value: Number(row.id), label: String(row.full_name ?? '') }))
      .filter((option) => option.label !== '');
  },
  projects: async (): Promise<Option[]> => {
    const res = await crud<Record<string, unknown>>('/admin/projects').list({ limit: 500 });
    return (res.data ?? [])
      .map((row) => ({ value: Number(row.id), label: String(row.title ?? '') }))
      .filter((option) => option.label !== '');
  },
  priceLists: async (): Promise<Option[]> => {
    const res = await crud<Record<string, unknown>>('/admin/priceLists').list({ limit: 500 });
    return (res.data ?? [])
      .map((row) => ({ value: Number(row.id), label: String(row.name ?? '') }))
      .filter((option) => option.label !== '');
  },
};

export const api = {
  login: (login: string, password: string) =>
    request<{ token: string; user?: { login: string } }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ login, password }),
    }),
  me: () => request<{ login: string }>('/admin/me'),

  priceLists: crud('/admin/priceLists'),
  priceCategories: crud('/admin/priceCategories'),
  serviceSections: crud('/admin/serviceSections'),
  serviceSubsections: crud('/admin/serviceSubsections'),
  services: crud('/admin/services'),
  serviceProblemsAdmin: crud('/admin/serviceProblems'),
  serviceTypesAdmin: crud('/admin/serviceTypes'),
  serviceResultsAdmin: crud('/admin/serviceResults'),
  specialistExperienceAdmin: crud('/admin/specialistExperience'),
  specialistOperationsAdmin: crud('/admin/specialistOperations'),
  specialistPositiveReviewsAdmin: crud('/admin/specialistPositiveReviews'),
  specialistEducationAdmin: crud('/admin/specialistEducation'),
  specialistServicesAdmin: crud('/admin/specialistServices'),
  specialistAccreditationsAdmin: crud('/admin/specialistAccreditations'),
  promotions: crud('/admin/promotions'),
  projects: crud('/admin/projects'),
  fillProjectPartnersCount: async (id: number): Promise<number> => {
    const res = await request<{ partners_count: number }>(
      `/admin/projects/${id}/partners-count`,
      { method: 'POST' },
    );
    return res.data.partners_count;
  },
  projectDetailsAdmin: crud('/admin/projectDetails'),
  projectSeasonsAdmin: crud('/admin/projectSeasons'),
  projectParticipantsAdmin: crud('/admin/projectParticipants'),
  projectExpertsAdmin: crud('/admin/projectExperts'),
  projectPartnersAdmin: crud('/admin/projectPartners'),
  projectWorkFormatsAdmin: crud('/admin/projectWorkFormats'),
  projectStagesAdmin: crud('/admin/projectStages'),
  news: crud('/admin/news'),
  specialists: crud('/admin/specialists'),

  // Услуги — вложенные таблицы
  serviceProblems: (id: number) =>
    childCrud(`/admin/services/${id}/problems`, '/admin/serviceProblems'),
  serviceTypes: (id: number) =>
    childCrud(`/admin/services/${id}/types`, '/admin/serviceTypes'),
  serviceResults: (id: number) =>
    childCrud(`/admin/services/${id}/results`, '/admin/serviceResults'),
  serviceSpecialists: (id: number) =>
    childCrud(`/admin/services/${id}/specialists`, '/admin/serviceServices'),

  // Проекты — вложенные таблицы
  projectDetails: (id: number) =>
    childCrud(`/admin/projects/${id}/details`, '/admin/projectDetails'),
  projectSeasons: (id: number) =>
    childCrud(`/admin/projects/${id}/seasons`, '/admin/projectSeasons'),
  projectParticipants: (id: number) =>
    childCrud(`/admin/projects/${id}/participants`, '/admin/projectParticipants'),
  projectExperts: (id: number) =>
    childCrud(`/admin/projects/${id}/experts`, '/admin/projectExperts'),
  projectPartners: (id: number) =>
    childCrud(`/admin/projects/${id}/partners`, '/admin/projectPartners'),
  projectWorkFormats: (id: number) =>
    childCrud(`/admin/projects/${id}/workFormats`, '/admin/projectWorkFormats'),
  projectStages: (id: number) =>
    childCrud(`/admin/projects/${id}/stages`, '/admin/projectStages'),

  // Специалисты — вложенные таблицы
  specialistExperience: (id: number) =>
    childCrud(`/admin/specialists/${id}/experience`, '/admin/specialistExperience'),
  specialistOperations: (id: number) =>
    childCrud(`/admin/specialists/${id}/operations`, '/admin/specialistOperations'),
  specialistPositiveReviews: (id: number) =>
    childCrud(`/admin/specialists/${id}/positiveReviews`, '/admin/specialistPositiveReviews'),
  specialistServices: (id: number) =>
    childCrud(`/admin/specialists/${id}/services`, '/admin/specialistServices'),
  specialistEducation: (id: number) =>
    childCrud(`/admin/specialists/${id}/education`, '/admin/specialistEducation'),
  specialistAccreditations: (id: number) =>
    childCrud(`/admin/specialists/${id}/accreditations`, '/admin/specialistAccreditations'),
};
