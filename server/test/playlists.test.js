import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { startTestServer } from './helpers.js';

let server;
let client;

before(async () => {
  server = await startTestServer();
  client = server.makeClient();
});
after(() => server.close());

test('health endpoint responds', async () => {
  const res = await client.api('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.json.status, 'ok');
});

test('public config exposes no secrets', async () => {
  const res = await client.api('/api/config');
  assert.equal(res.status, 200);
  assert.equal(typeof res.json.siteUrl, 'string');
  assert.equal(res.json.miniLoopMax, 7);
  assert.equal(JSON.stringify(res.json).includes('secret'), false);
});

test('lists the seeded playlists with cover + href metadata', async () => {
  const res = await client.api('/api/playlists');
  assert.equal(res.status, 200);
  assert.equal(res.json.playlists.length, 7);
  const first = res.json.playlists[0];
  assert.equal(first.slug, 'honey-singh');
  assert.equal(first.href, '/playlist/honey-singh');
  assert.equal(first.trackCount, 7);
  assert.match(first.cover.src, /^\/images\/covers\/honey-singh-400\.webp$/);
  assert.match(first.cover.alt, /Honey Singh/);
});

test('returns a playlist with its tracks and playable urls', async () => {
  const res = await client.api('/api/playlists/eminem');
  assert.equal(res.status, 200);
  assert.equal(res.json.playlist.tracks.length, 11);
  const track = res.json.playlist.tracks[0];
  assert.equal(typeof track.id, 'number');
  assert.match(track.url, /^\/media\/music\/eminem\/.+\.mp3$/);
  assert.equal(track.playlistSlug, 'eminem');
});

test('unknown or malformed playlist slugs are JSON 404s', async () => {
  assert.equal((await client.api('/api/playlists/does-not-exist')).status, 404);
  const bad = await client.api('/api/playlists/..%2Fetc');
  assert.equal(bad.status, 404);
  assert.ok(bad.json.error);
});

test('flat track list is available for the Mini Loop picker', async () => {
  const res = await client.api('/api/tracks');
  assert.equal(res.status, 200);
  assert.equal(res.json.tracks.length, 47);
});

test('unknown API routes are JSON 404s, not HTML', async () => {
  const res = await client.api('/api/nope');
  assert.equal(res.status, 404);
  assert.match(res.json.error, /No API route/);
});

test('audio is served with range support', async () => {
  const { tracks } = (await client.api('/api/playlists/just-for-me')).json.playlist;
  const head = await fetch(server.baseUrl + tracks[0].url, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(head.headers.get('accept-ranges'), 'bytes');
  assert.match(head.headers.get('content-type'), /audio\/mpeg/);

  const partial = await fetch(server.baseUrl + tracks[0].url, { headers: { range: 'bytes=0-99' } });
  assert.equal(partial.status, 206);
  assert.equal(partial.headers.get('content-length'), '100');

  const missing = await fetch(server.baseUrl + '/media/music/nope.mp3');
  assert.equal(missing.status, 404);
});

test('security headers are present', async () => {
  const res = await client.api('/api/health');
  assert.ok(res.headers.get('content-security-policy').includes("default-src 'self'"));
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('x-powered-by'), null);
  assert.ok(res.headers.get('permissions-policy').includes('camera=()'));
});
