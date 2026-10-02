// Must run before any src module is imported so env.js sees test settings.
process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
process.env.LOG_LEVEL = 'error';
process.env.SESSION_SECRET = 'test-only-secret';

import { CSRF_HEADER, CSRF_HEADER_VALUE } from '@beatnest/shared';

/**
 * Boot the real Express app on a random port with an in-memory, seeded DB.
 * Returns a tiny HTTP client with a per-jar cookie store (no supertest needed).
 */
export async function startTestServer() {
  const { createApp } = await import('../src/app.js');
  const { getDb } = await import('../src/db/connection.js');
  const { seedDatabase } = await import('../src/db/seed.js');

  getDb();
  seedDatabase();

  const app = createApp();
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  function makeClient() {
    const jar = new Map();

    async function api(path, { method = 'GET', body, headers = {}, csrf = true } = {}) {
      const h = { ...headers };
      if (body !== undefined) h['content-type'] = 'application/json';
      if (csrf && !['GET', 'HEAD'].includes(method)) h[CSRF_HEADER] = CSRF_HEADER_VALUE;
      if (jar.size) h.cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ');

      const res = await fetch(baseUrl + path, {
        method,
        headers: h,
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: 'manual',
      });

      for (const sc of res.headers.getSetCookie()) {
        const [pair] = sc.split(';');
        const eq = pair.indexOf('=');
        const name = pair.slice(0, eq);
        const value = pair.slice(eq + 1);
        if (!value || /expires=Thu, 01 Jan 1970/i.test(sc)) jar.delete(name);
        else jar.set(name, value);
      }

      const text = await res.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        /* not json */
      }
      return { status: res.status, headers: res.headers, json, text };
    }

    async function formToken() {
      const r = await api('/api/auth/form-token');
      return r.json.formToken;
    }

    return { api, formToken, jar };
  }

  return {
    baseUrl,
    makeClient,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

export function validSignup(overrides = {}) {
  return {
    fullName: 'Test User',
    dateOfBirth: '2000-05-20',
    gender: 'other',
    username: 'tester1',
    email: 'Tester1@Example.com',
    password: 'secret123',
    acceptTerms: true,
    ...overrides,
  };
}
