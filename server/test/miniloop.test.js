import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { startTestServer, validSignup } from './helpers.js';

let server;
let client;
let trackIds;

before(async () => {
  server = await startTestServer();
  client = server.makeClient();
  const { tracks } = (await client.api('/api/tracks')).json;
  trackIds = tracks.map((t) => t.id);
});
after(() => server.close());

test('mini loop endpoints require a session', async () => {
  assert.equal((await client.api('/api/me/mini-loop')).status, 401);
  assert.equal((await client.api('/api/me/mini-loop', { method: 'PUT', body: { trackIds: [1] } })).status, 401);
});

test('a logged-in user can save, read and clear a mini loop', async () => {
  const signup = await client.api('/api/auth/signup', {
    method: 'POST',
    body: { ...validSignup({ username: 'looper', email: 'looper@example.com' }), formToken: await client.formToken() },
  });
  assert.equal(signup.status, 201);

  const chosen = [trackIds[5], trackIds[0], trackIds[12], trackIds[0]]; // duplicate on purpose
  const put = await client.api('/api/me/mini-loop', { method: 'PUT', body: { trackIds: chosen } });
  assert.equal(put.status, 200);
  assert.deepEqual(
    put.json.tracks.map((t) => t.id),
    [trackIds[5], trackIds[0], trackIds[12]],
    'order is preserved and duplicates dropped',
  );

  const get = await client.api('/api/me/mini-loop');
  assert.equal(get.status, 200);
  assert.equal(get.json.tracks.length, 3);
  assert.ok(get.json.tracks[0].url.startsWith('/media/music/'));

  const me = await client.api('/api/auth/me');
  assert.equal(me.json.miniLoop.length, 3, '/me includes the saved loop');

  const del = await client.api('/api/me/mini-loop', { method: 'DELETE' });
  assert.equal(del.status, 204);
  assert.equal((await client.api('/api/me/mini-loop')).json.tracks.length, 0);
});

test('mini loop size and track ids are validated', async () => {
  const tooMany = await client.api('/api/me/mini-loop', { method: 'PUT', body: { trackIds: trackIds.slice(0, 8) } });
  assert.equal(tooMany.status, 400);
  assert.match(tooMany.json.errors.trackIds, /at most 7/);

  const empty = await client.api('/api/me/mini-loop', { method: 'PUT', body: { trackIds: [] } });
  assert.equal(empty.status, 400);

  const unknown = await client.api('/api/me/mini-loop', { method: 'PUT', body: { trackIds: [999999] } });
  assert.equal(unknown.status, 400);

  const wrongType = await client.api('/api/me/mini-loop', { method: 'PUT', body: { trackIds: ['1'] } });
  assert.equal(wrongType.status, 400);
});
