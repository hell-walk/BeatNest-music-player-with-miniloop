import { env } from '../config/env.js';
import { getDb, nowIso } from '../db/connection.js';
import { conflict, unauthorized } from '../utils/httpError.js';
import { DUMMY_HASH_PROMISE, hashPassword, verifyPassword } from '../utils/password.js';
import { generateToken, hashToken } from '../utils/tokens.js';

/** Strip everything the browser must never see (password hash, etc.). */
export function toPublicUser(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    fullName: row.full_name,
    createdAt: row.created_at,
  };
}

export async function registerUser({ fullName, dateOfBirth, gender, username, email, password }) {
  const db = getDb();

  const errors = {};
  if (db.prepare('SELECT 1 FROM users WHERE username = ?').get(username)) {
    errors.username = 'That username is already taken';
  }
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
    errors.email = 'An account with this email already exists';
  }
  if (Object.keys(errors).length) throw conflict('Account already exists', errors);

  const passwordHash = await hashPassword(password);

  try {
    const info = db
      .prepare(
        `INSERT INTO users (username, email, full_name, date_of_birth, gender, password_hash)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(username, email, fullName, dateOfBirth, gender, passwordHash);
    return toPublicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid));
  } catch (err) {
    // Two sign-ups raced for the same username/email.
    if (/UNIQUE constraint failed/i.test(err?.message ?? '')) {
      throw conflict('Account already exists', { username: 'That username or email was just taken' });
    }
    throw err;
  }
}

/** Login by username *or* email. Timing is equalised for unknown accounts. */
export async function authenticate({ identifier, password }) {
  const db = getDb();
  const user = db
    .prepare('SELECT * FROM users WHERE username = ? OR email = ?')
    .get(identifier, identifier.toLowerCase());

  let ok = false;
  if (user) {
    ok = await verifyPassword(password, user.password_hash);
  } else {
    await verifyPassword(password, await DUMMY_HASH_PROMISE);
  }

  if (!ok) throw unauthorized('Incorrect username/email or password');
  return toPublicUser(user);
}

export function createSession(userId, userAgent) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_DAYS * 86_400_000).toISOString();
  getDb()
    .prepare('INSERT INTO sessions (token_hash, user_id, user_agent, expires_at) VALUES (?, ?, ?, ?)')
    .run(hashToken(token), userId, String(userAgent ?? '').slice(0, 255), expiresAt);
  return { token, expiresAt };
}

export function findSessionByToken(token) {
  const row = getDb()
    .prepare(
      `SELECT s.id AS session_id, s.expires_at, s.last_seen_at, u.*
         FROM sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .get(hashToken(token), nowIso());
  if (!row) return null;
  return {
    id: row.session_id,
    expiresAt: row.expires_at,
    lastSeenAt: row.last_seen_at,
    user: toPublicUser(row),
  };
}

/** Record activity at most once an hour to keep writes cheap. */
export function touchSession(sessionId, lastSeenAt) {
  if (Date.now() - Date.parse(lastSeenAt) < 3_600_000) return;
  getDb().prepare('UPDATE sessions SET last_seen_at = ? WHERE id = ?').run(nowIso(), sessionId);
}

export function destroySession(token) {
  getDb().prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
}

export function pruneExpiredSessions() {
  return getDb().prepare('DELETE FROM sessions WHERE expires_at <= ?').run(nowIso()).changes;
}
