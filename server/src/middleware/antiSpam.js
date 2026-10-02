import { createHmac, timingSafeEqual } from 'node:crypto';
import { HONEYPOT_FIELD } from '@beatnest/shared';
import { env } from '../config/env.js';
import { badRequest } from '../utils/httpError.js';
import { logger } from '../utils/logger.js';

const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function sign(value) {
  return createHmac('sha256', env.SESSION_SECRET).update(value).digest('base64url');
}

/**
 * A form token is issued when a form is rendered (GET /api/auth/form-token).
 * It proves the submission came from a page we served and lets us measure,
 * with the *server* clock, how long the form took to fill in.
 */
export function issueFormToken(now = Date.now()) {
  const ts = now.toString(36);
  return `${ts}.${sign(ts)}`;
}

/** @returns {{ ok: true } | { ok: false, reason: 'invalid' | 'too_fast' | 'expired' }} */
export function verifyFormToken(token, now = Date.now()) {
  if (typeof token !== 'string' || token.length > 200) return { ok: false, reason: 'invalid' };
  const [ts, sig] = token.split('.');
  if (!ts || !sig) return { ok: false, reason: 'invalid' };

  const expected = Buffer.from(sign(ts));
  const actual = Buffer.from(sig);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return { ok: false, reason: 'invalid' };
  }

  const issuedAt = Number.parseInt(ts, 36);
  const elapsed = now - issuedAt;
  if (!Number.isFinite(elapsed) || elapsed > TOKEN_MAX_AGE_MS) return { ok: false, reason: 'expired' };
  if (elapsed < env.MIN_FORM_FILL_MS) return { ok: false, reason: 'too_fast' };
  return { ok: true };
}

const TOKEN_MESSAGES = {
  invalid: 'Please reload the page and try again.',
  expired: 'This form has expired. Please reload the page and try again.',
  too_fast: 'That was quick! Please take a moment and try again.',
};

/**
 * Bot protection for public forms:
 *  - honeypot field must be empty (humans never see it)
 *  - a valid, not-too-fresh form token must be present
 * Both fields are stripped from the body before validation.
 */
export function antiSpam(req, _res, next) {
  const body = req.body ?? {};

  const honey = body[HONEYPOT_FIELD];
  if (typeof honey === 'string' && honey.trim() !== '') {
    logger.warn('spam blocked: honeypot filled', { path: req.path, ip: req.ip });
    return next(badRequest('We could not process your request. Please try again.'));
  }

  const check = verifyFormToken(body.formToken);
  if (!check.ok) {
    logger.warn('spam blocked: form token', { path: req.path, ip: req.ip, reason: check.reason });
    return next(badRequest(TOKEN_MESSAGES[check.reason]));
  }

  delete body[HONEYPOT_FIELD];
  delete body.formToken;
  next();
}
