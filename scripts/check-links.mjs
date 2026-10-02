/**
 * Broken-link / broken-asset check against a running BeatNest server.
 *   CHECK_URL=http://localhost:3000 node scripts/check-links.mjs
 * Checks every page route, sitemap entry, asset referenced by index.html and the
 * manifest, every cover image and every audio file, plus that unknown pages
 * really answer 404. External links are reported but do not fail the run.
 */
import { PAGE_ROUTES } from '../shared/src/routes.js';

const BASE = (process.env.CHECK_URL || 'http://localhost:3000').replace(/\/+$/, '');
const EXTERNAL = [
  'https://github.com/hell-walk/BeatNest-music-player-with-miniloop',
  'https://fonts.googleapis.com/css2?family=Bitcount+Grid+Double:wght@400;700&display=swap',
];

const results = [];
let internalFailures = 0;

async function check(url, { expect = [200], method = 'GET', external = false, label = '' } = {}) {
  const started = performance.now();
  let status = 0;
  let note = '';
  try {
    const res = await fetch(url, {
      method,
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
      headers: { 'user-agent': 'beatnest-link-check' },
    });
    status = res.status;
    await res.arrayBuffer();
  } catch (err) {
    note = err.message;
  }
  const ok = expect.includes(status);
  if (!ok && !external) internalFailures += 1;
  results.push({
    url: url.replace(BASE, ''),
    status: status || 'ERR',
    expected: expect.join('/'),
    result: ok ? 'OK' : external ? 'WARN' : 'FAIL',
    ms: Math.round(performance.now() - started),
    note: note || label,
  });
  return status;
}

function sameOrigin(href) {
  try {
    const u = new URL(href, BASE);
    return u.origin === new URL(BASE).origin ? u.href : null;
  } catch {
    return null;
  }
}

async function main() {
  const health = await check(`${BASE}/api/health`);
  if (health !== 200) {
    console.table(results);
    console.error(`Server at ${BASE} is not healthy. Start it with "npm start" (after "npm run build").`);
    process.exit(1);
  }

  // 1. pages
  for (const r of PAGE_ROUTES) await check(`${BASE}${r.path}`);
  const { playlists } = await (await fetch(`${BASE}/api/playlists`)).json();
  for (const p of playlists) await check(`${BASE}${p.href}`);

  // 2. assets referenced by index.html
  const html = await (await fetch(`${BASE}/`)).text();
  const refs = new Set();
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) refs.add(m[1]);
  for (const m of html.matchAll(/content="(https?:\/\/[^"]+\.(?:png|jpg|webp|svg))"/g)) refs.add(m[1]);
  for (const ref of refs) {
    const url = sameOrigin(ref);
    if (url && !url.endsWith('/')) await check(url);
  }

  // 3. manifest icons, sitemap entries, robots
  const manifest = await (await fetch(`${BASE}/site.webmanifest`)).json();
  for (const icon of manifest.icons ?? []) await check(`${BASE}${icon.src}`);
  await check(`${BASE}/robots.txt`);
  const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
  for (const m of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const loc = new URL(m[1]);
    await check(`${BASE}${loc.pathname}`, { label: 'from sitemap' });
  }

  // 4. covers and audio
  for (const p of playlists) {
    await check(`${BASE}${p.cover.src}`);
    await check(`${BASE}${p.cover.fallback}`);
    for (const part of p.cover.srcSet.split(',')) await check(`${BASE}${part.trim().split(' ')[0]}`);
  }
  const { tracks } = await (await fetch(`${BASE}/api/tracks`)).json();
  for (const t of tracks) await check(`${BASE}${t.url}`, { method: 'HEAD' });

  // 5. negative cases – unknown things must be 404, not 200
  await check(`${BASE}/this-page-does-not-exist`, { expect: [404] });
  await check(`${BASE}/playlist/not-a-real-playlist`, { expect: [404] });
  await check(`${BASE}/api/nope`, { expect: [404] });
  await check(`${BASE}/media/music/nope.mp3`, { expect: [404] });

  // 6. external (warn only)
  for (const url of EXTERNAL) await check(url, { external: true, expect: [200, 301, 302] });

  console.table(results.filter((r) => r.result !== 'OK').length ? results : results.slice(0, 0));
  const okCount = results.filter((r) => r.result === 'OK').length;
  console.log(`${okCount}/${results.length} checks OK`);
  if (internalFailures) {
    console.error(`${internalFailures} broken internal link(s)/asset(s).`);
    process.exit(1);
  }
  console.log('No broken internal links or assets.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
