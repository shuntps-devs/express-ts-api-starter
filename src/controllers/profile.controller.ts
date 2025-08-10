import { Request, Response } from 'express';

import { logger } from '../config';
import { t } from '../i18n';
import { IUserResponse } from '../interfaces';
import { asyncHandler } from '../middleware';
import { AvatarService, UserService } from '../services';
import { ErrorHelper, ResponseHelper } from '../utils';

/**
 * ProfileController class
 * @description Handles all profile-related operations including profile data management and avatar operations
 * @class ProfileController
 */
class ProfileController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Get current user's profile
   * @route GET /api/profile
   * @description Retrieves the authenticated user's profile information
   * @param req - Express request object with authenticated user
   * @param res - Express response object
   * @returns User profile data sanitized for client consumption
   * @throws ErrorHelper.createAuthError if user not authenticated
   */
  public getProfile = asyncHandler((req: Request, res: Response): void => {
    const contextLogger = req.logger ?? logger;
    const requestId = ResponseHelper.extractRequestId(req);

    if (!req.user) {
      contextLogger.warn('Profile access failed - user not authenticated', {
        requestId,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      throw ErrorHelper.createAuthError(t('auth.userNotFound'), requestId);
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
      requestId,
      ip: req.ip,
      userAgent: req.get('user-agent'),
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
   * @route PATCH /api/profile
   * @description Updates the authenticated user's profile information
   * @param req - Express request object with profile update data
   * @param res - Express response object
   * @returns Updated user profile data
   * @throws ErrorHelper.createAuthError if user not authenticated
   * @throws ErrorHelper.createNotFoundError if user not found
   */
  public updateProfile = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const contextLogger = req.logger ?? logger;
      const requestId = ResponseHelper.extractRequestId(req);

      if (!req.user) {
        contextLogger.warn('Update profile failed - user not authenticated', {
          requestId,
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
        throw ErrorHelper.createAuthError(t('auth.userNotFound'), requestId);
      }

      try {
        const updatedUser = await this.userService.updateUser(
          String(req.user._id),
          req.body
        );

        if (!updatedUser) {
          contextLogger.warn('Profile update failed - user not found', {
            userId: req.user._id,
            requestId,
            updateData: Object.keys(req.body),
          });
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

        contextLogger.info('Profile updated', {
          userId: updatedUser._id,
          requestId,
          updatedFields: Object.keys(req.body),
        });

        ResponseHelper.sendSuccess<IUserResponse>(
          res,
          userResponse,
          200,
          t('success.resourceUpdated'),
          requestId
        );
      } catch (error) {
        contextLogger.error('Profile update failed', {
          userId: req.user._id.toString(),
          requestId,
          error: error instanceof Error ? error.message : 'Unknown error',
          updateData: Object.keys(req.body),
        });
        throw error;
      }
    }
  );

  /**
   * Upload user avatar
   * @route POST /api/profile/avatar
   * @description Uploads and processes a new avatar for the authenticated user
   * @param req - Express request object with file data in fileBuffer
   * @param res - Express response object
   * @returns Avatar upload success response with avatar URL
   * @throws ErrorHelper.createAuthError if user not authenticated or no file
   */
  public uploadAvatar = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const contextLogger = req.logger ?? logger;
      const requestId = ResponseHelper.extractRequestId(req);

      if (!req.user) {
        throw ErrorHelper.createAuthError(t('auth.userNotFound'), requestId);
      }

      const avatarReq = req as {
        fileBuffer?: { buffer: Buffer; originalName: string };
      };
      if (!avatarReq.fileBuffer) {
        throw ErrorHelper.createAuthError(t('auth.userNotFound'), requestId);
      }

      const userId = req.user._id.toString();
      const { buffer, originalName } = avatarReq.fileBuffer;

      try {
        /**
         * Save avatar using AvatarService
         */
        const avatarData = await AvatarService.saveAvatar(
          userId,
          buffer,
          originalName,
          contextLogger
        );

        /**
         * Update user profile with avatar
         */
        await AvatarService.updateProfileAvatar(
          userId,
          avatarData.avatar,
          contextLogger
        );

        contextLogger.info('Avatar uploaded successfully', {
          userId,
          requestId,
          fileName: originalName,
          avatarUrl: avatarData.avatar.url,
        });

        ResponseHelper.sendSuccess(
          res,
          {
            avatarUrl: avatarData.avatar.url,
            uploadedAt: avatarData.avatar.uploadedAt,
          },
          200,
          t('success.resourceUpdated'),
          requestId
        );
      } catch (error) {
        contextLogger.error('Avatar upload failed', {
          userId,
          requestId,
          fileName: originalName,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    }
  );

  /**
   * Remove user avatar
   * @route DELETE /api/profile/avatar
   * @description Removes the current user's avatar
   * @param req - Express request object with authenticated user
   * @param res - Express response object
   * @returns Avatar removal success response
   * @throws ErrorHelper.createAuthError if user not authenticated
   */
  public removeAvatar = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const contextLogger = req.logger ?? logger;
      const requestId = ResponseHelper.extractRequestId(req);

      if (!req.user) {
        throw ErrorHelper.createAuthError(t('auth.userNotFound'), requestId);
      }

      const userId = req.user._id.toString();

      try {
        /**
         * Remove avatar using AvatarService
         */
        await AvatarService.removeAvatar(userId, contextLogger);

        contextLogger.info('Avatar removed successfully', {
          userId,
          requestId,
        });

        ResponseHelper.sendSuccess(
          res,
          null,
          200,
          t('success.resourceDeleted'),
          requestId
        );
      } catch (error) {
        contextLogger.error('Avatar removal failed', {
          userId,
          requestId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    }
  );

  /**
   * Get avatar upload configuration
   * @route GET /api/profile/avatar/config
   * @description Returns configuration for avatar uploads (max size, allowed formats, etc.)
   * @param req - Express request object
   * @param res - Express response object
   * @returns Avatar upload configuration
   */
  public getAvatarConfig = asyncHandler((req: Request, res: Response): void => {
    const requestId = ResponseHelper.extractRequestId(req);

    /**
     * Get configuration from AvatarService
     */
    const config = AvatarService.getUploadConfig();

    ResponseHelper.sendSuccess(
      res,
      config,
      200,
      t('success.profileRetrieved'),
      requestId
    );
  });
}

export { ProfileController };
export const profileController = new ProfileController();
