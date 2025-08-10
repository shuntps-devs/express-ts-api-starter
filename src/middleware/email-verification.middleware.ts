/**
 * Email verification middleware collection
 * Provides various levels of email verification enforcement for protected routes
 */

import { NextFunction, Request, Response } from 'express';

import { logger } from '../config';
import { t } from '../i18n';
import { ErrorHelper, ResponseHelper } from '../utils';

/**
 * Middleware to enforce email verification requirement
 * Blocks access to protected routes if user's email is not verified
 * @param req - Express request object with authenticated user
 * @param res - Express response object
 * @param next - Express next function
 * @throws 401 if user is not authenticated
 * @throws 403 if email is not verified
 */
export const requireEmailVerification = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const contextLogger = req.logger ?? logger;
  const requestId = ResponseHelper.extractRequestId(req);

  if (!req.user) {
    contextLogger.warn(
      'Email verification check failed - no authenticated user',
      {
        requestId,
      }
    );
    ErrorHelper.sendUnauthorized(res, t('auth.userNotFound'), requestId);
    return;
  }

  if (!req.user.isEmailVerified) {
    contextLogger.warn('Access denied - email not verified', {
      userId: req.user._id,
      email: req.user.email,
      requestId,
    });

    ErrorHelper.sendForbidden(res, t('auth.verification.required'), requestId);
    return;
  }

  contextLogger.debug('Email verification check passed', {
    userId: req.user._id,
    email: req.user.email,
    requestId,
  });

  next();
};

/**
 * Middleware to validate user can receive emails
 * Checks account status before allowing email operations
 * @param req - Express request object with authenticated user
 * @param res - Express response object
 * @param next - Express next function
 * @throws 401 if user is not authenticated
 * @throws 403 if account is inactive
 */
export const requireValidEmail = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const contextLogger = req.logger ?? logger;
  const requestId = ResponseHelper.extractRequestId(req);

  if (!req.user) {
    contextLogger.warn(
      'Email validation check failed - no authenticated user',
      {
        requestId,
      }
    );
    ErrorHelper.sendUnauthorized(res, t('auth.userNotFound'), requestId);
    return;
  }

  if (!req.user.isActive) {
    contextLogger.warn('Email operation denied - inactive account', {
      userId: req.user._id,
      email: req.user.email,
      requestId,
    });

    ErrorHelper.sendForbidden(res, t('auth.account.inactive'), requestId);
    return;
  }

  next();
};

/**
 * Conditional email verification middleware factory
 * Enforces verification only after a grace period expires
 * @param gracePeriodDays - Number of days to allow unverified access (default: 7)
 * @returns Express middleware function that conditionally enforces verification
 * @throws 401 if user is not authenticated
 * @throws 403 if grace period expired and email not verified
 */
export const conditionalEmailVerification = (gracePeriodDays: number = 7) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contextLogger = req.logger ?? logger;
    const requestId = ResponseHelper.extractRequestId(req);

    if (!req.user) {
      ErrorHelper.sendUnauthorized(res, t('auth.userNotFound'), requestId);
      return;
    }

    const daysSinceRegistration = Math.floor(
      (Date.now() - req.user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceRegistration <= gracePeriodDays) {
      contextLogger.debug('Email verification bypassed - within grace period', {
        userId: req.user._id,
        daysSinceRegistration,
        gracePeriodDays,
        requestId,
      });
      next();
      return;
    }

    if (!req.user.isEmailVerified) {
      contextLogger.warn(
        'Access denied - grace period expired, email not verified',
        {
          userId: req.user._id,
          daysSinceRegistration,
          gracePeriodDays,
          requestId,
        }
      );

      ErrorHelper.sendForbidden(
        res,
        t('auth.verification.requiredWithDays', {
          days: daysSinceRegistration,
        }),
        requestId
      );
      return;
    }

    next();
  };
};
