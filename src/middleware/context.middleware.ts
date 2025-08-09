/**
 * User context middleware for enriching requests with contextual logging
 * Sets up user-specific logging context for better request traceability
 */

import { NextFunction, Request, Response } from 'express';
import { Logger } from 'winston';

import { logger } from '../config';

/**
 * Middleware to enrich request context with user information
 * Creates contextual logger with user details for better traceability throughout request lifecycle
 * @param req - Express request object (may contain authenticated user)
 * @param _res - Express response object (unused)
 * @param next - Express next function
 */
export const userContext = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.user) {
    const userLogger = logger.child({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      sessionId: req.session?._id,
    });

    req.logger = userLogger;

    userLogger.debug('User context established', {
      path: req.path,
      method: req.method,
    });
  } else {
    req.logger = logger.child({
      userId: 'anonymous',
      sessionId: null,
    });
  }

  next();
};

/**
 * Helper function to safely extract contextual logger from request
 * Returns the request-specific logger or falls back to default logger
 * @param req - Express request object
 * @returns Winston logger instance with or without user context
 */
export const getRequestLogger = (req: Request): Logger => {
  return req.logger ?? logger;
};
