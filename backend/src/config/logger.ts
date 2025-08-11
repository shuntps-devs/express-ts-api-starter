import fs from 'fs';
import path from 'path';

import winston from 'winston';

import { env } from './env';

/**
 * Log directory path for storing log files
 */
const logDir = 'logs';

/**
 * Create logs directory if it doesn't exist
 */
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

/**
 * Winston log format configuration with timestamp, errors, and JSON formatting
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

/**
 * Clean existing logs in development mode for fresh start
 */
if (env.IS_DEV) {
  const files = fs.readdirSync(logDir);
  files.forEach((file) => {
    fs.unlinkSync(path.join(logDir, file));
  });
}

/**
 * Winston log levels configuration
 */
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

/**
 * Determine log level based on environment
 * @returns Log level string - 'debug' for development, 'warn' for production
 */
const level = () => {
  return env.IS_DEV ? 'debug' : 'warn';
};

/**
 * File transports configuration for error and combined logs
 */
const fileTransports = [
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: logFormat,
  }),
  new winston.transports.File({
    filename: 'logs/combined.log',
    format: logFormat,
  }),
];

/**
 * All transports array with proper typing
 */
const allTransports: winston.transport[] = [...fileTransports];

/**
 * Add console transport for non-production environments
 */
if (!env.IS_PRODUCTION) {
  allTransports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

/**
 * Main Winston logger instance with configured levels, format, and transports
 */
export const logger = winston.createLogger({
  level: level(),
  levels,
  format: logFormat,
  transports: allTransports,
});

/**
 * Convenience error logging function
 * @param message - Error message or object to log
 * @param meta - Optional metadata to include
 */
export const error = logger.error.bind(logger);

/**
 * Convenience warning logging function
 * @param message - Warning message or object to log
 * @param meta - Optional metadata to include
 */
export const warn = logger.warn.bind(logger);

/**
 * Convenience info logging function
 * @param message - Info message or object to log
 * @param meta - Optional metadata to include
 */
export const info = logger.info.bind(logger);

/**
 * Convenience HTTP logging function
 * @param message - HTTP message or object to log
 * @param meta - Optional metadata to include
 */
export const http = logger.http.bind(logger);

/**
 * Convenience debug logging function
 * @param message - Debug message or object to log
 * @param meta - Optional metadata to include
 */
export const debug = logger.debug.bind(logger);
