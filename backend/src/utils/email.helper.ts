import { logger } from '../config';
import { IUser } from '../models';

/**
 * Email Helper - Utilities for email-related operations
 * Following project standards: always use helpers instead of custom implementations
 */
export class EmailHelper {
  /**
   * Generate verification link from token
   * @param token - Verification token
   * @param baseUrl - Base URL for the application
   * @returns Verification link
   */
  public static generateVerificationLink(
    token: string,
    baseUrl: string
  ): string {
    return `${baseUrl}/verify-email?token=${token}`;
  }

  /**
   * Generate password reset link from token
   * @param token - Reset token
   * @param baseUrl - Base URL for the application
   * @returns Password reset link
   */
  public static generatePasswordResetLink(
    token: string,
    baseUrl: string
  ): string {
    return `${baseUrl}/reset-password?token=${token}`;
  }

  /**
   * Validate email format
   * @param email - Email to validate
   * @returns boolean - True if valid
   */
  public static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Sanitize email address
   * @param email - Email to sanitize
   * @returns Sanitized email
   */
  public static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  /**
   * Check if user can receive emails
   * @param user - User document
   * @returns boolean - True if user can receive emails
   */
  public static canReceiveEmails(user: IUser): boolean {
    return user.isActive && EmailHelper.isValidEmail(user.email);
  }

  /**
   * Get user's display name for emails
   * @param user - User document
   * @returns Display name (username or email)
   */
  public static getDisplayName(user: IUser): string {
    return user.username || user.email.split('@')[0] || 'User';
  }

  /**
   * Generate email template variables for user
   * @param user - User document
   * @param additionalData - Additional template data
   * @returns Template variables object
   */
  public static generateTemplateVariables(
    user: IUser,
    additionalData: Record<string, string> = {}
  ): Record<string, string> {
    return {
      username: EmailHelper.getDisplayName(user),
      email: user.email,
      ...additionalData,
    };
  }

  /**
   * Log email operation
   * @param operation - Email operation type
   * @param user - User document
   * @param success - Whether operation succeeded
   * @param error - Error message if failed
   */
  public static logEmailOperation(
    operation: string,
    user: IUser,
    success: boolean,
    error?: string
  ): void {
    const logData = {
      operation,
      userId: (user._id as string) ?? user.id?.toString() ?? 'unknown',
      email: user.email,
      success,
      error,
    };

    if (success) {
      logger.info(`Email operation successful: ${operation}`, logData);
    } else {
      logger.error(`Email operation failed: ${operation}`, logData);
    }
  }

  /**
   * Extract domain from email address
   * @param email - Email address
   * @returns Domain part of email
   */
  public static extractDomain(email: string): string {
    return email.split('@')[1] || '';
  }

  /**
   * Check if email is from a disposable email provider
   * @param email - Email to check
   * @returns boolean - True if from disposable provider
   */
  public static isDisposableEmail(email: string): boolean {
    const disposableDomains = [
      '10minutemail.com',
      'tempmail.org',
      'guerrillamail.com',
      'mailinator.com',
      'throwaway.email',

    ];

    const domain = EmailHelper.extractDomain(email).toLowerCase();
    return disposableDomains.includes(domain);
  }

  /**
   * Format expiration time for email templates
   * @param expiresAt - Expiration date
   * @param language - Language for formatting
   * @returns Formatted expiration string
   */
  public static formatExpirationTime(
    expiresAt: Date,
    language: 'en' | 'fr' = 'en'
  ): string {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (expiresAt.getTime() - now.getTime()) / (1000 * 60)
    );

    if (diffInMinutes <= 0) {
      return language === 'fr' ? 'expiré' : 'expired';
    }

    if (diffInMinutes < 60) {
      return language === 'fr'
        ? `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`
        : `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
    }

    const hours = Math.floor(diffInMinutes / 60);
    if (hours < 24) {
      return language === 'fr'
        ? `${hours} heure${hours > 1 ? 's' : ''}`
        : `${hours} hour${hours > 1 ? 's' : ''}`;
    }

    const days = Math.floor(hours / 24);
    return language === 'fr'
      ? `${days} jour${days > 1 ? 's' : ''}`
      : `${days} day${days > 1 ? 's' : ''}`;
  }

  /**
   * Check if email verification is required for user action
   * @param user - User document
   * @param action - Action being performed
   * @returns boolean - True if verification required
   */
  public static isVerificationRequiredForAction(
    user: IUser,
    action: 'login' | 'sensitive-operation' | 'profile-update'
  ): boolean {

    if (action === 'sensitive-operation') {
      return !user.isEmailVerified;
    }


    if (action === 'profile-update') {
      return !user.isEmailVerified;
    }


    return false;
  }
}
