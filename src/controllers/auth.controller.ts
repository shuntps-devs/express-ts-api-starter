import { Request, Response } from 'express';

import { logger } from '../config';
import { t } from '../i18n';
import { ICreateUserDto, ILoginDto, IUserResponse } from '../interfaces';
import { asyncHandler } from '../middleware';
import { UserService } from '../services';
import { ResponseHelper } from '../utils';

export class AuthController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  public register = asyncHandler(async (req: Request, res: Response) => {
    const requestId = ResponseHelper.extractRequestId(req);
    const userData: ICreateUserDto = req.body;

    logger.info('User registration attempt', {
      email: userData.email,
      username: userData.username,
      requestId,
    });

    // Check if user already exists
    const existingUser = await this.userService.findUserByIdentifier(
      userData.email ?? userData.username
    );

    if (existingUser) {
      logger.warn('Registration failed - user already exists', {
        email: userData.email,
        username: userData.username,
        requestId,
      });

      return ResponseHelper.sendConflict(
        res,
        existingUser.email === userData.email
          ? t('auth.email.alreadyExists')
          : t('auth.username.alreadyExists'),
        undefined,
        requestId
      );
    }

    const user = await this.userService.createUser(userData);

    const userResponse: IUserResponse = {
      id: String(user._id),
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    logger.info('User registered successfully', {
      userId: user._id,
      email: user.email,
      requestId,
    });

    ResponseHelper.sendCreated(
      res,
      userResponse,
      t('success.userCreated'),
      requestId
    );
  });

  public login = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const loginData: ILoginDto = req.body;
      const requestId = ResponseHelper.extractRequestId(req);

      logger.info('User login attempt', {
        identifier: loginData.identifier ?? loginData.email,
        requestId,
      });

      // Find user by email or username
      const identifier = loginData.identifier ?? loginData.email;
      if (!identifier) {
        logger.warn('Login failed - missing identifier', { requestId });
        return ResponseHelper.sendBadRequest(
          res,
          t('validation.identifier.required'),
          undefined,
          requestId
        );
      }

      const user = await this.userService.findUserByIdentifier(identifier);

      if (!user) {
        logger.warn('Login failed - user not found', { identifier, requestId });
        return ResponseHelper.sendUnauthorized(
          res,
          t('auth.credentials.invalid'),
          requestId
        );
      }

      // Check if account is locked
      if (user.isLocked) {
        const lockTimeRemaining = user.lockUntil
          ? Math.ceil((user.lockUntil.getTime() - Date.now()) / (1000 * 60))
          : 0;

        logger.warn('Login failed - account locked', {
          userId: user._id,
          lockTimeRemaining,
          requestId,
        });

        return ResponseHelper.sendTooManyRequests(
          res,
          t('auth.account.locked'),
          lockTimeRemaining * 60,
          requestId
        );
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(loginData.password);

      if (!isPasswordValid) {
        logger.warn('Login failed - invalid password', {
          userId: user._id,
          requestId,
        });

        // Increment login attempts
        await user.incLoginAttempts();
        return ResponseHelper.sendUnauthorized(
          res,
          t('auth.credentials.invalid'),
          requestId
        );
      }

      // Reset login attempts on successful login
      if (user.loginAttempts > 0) {
        await user.resetLoginAttempts();
      }

      // Return user info (without password)
      const userResponse: IUserResponse = {
        id: String(user._id),
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      logger.info('User logged in successfully', {
        userId: user._id,
        requestId,
      });

      ResponseHelper.sendSuccess<IUserResponse>(
        res,
        userResponse,
        200,
        t('success.loginSuccessful'),
        requestId
      );
    }
  );

  public getProfile = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      // This would typically use the authenticated user ID from middleware
      // For now, we'll get it from params
      const { userId } = req.params;
      const requestId = ResponseHelper.extractRequestId(req);

      const user = await this.userService.findUserById(userId);

      if (!user) {
        return ResponseHelper.sendNotFound(
          res,
          t('auth.userNotFound'),
          requestId
        );
      }

      const userResponse: IUserResponse = {
        id: String(user._id),
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      ResponseHelper.sendSuccess<IUserResponse>(
        res,
        userResponse,
        200,
        t('success.profileRetrieved'),
        requestId
      );
    }
  );
}
