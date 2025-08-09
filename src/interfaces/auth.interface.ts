/**
 * Authentication-related interfaces
 */

export interface IAuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      emailVerified: boolean;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface IChangePassword {
  currentPassword: string;
  newPassword: string;
}
