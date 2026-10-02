import { MINI_LOOP_MAX } from '@beatnest/shared';
import { env } from '../config/env.js';

/** GET /api/health – used by load balancers and the perf/link check scripts. */
export function health(_req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ status: 'ok', uptime: Math.round(process.uptime()), timestamp: new Date().toISOString() });
}

/**
 * GET /api/config – public, non-secret runtime configuration for the client.
 * Keeping it here (instead of baking VITE_* vars into the bundle) means the
 * CSP on the server and the analytics loader on the client always agree.
 */
export function publicConfig(_req, res) {
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.json({
    siteUrl: env.SITE_URL,
    miniLoopMax: MINI_LOOP_MAX,
    analytics: {
      provider: env.ANALYTICS_PROVIDER,
      plausibleDomain: env.PLAUSIBLE_DOMAIN || null,
      gaMeasurementId: env.GA_MEASUREMENT_ID || null,
    },
  });
}
