import { Request, Response } from 'express';

import { logger } from '../config';
import { t } from '../i18n';
import { IPaginatedResponse, IUserResponse, UserRole } from '../interfaces';
import { asyncHandler } from '../middleware';
import { UserService } from '../services';
import { ResponseHelper, UserHelper } from '../utils';

/**
 * Controller for user management operations
 */
export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Get current user's profile
   */
  public getProfile = asyncHandler((req: Request, res: Response): void => {
    const requestId = ResponseHelper.extractRequestId(req);
    const contextLogger = req.logger ?? logger;

    if (!req.user) {
      ResponseHelper.sendUnauthorized(res, t('auth.userNotFound'), requestId);
      return;
    }

    const userResponse: IUserResponse = {
      id: String(req.user._id),
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      isActive: req.user.isActive,
      isEmailVerified: req.user.isEmailVerified,
      lastLogin: req.user.lastLogin,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
    };

    contextLogger.info('Profile accessed', {
      userId: req.user._id,
    });

    ResponseHelper.sendSuccess<IUserResponse>(
      res,
      userResponse,
      200,
      t('success.profileRetrieved'),
      requestId
    );
  });

  /**
   * Update current user's profile
   */
  public updateProfile = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const requestId = ResponseHelper.extractRequestId(req);
      const contextLogger = req.logger ?? logger;

      if (!req.user) {
        ResponseHelper.sendUnauthorized(res, t('auth.userNotFound'), requestId);
        return;
      }

      // Update user with provided data
      const updatedUser = await this.userService.updateUser(
        String(req.user._id),
        req.body
      );

      if (!updatedUser) {
        ResponseHelper.sendNotFound(res, t('auth.userNotFound'), requestId);
        return;
      }

      const userResponse: IUserResponse = {
        id: String(updatedUser._id),
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        isEmailVerified: updatedUser.isEmailVerified,
        lastLogin: updatedUser.lastLogin,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      };

      contextLogger.info('Profile updated', {
        userId: req.user._id,
      });

      ResponseHelper.sendSuccess<IUserResponse>(
        res,
        userResponse,
        200,
        t('success.resourceUpdated'),
        requestId
      );
    }
  );

  /**
   * Get all users (admin only)
   */
  public getAllUsers = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const requestId = ResponseHelper.extractRequestId(req);
      const contextLogger = req.logger ?? logger;

      const paginatedUsers = await this.userService.getAllUsers(req.query);

      contextLogger.info('All users retrieved', {
        adminId: req.user?._id,
        count: paginatedUsers.data.length,
        total: paginatedUsers.pagination.total,
      });

      ResponseHelper.sendSuccess<IPaginatedResponse<IUserResponse>>(
        res,
        paginatedUsers,
        200,
        t('success.resourceCreated'),
        requestId
      );
    }
  );

  /**
   * Get user by ID (admin only)
   */
  public getUserById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { userId } = req.params;
      const requestId = ResponseHelper.extractRequestId(req);
      const contextLogger = req.logger ?? logger;

      const user = await this.userService.findUserById(userId);

      if (!user) {
        ResponseHelper.sendNotFound(res, t('auth.userNotFound'), requestId);
        return;
      }

      const userResponse: IUserResponse = {
        id: String(user._id),
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      contextLogger.info('User retrieved by ID', {
        adminId: req.user?._id,
        targetUserId: userId,
      });

      ResponseHelper.sendSuccess<IUserResponse>(
        res,
        userResponse,
        200,
        t('success.profileRetrieved'),
        requestId
      );
    }
  );

  /**
   * Update user by ID (admin only)
   */
  public updateUserById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { userId } = req.params;
      const requestId = ResponseHelper.extractRequestId(req);
      const contextLogger = req.logger ?? logger;

      const updatedUser = await this.userService.updateUser(userId, req.body);

      if (!updatedUser) {
        ResponseHelper.sendNotFound(res, t('auth.userNotFound'), requestId);
        return;
      }

      const userResponse: IUserResponse = {
        id: String(updatedUser._id),
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        isEmailVerified: updatedUser.isEmailVerified,
        lastLogin: updatedUser.lastLogin,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      };

      contextLogger.info('User updated by admin', {
        adminId: req.user?._id,
        targetUserId: userId,
      });

      ResponseHelper.sendSuccess<IUserResponse>(
        res,
        userResponse,
        200,
        t('success.resourceUpdated'),
        requestId
      );
    }
  );

  /**
   * Delete user by ID (admin only)
   */
  public deleteUserById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { userId } = req.params;
      const requestId = ResponseHelper.extractRequestId(req);
      const contextLogger = req.logger ?? logger;

      const deleted = await this.userService.deleteUser(userId);

      if (!deleted) {
        ResponseHelper.sendNotFound(res, t('auth.userNotFound'), requestId);
        return;
      }

      contextLogger.info('User deleted by admin', {
        adminId: req.user?._id,
        deletedUserId: userId,
      });

      ResponseHelper.sendSuccess(
        res,
        null,
        200,
        t('success.resourceDeleted'),
        requestId
      );
    }
  );

  /**
   * Get current user's dashboard with personalized content
   */
  public getDashboard = asyncHandler((req: Request, res: Response): void => {
    const requestId = ResponseHelper.extractRequestId(req);

    // Use our helper to get session info
    const sessionInfo = UserHelper.getSessionInfo(req);

    // Use contextual logger if available
    const contextLogger = req.logger ?? logger;

    contextLogger.info('Dashboard accessed', {
      userId: sessionInfo.userId,
      role: sessionInfo.role,
    });

    const dashboardData = {
      user: {
        displayName: UserHelper.getDisplayName(req),
        isAdmin: UserHelper.isAdmin(req),
        isModerator: UserHelper.isModerator(req),
        ...sessionInfo,
      },
      permissions: {
        canManageUsers: UserHelper.isAdmin(req),
        canModerate: UserHelper.isModerator(req),
        canViewAnalytics: UserHelper.hasAnyRole(req, [
          UserRole.ADMIN,
          UserRole.MODERATOR,
        ]),
      },
      clientInfo: UserHelper.getClientInfo(req),
    };

    ResponseHelper.sendSuccess(
      res,
      dashboardData,
      200,
      'Dashboard data retrieved successfully',
      requestId
    );
  });

  /**
   * Get user profile by ID (with access control)
   */
  public getUserProfile = asyncHandler((req: Request, res: Response): void => {
    const { userId } = req.params;
    const requestId = ResponseHelper.extractRequestId(req);
    const contextLogger = req.logger ?? logger;

    // Check if user can access this profile
    if (!UserHelper.canAccessUser(req, userId)) {
      contextLogger.warn('Unauthorized profile access attempt', {
        requestorId: req.user?._id,
        targetUserId: userId,
      });

      ResponseHelper.sendForbidden(
        res,
        'You can only access your own profile',
        requestId
      );
      return;
    }

    // For now, return the requesting user's profile
    // In a real app, you'd fetch the target user's profile
    const profileData = UserHelper.getSessionInfo(req);

    contextLogger.info('Profile accessed', {
      userId: req.user?._id,
      targetUserId: userId,
    });

    ResponseHelper.sendSuccess(
      res,
      profileData,
      200,
      'Profile retrieved successfully',
      requestId
    );
  });

  /**
   * Get user statistics (admin only)
   */
  public getUserStats = asyncHandler((req: Request, res: Response): void => {
    const requestId = ResponseHelper.extractRequestId(req);
    const contextLogger = req.logger ?? logger;

    if (!UserHelper.isAdmin(req)) {
      ResponseHelper.sendForbidden(res, 'Admin access required', requestId);
      return;
    }

    // Mock statistics data
    const stats = {
      totalUsers: 150,
      activeUsers: 120,
      newUsersThisMonth: 25,
      usersByRole: {
        admin: 2,
        moderator: 5,
        user: 143,
      },
    };

    contextLogger.info('User statistics accessed', {
      adminId: req.user?._id,
    });

    ResponseHelper.sendSuccess(
      res,
      stats,
      200,
      'User statistics retrieved successfully',
      requestId
    );
  });
}
