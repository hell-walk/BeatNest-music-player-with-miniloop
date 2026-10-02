import { validate } from '@beatnest/shared';
import { badRequest } from '../utils/httpError.js';

/**
 * Validate `req.body` against a shared zod schema.
 * On success the parsed (trimmed / coerced) data is exposed as `req.validated`.
 * On failure the client receives `{ error, errors: { field: message } }`.
 */
export function validateBody(schema) {
  return (req, _res, next) => {
    const result = validate(schema, req.body ?? {});
    if (!result.success) {
      return next(badRequest('Please fix the highlighted fields.', result.errors));
    }
    req.validated = result.data;
    next();
  };
}
