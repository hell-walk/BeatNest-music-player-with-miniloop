/** Maximum number of tracks a Mini Loop can hold (product rule carried over from v1). */
export const MINI_LOOP_MAX = 7;

/** Name of the httpOnly session cookie set by the API. */
export const SESSION_COOKIE = 'bn_session';

/**
 * Every state-changing request must carry this header. Browsers only attach
 * custom headers to same-origin requests (or after a CORS preflight), which
 * gives us CSRF protection on top of the SameSite cookie.
 */
export const CSRF_HEADER = 'x-requested-with';
export const CSRF_HEADER_VALUE = 'BeatNest';

/** Minimum milliseconds between a form being rendered and submitted (bot trap). */
export const MIN_FORM_FILL_MS = 1500;

/** Name of the hidden honeypot field present on every public form. */
export const HONEYPOT_FIELD = 'website';

/** localStorage key for the cookie-consent decision. */
export const CONSENT_STORAGE_KEY = 'bn_consent_v1';

/** localStorage key for the anonymous Mini Loop (guests only). */
export const GUEST_MINI_LOOP_KEY = 'bn_mini_loop_v1';
