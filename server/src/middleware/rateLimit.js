import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';

const common = {
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.isTest,
};

/** Blanket limit for the whole API. */
export const apiLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 600,
  message: { error: 'Too many requests. Please slow down and try again shortly.' },
});

/** Credential stuffing / brute-force protection. Successful logins do not count. */
export const authLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

/** Account-creation spam protection. */
export const signupLimiter = rateLimit({
  ...common,
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: { error: 'Too many accounts created from this network. Please try again later.' },
});

/** Analytics beacons are cheap but should not be flood-able. */
export const analyticsLimiter = rateLimit({
  ...common,
  windowMs: 60 * 1000,
  limit: 120,
  message: { error: 'Too many events' },
});
