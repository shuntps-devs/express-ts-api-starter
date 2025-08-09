import { NextFunction, Request, Response } from 'express';

import { UserRole } from '../interfaces/user.interface';
import { SessionService } from '../services/session.service';
import { TokenService } from '../services/token.service';
import { ResponseHelper } from '../utils/response.helper';

/**
 * Middleware to authenticate user using cookies
 * Handles automatic token refresh if access token is expired
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { accessToken, refreshToken } =
      SessionService.extractTokensFromCookies(req);

    // No tokens present
    if (!accessToken && !refreshToken) {
      res
        .status(401)
        .json(ResponseHelper.unauthorized('Authentication required'));
      return;
    }

    // Try to validate access token first
    if (accessToken) {
      const result = await SessionService.validateAccessToken(accessToken);

      if (result) {
        req.user = result.user;
        req.session = result.session;
        next();
        return;
      }
    }

    // Access token invalid/expired, try refresh token
    if (refreshToken) {
      const refreshResult = await SessionService.refreshSession(
        refreshToken,
        req,
        res
      );

      if (refreshResult) {
        req.user = refreshResult.user;
        req.session = refreshResult.session;
        next();
        return;
      }
    }

    // Both tokens invalid, clear cookies and require new login
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    res
      .status(401)
      .json(
        ResponseHelper.unauthorized('Session expired. Please login again.')
      );
  } catch {
    res
      .status(500)
      .json(ResponseHelper.internalServerError('Authentication error'));
  }
};

/**
 * Optional authentication - sets user if valid token, but doesn't reject
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { accessToken, refreshToken } =
      SessionService.extractTokensFromCookies(req);

    if (accessToken) {
      const result = await SessionService.validateAccessToken(accessToken);

      if (result) {
        req.user = result.user;
        req.session = result.session;
      } else if (refreshToken) {
        // Try refresh if access token is invalid
        const refreshResult = await SessionService.refreshSession(
          refreshToken,
          req,
          res
        );

        if (refreshResult) {
          req.user = refreshResult.user;
          req.session = refreshResult.session;
        }
      }
    }

    next();
  } catch {
    // Don't block request on optional auth error
    next();
  }
};

/**
 * Extract token from Authorization header (for API clients that can't use cookies)
 */
export const authenticateHeader = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = TokenService.extractTokenFromHeader(authHeader);

    if (!token) {
      res
        .status(401)
        .json(ResponseHelper.unauthorized('Access token required'));
      return;
    }

    const result = await SessionService.validateAccessToken(token);

    if (!result) {
      res
        .status(401)
        .json(ResponseHelper.unauthorized('Invalid or expired token'));
      return;
    }

    req.user = result.user;
    req.session = result.session;
    next();
  } catch {
    res
      .status(500)
      .json(ResponseHelper.internalServerError('Authentication error'));
  }
};

/**
 * Require specific roles or permissions
 */
export const requireRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res
        .status(401)
        .json(ResponseHelper.unauthorized('Authentication required'));
      return;
    }

    // If user has any of the required roles
    const userRoles = Array.isArray(req.user.role)
      ? req.user.role
      : [req.user.role];
    const hasRequiredRole = roles.some((role) => userRoles.includes(role));

    if (!hasRequiredRole) {
      res
        .status(403)
        .json(ResponseHelper.forbidden('Insufficient permissions'));
      return;
    }

    next();
  };
};
