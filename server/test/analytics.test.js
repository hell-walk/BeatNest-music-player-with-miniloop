import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';
import { startTestServer } from './helpers.js';

let server;
let client;

before(async () => {
  server = await startTestServer();
  client = server.makeClient();
});
after(() => server.close());

test('accepts a well-formed first-party event', async () => {
  const res = await client.api('/api/events', {
    method: 'POST',
    body: { name: 'page_view', path: '/', sessionId: randomUUID(), props: { referrer: 'direct' } },
  });
  assert.equal(res.status, 202);
});

test('rejects malformed events', async () => {
  const badName = await client.api('/api/events', {
    method: 'POST',
    body: { name: 'DROP TABLE', path: '/', sessionId: randomUUID() },
  });
  assert.equal(badName.status, 400);

  const badSession = await client.api('/api/events', {
    method: 'POST',
    body: { name: 'page_view', path: '/', sessionId: 'not-a-uuid' },
  });
  assert.equal(badSession.status, 400);

  const extraField = await client.api('/api/events', {
    method: 'POST',
    body: { name: 'page_view', path: '/', sessionId: randomUUID(), ip: '1.2.3.4' },
  });
  assert.equal(extraField.status, 400, 'unknown fields are refused (strict schema)');
});

test('summary aggregates stored events', async () => {
  const { getSummary } = await import('../src/services/analytics.service.js');
  const summary = getSummary(1);
  assert.ok(summary.totals.events >= 1);
  assert.equal(summary.topPaths[0].path, '/');
});
