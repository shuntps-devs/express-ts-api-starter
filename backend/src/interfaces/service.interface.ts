/**
 * Service interfaces defining contracts for business logic layer
 * These interfaces ensure consistent service implementations across the application
 */

import { IPaginatedResponse, ISearchQuery } from './api.interface';
import { IAuthResponse, IChangePassword } from './auth.interface';
import {
  ICreateUserDto,
  ILoginDto,
  IUpdateUserDto,
  IUser,
  IUserResponse,
} from './user.interface';

/**
 * Base service interface that all services must implement
 * Provides common service identification
 * @interface IBaseService
 */
export interface IBaseService {
  /** Human-readable service name for logging and debugging */
  readonly serviceName: string;
}

/**
 * User service interface defining user management operations
 * Handles all user-related business logic
 * @interface IUserService
 */
export interface IUserService extends IBaseService {
  /**
   * Create a new user in the system
   * @param data - User creation data
   * @returns Promise resolving to created user document
   */
  createUser(data: ICreateUserDto): Promise<IUser>;

  /**
   * Retrieve user by unique identifier
   * @param id - User's unique ID
   * @returns Promise resolving to user document or null if not found
   */
  getUserById(id: string): Promise<IUser | null>;

  /**
   * Retrieve user by email address
   * @param email - User's email address
   * @returns Promise resolving to user document or null if not found
   */
  getUserByEmail(email: string): Promise<IUser | null>;

  /**
   * Update existing user data
   * @param id - User's unique ID
   * @param data - Updated user data
   * @returns Promise resolving to updated user document or null if not found
   */
  updateUser(id: string, data: IUpdateUserDto): Promise<IUser | null>;

  /**
   * Delete user from the system
   * @param id - User's unique ID
   * @returns Promise resolving to true if deleted, false otherwise
   */
  deleteUser(id: string): Promise<boolean>;

  /**
   * Get paginated list of users with optional search
   * @param query - Search and pagination parameters
   * @returns Promise resolving to paginated user response
   */
  getAllUsers(query: ISearchQuery): Promise<IPaginatedResponse<IUserResponse>>;

  /**
   * Verify user's email using verification token
   * @param token - Email verification token
   * @returns Promise resolving to true if verified successfully
   */
  verifyEmail(token: string): Promise<boolean>;

  /**
   * Change user's password with current password verification
   * @param userId - User's unique ID
   * @param data - Current and new password data
   * @returns Promise resolving to true if password changed successfully
   */
  changePassword(userId: string, data: IChangePassword): Promise<boolean>;
}

/**
 * Authentication service interface defining authentication operations
 * Handles user registration, login, token management, and password recovery
 * @interface IAuthService
 */
export interface IAuthService extends IBaseService {
  /**
   * Register a new user account
   * @param data - User registration data
   * @returns Promise resolving to authentication response with user and tokens
   */
  register(data: ICreateUserDto): Promise<IAuthResponse>;

  /**
   * Authenticate user and create session
   * @param data - Login credentials
   * @returns Promise resolving to authentication response with user and tokens
   */
  login(data: ILoginDto): Promise<IAuthResponse>;

  /**
   * Logout user and invalidate session
   * @param userId - User's unique ID
   * @returns Promise resolving to true if logout successful
   */
  logout(userId: string): Promise<boolean>;

  /**
   * Refresh access token using refresh token
   * @param token - Valid refresh token
   * @returns Promise resolving to new authentication response with refreshed tokens
   */
  refreshToken(token: string): Promise<IAuthResponse>;

  /**
   * Initiate password reset process by sending reset email
   * @param email - User's email address
   * @returns Promise resolving to true if reset email sent successfully
   */
  forgotPassword(email: string): Promise<boolean>;

  /**
   * Reset user password using valid reset token
   * @param token - Password reset token
   * @param newPassword - New password to set
   * @returns Promise resolving to true if password reset successfully
   */
  resetPassword(token: string, newPassword: string): Promise<boolean>;

  /**
   * Validate JWT token and return associated user
   * @param token - JWT token to validate
   * @returns Promise resolving to user document or null if invalid
   */
  validateToken(token: string): Promise<IUser | null>;
}

/**
 * Email service interface defining email sending operations
 * Handles all email communication including transactional emails
 * @interface IEmailService
 */
export interface IEmailService extends IBaseService {
  /**
   * Send email verification message to user
   * @param to - Recipient email address
   * @param token - Email verification token
   * @returns Promise resolving to true if email sent successfully
   */
  sendVerificationEmail(to: string, token: string): Promise<boolean>;

  /**
   * Send password reset email to user
   * @param to - Recipient email address
   * @param token - Password reset token
   * @returns Promise resolving to true if email sent successfully
   */
  sendPasswordResetEmail(to: string, token: string): Promise<boolean>;

  /**
   * Send welcome email to newly registered user
   * @param to - Recipient email address
   * @param userName - User's display name
   * @returns Promise resolving to true if email sent successfully
   */
  sendWelcomeEmail(to: string, userName: string): Promise<boolean>;
}

/**
 * File upload service interface defining file management operations
 * Handles file upload, storage, and retrieval operations
 * @interface IUploadService
 */
export interface IUploadService extends IBaseService {
  /**
   * Upload file to storage and return public URL
   * @param file - File buffer data
   * @param fileName - Original filename
   * @returns Promise resolving to public file URL
   */
  uploadFile(file: Buffer, fileName: string): Promise<string>;

  /**
   * Delete file from storage using its URL
   * @param fileUrl - Public URL of file to delete
   * @returns Promise resolving to true if file deleted successfully
   */
  deleteFile(fileUrl: string): Promise<boolean>;

  /**
   * Generate public URL for accessing stored file
   * @param fileName - Stored filename identifier
   * @returns Public URL string for file access
   */
  getFileUrl(fileName: string): string;
}
