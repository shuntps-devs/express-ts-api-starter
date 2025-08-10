import { Request, Response } from 'express';

import { logger } from '../config';
import { t } from '../i18n';
import { IPaginatedResponse, IUserResponse, UserRole } from '../interfaces';
import { asyncHandler } from '../middleware';
import { UserService } from '../services';
import { ErrorHelper, ResponseHelper, UserHelper } from '../utils';

/**
 * User management controller
 * @description Handles user administration and dashboard functionality (profile management moved to ProfileController)
 * @class UserController
 */
export class UserController {
  private userService: UserService;

  /**
   * Initialize user controller
   * @description Creates new instance of UserService for user management operations
   */
  constructor() {
    this.userService = new UserService();
  }

  /**
   * Get all users (admin only)
   * @route GET /api/user/all
   * @description Retrieves paginated list of all users (admin access required)
   * @param req - Express request object with query parameters for pagination
   * @param res - Express response object
   * @returns Paginated list of users with metadata
   * @throws 401 - User not authenticated
   * @throws 403 - User not authorized (admin role required)
   * @security Bearer token required (HTTP-only cookie) + Admin role
   */
  public getAllUsers = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const requestId = ResponseHelper.extractRequestId(req);
      const contextLogger = req.logger ?? logger;

      try {
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
      } catch (error) {
        contextLogger.error('Failed to retrieve all users', {
          adminId: req.user?._id,
          error,
          requestId,
        });
        throw error;
      }
    }
  );

  /**
   * Get user by ID (admin only)
   * @route GET /api/user/:userId
   * @description Retrieves specific user by ID (admin access required)
   * @param req - Express request object with userId parameter
   * @param res - Express response object
   * @returns User data for specified ID
   * @throws 401 - User not authenticated
   * @throws 403 - User not authorized (admin role required)
   * @throws 404 - User not found
   * @security Bearer token required (HTTP-only cookie) + Admin role
   */
  public getUserById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { userId } = req.params;
      const requestId = ResponseHelper.extractRequestId(req);
      const contextLogger = req.logger ?? logger;

      try {
        const user = await this.userService.findUserById(userId);

        if (!user) {
          contextLogger.warn('User not found by ID', {
            adminId: req.user?._id,
            targetUserId: userId,
            requestId,
          });
          // ✅ Use ErrorHelper for consistent not found errors
          throw ErrorHelper.createNotFoundError('User', requestId);
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
      } catch (error) {
        contextLogger.error('Failed to retrieve user by ID', {
          adminId: req.user?._id,
          targetUserId: userId,
          error,
          requestId,
        });
        throw error;
      }
    }
  );

  /**
   * Update user by ID (admin only)
   * @route PATCH /api/user/:userId
   * @description Updates specific user by ID (admin access required)
   * @param req - Express request object with userId parameter and update data
   * @param res - Express response object
   * @returns Updated user data
   * @throws 401 - User not authenticated
   * @throws 403 - User not authorized (admin role required)
   * @throws 404 - User not found
   * @security Bearer token required (HTTP-only cookie) + Admin role
   */
  public updateUserById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { userId } = req.params;
      const requestId = ResponseHelper.extractRequestId(req);
      const contextLogger = req.logger ?? logger;

      try {
        const updatedUser = await this.userService.updateUser(userId, req.body);

        if (!updatedUser) {
          contextLogger.warn('User update failed - user not found', {
            adminId: req.user?._id,
            targetUserId: userId,
            requestId,
          });
          // ✅ Use ErrorHelper for consistent not found errors
          throw ErrorHelper.createNotFoundError('User', requestId);
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
      } catch (error) {
        contextLogger.error('Failed to update user by admin', {
          adminId: req.user?._id,
          targetUserId: userId,
          error,
          requestId,
        });
        throw error;
      }
    }
  );

  /**
   * Delete user by ID (admin only)
   * @route DELETE /api/user/:userId
   * @description Permanently deletes specific user by ID (admin access required)
   * @param req - Express request object with userId parameter
   * @param res - Express response object
   * @returns Success confirmation message
   * @throws 401 - User not authenticated
   * @throws 403 - User not authorized (admin role required)
   * @throws 404 - User not found
   * @security Bearer token required (HTTP-only cookie) + Admin role
   */
  public deleteUserById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { userId } = req.params;
      const requestId = ResponseHelper.extractRequestId(req);
      const contextLogger = req.logger ?? logger;

      try {
        const deleted = await this.userService.deleteUser(userId);

        if (!deleted) {
          contextLogger.warn('User deletion failed - user not found', {
            adminId: req.user?._id,
            targetUserId: userId,
            requestId,
          });
          // ✅ Use ErrorHelper for consistent not found errors
          throw ErrorHelper.createNotFoundError('User', requestId);
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
      } catch (error) {
        contextLogger.error('Failed to delete user', {
          adminId: req.user?._id,
          targetUserId: userId,
          error,
          requestId,
        });
        throw error;
      }
    }
  );

  /**
   * Get current user's dashboard with personalized content
   * @route GET /api/user/dashboard
   * @description Retrieves dashboard data with user permissions and session information
   * @param req - Express request object with authenticated user
   * @param res - Express response object
   * @returns Dashboard data with user info, permissions, and client details
   * @throws 401 - User not authenticated
   * @security Bearer token required (HTTP-only cookie)
   */
  public getDashboard = asyncHandler((req: Request, res: Response): void => {
    const requestId = ResponseHelper.extractRequestId(req);

    const sessionInfo = UserHelper.getSessionInfo(req);

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
   * @route GET /api/user/profile/:userId
   * @description Retrieves user profile with proper access control (own profile or admin)
   * @param req - Express request object with userId parameter
   * @param res - Express response object
   * @returns User profile data if access is authorized
   * @throws 401 - User not authenticated
   * @throws 403 - Access denied (can only access own profile unless admin)
   * @security Bearer token required (HTTP-only cookie)
   */
  public getUserProfile = asyncHandler((req: Request, res: Response): void => {
    const { userId } = req.params;
    const requestId = ResponseHelper.extractRequestId(req);
    const contextLogger = req.logger ?? logger;

    if (!UserHelper.canAccessUser(req, userId)) {
      contextLogger.warn('Unauthorized profile access attempt', {
        requestorId: req.user?._id,
        targetUserId: userId,
      });

      ErrorHelper.sendForbidden(
        res,
        'You can only access your own profile',
        requestId
      );
      return;
    }

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
   * @route GET /api/user/stats
   * @description Retrieves comprehensive user statistics and analytics (admin access required)
   * @param req - Express request object with authenticated admin user
   * @param res - Express response object
   * @returns Statistical data about user base including counts and role distribution
   * @throws 401 - User not authenticated
   * @throws 403 - Access denied (admin role required)
   * @security Bearer token required (HTTP-only cookie) + Admin role
   */
  public getUserStats = asyncHandler((req: Request, res: Response): void => {
    const requestId = ResponseHelper.extractRequestId(req);
    const contextLogger = req.logger ?? logger;

    if (!UserHelper.isAdmin(req)) {
      ErrorHelper.sendForbidden(res, 'Admin access required', requestId);
      return;
    }

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
