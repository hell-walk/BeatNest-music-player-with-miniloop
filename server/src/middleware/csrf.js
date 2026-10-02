import { CSRF_HEADER, CSRF_HEADER_VALUE } from '@beatnest/shared';
import { allowedOrigins, env } from '../config/env.js';
import { forbidden } from '../utils/httpError.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const LOCAL_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

function originAllowed(origin) {
  if (allowedOrigins.includes(origin)) return true;
  // During development the client may be opened via 127.0.0.1 or another port.
  return !env.isProd && LOCAL_ORIGIN_RE.test(origin);
}

/**
 * CSRF guard for state-changing requests.
 *  1. A custom header must be present – a cross-site <form> or <img> cannot set it,
 *     and a cross-origin fetch would be blocked by CORS before reaching us.
 *  2. If the browser sends an Origin header it must be one of ours.
 */
export function csrfGuard(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  if (req.get(CSRF_HEADER) !== CSRF_HEADER_VALUE) {
    return next(forbidden('Request blocked: missing security header'));
  }

  const origin = req.get('origin');
  if (origin && !originAllowed(origin)) {
    return next(forbidden('Request blocked: cross-origin request'));
  }

  next();
}
