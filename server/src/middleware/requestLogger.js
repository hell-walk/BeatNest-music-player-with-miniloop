import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/** Lightweight access log. Static/media hits are logged at debug level only. */
export function requestLogger(req, res, next) {
  if (env.isTest) return next();
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    const isApi = req.originalUrl.startsWith('/api/');
    const level =
      res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : isApi ? 'info' : 'debug';
    logger[level](`${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms.toFixed(1)} ms)`);
  });

  next();
}
