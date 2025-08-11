/**
 * Global error handling middleware
 * Centralized error processing with environment-specific responses
 */

import { NextFunction, Request, Response } from 'express';

import { env } from '../config';
import { t } from '../i18n';
import { ErrorHelper } from '../utils';

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
  const requestId = ErrorHelper.extractRequestId(req);

  err.statusCode = err.statusCode ?? 500;
  err.status = err.status ?? 'error';

  ErrorHelper.logError(
    err,
    {
      statusCode: err.statusCode,
      isOperational: err.isOperational,
      userId: req.user?._id,
    },
    requestId,
    req // ✅ Pass request for contextual logging
  );

  if (env.NODE_ENV === 'development') {
    ErrorHelper.sendError(
      res,
      err.message,
      err.statusCode,
      err.status,
      {
        stack: err.stack,
        error: err,
      },
      requestId
    );
  } else {
    const message = ErrorHelper.isOperational(err)
      ? err.message
      : t('error.internalServer');

    ErrorHelper.sendError(
      res,
      message,
      err.statusCode,
      err.status,
      undefined,
      requestId
    );
  }
};
