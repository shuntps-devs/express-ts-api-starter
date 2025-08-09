import fs from 'fs';
import path from 'path';

import winston from 'winston';

// Get NODE_ENV directly from process.env to avoid circular dependency
const NODE_ENV = process.env.NODE_ENV ?? 'development';

// Define log directory
const logDir = 'logs';

// Create logs directory if it doesn't exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Clean logs in development mode
if (NODE_ENV === 'development') {
  const files = fs.readdirSync(logDir);
  files.forEach((file) => {
    fs.unlinkSync(path.join(logDir, file));
  });
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define level based on environment
const level = () => {
  return NODE_ENV === 'development' ? 'debug' : 'warn';
};

// Define transports
const fileTransports = [
  // Write all errors to error.log
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: logFormat,
  }),
  // Write all logs to combined.log
  new winston.transports.File({
    filename: 'logs/combined.log',
    format: logFormat,
  }),
];

// Create transport array with type union
const allTransports: winston.transport[] = [...fileTransports];

// Add Console transport in development
if (NODE_ENV !== 'production') {
  allTransports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// Create and export logger
export const logger = winston.createLogger({
  level: level(),
  levels,
  format: logFormat,
  transports: allTransports,
});

// Export default logger functions for easier usage
export const error = logger.error.bind(logger);
export const warn = logger.warn.bind(logger);
export const info = logger.info.bind(logger);
export const http = logger.http.bind(logger);
export const debug = logger.debug.bind(logger);
