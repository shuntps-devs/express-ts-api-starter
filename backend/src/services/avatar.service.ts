import { promises as fs } from 'fs';
import path from 'path';

import { Logger } from 'winston';

import { logger } from '../config';
import { t } from '../i18n';
import { IProfile, Profile } from '../models';
import { DateHelper, ErrorHelper } from '../utils';

/**
 * Avatar upload result interface
 */
export interface IAvatarUploadResult {
  success: boolean;
  avatar: {
    url: string;
    filename: string;
    uploadedAt: Date;
  };
  previousAvatarDeleted?: boolean;
}

/**
 * Avatar Service
 * Handles avatar upload, deletion, and management operations
 */
export class AvatarService {
  private static readonly UPLOAD_DIR = 'uploads/avatars';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024;
  private static readonly ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];

  /**
   * Initialize upload directory
   * @param contextLogger - Optional context logger for request tracing
   * @throws Error if directory creation fails
   */
  public static async initializeUploadDirectory(
    contextLogger?: Logger
  ): Promise<void> {
    const requestLogger = contextLogger ?? logger;

    try {
      await fs.mkdir(this.UPLOAD_DIR, { recursive: true });
      requestLogger.info('Avatar upload directory initialized', {
        directory: this.UPLOAD_DIR,
      });
    } catch (error) {
      requestLogger.error('Failed to initialize upload directory', {
        directory: this.UPLOAD_DIR,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ErrorHelper.createOperationalError(
        t('avatar.directoryCreationFailed'),
        500,
        'DIRECTORY_CREATION_FAILED'
      );
    }
  }

  /**
   * Get user avatar directory path
   * @param userId - User identifier
   * @returns Path to user's avatar directory
   */
  public static getUserAvatarPath(userId: string): string {
    return path.join(this.UPLOAD_DIR, userId);
  }

  /**
   * Get avatar file URL
   * @param userId - User identifier
   * @param filename - Avatar filename
   * @returns Avatar URL path
   */
  public static getAvatarUrl(userId: string, filename: string): string {
    return `/uploads/avatars/${userId}/${filename}`;
  }

  /**
   * Validate file format
   * @param filename - File name to validate
   * @returns True if format is allowed
   */
  public static isValidFormat(filename: string): boolean {
    const extension = path.extname(filename).toLowerCase().slice(1);
    return this.ALLOWED_FORMATS.includes(extension);
  }

  /**
   * Validate file size
   * @param fileSize - File size in bytes
   * @returns True if size is within limits
   */
  public static isValidSize(fileSize: number): boolean {
    return fileSize <= this.MAX_FILE_SIZE;
  }

  /**
   * Delete existing avatar files for user
   * @param userId - User identifier
   * @param contextLogger - Optional context logger for request tracing
   * @returns Promise resolving to true if files were deleted
   */
  public static async deleteExistingAvatar(
    userId: string,
    contextLogger?: Logger
  ): Promise<boolean> {
    const requestLogger = contextLogger ?? logger;
    const userAvatarPath = this.getUserAvatarPath(userId);

    try {

      await fs.access(userAvatarPath);


      const files = await fs.readdir(userAvatarPath);
      let deletedFiles = 0;


      for (const file of files) {
        const filePath = path.join(userAvatarPath, file);
        await fs.unlink(filePath);
        deletedFiles++;
      }

      if (deletedFiles > 0) {
        requestLogger.info('Existing avatar files deleted', {
          userId,
          deletedFiles,
          directory: userAvatarPath,
        });
        return true;
      }

      return false;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {

        requestLogger.debug('No existing avatar directory to delete', {
          userId,
          directory: userAvatarPath,
        });
        return false;
      }

      requestLogger.warn('Failed to delete existing avatar', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Save uploaded avatar file
   * @param userId - User identifier
   * @param buffer - File buffer data
   * @param originalName - Original filename
   * @param contextLogger - Optional context logger for request tracing
   * @returns Promise resolving to upload result
   * @throws Error if save operation fails
   */
  public static async saveAvatar(
    userId: string,
    buffer: Buffer,
    originalName: string,
    contextLogger?: Logger
  ): Promise<IAvatarUploadResult> {
    const requestLogger = contextLogger ?? logger;

    try {

      if (!this.isValidFormat(originalName)) {
        throw ErrorHelper.createOperationalError(
          t('avatar.invalidFormat'),
          400,
          'INVALID_FILE_FORMAT'
        );
      }


      if (!this.isValidSize(buffer.length)) {
        throw ErrorHelper.createOperationalError(
          t('avatar.fileTooLarge'),
          400,
          'FILE_TOO_LARGE'
        );
      }


      const timestamp = DateHelper.timestamp();
      const extension = path.extname(originalName).toLowerCase();
      const filename = `avatar-${timestamp}${extension}`;
      const userAvatarPath = this.getUserAvatarPath(userId);
      const filePath = path.join(userAvatarPath, filename);


      await fs.mkdir(userAvatarPath, { recursive: true });


      const previousAvatarDeleted = await this.deleteExistingAvatar(
        userId,
        requestLogger
      );


      await fs.writeFile(filePath, buffer);

      const uploadedAt = DateHelper.now();
      const avatarUrl = this.getAvatarUrl(userId, filename);

      requestLogger.info('Avatar uploaded successfully', {
        userId,
        filename,
        originalName,
        fileSize: buffer.length,
        avatarUrl,
        previousAvatarDeleted,
      });

      return {
        success: true,
        avatar: {
          url: avatarUrl,
          filename,
          uploadedAt,
        },
        previousAvatarDeleted,
      };
    } catch (error) {
      requestLogger.error('Avatar upload failed', {
        userId,
        originalName,
        fileSize: buffer.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      });


      if (ErrorHelper.isOperational(error)) {
        throw error;
      }


      throw ErrorHelper.createOperationalError(
        t('avatar.uploadFailed'),
        500,
        'AVATAR_UPLOAD_FAILED'
      );
    }
  }

  /**
   * Update user profile with new avatar data
   * @param userId - User identifier
   * @param avatarData - Avatar data from upload result
   * @param contextLogger - Optional context logger for request tracing
   * @returns Promise resolving to updated profile
   * @throws Error if profile update fails
   */
  public static async updateProfileAvatar(
    userId: string,
    avatarData: IAvatarUploadResult['avatar'],
    contextLogger?: Logger
  ): Promise<IProfile> {
    const requestLogger = contextLogger ?? logger;

    try {
      const profile = await Profile.findByUserId(userId);

      if (!profile) {
        throw ErrorHelper.createNotFoundError('Profile', userId);
      }

      await profile.updateAvatar({
        url: avatarData.url,
        uploadedAt: avatarData.uploadedAt,
      });

      requestLogger.info('Profile avatar updated successfully', {
        userId,
        profileId: profile._id,
        avatarUrl: avatarData.url,
      });

      return profile;
    } catch (error) {
      requestLogger.error('Failed to update profile avatar', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (ErrorHelper.isOperational(error)) {
        throw error;
      }

      throw ErrorHelper.createOperationalError(
        t('avatar.profileUpdateFailed'),
        500,
        'PROFILE_UPDATE_FAILED'
      );
    }
  }

  /**
   * Remove user avatar
   * @param userId - User identifier
   * @param contextLogger - Optional context logger for request tracing
   * @returns Promise resolving to updated profile
   * @throws Error if avatar removal fails
   */
  public static async removeAvatar(
    userId: string,
    contextLogger?: Logger
  ): Promise<IProfile> {
    const requestLogger = contextLogger ?? logger;

    try {

      const filesDeleted = await this.deleteExistingAvatar(
        userId,
        requestLogger
      );


      const profile = await Profile.findByUserId(userId);

      if (!profile) {
        throw ErrorHelper.createNotFoundError('Profile', userId);
      }

      await profile.removeAvatar();

      requestLogger.info('Avatar removed successfully', {
        userId,
        profileId: profile._id,
        filesDeleted,
      });

      return profile;
    } catch (error) {
      requestLogger.error('Failed to remove avatar', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (ErrorHelper.isOperational(error)) {
        throw error;
      }

      throw ErrorHelper.createOperationalError(
        t('avatar.removalFailed'),
        500,
        'AVATAR_REMOVAL_FAILED'
      );
    }
  }

  /**
   * Get avatar upload limits and allowed formats
   * @returns Upload configuration object
   */
  public static getUploadConfig(): {
    maxFileSize: number;
    allowedFormats: string[];
    maxFileSizeMB: number;
  } {
    return {
      maxFileSize: this.MAX_FILE_SIZE,
      allowedFormats: this.ALLOWED_FORMATS,
      maxFileSizeMB: Math.round(this.MAX_FILE_SIZE / (1024 * 1024)),
    };
  }
}
