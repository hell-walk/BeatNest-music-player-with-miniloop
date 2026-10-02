/**
 * Error type the error-handling middleware knows how to serialise.
 * `errors` is an optional `{ field: message }` map for form validation.
 */
export class HttpError extends Error {
  constructor(status, message, { errors, cause } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = 'HttpError';
    this.status = status;
    this.errors = errors;
  }
}

export const badRequest = (message = 'Bad request', errors) => new HttpError(400, message, { errors });
export const unauthorized = (message = 'You need to be logged in to do that') => new HttpError(401, message);
export const forbidden = (message = 'Forbidden') => new HttpError(403, message);
export const notFound = (message = 'Not found') => new HttpError(404, message);
export const conflict = (message = 'Conflict', errors) => new HttpError(409, message, { errors });
export const tooManyRequests = (message = 'Too many requests') => new HttpError(429, message);
