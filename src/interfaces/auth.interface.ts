/**
 * Authentication-related interfaces
 */

/**
 * Standard authentication response interface
 * Used for login, registration, and token refresh operations
 * @interface IAuthResponse
 */
export interface IAuthResponse {
  /** Indicates if the authentication operation was successful */
  success: boolean;
  /** Localized message key for user feedback */
  message: string;
  /** Optional authentication data containing user info and tokens */
  data?: {
    /** Authenticated user information */
    user: {
      /** Unique user identifier */
      id: string;
      /** User's display name */
      name: string;
      /** User's email address */
      email: string;
      /** User's role in the system */
      role: string;
      /** Whether user's email has been verified */
      emailVerified: boolean;
    };
    /** JWT token pair for authentication */
    tokens: {
      /** Short-lived access token for API requests */
      accessToken: string;
      /** Long-lived refresh token for token renewal */
      refreshToken: string;
    };
  };
}

/**
 * JWT token pair interface
 * Contains both access and refresh tokens for authentication
 * @interface ITokenPair
 */
export interface ITokenPair {
  /** Short-lived access token for API requests (15min) */
  accessToken: string;
  /** Long-lived refresh token for token renewal (7 days) */
  refreshToken: string;
}

/**
 * Password change request interface
 * Used for secure password update operations
 * @interface IChangePassword
 */
export interface IChangePassword {
  /** User's current password for verification */
  currentPassword: string;
  /** New password to be set */
  newPassword: string;
}
