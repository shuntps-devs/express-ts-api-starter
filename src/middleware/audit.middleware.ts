import { NextFunction, Request, Response } from 'express';

import { logger } from '../config';

/**
 * Middleware to log user actions for audit trail
 */
export const auditLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Auto-generate action from method and path
  const action = `${req.method} ${req.route?.path ?? req.path}`;

  // Log before processing
  const auditInfo = {
    action,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?._id ?? 'anonymous',
    sessionId: req.session?._id ?? null,
    timestamp: new Date().toISOString(),
    body: req.method !== 'GET' ? req.body : undefined,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
  };

  logger.info('User action audit', auditInfo);

  // Log response on finish
  res.on('finish', () => {
    logger.info('User action completed', {
      ...auditInfo,
      statusCode: res.statusCode,
      duration: Date.now() - new Date(auditInfo.timestamp).getTime(),
    });
  });

  next();
};
