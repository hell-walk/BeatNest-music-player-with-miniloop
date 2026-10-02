import { HttpError } from '../utils/httpError.js';
import { logger } from '../utils/logger.js';

/** JSON 404 for unknown /api routes (the SPA handles page-level 404s). */
export function notFoundApi(req, res) {
  res.status(404).json({ error: `No API route matches ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof HttpError) {
    if (err.status >= 500) logger.error(err.message, { stack: err.stack });
    return res.status(err.status).json({
      error: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
  }

  // body-parser style errors
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large' });
  }
  // Errors from express.static / send (e.g. ENOENT -> 404) and other 4xx errors.
  // Never echo internal messages (file paths) unless the error is marked safe.
  const status = Number.isInteger(err?.status) ? err.status : Number.isInteger(err?.statusCode) ? err.statusCode : null;
  if (status && status >= 400 && status < 500) {
    const safeMessage = err.expose ? err.message : status === 404 ? 'Not found' : 'Request could not be processed';
    return res.status(status).json({ error: safeMessage });
  }

  logger.error('unhandled error', {
    method: req.method,
    path: req.originalUrl,
    message: err?.message,
    stack: err?.stack,
  });
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
}
