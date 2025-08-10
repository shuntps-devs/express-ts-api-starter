import { Logger } from 'winston';

import { logger } from '../config';
import { IUser, User } from '../models';
import { EmailService } from '../services';
import { DateHelper } from '../utils';

/**
 * Email Verification Service
 * Handles email verification flow using existing User model fields
 */
export class VerificationService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Generate and send email verification
   * @param user - User document
   * @param language - Email language
   * @param contextLogger - Optional context logger for request tracing
   * @returns Promise<{ success: boolean; message: string; error?: string }>
   */
  public async sendVerificationEmail(
    user: IUser,
    language: 'en' | 'fr' = 'en',
    contextLogger?: Logger
  ): Promise<{ success: boolean; message: string; error?: string }> {
    const requestLogger = contextLogger ?? logger;
    try {
      if (user.isEmailVerified) {
        return {
          success: false,
          message: 'Email is already verified',
        };
      }

      const { token } = user.generateEmailVerification();
      await user.save();

      requestLogger.info('Generated email verification token', {
        userId: user._id,
        email: user.email,
        tokenExpiry: user.emailVerificationExpires,
      });

      const emailResult = await this.emailService.sendVerificationEmail(
        user.email,
        user.username,
        token,
        language
      );

      if (!emailResult.success) {
        requestLogger.error('Failed to send verification email', {
          userId: user._id,
          email: user.email,
          error: emailResult.error,
        });

        return {
          success: false,
          message: 'Failed to send verification email',
          error: emailResult.error,
        };
      }

      requestLogger.info('Verification email sent successfully', {
        userId: user._id,
        email: user.email,
        emailId: emailResult.id,
      });

      return {
        success: true,
        message: 'Verification email sent successfully',
      };
    } catch (error) {
      requestLogger.error('Error sending verification email', {
        userId: user._id,
        email: user.email,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      return {
        success: false,
        message: 'Failed to send verification email',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Verify email with token
   * @param token - Verification token
   * @param contextLogger - Optional context logger for request tracing
   * @returns Promise<{ success: boolean; message: string; user?: IUser; error?: string }>
   */
  public async verifyEmail(
    token: string,
    contextLogger?: Logger
  ): Promise<{
    success: boolean;
    message: string;
    user?: IUser;
    error?: string;
  }> {
    const requestLogger = contextLogger ?? logger;
    try {
      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() },
        isEmailVerified: false,
      }).select('+password');

      if (!user) {
        requestLogger.warn('Invalid or expired verification token', { token });
        return {
          success: false,
          message: 'Invalid or expired verification token',
        };
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;

      await user.save();

      requestLogger.info('Email verified successfully', {
        userId: user._id,
        email: user.email,
        verifiedAt: new Date(),
      });

      try {
        await this.emailService.sendWelcomeEmail(
          user.email,
          user.username,
          'en',
          contextLogger
        );

        requestLogger.info('Welcome email sent', {
          userId: user._id,
          email: user.email,
        });
      } catch (welcomeError) {
        requestLogger.warn('Failed to send welcome email', {
          userId: user._id,
          email: user.email,
          error:
            welcomeError instanceof Error
              ? welcomeError.message
              : 'Unknown error',
        });
      }

      return {
        success: true,
        message: 'Email verified successfully',
        user,
      };
    } catch (error) {
      requestLogger.error('Error verifying email', {
        token,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      return {
        success: false,
        message: 'Failed to verify email',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if user can request new verification email
   * @param user - User document
   * @returns boolean
   */
  public canRequestNewVerification(user: IUser): boolean {
    if (user.isEmailVerified) {
      return false;
    }

    if (!user.emailVerificationExpires) {
      return true;
    }

    return DateHelper.isExpired(user.emailVerificationExpires);
  }

  /**
   * Get verification status for user
   * @param userId - User ID
   * @param contextLogger - Optional context logger for request tracing
   * @returns Promise<{ isVerified: boolean; canResend: boolean; expiresAt?: Date }>
   */
  public async getVerificationStatus(
    userId: string,
    contextLogger?: Logger
  ): Promise<{ isVerified: boolean; canResend: boolean; expiresAt?: Date }> {
    const requestLogger = contextLogger ?? logger;
    try {
      const user = await User.findById(userId);

      if (!user) {
        return { isVerified: false, canResend: false };
      }

      return {
        isVerified: user.isEmailVerified,
        canResend: this.canRequestNewVerification(user),
        expiresAt: user.emailVerificationExpires,
      };
    } catch (error) {
      requestLogger.error('Error getting verification status', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return { isVerified: false, canResend: false };
    }
  }

  /**
   * Cleanup expired verification tokens
   * @param contextLogger - Optional context logger for request tracing
   * @returns Promise<number> - Number of cleaned up tokens
   */
  public async cleanupExpiredTokens(contextLogger?: Logger): Promise<number> {
    const requestLogger = contextLogger ?? logger;
    try {
      const result = await User.updateMany(
        {
          emailVerificationExpires: { $lt: new Date() },
          isEmailVerified: false,
        },
        {
          $unset: {
            emailVerificationToken: '',
            emailVerificationExpires: '',
          },
        }
      );

      requestLogger.info('Cleaned up expired verification tokens', {
        count: result.modifiedCount,
      });

      return result.modifiedCount ?? 0;
    } catch (error) {
      requestLogger.error('Error cleaning up expired verification tokens', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return 0;
    }
  }
}
