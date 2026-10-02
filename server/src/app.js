import fs from 'node:fs';
import path from 'node:path';
import { normalizePath, PAGE_ROUTES, playlistSlugFromPath } from '@beatnest/shared';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { allowedOrigins, env } from './config/env.js';
import { attachUser } from './middleware/auth.js';
import { csrfGuard } from './middleware/csrf.js';
import { errorHandler, notFoundApi } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { requestLogger } from './middleware/requestLogger.js';
import { httpsRedirect, permissionsPolicy, securityHeaders } from './middleware/security.js';
import apiRouter from './routes/index.js';
import { getPlaylistBySlug } from './services/playlists.service.js';

const LOCAL_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

function corsOrigin(origin, callback) {
  // No Origin header = same-origin navigation or server-to-server call.
  if (!origin || allowedOrigins.includes(origin) || (!env.isProd && LOCAL_ORIGIN_RE.test(origin))) {
    return callback(null, true);
  }
  callback(null, false);
}

/** Build the Express application (no listening – tests mount it themselves). */
export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);
  app.set('etag', 'weak');

  // ---- global hardening ----
  app.use(httpsRedirect);
  app.use(securityHeaders());
  app.use(permissionsPolicy);
  app.use(compression());
  app.use(requestLogger);

  // ---- JSON API ----
  const api = express.Router();
  api.use(
    cors({
      origin: corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-Requested-With'],
      maxAge: 600,
    }),
  );
  api.use(apiLimiter);
  api.use(express.json({ limit: '32kb' }));
  api.use(cookieParser(env.SESSION_SECRET));
  api.use(csrfGuard);
  api.use(attachUser);
  api.use(apiRouter);
  api.use(notFoundApi);
  app.use('/api', api);

  // ---- Audio files: express.static implements HTTP Range requests, which
  //      is what lets the browser seek inside an mp3 without downloading it all.
  app.use(
    '/media',
    express.static(env.MEDIA_DIR, {
      index: false,
      dotfiles: 'ignore',
      maxAge: '30d',
      setHeaders(res) {
        res.setHeader('Accept-Ranges', 'bytes');
      },
    }),
    (_req, res) => res.status(404).type('text').send('Media not found'),
  );

  // ---- Built client (production) ----
  if (fs.existsSync(path.join(env.CLIENT_DIST, 'index.html'))) {
    serveClient(app);
  } else {
    app.get('/', (_req, res) =>
      res.json({
        message: 'BeatNest API is running. In development the UI is served by Vite.',
        client: env.CLIENT_ORIGIN,
        health: '/api/health',
      }),
    );
  }

  app.use(errorHandler);
  return app;
}

const PLACEHOLDER_ORIGIN = 'https://beatnest.example.com';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function setMeta(html, attr, key, value) {
  const re = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`);
  return html.replace(re, `$1${escapeHtml(value)}$2`);
}

/**
 * Rewrite the static head tags of index.html for the requested route so social
 * crawlers (which do not run JavaScript) see the right title, description,
 * canonical URL and preview image. The React app keeps them in sync afterwards.
 */
export function renderIndexHtml(template, { title, description, path: pathname, image, type = 'website', noindex = false }) {
  const url = `${env.SITE_URL}${pathname === '/' ? '/' : pathname}`;
  const img = image ? new URL(image, `${env.SITE_URL}/`).href : `${env.SITE_URL}/og-image.png`;

  let html = template.split(PLACEHOLDER_ORIGIN).join(env.SITE_URL);
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  html = html.replace(/(<link\s+rel="canonical"\s+href=")[^"]*(")/, `$1${escapeHtml(url)}$2`);
  html = setMeta(html, 'name', 'description', description);
  html = setMeta(html, 'property', 'og:title', title);
  html = setMeta(html, 'property', 'og:description', description);
  html = setMeta(html, 'property', 'og:url', url);
  html = setMeta(html, 'property', 'og:type', type);
  html = setMeta(html, 'property', 'og:image', img);
  html = setMeta(html, 'name', 'twitter:title', title);
  html = setMeta(html, 'name', 'twitter:description', description);
  html = setMeta(html, 'name', 'twitter:image', img);
  html = setMeta(html, 'name', 'twitter:card', image ? 'summary' : 'summary_large_image');
  if (noindex) html = html.replace('</head>', '    <meta name="robots" content="noindex, nofollow" />\n  </head>');
  return html;
}

/** Resolve the page metadata (and HTTP status) for a pathname. */
function metaForPath(pathname) {
  const route = PAGE_ROUTES.find((r) => r.path === normalizePath(pathname));
  if (route) return { status: 200, meta: { title: route.title, description: route.description, path: route.path } };

  const slug = playlistSlugFromPath(pathname);
  if (slug) {
    const playlist = getPlaylistBySlug(slug);
    if (playlist) {
      return {
        status: 200,
        meta: {
          title: `${playlist.title} playlist – BeatNest`,
          description: `${playlist.description}. ${playlist.trackCount} songs to stream free on BeatNest.`,
          path: `/playlist/${slug}`,
          image: playlist.cover.fallback,
          type: 'music.playlist',
        },
      };
    }
  }

  return {
    status: 404,
    meta: { title: 'Page not found – BeatNest', description: 'That page does not exist on BeatNest.', path: pathname, noindex: true },
  };
}

function serveClient(app) {
  const dist = env.CLIENT_DIST;
  const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  const cache = new Map();

  // Vite emits content-hashed files under /assets – safe to cache forever.
  app.use(
    '/assets',
    express.static(path.join(dist, 'assets'), { immutable: true, maxAge: '1y', index: false, fallthrough: false }),
  );
  // Favicons, images, robots.txt, sitemap.xml, manifest …
  app.use(express.static(dist, { index: false, dotfiles: 'ignore', maxAge: '1d' }));

  // SPA fallback with per-route metadata. Known routes get 200; anything else
  // gets a *real* 404 status while still rendering the React "not found" page.
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (!req.accepts('html')) return next();

    const pathname = normalizePath(req.path);
    let entry = cache.get(pathname);
    if (!entry) {
      const { status, meta } = metaForPath(pathname);
      entry = { status, html: renderIndexHtml(template, meta) };
      if (cache.size > 200) cache.clear();
      cache.set(pathname, entry);
    }

    res.status(entry.status);
    res.setHeader('Cache-Control', 'no-cache');
    res.type('html').send(entry.html);
  });
}
