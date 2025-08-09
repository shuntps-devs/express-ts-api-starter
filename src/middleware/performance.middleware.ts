import { NextFunction, Request, Response } from 'express';

import { logger } from '../config';

/**
 * Performance monitoring middleware
 * Tracks response time and logs slow requests
 */
export const performanceMonitor = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();
  const originalSend = res.send;

  // Override res.send to capture response time
  res.send = function (data: unknown) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Log slow requests (over 1 second)
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

    // Add performance headers
    res.set('X-Response-Time', `${responseTime}ms`);

    // Call the original send method
    return originalSend.call(this, data);
  };

  next();
};

/**
 * API versioning middleware
 * Ensures API version compatibility
 */
export const apiVersioning = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Set API version header
  res.set('X-API-Version', '1.0.0');

  // Check client version compatibility
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
 * Request size limiter middleware
 * Prevents abuse from large payloads
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

        res.status(413).json({
          success: false,
          message: 'Request entity too large',
          error: {
            code: 'PAYLOAD_TOO_LARGE',
            maxSize: `${maxSizeMB}MB`,
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    next();
  };
};
