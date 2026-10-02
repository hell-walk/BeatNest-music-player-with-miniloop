import { createHash, randomBytes } from 'node:crypto';

/** 256-bit random, URL-safe session token (sent to the browser in a cookie). */
export function generateToken() {
  return randomBytes(32).toString('base64url');
}

/** Only the SHA-256 of the token is stored, so a DB leak cannot hijack sessions. */
export function hashToken(token) {
  return createHash('sha256').update(String(token)).digest('hex');
}
