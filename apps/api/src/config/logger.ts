import winston from 'winston';
import { env } from './env.js';

// ─────────────────────────────────────────────────────────────────────────────
//  Structured Logger
//  Uses Winston. Development output is colorized and human-readable.
//  Production output is structured JSON for log aggregation.
// ─────────────────────────────────────────────────────────────────────────────

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const developmentFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    return `${ts} [${level}] ${message}${metaStr}`;
  }),
);

const productionFormat = combine(timestamp(), errors({ stack: true }), json());

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  transports: [
    new winston.transports.Console(),
  ],
  exitOnError: false,
});

// Convenience re-exports for common log levels
export const log = {
  info: (message: string, meta?: Record<string, unknown>) => logger.info(message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => logger.warn(message, meta),
  error: (message: string, meta?: Record<string, unknown>) => logger.error(message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => logger.debug(message, meta),
};
