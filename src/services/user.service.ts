import { Logger } from 'winston';

import { logger } from '../config';
import { t } from '../i18n';
import {
  IChangePassword,
  ICreateUserDto,
  IPaginatedResponse,
  ISearchQuery,
  IUpdateUserDto,
  IUserResponse,
} from '../interfaces';
import { IUser, User } from '../models';
import { ErrorHelper } from '../utils';

/**
 * User Service
 * @description Handles all user-related business logic operations
 * @class UserService
 */
export class UserService {
  /**
   * Create a new user account
   * @param userData - User creation data
   * @param contextLogger - Optional context logger for request tracing
   * @returns Promise resolving to created user
   * @throws Error if user already exists or creation fails
   */
  async createUser(
    userData: ICreateUserDto,
    contextLogger?: Logger
  ): Promise<IUser> {
    const requestLogger = contextLogger ?? logger;
    const { username, email, password: userPassword, role } = userData;

    requestLogger.info('Creating new user', {
      email: email.toLowerCase(),
      username,
    });

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      const conflict =
        existingUser.email === email.toLowerCase() ? 'email' : 'username';

      requestLogger.warn('User creation failed - user already exists', {
        email: email.toLowerCase(),
        username,
        conflict,
      });

      throw ErrorHelper.createOperationalError(
        conflict === 'email'
          ? t('auth.email.alreadyExists')
          : t('auth.username.alreadyExists'),
        409,
        `USER_${conflict.toUpperCase()}_EXISTS`,
        true
      );
    }

    try {
      const user = new User({
        username,
        email: email.toLowerCase(),
        password: userPassword,
        role: role ?? 'user',
      });

      await user.save();

      requestLogger.info('User created successfully', {
        userId: user._id,
        email: email.toLowerCase(),
        username,
      });

      return user;
    } catch (error) {
      ErrorHelper.logError(
        error,
        {
          operation: 'user-creation',
          email: email.toLowerCase(),
          username,
        },
        undefined,
        undefined
      );

      throw error;
    }
  }

  /**
   * Find user by ID
   * @param userId - User identifier
   * @returns Promise resolving to user or null if not found
   */
  async findUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId).select('-password');
  }

  /**
   * Find active user by email address
   * @param email - User email address
   * @returns Promise resolving to user or null if not found
   */
  async findUserByEmail(email: string): Promise<IUser | null> {
    return User.findOne({
      email: email.toLowerCase(),
      isActive: true,
    });
  }

  /**
   * Find active user by username
   * @param username - Username identifier
   * @returns Promise resolving to user or null if not found
   */
  async findUserByUsername(username: string): Promise<IUser | null> {
    return User.findOne({
      username,
      isActive: true,
    });
  }

  /**
   * Find active user by email or username identifier
   * @param identifier - Email or username identifier
   * @returns Promise resolving to user with password or null if not found
   */
  async findUserByIdentifier(identifier: string): Promise<IUser | null> {
    return User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
      isActive: true,
    }).select('+password');
  }

  /**
   * Update user information
   * @param id - User identifier
   * @param data - Updated user data
   * @returns Promise resolving to updated user or null if not found
   */
  async updateUser(id: string, data: IUpdateUserDto): Promise<IUser | null> {
    const user = await User.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true }
    ).select('-password');
    return user;
  }

  /**
   * Soft delete user by setting isActive to false
   * @param id - User identifier
   * @param contextLogger - Optional context logger for request tracing
   * @returns Promise resolving to true if deletion successful, false otherwise
   */
  async deleteUser(id: string, contextLogger?: Logger): Promise<boolean> {
    const requestLogger = contextLogger ?? logger;

    requestLogger.info('Deleting user', { userId: id });

    const result = await User.findByIdAndUpdate(id, {
      isActive: false,
      updatedAt: new Date(),
    });

    const success = !!result;

    if (success) {
      requestLogger.info('User deleted successfully', { userId: id });
    } else {
      requestLogger.warn('User deletion failed - user not found', {
        userId: id,
      });
    }

    return success;
  }

  /**
   * Get paginated list of all active users with optional search
   * @param query - Search and pagination parameters
   * @returns Promise resolving to paginated user response
   */
  async getAllUsers(
    query: ISearchQuery
  ): Promise<IPaginatedResponse<IUserResponse>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter: Record<string, unknown> = { isActive: true };
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const userResponses: IUserResponse[] = users.map((user) => ({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return {
      success: true,
      data: userResponses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Verify user email using verification token
   * @param token - Email verification token
   * @param contextLogger - Optional context logger for request tracing
   * @returns Promise resolving to true if verification successful, false otherwise
   */
  async verifyEmail(token: string, contextLogger?: Logger): Promise<boolean> {
    const requestLogger = contextLogger ?? logger;

    requestLogger.info('Verifying email', {
      token: `${token.substring(0, 8)}...`,
    });

    const user = await User.findOne({
      emailVerificationToken: token,
      isActive: true,
    });

    if (!user) {
      requestLogger.warn('Email verification failed - invalid token', {
        token: `${token.substring(0, 8)}...`,
      });
      return false;
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    requestLogger.info('Email verified successfully', { userId: user._id });

    return true;
  }

  /**
   * Change user password after validating current password
   * @param userId - User identifier
   * @param data - Password change data with current and new passwords
   * @param contextLogger - Optional context logger for request tracing
   * @returns Promise resolving to true if change successful, false otherwise
   */
  async changePassword(
    userId: string,
    data: IChangePassword,
    contextLogger?: Logger
  ): Promise<boolean> {
    const requestLogger = contextLogger ?? logger;

    requestLogger.info('Changing user password', { userId });

    const user = await User.findById(userId).select('+password');

    if (!user) {
      requestLogger.warn('Password change failed - user not found', { userId });
      return false;
    }

    const isValidCurrentPassword = await user.comparePassword(
      data.currentPassword
    );

    if (!isValidCurrentPassword) {
      requestLogger.warn('Password change failed - invalid current password', {
        userId,
      });
      return false;
    }

    user.password = data.newPassword;
    await user.save();

    requestLogger.info('Password changed successfully', { userId });

    return true;
  }

  /**
   * Reset user password using reset token
   * @param token - Password reset token
   * @param newPassword - New password to set
   * @param contextLogger - Optional context logger for request tracing
   * @returns Promise resolving to true if reset successful, false otherwise
   */
  async resetPassword(
    token: string,
    newPassword: string,
    contextLogger?: Logger
  ): Promise<boolean> {
    const requestLogger = contextLogger ?? logger;

    requestLogger.info('Resetting user password', {
      token: `${token.substring(0, 8)}...`,
    });

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
      isActive: true,
    });

    if (!user) {
      requestLogger.warn('Password reset failed - invalid or expired token', {
        token: `${token.substring(0, 8)}...`,
      });
      return false;
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    requestLogger.info('Password reset successfully', { userId: user._id });

    return true;
  }
}
