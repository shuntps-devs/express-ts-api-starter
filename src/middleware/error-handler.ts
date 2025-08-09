/**
 * Global error handling middleware
 * Centralized error processing with environment-specific responses
 */

import { NextFunction, Request, Response } from 'express';

import { env, logger } from '../config';
import { t } from '../i18n';

/**
 * Extended Error interface with additional properties
 * Used for operational error handling and status code management
 * @interface IError
 */
interface IError extends Error {
  /** HTTP status code for the error */
  statusCode?: number;
  /** Error status string (error, fail, etc.) */
  status?: string;
  /** Whether this is an operational error that can be safely exposed */
  isOperational?: boolean;
}

/**
 * Global error handling middleware for Express application
 * Logs all errors and returns appropriate responses based on environment
 * @param err - Error object with optional additional properties
 * @param _req - Express request object (unused but required by Express)
 * @param res - Express response object for sending error response
 * @param _next - Express next function (unused but required by Express)
 */
export const errorHandler = (
  err: IError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const contextLogger = req.logger ?? logger;

  err.statusCode = err.statusCode ?? 500;
  err.status = err.status ?? 'error';

  contextLogger.error('Error:', {
    statusCode: err.statusCode,
    message: err.message,
    stack: err.stack,
    isOperational: err.isOperational,
    userId: req.user?._id,
    requestId: req.headers['x-request-id'],
  });

  if (env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.isOperational ? err.message : t('error.internalServer'),
    });
  }
};
