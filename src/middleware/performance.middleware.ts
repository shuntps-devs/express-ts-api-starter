/**
 * Performance monitoring and optimization middleware collection
 * Provides request timing, API versioning, and request size limiting functionality
 */

import { NextFunction, Request, Response } from 'express';

import { logger } from '../config';
import { t } from '../i18n';
import { ResponseHelper } from '../utils';

/**
 * Performance monitoring middleware for tracking response times
 * Logs slow requests and adds performance headers to responses
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const performanceMonitor = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function (data: unknown) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (responseTime > 1000) {
      const contextLogger = req.logger ?? logger;
      contextLogger.warn('Slow request detected', {
        method: req.method,
        url: req.originalUrl,
        responseTime,
        statusCode: res.statusCode,
        userId: req.user?._id,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      });
    }

    res.set('X-Response-Time', `${responseTime}ms`);
    return originalSend.call(this, data);
  };

  next();
};

/**
 * API versioning middleware for ensuring compatibility
 * Sets API version headers and logs version mismatches
 * @param req - Express request object with optional X-Client-Version header
 * @param res - Express response object
 * @param next - Express next function
 */
export const apiVersioning = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.set('X-API-Version', '1.0.0');

  const clientVersion = req.get('X-Client-Version');
  if (clientVersion && clientVersion !== '1.0.0') {
    const contextLogger = req.logger ?? logger;
    contextLogger.info('API version mismatch', {
      clientVersion,
      serverVersion: '1.0.0',
      endpoint: req.originalUrl,
    });
  }

  next();
};

/**
 * Request size limiting middleware factory
 * Prevents abuse from oversized request payloads
 * @param maxSizeMB - Maximum allowed request size in megabytes (default: 10MB)
 * @returns Express middleware function that enforces size limits
 * @throws 413 if request exceeds size limit
 */
export const requestSizeLimiter = (maxSizeMB = 10) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = req.get('Content-Length');

    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);

      if (sizeInMB > maxSizeMB) {
        const contextLogger = req.logger ?? logger;
        contextLogger.warn('Request too large', {
          contentLength: parseInt(contentLength),
          maxAllowed: maxSizeMB * 1024 * 1024,
          endpoint: req.originalUrl,
          userId: req.user?._id,
        });

        ResponseHelper.sendError(
          res,
          t('error.payloadTooLarge'),
          413,
          'PAYLOAD_TOO_LARGE',
          {
            maxSize: `${maxSizeMB}MB`,
            requestedSize: `${sizeInMB.toFixed(2)}MB`,
          }
        );
        return;
      }
    }

    next();
  };
};
