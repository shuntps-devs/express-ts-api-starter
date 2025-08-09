/**
 * User-related interfaces
 * Defines the structure for user data throughout the application
 */

/**
 * User roles enumeration
 * Defines the available user roles in the system
 */
export enum UserRole {
  /** Regular user with basic permissions */
  USER = 'user',
  /** Administrator with full system access */
  ADMIN = 'admin',
  /** Moderator with content management permissions */
  MODERATOR = 'moderator',
}

/**
 * Complete user interface representing a user document
 * Contains all user fields including sensitive data
 * @interface IUser
 */
/**
 * Complete user interface representing a user document
 * Contains all user fields including sensitive data
 * @interface IUser
 */
export interface IUser {
  /** Unique user identifier */
  _id: string;
  /** User's chosen username */
  username: string;
  /** User's email address */
  email: string;
  /** Hashed password (sensitive) */
  password: string;
  /** User's role in the system */
  role: UserRole;
  /** Whether the user account is active */
  isActive: boolean;
  /** Whether the user's email has been verified */
  isEmailVerified: boolean;
  /** Token for email verification (optional) */
  emailVerificationToken?: string;
  /** Expiration date for email verification token */
  emailVerificationExpires?: Date;
  /** Token for password reset (optional) */
  passwordResetToken?: string;
  /** Expiration date for password reset token */
  passwordResetExpires?: Date;
  /** Number of failed login attempts */
  loginAttempts: number;
  /** Account lock expiration date (optional) */
  lockUntil?: Date;
  /** Timestamp of last successful login */
  lastLogin?: Date;
  /** Account creation timestamp */
  createdAt: Date;
  /** Last modification timestamp */
  updatedAt: Date;
}

/**
 * Data Transfer Objects (DTOs) for API requests/responses
 */

/**
 * User creation DTO for registration requests
 * Contains required and optional fields for creating a new user
 * @interface ICreateUserDto
 */
export interface ICreateUserDto {
  /** Optional username (auto-generated if not provided) */
  username?: string;
  /** User's email address (required) */
  email: string;
  /** User's password (required) */
  password: string;
  /** Optional role assignment (defaults to USER) */
  role?: UserRole;
}

/**
 * User update DTO for profile modification requests
 * Contains optional fields that can be updated
 * @interface IUpdateUserDto
 */
export interface IUpdateUserDto {
  /** Updated username */
  username?: string;
  /** Updated email address */
  email?: string;
  /** Updated user role (admin only) */
  role?: UserRole;
  /** Updated active status (admin only) */
  isActive?: boolean;
}

/**
 * Login credentials DTO for authentication requests
 * Supports login with email or username identifier
 * @interface ILoginDto
 */
export interface ILoginDto {
  /** Email address for login (deprecated, use identifier) */
  email?: string;
  /** Can be email or username for flexible login */
  identifier?: string;
  /** User's password */
  password: string;
}

/**
 * Sanitized user response interface for API responses
 * Excludes sensitive fields like password and tokens
 * @interface IUserResponse
 */
export interface IUserResponse {
  /** User's unique identifier */
  id: string;
  /** User's display name */
  username: string;
  /** User's email address */
  email: string;
  /** User's system role */
  role: UserRole;
  /** Account active status */
  isActive: boolean;
  /** Email verification status */
  isEmailVerified: boolean;
  /** Last successful login timestamp */
  lastLogin?: Date;
  /** Account creation timestamp */
  createdAt: Date;
  /** Last profile update timestamp */
  updatedAt: Date;
}

/**
 * Users list response interface for paginated user queries
 * Contains array of users and total count
 * @interface IUsersListResponse
 */
export interface IUsersListResponse {
  /** Array of sanitized user objects */
  users: IUserResponse[];
  /** Total number of users matching the query */
  total: number;
}
