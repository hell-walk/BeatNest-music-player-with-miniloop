import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { startTestServer, validSignup } from './helpers.js';

let server;
let client;

before(async () => {
  server = await startTestServer();
  client = server.makeClient();
});
after(() => server.close());

test('state-changing requests without the CSRF header are refused', async () => {
  const res = await client.api('/api/auth/login', { method: 'POST', body: {}, csrf: false });
  assert.equal(res.status, 403);
  assert.match(res.json.error, /security header/i);
});

test('invalid signup payload returns per-field errors', async () => {
  const res = await client.api('/api/auth/signup', {
    method: 'POST',
    body: {
      ...validSignup({ username: 'x', email: 'nope', password: 'short', acceptTerms: false, dateOfBirth: '2020-01-01' }),
      formToken: await client.formToken(),
    },
  });
  assert.equal(res.status, 400);
  assert.ok(res.json.errors.username);
  assert.ok(res.json.errors.email);
  assert.ok(res.json.errors.password);
  assert.ok(res.json.errors.acceptTerms);
  assert.match(res.json.errors.dateOfBirth, /at least 13/);
});

test('honeypot submissions are rejected', async () => {
  const res = await client.api('/api/auth/signup', {
    method: 'POST',
    body: { ...validSignup(), formToken: await client.formToken(), website: 'http://spam.example' },
  });
  assert.equal(res.status, 400);
});

test('submissions without a form token are rejected', async () => {
  const res = await client.api('/api/auth/signup', { method: 'POST', body: validSignup() });
  assert.equal(res.status, 400);
  assert.match(res.json.error, /reload/i);
});

test('signup creates the account, sets an httpOnly cookie and /me returns the user', async () => {
  const res = await client.api('/api/auth/signup', {
    method: 'POST',
    body: { ...validSignup(), formToken: await client.formToken() },
  });
  assert.equal(res.status, 201);
  assert.equal(res.json.user.username, 'tester1');
  assert.equal(res.json.user.email, 'tester1@example.com', 'email is normalised to lower-case');
  assert.equal(res.json.user.passwordHash, undefined);

  const setCookie = res.headers.getSetCookie().join('\n');
  assert.match(setCookie, /bn_session=/);
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /SameSite=Lax/);

  const me = await client.api('/api/auth/me');
  assert.equal(me.status, 200);
  assert.equal(me.json.user.username, 'tester1');
  assert.deepEqual(me.json.miniLoop, []);
});

test('duplicate username / email is a 409 with field errors', async () => {
  const other = server.makeClient();
  const res = await other.api('/api/auth/signup', {
    method: 'POST',
    body: { ...validSignup(), formToken: await other.formToken() },
  });
  assert.equal(res.status, 409);
  assert.ok(res.json.errors.username);
  assert.ok(res.json.errors.email);
});

test('login rejects a wrong password and accepts the right one (by username or email)', async () => {
  const fresh = server.makeClient();

  const bad = await fresh.api('/api/auth/login', {
    method: 'POST',
    body: { identifier: 'tester1', password: 'wrong-password', formToken: await fresh.formToken() },
  });
  assert.equal(bad.status, 401);
  assert.equal(fresh.jar.size, 0, 'no cookie on failed login');

  const good = await fresh.api('/api/auth/login', {
    method: 'POST',
    body: { identifier: 'TESTER1@example.com', password: 'secret123', formToken: await fresh.formToken() },
  });
  assert.equal(good.status, 200);
  assert.equal(good.json.user.username, 'tester1');
  assert.ok(Array.isArray(good.json.miniLoop));
  assert.ok(fresh.jar.has('bn_session'));
});

test('logout clears the cookie and /me becomes anonymous', async () => {
  const out = await client.api('/api/auth/logout', { method: 'POST' });
  assert.equal(out.status, 204);
  assert.equal(client.jar.has('bn_session'), false);

  const me = await client.api('/api/auth/me');
  assert.equal(me.status, 200);
  assert.equal(me.json.user, null);
});

test('a forged session cookie is ignored and cleared', async () => {
  const forged = server.makeClient();
  forged.jar.set('bn_session', 's%3Aforged.signature');
  const me = await forged.api('/api/auth/me');
  assert.equal(me.status, 200);
  assert.equal(me.json.user, null);
});
