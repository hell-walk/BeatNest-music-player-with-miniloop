import { env } from '../config/env.js';
import { getDb } from '../db/connection.js';

/**
 * First-party, consent-gated analytics. We store the event name, the page
 * path, an anonymous per-browser-session id and optional props. No IPs,
 * no user ids, no fingerprinting – and rows are pruned after
 * ANALYTICS_RETENTION_DAYS.
 */
export function recordEvent({ name, path, sessionId, props }) {
  getDb()
    .prepare('INSERT INTO analytics_events (name, path, session_id, props) VALUES (?, ?, ?, ?)')
    .run(name, path, sessionId, props ? JSON.stringify(props) : null);
}

export function pruneOldEvents(days = env.ANALYTICS_RETENTION_DAYS) {
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();
  return getDb().prepare('DELETE FROM analytics_events WHERE created_at < ?').run(cutoff).changes;
}

/** Aggregate numbers for the last `days` days (used by `npm run report`). */
export function getSummary(days = 30) {
  const db = getDb();
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const totals = db
    .prepare(
      `SELECT COUNT(*) AS events,
              SUM(name = 'page_view') AS page_views,
              COUNT(DISTINCT session_id) AS sessions
         FROM analytics_events WHERE created_at >= ?`,
    )
    .get(since);

  const topPaths = db
    .prepare(
      `SELECT path, COUNT(*) AS views FROM analytics_events
        WHERE name = 'page_view' AND created_at >= ?
        GROUP BY path ORDER BY views DESC LIMIT 10`,
    )
    .all(since);

  const topEvents = db
    .prepare(
      `SELECT name, COUNT(*) AS count FROM analytics_events
        WHERE created_at >= ? GROUP BY name ORDER BY count DESC LIMIT 10`,
    )
    .all(since);

  return { days, since, totals, topPaths, topEvents };
}
