const API_BASE = '/api';

export type Ok<T> = { success: true; data: T; count?: number; message?: string };

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
    list: (params: Record<string, string | number | boolean | undefined> = {}) => {
      const q = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === '' || v === null) continue;
        q.set(k, String(v));
      }
      const qs = q.toString();
      return request<T[]>(`${base}${qs ? `?${qs}` : ''}`);
    },
    get: (id: number) => request<T>(`${base}/${id}`),
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

export const api = {
  login: (login: string, password: string) =>
    request<{ token: string; user?: { login: string } }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ login, password }),
    }),
  me: () => request<{ login: string }>('/admin/me'),

  priceSections: crud('/admin/priceSections'),
  prices: crud('/admin/priceYslyga'),
  serviceCategories: crud('/admin/serviceCategories'),
  services: crud('/admin/services'),
  promotions: crud('/admin/promotions'),
  projects: crud('/admin/projects'),
  news: crud('/admin/news'),
  specialists: crud('/admin/specialists'),

  projectPartners: (id: number) =>
    childCrud(`/admin/projects/${id}/partners`, '/admin/projectPartners'),
  projectStages: (id: number) =>
    childCrud(`/admin/projects/${id}/stages`, '/admin/projectStages'),
  projectGallery: (id: number) =>
    childCrud(`/admin/projects/${id}/gallery`, '/admin/projectGallery'),
  projectTeam: (id: number) =>
    childCrud(`/admin/projects/${id}/team`, '/admin/projectTeam'),

  specialistDirections: (id: number) =>
    childCrud(`/admin/specialists/${id}/directions`, '/admin/specialistDirections'),
  specialistEducation: (id: number) =>
    childCrud(`/admin/specialists/${id}/education`, '/admin/specialistEducation'),
  specialistCertifications: (id: number) =>
    childCrud(`/admin/specialists/${id}/certifications`, '/admin/specialistCertifications'),
  specialistPhotos: (id: number) =>
    childCrud(`/admin/specialists/${id}/photos`, '/admin/specialistPhotos'),
  specialistReviews: (id: number) =>
    childCrud(`/admin/specialists/${id}/reviews`, '/admin/specialistReviews'),
  specialistServices: (id: number) =>
    childCrud(`/admin/specialists/${id}/services`, '/admin/specialistServices'),
  specialistAchievements: (id: number) =>
    childCrud(`/admin/specialists/${id}/achievements`, '/admin/specialistAchievements'),
};
