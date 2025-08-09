import { NextFunction, Request, Response } from 'express';

import { logger } from '../config';

/**
 * Middleware to enrich request context with user information
 * Sets user context for logging throughout the request lifecycle
 */
export const userContext = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // Add user context to the logger for this request
  if (req.user) {
    // Create a child logger with user context
    const userLogger = logger.child({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      sessionId: req.session?._id,
    });

    // Attach the contextual logger to the request for use in controllers
    req.logger = userLogger;

    // Log user context establishment
    userLogger.debug('User context established', {
      path: req.path,
      method: req.method,
    });
  } else {
    // Use default logger for anonymous requests
    req.logger = logger.child({
      userId: 'anonymous',
      sessionId: null,
    });
  }

  next();
};

/**
 * Helper to get the contextual logger from request
 */
export const getRequestLogger = (req: Request) => {
  return req.logger ?? logger;
};
