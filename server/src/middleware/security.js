import helmet from 'helmet';
import { env } from '../config/env.js';

/**
 * Enforce HTTPS. Relies on `trust proxy` so that `req.secure` reflects the
 * X-Forwarded-Proto header set by the TLS-terminating reverse proxy.
 */
export function httpsRedirect(req, res, next) {
  if (!env.ENFORCE_HTTPS || req.secure) return next();
  // Load-balancer health checks are commonly plain http.
  if (req.path === '/api/health') return next();

  const host = req.get('host');
  if (!host) return res.status(400).type('text').send('Bad Request');

  if (req.method === 'GET' || req.method === 'HEAD') {
    return res.redirect(301, `https://${host}${req.originalUrl}`);
  }
  return res.status(403).json({ error: 'HTTPS is required' });
}

/** Content-Security-Policy tuned to what the client actually loads. */
export function buildCspDirectives() {
  const scriptSrc = ["'self'"];
  const connectSrc = ["'self'"];
  const imgSrc = ["'self'", 'data:', 'blob:'];

  if (env.ANALYTICS_PROVIDER === 'plausible') {
    scriptSrc.push('https://plausible.io');
    connectSrc.push('https://plausible.io');
  }
  if (env.ANALYTICS_PROVIDER === 'ga4') {
    scriptSrc.push('https://www.googletagmanager.com');
    connectSrc.push(
      'https://www.googletagmanager.com',
      'https://*.google-analytics.com',
      'https://*.analytics.google.com',
    );
    imgSrc.push('https://*.google-analytics.com');
  }

  return {
    'default-src': ["'self'"],
    'script-src': scriptSrc,
    'style-src': ["'self'", 'https://fonts.googleapis.com'],
    // React sets styles through the CSSOM (not blocked by CSP); this only
    // covers the rare static style="" attribute.
    'style-src-attr': ["'unsafe-inline'"],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'img-src': imgSrc,
    'media-src': ["'self'", 'blob:'],
    'connect-src': connectSrc,
    'manifest-src': ["'self'"],
    'worker-src': ["'self'", 'blob:'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    ...(env.ENFORCE_HTTPS ? { 'upgrade-insecure-requests': [] } : {}),
  };
}

export function securityHeaders() {
  return helmet({
    contentSecurityPolicy: { useDefaults: false, directives: buildCspDirectives() },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-origin' },
    // 180 days HSTS, only when we actually serve https.
    hsts: env.ENFORCE_HTTPS ? { maxAge: 15552000, includeSubDomains: true, preload: true } : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  });
}

export function permissionsPolicy(_req, res, next) {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  );
  next();
}
