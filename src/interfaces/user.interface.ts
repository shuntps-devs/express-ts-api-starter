/**
 * User-related interfaces
 * Defines the structure for user data throughout the application
 */

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

export interface IUser {
  _id: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// DTOs (Data Transfer Objects) for API requests/responses
export interface ICreateUserDto {
  username?: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface IUpdateUserDto {
  username?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface ILoginDto {
  email?: string;
  identifier?: string; // Can be email or username
  password: string;
}

export interface IUserResponse {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUsersListResponse {
  users: IUserResponse[];
  total: number;
}
