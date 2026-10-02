import { SESSION_COOKIE } from '@beatnest/shared';
import { env } from '../config/env.js';
import { findSessionByToken, touchSession } from '../services/auth.service.js';
import { unauthorized } from '../utils/httpError.js';

/** Cookie attributes for the session cookie (shared by set and clear). */
export function sessionCookieOptions(maxAgeMs) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProd || env.ENFORCE_HTTPS,
    signed: true,
    path: '/',
    ...(maxAgeMs ? { maxAge: maxAgeMs } : {}),
  };
}

/** Resolve the session cookie to `req.user` (or null). Never fails the request. */
export function attachUser(req, res, next) {
  req.user = null;
  req.session = null;

  const token = req.signedCookies?.[SESSION_COOKIE];
  if (!token) return next();

  const session = findSessionByToken(token);
  if (!session) {
    // Stale or forged cookie – drop it so the browser stops sending it.
    res.clearCookie(SESSION_COOKIE, sessionCookieOptions());
    return next();
  }

  req.user = session.user;
  req.session = { id: session.id, token, expiresAt: session.expiresAt };
  touchSession(session.id, session.lastSeenAt);
  next();
}

export function requireAuth(req, _res, next) {
  if (!req.user) return next(unauthorized());
  next();
}
