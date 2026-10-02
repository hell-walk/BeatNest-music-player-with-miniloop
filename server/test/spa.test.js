import './fixtures/spa-dist.js';
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { startTestServer } from './helpers.js';

let server;

before(async () => {
  server = await startTestServer();
});
after(() => server.close());

const get = (path, init) => fetch(server.baseUrl + path, { redirect: 'manual', ...init });

test('home page is served with its own metadata and the placeholder origin replaced', async () => {
  const res = await get('/');
  const html = await res.text();
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/html/);
  assert.match(html, /<title>BeatNest – Free music player with Mini Loop<\/title>/);
  assert.ok(!html.includes('beatnest.example.com'), 'placeholder origin must be rewritten to SITE_URL');
  assert.match(html, /<link rel="canonical" href="http:\/\/localhost:3000\/" \/>/);
  assert.match(html, /property="og:image" content="http:\/\/localhost:3000\/og-image\.png"/);
});

test('static pages get their own title and description', async () => {
  const html = await (await get('/privacy')).text();
  assert.match(html, /<title>Privacy Policy – BeatNest<\/title>/);
  assert.match(html, /name="description"\s+content="How BeatNest collects/);
  assert.match(html, /property="og:url" content="http:\/\/localhost:3000\/privacy"/);
});

test('playlist pages get playlist metadata and cover image', async () => {
  const res = await get('/playlist/eminem');
  const html = await res.text();
  assert.equal(res.status, 200);
  assert.match(html, /<title>Eminem playlist – BeatNest<\/title>/);
  assert.match(html, /property="og:type" content="music.playlist"/);
  assert.match(html, /property="og:image" content="http:\/\/localhost:3000\/images\/covers\/eminem-400\.jpg"/);
  assert.match(html, /name="twitter:card" content="summary"/);
});

test('unknown pages render the app with a real 404 status and noindex', async () => {
  for (const path of ['/this-does-not-exist', '/playlist/nope', '/privacy/extra']) {
    const res = await get(path);
    const html = await res.text();
    assert.equal(res.status, 404, path);
    assert.match(html, /<div id="root"><\/div>/, 'still serves the SPA shell');
    assert.match(html, /name="robots" content="noindex, nofollow"/);
    assert.match(html, /<title>Page not found – BeatNest<\/title>/);
  }
});

test('HTML responses are not cached, static files are', async () => {
  const page = await get('/');
  assert.equal(page.headers.get('cache-control'), 'no-cache');
  const robots = await get('/robots.txt');
  assert.equal(robots.status, 200);
  assert.match(robots.headers.get('cache-control'), /max-age=86400/);
});

test('missing hashed asset is a 404, not the SPA shell', async () => {
  const res = await get('/assets/does-not-exist.js');
  assert.equal(res.status, 404);
});
