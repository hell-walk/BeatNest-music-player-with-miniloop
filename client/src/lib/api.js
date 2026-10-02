import { CSRF_HEADER, CSRF_HEADER_VALUE } from '@beatnest/shared';

const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    /** `{ field: message }` for validation failures, otherwise undefined */
    this.errors = errors;
  }
}

async function request(path, { method = 'GET', body, signal, keepalive } = {}) {
  const headers = { [CSRF_HEADER]: CSRF_HEADER_VALUE, Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
      signal,
      keepalive,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiError('You appear to be offline. Check your connection and try again.', 0);
  }

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(data?.error ?? `Request failed (${res.status})`, res.status, data?.errors);
  }
  return data;
}

export const api = {
  getConfig: (signal) => request('/config', { signal }),
  getPlaylists: (signal) => request('/playlists', { signal }),
  getPlaylist: (slug, signal) => request(`/playlists/${encodeURIComponent(slug)}`, { signal }),
  getTracks: (signal) => request('/tracks', { signal }),

  getFormToken: () => request('/auth/form-token'),
  me: (signal) => request('/auth/me', { signal }),
  signup: (payload) => request('/auth/signup', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  logout: () => request('/auth/logout', { method: 'POST' }),

  getMiniLoop: () => request('/me/mini-loop'),
  setMiniLoop: (trackIds) => request('/me/mini-loop', { method: 'PUT', body: { trackIds } }),
  clearMiniLoop: () => request('/me/mini-loop', { method: 'DELETE' }),

  trackEvent: (event) => request('/events', { method: 'POST', body: event, keepalive: true }),
};
