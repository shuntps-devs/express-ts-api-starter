import { Request, Response, NextFunction } from 'express';

import { logger, env } from '../config';
import { t } from '../i18n';

interface IError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

export const errorHandler = (
  err: IError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  err.statusCode = err.statusCode ?? 500;
  err.status = err.status ?? 'error';

  // Log all errors
  logger.error('Error:', {
    statusCode: err.statusCode,
    message: err.message,
    stack: err.stack,
    isOperational: err.isOperational,
  });

  if (env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    // Don't leak error details in production
    res.status(err.statusCode).json({
      status: err.status,
      message: err.isOperational ? err.message : t('error.internalServer'),
    });
  }
};
