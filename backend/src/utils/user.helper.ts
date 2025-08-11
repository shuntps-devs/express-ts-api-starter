import { Request } from 'express';

import { UserRole } from '../interfaces';

/**
 * User helper utilities that work with Express Request
 */
export class UserHelper {
  /**
   * Check if user is authenticated
   */
  static isAuthenticated(req: Request): boolean {
    return !!req.user;
  }

  /**
   * Check if user has specific role
   */
  static hasRole(req: Request, role: UserRole): boolean {
    if (!req.user) return false;

    const userRoles = Array.isArray(req.user.role)
      ? req.user.role
      : [req.user.role];

    return userRoles.includes(role);
  }

  /**
   * Check if user has any of the specified roles
   */
  static hasAnyRole(req: Request, roles: UserRole[]): boolean {
    if (!req.user) return false;

    const userRoles = Array.isArray(req.user.role)
      ? req.user.role
      : [req.user.role];

    return roles.some((role) => userRoles.includes(role));
  }

  /**
   * Check if user is admin
   */
  static isAdmin(req: Request): boolean {
    return this.hasRole(req, UserRole.ADMIN);
  }

  /**
   * Check if user is moderator or higher
   */
  static isModerator(req: Request): boolean {
    return this.hasAnyRole(req, [UserRole.ADMIN, UserRole.MODERATOR]);
  }

  /**
   * Get user display name (username or email)
   */
  static getDisplayName(req: Request): string | null {
    if (!req.user) return null;
    return req.user.username || req.user.email;
  }

  /**
   * Get user session information
   */
  static getSessionInfo(req: Request) {
    return {
      isAuthenticated: this.isAuthenticated(req),
      userId: req.user?._id,
      username: req.user?.username,
      email: req.user?.email,
      role: req.user?.role,
      isActive: req.user?.isActive,
      sessionId: req.session?._id,
      sessionCreatedAt: req.session?.createdAt,
      lastActivity: req.session?.lastActivity,
    };
  }

  /**
   * Check if current user can access another user's data
   */
  static canAccessUser(req: Request, targetUserId: string): boolean {

    if (this.isAdmin(req)) return true;


    return req.user?._id === targetUserId;
  }

  /**
   * Get client information from request
   */
  static getClientInfo(req: Request) {
    return {
      ip: req.ip ?? req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      acceptLanguage: req.get('Accept-Language'),
      referer: req.get('Referer'),
      origin: req.get('Origin'),
    };
  }
}
