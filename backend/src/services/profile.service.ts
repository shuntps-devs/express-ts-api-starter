import { Logger } from 'winston';

import { logger } from '../config';
import { t } from '../i18n';
import { ICreateProfileDto, IUpdateProfileDto } from '../interfaces';
import { IProfile, Profile } from '../models';
import { AvatarHelper, ErrorHelper } from '../utils';

/**
 * Profile Service
 * Handles all profile-related business logic operations
 */
export class ProfileService {
  /**
   * Create a new user profile with default avatar
   * @param userId - User identifier
   * @param data - Optional profile creation data
   * @param contextLogger - Optional context logger for request tracing
   * @returns Promise resolving to created profile
   * @throws Error if profile creation fails
   */
  async createProfile(
    userId: string,
    data?: Partial<ICreateProfileDto>,
    contextLogger?: Logger
  ): Promise<IProfile> {
    const requestLogger = contextLogger ?? logger;

    requestLogger.info('Creating user profile', { userId });

    try {
      const existingProfile = await Profile.findByUserId(userId);
      if (existingProfile) {
        requestLogger.warn('Profile creation failed - profile already exists', {
          userId,
          profileId: existingProfile._id,
        });

        throw ErrorHelper.createOperationalError(
          t('profile.alreadyExists'),
          409,
          'PROFILE_EXISTS',
          true
        );
      }

      const defaultAvatar = AvatarHelper.generateDefaultAvatar(
        data?.username ?? userId
      );

      const profileData = {
        userId,
        bio: data?.bio ?? '',
        avatar: {
          url: defaultAvatar.url,
          uploadedAt: new Date(),
        },
        preferences: {
          twoFactorAuth: {
            isEnabled: false,
            backupCodes: [],
          },
        },
      };

      const profile = new Profile(profileData);
      await profile.save();

      requestLogger.info('Profile created successfully', {
        userId,
        profileId: profile._id,
        hasDefaultAvatar: true,
        avatarUrl: defaultAvatar.url,
      });

      return profile;
    } catch (error) {
      requestLogger.error('Profile creation failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (ErrorHelper.isOperational(error)) {
        throw error;
      }

      throw ErrorHelper.createOperationalError(
        t('profile.creationFailed'),
        500,
        'PROFILE_CREATION_FAILED'
      );
    }
  }

  /**
   * Find profile by user ID
   * @param userId - User identifier
   * @returns Promise resolving to profile or null if not found
   */
  async findProfileByUserId(userId: string): Promise<IProfile | null> {
    return Profile.findByUserId(userId);
  }

  /**
   * Update user profile
   * @param userId - User identifier
   * @param data - Updated profile data
   * @param contextLogger - Optional context logger for request tracing
   * @returns Promise resolving to updated profile or null if not found
   */
  async updateProfile(
    userId: string,
    data: IUpdateProfileDto,
    contextLogger?: Logger
  ): Promise<IProfile | null> {
    const requestLogger = contextLogger ?? logger;

    requestLogger.info('Updating user profile', { userId });

    try {
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (data.bio !== undefined) {
        updateData.bio = data.bio;
      }

      if (data.avatar) {
        updateData.avatar = data.avatar;
      }

      if (data.preferences?.twoFactorAuth) {
        updateData['preferences.twoFactorAuth'] =
          data.preferences.twoFactorAuth;
      }

      const profile = await Profile.findOneAndUpdate({ userId }, updateData, {
        new: true,
        runValidators: true,
      });

      if (!profile) {
        requestLogger.warn('Profile update failed - profile not found', {
          userId,
        });
        return null;
      }

      requestLogger.info('Profile updated successfully', {
        userId,
        profileId: profile._id,
      });

      return profile;
    } catch (error) {
      requestLogger.error('Profile update failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw ErrorHelper.createOperationalError(
        t('profile.updateFailed'),
        500,
        'PROFILE_UPDATE_FAILED'
      );
    }
  }

  /**
   * Get or create user profile (ensures profile exists)
   * @param userId - User identifier
   * @param fallbackData - Data to use if creating new profile
   * @param contextLogger - Optional context logger for request tracing
   * @returns Promise resolving to existing or newly created profile
   */
  async getOrCreateProfile(
    userId: string,
    fallbackData?: Partial<ICreateProfileDto>,
    contextLogger?: Logger
  ): Promise<IProfile> {
    const requestLogger = contextLogger ?? logger;

    let profile = await this.findProfileByUserId(userId);

    if (!profile) {
      requestLogger.info('Profile not found, creating new profile', { userId });
      profile = await this.createProfile(userId, fallbackData, requestLogger);
    }

    return profile;
  }

  /**
   * Delete user profile (soft delete by marking inactive)
   * @param userId - User identifier
   * @param contextLogger - Optional context logger for request tracing
   * @returns Promise resolving to true if deletion successful
   */
  async deleteProfile(
    userId: string,
    contextLogger?: Logger
  ): Promise<boolean> {
    const requestLogger = contextLogger ?? logger;

    requestLogger.info('Deleting user profile', { userId });

    try {
      const result = await Profile.findOneAndDelete({ userId });
      const success = !!result;

      if (success) {
        requestLogger.info('Profile deleted successfully', {
          userId,
          profileId: result._id,
        });
      } else {
        requestLogger.warn('Profile deletion failed - profile not found', {
          userId,
        });
      }

      return success;
    } catch (error) {
      requestLogger.error('Profile deletion failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw ErrorHelper.createOperationalError(
        t('profile.deletionFailed'),
        500,
        'PROFILE_DELETION_FAILED'
      );
    }
  }

  /**
   * Update user avatar in profile
   * @param userId - User identifier
   * @param avatarData - Avatar data to update
   * @param contextLogger - Optional context logger for request tracing
   * @returns Promise resolving to updated profile
   */
  async updateProfileAvatar(
    userId: string,
    avatarData: { url: string; uploadedAt?: Date },
    contextLogger?: Logger
  ): Promise<IProfile> {
    const requestLogger = contextLogger ?? logger;

    requestLogger.info('Updating profile avatar', { userId });

    try {
      const profile = await Profile.findByUserId(userId);

      if (!profile) {
        throw ErrorHelper.createNotFoundError('Profile', userId);
      }

      await profile.updateAvatar({
        url: avatarData.url,
        uploadedAt: avatarData.uploadedAt ?? new Date(),
      });

      requestLogger.info('Profile avatar updated successfully', {
        userId,
        profileId: profile._id,
        avatarUrl: avatarData.url,
      });

      return profile;
    } catch (error) {
      requestLogger.error('Profile avatar update failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (ErrorHelper.isOperational(error)) {
        throw error;
      }

      throw ErrorHelper.createOperationalError(
        t('profile.avatarUpdateFailed'),
        500,
        'PROFILE_AVATAR_UPDATE_FAILED'
      );
    }
  }

  /**
   * Remove user avatar from profile
   * @param userId - User identifier
   * @param contextLogger - Optional context logger for request tracing
   * @returns Promise resolving to updated profile
   */
  async removeProfileAvatar(
    userId: string,
    contextLogger?: Logger
  ): Promise<IProfile> {
    const requestLogger = contextLogger ?? logger;

    requestLogger.info('Removing profile avatar', { userId });

    try {
      const profile = await Profile.findByUserId(userId);

      if (!profile) {
        throw ErrorHelper.createNotFoundError('Profile', userId);
      }

      await profile.removeAvatar();

      requestLogger.info('Profile avatar removed successfully', {
        userId,
        profileId: profile._id,
      });

      return profile;
    } catch (error) {
      requestLogger.error('Profile avatar removal failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (ErrorHelper.isOperational(error)) {
        throw error;
      }

      throw ErrorHelper.createOperationalError(
        t('profile.avatarRemovalFailed'),
        500,
        'PROFILE_AVATAR_REMOVAL_FAILED'
      );
    }
  }
}
