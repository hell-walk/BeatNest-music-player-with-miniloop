import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { closeDb, getDb } from './db/connection.js';
import { seedIfEmpty } from './db/seed.js';
import { pruneOldEvents } from './services/analytics.service.js';
import { pruneExpiredSessions } from './services/auth.service.js';
import { logger } from './utils/logger.js';

// ---- bootstrap ----
getDb();
seedIfEmpty();
pruneExpiredSessions();
pruneOldEvents();

const app = createApp();
const server = createServer(app);

server.listen(env.PORT, env.HOST, () => {
  logger.info(`BeatNest server listening on http://localhost:${env.PORT}`, {
    env: env.NODE_ENV,
    enforceHttps: env.ENFORCE_HTTPS,
    analytics: env.ANALYTICS_PROVIDER,
  });
});

// ---- hourly housekeeping ----
const housekeeping = setInterval(() => {
  const sessions = pruneExpiredSessions();
  const events = pruneOldEvents();
  if (sessions || events) logger.info('housekeeping', { expiredSessions: sessions, prunedEvents: events });
}, 60 * 60 * 1000);
housekeeping.unref();

// ---- graceful shutdown ----
function shutdown(signal) {
  logger.info(`${signal} received – shutting down`);
  clearInterval(housekeeping);
  server.close(() => {
    closeDb();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
