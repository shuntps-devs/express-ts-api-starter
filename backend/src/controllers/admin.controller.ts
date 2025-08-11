import { Request, Response } from 'express';

import { logger } from '../config';
import { t } from '../i18n';
import { asyncHandler } from '../middleware';
import { Session } from '../models';
import { CleanupService } from '../services';
import { ErrorHelper, ResponseHelper } from '../utils';

/**
 * Admin controller
 * @description Handles administrative operations including session management and system cleanup
 * @class AdminController
 */
export class AdminController {
  private cleanupService: CleanupService;

  /**
   * Initialize admin controller
   * @description Creates instance with CleanupService for administrative operations
   */
  constructor() {
    this.cleanupService = CleanupService.getInstance();
  }

  /**
   * Get all active sessions
   * @route GET /api/admin/sessions/active
   * @description Retrieve all currently active user sessions with pagination
   * @param req - Express request object with optional pagination query parameters
   * @param res - Express response object
   * @returns Paginated list of active sessions with user information
   * @throws 500 - Database error when retrieving sessions
   * @example
   * GET /api/admin/sessions/active?page=1&limit=10
   */
  public getActiveSessions = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const requestId = ResponseHelper.extractRequestId(req);
      const contextLogger = req.logger ?? logger;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(
        100,
        Math.max(1, parseInt(req.query.limit as string) || 20)
      );
      const skip = (page - 1) * limit;

      contextLogger.info('Admin retrieving active sessions', {
        page,
        limit,
        requestId,
        adminId: req.user?._id,
      });

      const [sessions, totalSessions] = await Promise.all([
        Session.find({ isActive: true })
          .populate('userId', 'username email role lastLogin')
          .sort({ lastActivity: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Session.countDocuments({ isActive: true }),
      ]);

      const pagination = {
        currentPage: page,
        totalPages: Math.ceil(totalSessions / limit),
        totalItems: totalSessions,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(totalSessions / limit),
        hasPrevPage: page > 1,
      };

      contextLogger.info('Active sessions retrieved successfully', {
        count: sessions.length,
        totalSessions,
        requestId,
        adminId: req.user?._id,
      });

      ResponseHelper.sendSuccess(
        res,
        { sessions, pagination },
        200,
        t('success.sessionsRetrieved'),
        requestId
      );
    }
  );

  /**
   * Get all inactive sessions
   * @route GET /api/admin/sessions/inactive
   * @description Retrieve all currently inactive user sessions with pagination
   * @param req - Express request object with optional pagination query parameters
   * @param res - Express response object
   * @returns Paginated list of inactive sessions with user information
   * @throws 500 - Database error when retrieving sessions
   * @example
   * GET /api/admin/sessions/inactive?page=1&limit=10
   */
  public getInactiveSessions = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const requestId = ResponseHelper.extractRequestId(req);
      const contextLogger = req.logger ?? logger;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(
        100,
        Math.max(1, parseInt(req.query.limit as string) || 20)
      );
      const skip = (page - 1) * limit;

      contextLogger.info('Admin retrieving inactive sessions', {
        page,
        limit,
        requestId,
        adminId: req.user?._id,
      });

      const [sessions, totalSessions] = await Promise.all([
        Session.find({ isActive: false })
          .populate('userId', 'username email role lastLogin')
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Session.countDocuments({ isActive: false }),
      ]);

      const pagination = {
        currentPage: page,
        totalPages: Math.ceil(totalSessions / limit),
        totalItems: totalSessions,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(totalSessions / limit),
        hasPrevPage: page > 1,
      };

      contextLogger.info('Inactive sessions retrieved successfully', {
        count: sessions.length,
        totalSessions,
        requestId,
        adminId: req.user?._id,
      });

      ResponseHelper.sendSuccess(
        res,
        { sessions, pagination },
        200,
        t('success.sessionsRetrieved'),
        requestId
      );
    }
  );

  /**
   * Get session statistics
   * @route GET /api/admin/sessions/stats
   * @description Retrieve comprehensive session statistics for administrative overview
   * @param req - Express request object
   * @param res - Express response object
   * @returns Session statistics including active, inactive, expired counts
   * @throws 500 - Database error when retrieving statistics
   * @example
   * GET /api/admin/sessions/stats
   */
  public getSessionStats = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const requestId = ResponseHelper.extractRequestId(req);
      const contextLogger = req.logger ?? logger;

      contextLogger.info('Admin retrieving session statistics', {
        requestId,
        adminId: req.user?._id,
      });

      const stats =
        await this.cleanupService.getCleanupStatistics(contextLogger);

      const additionalStats = await Promise.all([
        Session.countDocuments({
          isActive: true,
          lastActivity: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        }),
        Session.countDocuments({
          isActive: true,
          lastActivity: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        }),
      ]);

      const enhancedStats = {
        ...stats,
        activeToday: additionalStats[0],
        activeThisWeek: additionalStats[1],
        inactiveRate:
          stats.totalSessions > 0
            ? Math.round((stats.inactiveSessions / stats.totalSessions) * 100)
            : 0,
        activeRate:
          stats.totalSessions > 0
            ? Math.round((stats.activeSessions / stats.totalSessions) * 100)
            : 0,
      };

      contextLogger.info('Session statistics retrieved successfully', {
        ...enhancedStats,
        requestId,
        adminId: req.user?._id,
      });

      ResponseHelper.sendSuccess(
        res,
        enhancedStats,
        200,
        t('success.profileRetrieved'),
        requestId
      );
    }
  );

  /**
   * Force cleanup inactive sessions
   * @route DELETE /api/admin/sessions/inactive
   * @description Force cleanup of all inactive sessions regardless of age
   * @param req - Express request object
   * @param res - Express response object
   * @returns Number of sessions cleaned and cleanup summary
   * @throws 500 - Database error during cleanup operation
   * @example
   * DELETE /api/admin/sessions/inactive
   */
  public forceCleanupInactiveSessions = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const requestId = ResponseHelper.extractRequestId(req);
      const contextLogger = req.logger ?? logger;

      contextLogger.info(
        'Admin initiating force cleanup of inactive sessions',
        {
          requestId,
          adminId: req.user?._id,
        }
      );

      const deletedCount =
        await this.cleanupService.forceCleanupAllInactiveSessions(
          contextLogger
        );

      contextLogger.info('Force cleanup completed successfully', {
        deletedCount,
        requestId,
        adminId: req.user?._id,
      });

      ResponseHelper.sendSuccess(
        res,
        { deletedCount },
        200,
        t('success.resourceDeleted'),
        requestId
      );
    }
  );

  /**
   * Run full cleanup tasks
   * @route POST /api/admin/cleanup
   * @description Execute all cleanup tasks including expired sessions and tokens
   * @param req - Express request object
   * @param res - Express response object
   * @returns Detailed cleanup results with counts per category
   * @throws 500 - Cleanup operation failure
   * @example
   * POST /api/admin/cleanup
   */
  public runCleanupTasks = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const requestId = ResponseHelper.extractRequestId(req);
      const contextLogger = req.logger ?? logger;

      contextLogger.info('Admin initiating full cleanup tasks', {
        requestId,
        adminId: req.user?._id,
      });

      const results = await this.cleanupService.runCleanupTasks(contextLogger);

      contextLogger.info('Full cleanup tasks completed successfully', {
        ...results,
        requestId,
        adminId: req.user?._id,
      });

      ResponseHelper.sendSuccess(
        res,
        results,
        200,
        t('success.resourceDeleted'),
        requestId
      );
    }
  );

  /**
   * Deactivate specific session
   * @route DELETE /api/admin/sessions/:sessionId
   * @description Deactivate a specific user session by ID
   * @param req - Express request object with sessionId parameter
   * @param res - Express response object
   * @returns Confirmation of session deactivation
   * @throws 404 - Session not found
   * @throws 500 - Database error during deactivation
   * @example
   * DELETE /api/admin/sessions/60f4b2b5e5b2a5001f5e4b2a
   */
  public deactivateSession = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const requestId = ResponseHelper.extractRequestId(req);
      const contextLogger = req.logger ?? logger;
      const { sessionId } = req.params;

      contextLogger.info('Admin deactivating specific session', {
        sessionId,
        requestId,
        adminId: req.user?._id,
      });

      const session = await Session.findById(sessionId);

      if (!session) {
        contextLogger.warn('Session not found for deactivation', {
          sessionId,
          requestId,
          adminId: req.user?._id,
        });

        return ErrorHelper.sendNotFound(
          res,
          t('errors.resourceNotFound'),
          requestId
        );
      }

      session.isActive = false;
      await session.save();

      contextLogger.info('Session deactivated successfully', {
        sessionId,
        userId: session.userId,
        requestId,
        adminId: req.user?._id,
      });

      ResponseHelper.sendSuccess(
        res,
        { sessionId, userId: session.userId, deactivatedAt: new Date() },
        200,
        t('success.resourceUpdated'),
        requestId
      );
    }
  );
}
