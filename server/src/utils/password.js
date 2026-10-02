import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb);

// OWASP-recommended scrypt parameters (N=2^14, r=8, p=1) – ~16 MB, ~50 ms.
const PARAMS = { N: 16384, r: 8, p: 1, keylen: 64 };

/** Returns a self-describing string: scrypt$N$r$p$<salt>$<hash> (base64url). */
export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, PARAMS.keylen, {
    N: PARAMS.N,
    r: PARAMS.r,
    p: PARAMS.p,
    maxmem: 64 * 1024 * 1024,
  });
  return ['scrypt', PARAMS.N, PARAMS.r, PARAMS.p, salt.toString('base64url'), hash.toString('base64url')].join('$');
}

/** Constant-time verification. Returns false for malformed stored values. */
export async function verifyPassword(password, stored) {
  try {
    const [algo, N, r, p, saltB64, hashB64] = String(stored).split('$');
    if (algo !== 'scrypt') return false;
    const salt = Buffer.from(saltB64, 'base64url');
    const expected = Buffer.from(hashB64, 'base64url');
    const actual = await scrypt(password, salt, expected.length, {
      N: Number(N),
      r: Number(r),
      p: Number(p),
      maxmem: 64 * 1024 * 1024,
    });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/**
 * Pre-computed hash used to equalise response time when the user does not
 * exist, so login timing does not reveal which usernames are registered.
 */
export const DUMMY_HASH_PROMISE = hashPassword('dummy-password-for-timing-0');
