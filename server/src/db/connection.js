import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const SCHEMA_PATH = path.join(import.meta.dirname, 'schema.sql');

/** @type {DatabaseSync | null} */
let db = null;

/** Apply schema.sql (idempotent) and pragmas to a connection. */
export function migrate(connection) {
  connection.exec('PRAGMA foreign_keys = ON;');
  connection.exec('PRAGMA busy_timeout = 5000;');
  if (connection.location() !== ':memory:') {
    connection.exec('PRAGMA journal_mode = WAL;');
  }
  connection.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  return connection;
}

/** Lazily open (and migrate) the single process-wide connection. */
export function getDb() {
  if (db) return db;
  if (env.DB_PATH !== ':memory:') {
    fs.mkdirSync(path.dirname(env.DB_PATH), { recursive: true });
  }
  db = migrate(new DatabaseSync(env.DB_PATH));
  logger.info('database ready', { path: env.DB_PATH });
  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

/** Run `fn` inside a transaction; rolls back on throw. */
export function transaction(fn) {
  const conn = getDb();
  conn.exec('BEGIN');
  try {
    const result = fn(conn);
    conn.exec('COMMIT');
    return result;
  } catch (err) {
    conn.exec('ROLLBACK');
    throw err;
  }
}

/** ISO-8601 UTC timestamp, matching the SQL defaults. */
export function nowIso() {
  return new Date().toISOString();
}
