import { env } from '../config/env.js';

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 99 };
const threshold = LEVELS[env.LOG_LEVEL] ?? LEVELS.info;

function write(level, message, meta) {
  if (LEVELS[level] < threshold) return;
  const stream = level === 'error' || level === 'warn' ? process.stderr : process.stdout;

  if (env.isProd) {
    // One JSON object per line – easy to ship to any log aggregator.
    stream.write(`${JSON.stringify({ time: new Date().toISOString(), level, message, ...meta })}\n`);
    return;
  }

  const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
  const extra = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  stream.write(`${time} ${level.toUpperCase().padEnd(5)} ${message}${extra}\n`);
}

export const logger = {
  debug: (message, meta) => write('debug', message, meta),
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta),
};
