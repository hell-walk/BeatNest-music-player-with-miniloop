import { SESSION_COOKIE } from '@beatnest/shared';
import { env } from '../config/env.js';
import { issueFormToken } from '../middleware/antiSpam.js';
import { sessionCookieOptions } from '../middleware/auth.js';
import * as authService from '../services/auth.service.js';
import * as miniLoopService from '../services/miniloop.service.js';

function startSession(req, res, user) {
  const { token } = authService.createSession(user.id, req.get('user-agent'));
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions(env.SESSION_TTL_DAYS * 86_400_000));
}

/** GET /api/auth/form-token – issued when a public form is rendered. */
export function formToken(_req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ formToken: issueFormToken() });
}

/** POST /api/auth/signup */
export async function signup(req, res) {
  const user = await authService.registerUser(req.validated);
  startSession(req, res, user);
  res.status(201).json({ user, miniLoop: [] });
}

/** POST /api/auth/login */
export async function login(req, res) {
  const user = await authService.authenticate(req.validated);
  startSession(req, res, user);
  res.json({ user, miniLoop: miniLoopService.getMiniLoop(user.id) });
}

/** POST /api/auth/logout */
export function logout(req, res) {
  if (req.session) authService.destroySession(req.session.token);
  res.clearCookie(SESSION_COOKIE, sessionCookieOptions());
  res.status(204).end();
}

/** GET /api/auth/me – 200 with `user: null` when logged out (no error noise). */
export function me(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    user: req.user,
    miniLoop: req.user ? miniLoopService.getMiniLoop(req.user.id) : [],
  });
}
