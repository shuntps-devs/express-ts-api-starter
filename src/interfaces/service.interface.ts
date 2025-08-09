/**
 * Service interfaces defining contracts for business logic layer
 */

import { IPaginatedResponse, ISearchQuery } from './api.interface';
import { IAuthResponse, IChangePassword } from './auth.interface';
import {
  IUser,
  ICreateUserDto,
  IUpdateUserDto,
  ILoginDto,
  IUserResponse,
} from './user.interface';

export interface IBaseService {
  readonly serviceName: string;
}

export interface IUserService extends IBaseService {
  createUser(data: ICreateUserDto): Promise<IUser>;
  getUserById(id: string): Promise<IUser | null>;
  getUserByEmail(email: string): Promise<IUser | null>;
  updateUser(id: string, data: IUpdateUserDto): Promise<IUser | null>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(query: ISearchQuery): Promise<IPaginatedResponse<IUserResponse>>;
  verifyEmail(token: string): Promise<boolean>;
  changePassword(userId: string, data: IChangePassword): Promise<boolean>;
}

export interface IAuthService extends IBaseService {
  register(data: ICreateUserDto): Promise<IAuthResponse>;
  login(data: ILoginDto): Promise<IAuthResponse>;
  logout(userId: string): Promise<boolean>;
  refreshToken(token: string): Promise<IAuthResponse>;
  forgotPassword(email: string): Promise<boolean>;
  resetPassword(token: string, newPassword: string): Promise<boolean>;
  validateToken(token: string): Promise<IUser | null>;
}

export interface IEmailService extends IBaseService {
  sendVerificationEmail(to: string, token: string): Promise<boolean>;
  sendPasswordResetEmail(to: string, token: string): Promise<boolean>;
  sendWelcomeEmail(to: string, userName: string): Promise<boolean>;
}

export interface IUploadService extends IBaseService {
  uploadFile(file: Buffer, fileName: string): Promise<string>;
  deleteFile(fileUrl: string): Promise<boolean>;
  getFileUrl(fileName: string): string;
}
