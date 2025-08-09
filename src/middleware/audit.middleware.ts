/**
 * Audit logging middleware for tracking user actions
 * Creates comprehensive audit trail for security and compliance monitoring
 */

import { NextFunction, Request, Response } from 'express';

import { logger } from '../config';

/**
 * Middleware to log user actions for comprehensive audit trail
 * Captures request details, user context, and response information for security monitoring
 * @param req - Express request object with user context
 * @param res - Express response object
 * @param next - Express next function
 */
export const auditLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const contextLogger = req.logger ?? logger;
  const action = `${req.method} ${req.route?.path ?? req.path}`;

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

  contextLogger.info('User action audit', auditInfo);

  res.on('finish', () => {
    contextLogger.info('User action completed', {
      ...auditInfo,
      statusCode: res.statusCode,
      duration: Date.now() - new Date(auditInfo.timestamp).getTime(),
    });
  });

  next();
};
