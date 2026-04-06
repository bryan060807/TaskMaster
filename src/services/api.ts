import { getToken } from '../lib/auth';

const API_BASE = '/api';

function normalizePath(path: string) {
  return path.startsWith('/') ? path : `/${path}`;
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();

  const res = await fetch(`${API_BASE}${normalizePath(path)}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    credentials: 'include',
  });

  let data = null;
  try {
    data = await res.json();
  } catch {}

  if (!res.ok) {
    throw new Error(data?.error || 'API request failed');
  }

  return data;
}

export const api = {
  get: (path: string) => request(path),
  post: (path: string, body?: unknown) =>
    request(path, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  put: (path: string, body?: unknown) =>
    request(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  delete: (path: string) =>
    request(path, {
      method: 'DELETE',
    }),
};
