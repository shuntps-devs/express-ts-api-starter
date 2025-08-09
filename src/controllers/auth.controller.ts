import { Request, Response } from 'express';

import { logger } from '../config';
import { t } from '../i18n';
import { ICreateUserDto, ILoginDto, IUserResponse } from '../interfaces';
import { asyncHandler } from '../middleware';
import { ISession } from '../models';
import { SessionService, UserService } from '../services';
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

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Create session with secure cookies
      const session = await SessionService.createSession(
        user as unknown as import('../interfaces/user.interface').IUser,
        req,
        res
      );

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
        sessionId: String(session._id),
        requestId,
      });

      ResponseHelper.sendSuccess<{ user: IUserResponse; sessionId: string }>(
        res,
        { user: userResponse, sessionId: String(session._id) },
        200,
        t('success.loginSuccessful'),
        requestId
      );
    }
  );

  public getProfile = asyncHandler((req: Request, res: Response): void => {
    const requestId = ResponseHelper.extractRequestId(req);

    // User is already populated by authenticate middleware
    if (!req.user) {
      ResponseHelper.sendUnauthorized(res, t('auth.userNotFound'), requestId);
      return;
    }

    const userResponse: IUserResponse = {
      id: String(req.user._id),
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      isActive: req.user.isActive,
      isEmailVerified: req.user.isEmailVerified,
      lastLogin: req.user.lastLogin,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
    };

    ResponseHelper.sendSuccess<IUserResponse>(
      res,
      userResponse,
      200,
      t('success.profileRetrieved'),
      requestId
    );
  });

  public logout = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const requestId = ResponseHelper.extractRequestId(req);

      if (req.session) {
        await SessionService.destroySession(String(req.session._id), res);

        logger.info('User logged out successfully', {
          userId: req.user?._id,
          sessionId: req.session._id,
          requestId,
        });
      } else {
        // Clear cookies even if no session found
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
      }

      ResponseHelper.sendSuccess(
        res,
        null,
        200,
        t('success.logoutSuccessful'),
        requestId
      );
    }
  );

  public logoutAll = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const requestId = ResponseHelper.extractRequestId(req);

      if (!req.user) {
        return ResponseHelper.sendUnauthorized(
          res,
          t('auth.userNotFound'),
          requestId
        );
      }

      await SessionService.destroyAllUserSessions(req.user._id, res);

      logger.info('User logged out from all devices', {
        userId: req.user._id,
        requestId,
      });

      ResponseHelper.sendSuccess(
        res,
        null,
        200,
        t('success.logoutAllSuccessful'),
        requestId
      );
    }
  );

  public refreshToken = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const requestId = ResponseHelper.extractRequestId(req);
      const { refreshToken } = SessionService.extractTokensFromCookies(req);

      if (!refreshToken) {
        return ResponseHelper.sendUnauthorized(
          res,
          t('auth.refreshTokenRequired'),
          requestId
        );
      }

      const result = await SessionService.refreshSession(
        refreshToken,
        req,
        res
      );

      if (!result) {
        return ResponseHelper.sendUnauthorized(
          res,
          t('auth.invalidRefreshToken'),
          requestId
        );
      }

      const userResponse: IUserResponse = {
        id: String(result.user._id),
        username: result.user.username,
        email: result.user.email,
        role: result.user.role,
        isActive: result.user.isActive,
        isEmailVerified: result.user.isEmailVerified,
        lastLogin: result.user.lastLogin,
        createdAt: result.user.createdAt,
        updatedAt: result.user.updatedAt,
      };

      logger.info('Token refreshed successfully', {
        userId: result.user._id,
        sessionId: result.session._id,
        requestId,
      });

      ResponseHelper.sendSuccess(
        res,
        { user: userResponse },
        200,
        t('success.tokenRefreshed'),
        requestId
      );
    }
  );

  public getSessions = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const requestId = ResponseHelper.extractRequestId(req);

      if (!req.user) {
        return ResponseHelper.sendUnauthorized(
          res,
          t('auth.userNotFound'),
          requestId
        );
      }

      const sessions = await SessionService.getUserActiveSessions(req.user._id);

      const sessionData = sessions.map((session: ISession) => ({
        id: String(session._id),
        deviceInfo: session.deviceInfo,
        location: session.location,
        ipAddress: session.ipAddress,
        lastActivity: session.lastActivity,
        createdAt: session.createdAt,
        isCurrent: String(session._id) === String(req.session?._id),
      }));

      ResponseHelper.sendSuccess(
        res,
        sessionData,
        200,
        t('success.sessionsRetrieved'),
        requestId
      );
    }
  );
}
