/**
 * Writes client/public/sitemap.xml and client/public/robots.txt from the shared
 * route list plus every playlist in the seed file.
 *   SITE_URL=https://beatnest.example.com node scripts/generate-sitemap.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { PAGE_ROUTES } from '../shared/src/routes.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'client', 'public');
const SEED = path.join(ROOT, 'server', 'data', 'seed', 'playlists.json');

const siteUrl = (process.env.SITE_URL || 'https://beatnest.example.com').replace(/\/+$/, '');
const today = new Date().toISOString().slice(0, 10);

function url(loc, { changefreq, priority }) {
  return `  <url>
    <loc>${siteUrl}${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`;
}

async function main() {
  const playlists = JSON.parse(await fs.readFile(SEED, 'utf8'));

  const entries = [
    // login/signup are reachable but not worth indexing
    ...PAGE_ROUTES.filter((r) => !['/login', '/signup'].includes(r.path)).map((r) => url(r.path, r)),
    ...playlists.map((p) => url(`/playlist/${p.slug}`, { changefreq: 'monthly', priority: 0.7 })),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

  const robots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /login
Disallow: /signup

Sitemap: ${siteUrl}/sitemap.xml
`;

  await fs.mkdir(OUT, { recursive: true });
  await fs.writeFile(path.join(OUT, 'sitemap.xml'), sitemap);
  await fs.writeFile(path.join(OUT, 'robots.txt'), robots);
  console.log(`sitemap.xml (${entries.length} urls) and robots.txt written for ${siteUrl}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
