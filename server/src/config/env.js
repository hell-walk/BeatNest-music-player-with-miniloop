import path from 'node:path';

/**
 * Central, validated runtime configuration.
 * Every secret lives here (server-side only) and is read from process.env.
 * Nothing in this file is ever shipped to the browser.
 */

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';

const serverRoot = path.resolve(import.meta.dirname, '../..');
const repoRoot = path.resolve(serverRoot, '..');

function bool(value, fallback) {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function int(value, fallback) {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) ? n : fallback;
}

function requiredInProd(name, devFallback) {
  const v = process.env[name];
  if (v) return v;
  if (isProd) {
    throw new Error(`Missing required environment variable ${name}. See server/.env.example.`);
  }
  return devFallback;
}

const PORT = int(process.env.PORT, 3000);

export const env = Object.freeze({
  NODE_ENV,
  isProd,
  isTest,
  isDev: !isProd && !isTest,

  PORT,
  HOST: process.env.HOST || '0.0.0.0',

  /** Public origin of the site, used for canonical URLs, CORS and HTTPS redirects. */
  SITE_URL: (process.env.SITE_URL || `http://localhost:${PORT}`).replace(/\/+$/, ''),

  /** Origin of the Vite dev server – only honoured outside production. */
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  /** Used to sign the session cookie and form tokens. Must be a long random string in production. */
  SESSION_SECRET: requiredInProd('SESSION_SECRET', 'dev-only-insecure-session-secret'),
  SESSION_TTL_DAYS: int(process.env.SESSION_TTL_DAYS, 30),

  /** Forms submitted faster than this (server clock) are treated as bots. 0 in tests. */
  MIN_FORM_FILL_MS: int(process.env.MIN_FORM_FILL_MS, isTest ? 0 : 1500),

  /** ':memory:' is supported (used by the test-suite). */
  DB_PATH: process.env.DB_PATH || path.join(serverRoot, 'data', 'beatnest.sqlite'),
  MEDIA_DIR: process.env.MEDIA_DIR || path.join(serverRoot, 'media'),
  CLIENT_DIST: process.env.CLIENT_DIST || path.join(repoRoot, 'client', 'dist'),

  /** Redirect http -> https and send HSTS. Defaults to on in production. */
  ENFORCE_HTTPS: bool(process.env.ENFORCE_HTTPS, isProd),
  /** Number of reverse proxies in front of the app (Express `trust proxy`). */
  TRUST_PROXY: int(process.env.TRUST_PROXY, isProd ? 1 : 0),

  /** Analytics: 'first-party' (default, stored in SQLite), 'plausible', 'ga4' or 'none'. */
  ANALYTICS_PROVIDER: process.env.ANALYTICS_PROVIDER || 'first-party',
  PLAUSIBLE_DOMAIN: process.env.PLAUSIBLE_DOMAIN || '',
  GA_MEASUREMENT_ID: process.env.GA_MEASUREMENT_ID || '',
  /** Days of first-party analytics to keep before pruning. */
  ANALYTICS_RETENTION_DAYS: int(process.env.ANALYTICS_RETENTION_DAYS, 90),

  LOG_LEVEL: process.env.LOG_LEVEL || (isTest ? 'error' : 'info'),
});

/** Origins allowed to call the API with credentials. */
export const allowedOrigins = Object.freeze(
  [env.SITE_URL, ...(env.isProd ? [] : [env.CLIENT_ORIGIN])].filter(Boolean),
);
