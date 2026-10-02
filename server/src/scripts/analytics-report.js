/**
 * Print a first-party analytics summary.
 *   npm run report -w server            (last 30 days)
 *   npm run report -w server -- 7       (last 7 days)
 */
import { closeDb, getDb } from '../db/connection.js';
import { getSummary } from '../services/analytics.service.js';

const days = Number.parseInt(process.argv[2] ?? '30', 10) || 30;

getDb();
const summary = getSummary(days);
closeDb();

console.log(`\nBeatNest analytics – last ${summary.days} days (since ${summary.since})\n`);
console.log(`  events:     ${summary.totals.events ?? 0}`);
console.log(`  page views: ${summary.totals.page_views ?? 0}`);
console.log(`  sessions:   ${summary.totals.sessions ?? 0}\n`);

if (summary.topPaths.length) {
  console.log('Top pages');
  console.table(summary.topPaths);
}
if (summary.topEvents.length) {
  console.log('Top events');
  console.table(summary.topEvents);
}
