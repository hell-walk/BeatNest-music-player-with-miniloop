/**
 * Page-load budget check against a running production server.
 *   CHECK_URL=http://localhost:3000 node scripts/perf-check.mjs
 * Measures TTFB, HTML size and the compressed size of every JS/CSS file the
 * home page loads, plus the first cover image. Exit code 1 if a budget is
 * exceeded. For a full Lighthouse run: npx lighthouse http://localhost:3000 --view
 */
import http from 'node:http';
import https from 'node:https';

const BASE = (process.env.CHECK_URL || 'http://localhost:3000').replace(/\/+$/, '');

const BUDGETS = {
  ttfbMs: 400,
  htmlKb: 25,
  jsGzipKb: 220,
  cssGzipKb: 40,
  lcpImageKb: 80,
  requests: 20,
};

/** Raw request so we can measure bytes on the wire (compressed). */
function raw(url, { method = 'GET' } = {}) {
  return new Promise((resolve, reject) => {
    const started = performance.now();
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(
      url,
      { method, headers: { 'accept-encoding': 'gzip, br', 'user-agent': 'beatnest-perf-check' } },
      (res) => {
        const ttfb = performance.now() - started;
        let bytes = 0;
        const chunks = [];
        res.on('data', (c) => {
          bytes += c.length;
          chunks.push(c);
        });
        res.on('end', () =>
          resolve({
            status: res.statusCode,
            ttfb,
            total: performance.now() - started,
            bytes,
            encoding: res.headers['content-encoding'] ?? 'identity',
            type: res.headers['content-type'] ?? '',
            body: res.headers['content-encoding'] ? null : Buffer.concat(chunks).toString('utf8'),
          }),
        );
      },
    );
    req.on('error', reject);
    req.setTimeout(15000, () => req.destroy(new Error('timeout')));
    req.end();
  });
}

const kb = (b) => +(b / 1024).toFixed(1);

async function main() {
  // HTML (fetch uncompressed so we can parse it, then measure compressed)
  const htmlRes = await fetch(`${BASE}/`, { headers: { 'accept-encoding': 'identity' } });
  if (htmlRes.status !== 200) throw new Error(`GET / -> ${htmlRes.status}. Is the production server running?`);
  const html = await htmlRes.text();
  const htmlWire = await raw(`${BASE}/`);

  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
  const modulePreloads = [...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g)].map((m) => m[1]);
  const styles = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map((m) => m[1]);

  const same = (u) => u.startsWith('/') || u.startsWith(BASE);
  const abs = (u) => (u.startsWith('/') ? `${BASE}${u}` : u);

  let jsBytes = 0;
  let cssBytes = 0;
  let requests = 1;
  const rows = [{ resource: '/', kind: 'html', kb: kb(htmlWire.bytes), encoding: htmlWire.encoding, ms: Math.round(htmlWire.total) }];

  for (const s of [...new Set([...scripts, ...modulePreloads])].filter(same)) {
    const r = await raw(abs(s));
    requests += 1;
    jsBytes += r.bytes;
    rows.push({ resource: s, kind: 'js', kb: kb(r.bytes), encoding: r.encoding, ms: Math.round(r.total) });
  }
  for (const s of styles.filter(same)) {
    const r = await raw(abs(s));
    requests += 1;
    cssBytes += r.bytes;
    rows.push({ resource: s, kind: 'css', kb: kb(r.bytes), encoding: r.encoding, ms: Math.round(r.total) });
  }

  // likely LCP candidate: first playlist cover
  const { playlists } = await (await fetch(`${BASE}/api/playlists`)).json();
  const cover = await raw(`${BASE}${playlists[0].cover.src}`);
  requests += 2; // api + image
  rows.push({ resource: playlists[0].cover.src, kind: 'lcp image', kb: kb(cover.bytes), encoding: cover.encoding, ms: Math.round(cover.total) });

  console.table(rows);

  const checks = [
    ['TTFB (ms)', Math.round(htmlWire.ttfb), BUDGETS.ttfbMs],
    ['HTML (KB on wire)', kb(htmlWire.bytes), BUDGETS.htmlKb],
    ['JS total (KB on wire)', kb(jsBytes), BUDGETS.jsGzipKb],
    ['CSS total (KB on wire)', kb(cssBytes), BUDGETS.cssGzipKb],
    ['LCP image (KB)', kb(cover.bytes), BUDGETS.lcpImageKb],
    ['critical requests', requests, BUDGETS.requests],
  ];
  let failed = false;
  console.table(
    checks.map(([metric, value, budget]) => {
      const ok = value <= budget;
      if (!ok) failed = true;
      return { metric, value, budget, result: ok ? 'PASS' : 'FAIL' };
    }),
  );

  const cacheHeader = (await fetch(abs(scripts[0] ?? '/'))).headers.get('cache-control') ?? '';
  console.log(`hashed asset cache-control: ${cacheHeader || '(none)'}`);
  if (!/immutable/.test(cacheHeader)) console.warn('warning: hashed assets are not served as immutable');

  if (failed) {
    console.error('Performance budget exceeded.');
    process.exit(1);
  }
  console.log('Within performance budget. For Core Web Vitals run: npx lighthouse ' + BASE + ' --view');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
