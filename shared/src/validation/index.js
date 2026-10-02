import { z } from 'zod';
import { MINI_LOOP_MAX } from '../constants.js';

/* ---------- primitive field schemas (single source of truth) ---------- */

export const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

export const usernameSchema = z
  .string()
  .trim()
  .regex(USERNAME_RE, 'Use 3–20 letters, numbers or underscores');

export const emailSchema = z
  .email('Enter a valid email address')
  .max(254, 'Email is too long')
  .transform((v) => v.trim().toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/\d/, 'Include at least one number');

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, 'Enter your name')
  .max(60, 'Name is too long')
  .regex(/^[\p{L}\p{M} .'-]+$/u, 'Letters, spaces, apostrophes and hyphens only');

export const genderSchema = z.enum(['male', 'female', 'other', 'prefer-not'], {
  error: 'Choose an option',
});

function ageFromISODate(value) {
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - d.getUTCFullYear();
  const m = now.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) age -= 1;
  return age;
}

export const dateOfBirthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter your date of birth')
  .refine((v) => ageFromISODate(v) !== null, { error: 'Enter a valid date' })
  .refine((v) => ageFromISODate(v) >= 13, { error: 'You must be at least 13 to use BeatNest' })
  .refine((v) => ageFromISODate(v) <= 120, { error: 'Enter a valid date' });

/* ---------- anti-spam fields carried by every public form ---------- */

export const antiSpamFields = {
  /** honeypot – humans never see it, so it must stay empty (checked server-side) */
  website: z.string().max(200).optional(),
  /** server-signed token issued when the form was rendered (checked server-side) */
  formToken: z.string().max(200).optional(),
};

/* ---------- form / request schemas ---------- */

export const signupSchema = z.strictObject({
  fullName: fullNameSchema,
  dateOfBirth: dateOfBirthSchema,
  gender: genderSchema,
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  acceptTerms: z.literal(true, { error: 'You need to accept the Terms and Privacy Policy' }),
  ...antiSpamFields,
});

export const loginSchema = z.strictObject({
  identifier: z.string().trim().min(1, 'Enter your username or email').max(254),
  password: z.string().min(1, 'Enter your password').max(128),
  ...antiSpamFields,
});

export const miniLoopSchema = z.strictObject({
  trackIds: z
    .array(z.number().int().positive())
    .min(1, 'Pick at least one song')
    .max(MINI_LOOP_MAX, `A Mini Loop holds at most ${MINI_LOOP_MAX} songs`),
});

export const analyticsEventSchema = z.strictObject({
  name: z.string().regex(/^[a-z][a-z0-9_]{0,39}$/, 'Invalid event name'),
  path: z.string().max(200),
  sessionId: z.uuid(),
  props: z
    .record(z.string().max(40), z.union([z.string().max(200), z.number(), z.boolean()]))
    .optional(),
});

/* ---------- helpers shared by client and server ---------- */

/** Turn zod issues into `{ fieldName: 'first message' }`. */
export function issuesToFieldErrors(issues = []) {
  const out = {};
  for (const issue of issues) {
    const key = issue.path?.length ? String(issue.path[0]) : '_form';
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

/**
 * Validate `data` against `schema`.
 * @returns {{ success: true, data: any } | { success: false, errors: Record<string,string> }}
 */
export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, errors: issuesToFieldErrors(result.error.issues) };
}
