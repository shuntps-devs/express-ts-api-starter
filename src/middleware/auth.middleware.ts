/**
 * Authentication middleware functions
 * Handles user authentication, token validation, and role-based access control
 */

import { NextFunction, Request, Response } from 'express';

import { logger } from '../config';
import { t } from '../i18n';
import { UserRole } from '../interfaces';
import { SessionService, TokenService } from '../services';
import { ResponseHelper } from '../utils';

/**
 * Middleware to authenticate user using HTTP-only cookies
 * Handles automatic token refresh if access token is expired
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * @throws 401 if no valid tokens are present
 * @throws 500 if authentication error occurs
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const contextLogger = req.logger ?? logger;

  try {
    const { accessToken, refreshToken } =
      SessionService.extractTokensFromCookies(req);

    if (!accessToken && !refreshToken) {
      contextLogger.warn('Authentication failed - no tokens present', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      res
        .status(401)
        .json(ResponseHelper.unauthorized(t('auth.authenticationRequired')));
      return;
    }

    if (accessToken) {
      const result = await SessionService.validateAccessToken(accessToken);

      if (result) {
        req.user = result.user;
        req.session = result.session;
        contextLogger.debug('Authentication successful via access token', {
          userId: result.user._id,
        });
        next();
        return;
      }
    }

    if (refreshToken) {
      const refreshResult = await SessionService.refreshSession(
        refreshToken,
        req,
        res
      );

      if (refreshResult) {
        req.user = refreshResult.user;
        req.session = refreshResult.session;
        contextLogger.info('Authentication successful via token refresh', {
          userId: refreshResult.user._id,
        });
        next();
        return;
      }
    }

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    contextLogger.warn('Authentication failed - all tokens invalid', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.status(401).json(ResponseHelper.unauthorized(t('auth.sessionExpired')));
  } catch (error) {
    contextLogger.error('Authentication error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    res
      .status(500)
      .json(ResponseHelper.internalServerError(t('auth.authenticationError')));
  }
};

/**
 * Optional authentication middleware - sets user if valid token present
 * Does not reject requests if no valid authentication is found
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const contextLogger = req.logger ?? logger;

  try {
    const { accessToken, refreshToken } =
      SessionService.extractTokensFromCookies(req);

    if (accessToken) {
      const result = await SessionService.validateAccessToken(accessToken);

      if (result) {
        req.user = result.user;
        req.session = result.session;
        contextLogger.debug(
          'Optional authentication successful via access token',
          {
            userId: result.user._id,
          }
        );
      } else if (refreshToken) {
        const refreshResult = await SessionService.refreshSession(
          refreshToken,
          req,
          res
        );

        if (refreshResult) {
          req.user = refreshResult.user;
          req.session = refreshResult.session;
          contextLogger.debug(
            'Optional authentication successful via token refresh',
            {
              userId: refreshResult.user._id,
            }
          );
        }
      }
    }

    next();
  } catch (error) {
    contextLogger.debug('Optional authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
    });
    next();
  }
};

/**
 * Authentication middleware using Authorization header
 * For API clients that cannot use HTTP-only cookies
 * @param req - Express request object with Authorization header
 * @param res - Express response object
 * @param next - Express next function
 * @throws 401 if no Authorization header or invalid token
 * @throws 500 if authentication error occurs
 */
export const authenticateHeader = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const contextLogger = req.logger ?? logger;

  try {
    const authHeader = req.headers.authorization;
    const token = TokenService.extractTokenFromHeader(authHeader);

    if (!token) {
      contextLogger.warn('Header authentication failed - no token provided', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      res
        .status(401)
        .json(ResponseHelper.unauthorized(t('auth.accessTokenRequired')));
      return;
    }

    const result = await SessionService.validateAccessToken(token);

    if (!result) {
      contextLogger.warn('Header authentication failed - invalid token', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      res
        .status(401)
        .json(ResponseHelper.unauthorized(t('auth.invalidOrExpiredToken')));
      return;
    }

    req.user = result.user;
    req.session = result.session;
    contextLogger.debug('Header authentication successful', {
      userId: result.user._id,
    });
    next();
  } catch (error) {
    contextLogger.error('Header authentication error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    res
      .status(500)
      .json(ResponseHelper.internalServerError(t('auth.authenticationError')));
  }
};

/**
 * Role-based access control middleware factory
 * Creates middleware that restricts access to users with specific roles
 * @param roles - Array of user roles that are allowed access
 * @returns Express middleware function that checks user role permissions
 * @throws 401 if user is not authenticated
 * @throws 403 if user lacks required role permissions
 * @example
 * ```typescript
 * router.get('/admin', requireRole([UserRole.ADMIN]), controller.adminOnly);
 * router.post('/moderate', requireRole([UserRole.ADMIN, UserRole.MODERATOR]), controller.moderate);
 * ```
 */
export const requireRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contextLogger = req.logger ?? logger;

    if (!req.user) {
      contextLogger.warn('Role check failed - user not authenticated', {
        requiredRoles: roles,
        ip: req.ip,
      });
      res
        .status(401)
        .json(ResponseHelper.unauthorized(t('auth.authenticationRequired')));
      return;
    }

    const userRoles = Array.isArray(req.user.role)
      ? req.user.role
      : [req.user.role];
    const hasRequiredRole = roles.some((role) => userRoles.includes(role));

    if (!hasRequiredRole) {
      contextLogger.warn('Role check failed - insufficient permissions', {
        userId: req.user._id,
        userRoles,
        requiredRoles: roles,
      });
      res
        .status(403)
        .json(ResponseHelper.forbidden(t('auth.insufficientPermissions')));
      return;
    }

    contextLogger.debug('Role check passed', {
      userId: req.user._id,
      userRoles,
      requiredRoles: roles,
    });

    next();
  };
};
