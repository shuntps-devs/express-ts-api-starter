import { Request, Response } from 'express';

import { logger } from '../config';
import { t } from '../i18n';
import { ICreateUserDto, ILoginDto, IUserResponse } from '../interfaces';
import { asyncHandler } from '../middleware';
import { ISession } from '../models';
import { SessionService, UserService, VerificationService } from '../services';
import { EmailHelper, ResponseHelper } from '../utils';

/**
 * Authentication controller
 * @description Handles user registration, login, logout, and profile management with session-based authentication
 * @class AuthController
 */
export class AuthController {
  private userService: UserService;
  private verificationService: VerificationService;

  /**
   * Initialize authentication controller
   * @description Creates new instances of UserService and VerificationService for authentication operations
   */
  constructor() {
    this.userService = new UserService();
    this.verificationService = new VerificationService();
  }

  /**
   * Register a new user account
   * @route POST /api/auth/register
   * @description Creates a new user account and sends verification email
   * @param req - Express request object containing user registration data
   * @param res - Express response object
   * @returns User data with registration confirmation message
   * @throws 409 - User already exists (email or username conflict)
   * @throws 400 - Validation errors in request body
   * @example
   * POST /api/auth/register
   * {
   *   "username": "johndoe",
   *   "email": "john@example.com",
   *   "password": "SecurePass123!"
   * }
   */
  public register = asyncHandler(async (req: Request, res: Response) => {
    const requestId = ResponseHelper.extractRequestId(req);
    const userData: ICreateUserDto = req.body;
    const contextLogger = req.logger ?? logger;

    contextLogger.info('User registration attempt', {
      email: userData.email,
      username: userData.username,
      requestId,
    });

    const existingUser = await this.userService.findUserByIdentifier(
      userData.email ?? userData.username
    );

    if (existingUser) {
      contextLogger.warn('Registration failed - user already exists', {
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

    try {
      await this.verificationService.sendVerificationEmail(user);
      contextLogger.info('Verification email sent', {
        userId: user._id,
        email: user.email,
        requestId,
      });
    } catch (emailError) {
      contextLogger.error('Failed to send verification email', {
        userId: user._id,
        email: user.email,
        error: emailError,
        requestId,
      });
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

    contextLogger.info('User registered successfully', {
      userId: user._id,
      email: user.email,
      requestId,
    });

    ResponseHelper.sendCreated(
      res,
      userResponse,
      `${t('success.userCreated')} Verification email sent.`,
      requestId
    );
  });

  /**
   * Authenticate user login
   * @route POST /api/auth/login
   * @description Authenticates user credentials and creates session with JWT tokens
   * @param req - Express request object containing login credentials
   * @param res - Express response object
   * @returns User data and session information with HTTP-only cookies
   * @throws 401 - Invalid credentials or user not found
   * @throws 429 - Account locked due to too many failed attempts
   * @throws 400 - Missing or invalid identifier/password
   * @example
   * POST /api/auth/login
   * {
   *   "identifier": "john@example.com",
   *   "password": "SecurePass123!"
   * }
   */
  public login = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const loginData: ILoginDto = req.body;
      const requestId = ResponseHelper.extractRequestId(req);
      const contextLogger = req.logger ?? logger;

      contextLogger.info('User login attempt', {
        identifier: loginData.identifier ?? loginData.email,
        requestId,
      });

      const identifier = loginData.identifier ?? loginData.email;
      if (!identifier) {
        contextLogger.warn('Login failed - missing identifier', { requestId });
        return ResponseHelper.sendBadRequest(
          res,
          t('validation.identifier.required'),
          undefined,
          requestId
        );
      }

      const user = await this.userService.findUserByIdentifier(identifier);

      if (!user) {
        contextLogger.warn('Login failed - user not found', {
          identifier,
          requestId,
        });
        return ResponseHelper.sendUnauthorized(
          res,
          t('auth.credentials.invalid'),
          requestId
        );
      }

      if (user.isLocked) {
        const lockTimeRemaining = user.lockUntil
          ? Math.ceil((user.lockUntil.getTime() - Date.now()) / (1000 * 60))
          : 0;

        contextLogger.warn('Login failed - account locked', {
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

      const isPasswordValid = await user.comparePassword(loginData.password);

      if (!isPasswordValid) {
        contextLogger.warn('Login failed - invalid password', {
          userId: user._id,
          requestId,
        });

        await user.incLoginAttempts();
        return ResponseHelper.sendUnauthorized(
          res,
          t('auth.credentials.invalid'),
          requestId
        );
      }

      if (user.loginAttempts > 0) {
        await user.resetLoginAttempts();
      }

      user.lastLogin = new Date();
      await user.save();

      const session = await SessionService.createSession(
        user as unknown as import('../interfaces/user.interface').IUser,
        req,
        res
      );

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

      contextLogger.info('User logged in successfully', {
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

  /**
   * Get authenticated user profile
   * @route GET /api/auth/profile
   * @description Retrieves current authenticated user's profile information
   * @param req - Express request object (user populated by auth middleware)
   * @param res - Express response object
   * @returns User profile data (sanitized, no sensitive information)
   * @throws 401 - User not authenticated
   * @security Bearer token required (HTTP-only cookie)
   * @example
   * GET /api/auth/profile
   * Authorization: Bearer <access_token> (via HTTP-only cookie)
   */
  public getProfile = asyncHandler((req: Request, res: Response): void => {
    const requestId = ResponseHelper.extractRequestId(req);

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

  /**
   * Logout current user session
   * @route POST /api/auth/logout
   * @description Destroys current user session and clears authentication cookies
   * @param req - Express request object (session populated by auth middleware)
   * @param res - Express response object
   * @returns Success confirmation message
   * @throws 401 - User not authenticated
   * @security Bearer token required (HTTP-only cookie)
   * @example
   * POST /api/auth/logout
   * Authorization: Bearer <access_token> (via HTTP-only cookie)
   */
  public logout = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const requestId = ResponseHelper.extractRequestId(req);
      const contextLogger = req.logger ?? logger;

      if (req.session) {
        await SessionService.destroySession(String(req.session._id), res);

        contextLogger.info('User logged out successfully', {
          userId: req.user?._id,
          sessionId: req.session._id,
          requestId,
        });
      } else {
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

  /**
   * Logout user from all devices
   * @route POST /api/auth/logout-all
   * @description Destroys all active sessions for the user across all devices
   * @param req - Express request object (user populated by auth middleware)
   * @param res - Express response object
   * @returns Success confirmation message
   * @throws 401 - User not authenticated
   * @security Bearer token required (HTTP-only cookie)
   * @example
   * POST /api/auth/logout-all
   * Authorization: Bearer <access_token> (via HTTP-only cookie)
   */
  public logoutAll = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const requestId = ResponseHelper.extractRequestId(req);
      const contextLogger = req.logger ?? logger;

      if (!req.user) {
        return ResponseHelper.sendUnauthorized(
          res,
          t('auth.userNotFound'),
          requestId
        );
      }

      await SessionService.destroyAllUserSessions(req.user._id, res);

      contextLogger.info('User logged out from all devices', {
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

  /**
   * Refresh authentication tokens
   * @route POST /api/auth/refresh
   * @description Refreshes expired access token using valid refresh token
   * @param req - Express request object (refresh token from HTTP-only cookie)
   * @param res - Express response object
   * @returns New access token and user data
   * @throws 401 - Invalid or expired refresh token
   * @security Refresh token required (HTTP-only cookie)
   * @example
   * POST /api/auth/refresh
   * Cookies: refresh_token=<refresh_token>
   */
  public refreshToken = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const requestId = ResponseHelper.extractRequestId(req);
      const contextLogger = req.logger ?? logger;
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

      contextLogger.info('Token refreshed successfully', {
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

  /**
   * Verify user email address
   * @route POST /api/auth/verify-email
   * @description Verifies user's email address using verification token from email
   * @param req - Express request object containing verification token
   * @param res - Express response object
   * @returns Email verification success confirmation
   * @throws 400 - Invalid, expired, or already used verification token
   * @example
   * POST /api/auth/verify-email
   * {
   *   "token": "verification_token_from_email"
   * }
   */
  public verifyEmail = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { token } = req.body;
      const requestId = ResponseHelper.extractRequestId(req);
      const contextLogger = req.logger ?? logger;

      contextLogger.info('Email verification attempt', { token, requestId });

      try {
        const result = await this.verificationService.verifyEmail(token);

        if (result.success && result.user) {
          contextLogger.info('Email verified successfully', {
            userId: result.user._id,
            email: result.user.email,
            requestId,
          });

          ResponseHelper.sendSuccess(
            res,
            { message: 'Email verified successfully' },
            200,
            'Email verified successfully',
            requestId
          );
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        contextLogger.error('Email verification failed', {
          token,
          error,
          requestId,
        });

        const errorMessage =
          error instanceof Error ? error.message : 'Invalid or expired token';
        ResponseHelper.sendBadRequest(res, errorMessage, undefined, requestId);
      }
    }
  );

  /**
   * Resend email verification
   * @route POST /api/auth/resend-verification
   * @description Resends verification email to user (rate limited for security)
   * @param req - Express request object containing user email
   * @param res - Express response object
   * @returns Success message (doesn't reveal if email exists for security)
   * @throws 400 - Invalid email format or email already verified
   * @throws 429 - Rate limit exceeded (too many requests)
   * @example
   * POST /api/auth/resend-verification
   * {
   *   "email": "john@example.com"
   * }
   */
  public resendVerification = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { email } = req.body;
      const requestId = ResponseHelper.extractRequestId(req);
      const contextLogger = req.logger ?? logger;

      contextLogger.info('Resend verification attempt', { email, requestId });

      if (!EmailHelper.isValidEmail(email)) {
        return ResponseHelper.sendBadRequest(
          res,
          'Invalid email format',
          undefined,
          requestId
        );
      }

      try {
        const user = await this.userService.findUserByIdentifier(email);

        if (!user) {
          contextLogger.warn('Resend verification for non-existent user', {
            email,
            requestId,
          });
          return ResponseHelper.sendSuccess(
            res,
            {
              message: 'If the email exists, verification email has been sent',
            },
            200,
            'Verification email sent if user exists',
            requestId
          );
        }

        if (user.isEmailVerified) {
          return ResponseHelper.sendBadRequest(
            res,
            'Email already verified',
            undefined,
            requestId
          );
        }

        await this.verificationService.sendVerificationEmail(user);

        contextLogger.info('Verification email resent', {
          userId: user._id,
          email: user.email,
          requestId,
        });

        ResponseHelper.sendSuccess(
          res,
          { message: 'Verification email sent' },
          200,
          'Verification email sent successfully',
          requestId
        );
      } catch (error) {
        contextLogger.error('Failed to resend verification email', {
          email,
          error,
          requestId,
        });

        ResponseHelper.sendError(
          res,
          'Failed to send verification email',
          500,
          requestId
        );
      }
    }
  );

  /**
   * Get user's active sessions
   * @route GET /api/auth/sessions
   * @description Retrieves all active sessions for the authenticated user
   * @param req - Express request object (user populated by auth middleware)
   * @param res - Express response object
   * @returns Array of active sessions with device info and timestamps
   * @throws 401 - User not authenticated
   * @security Bearer token required (HTTP-only cookie)
   * @example
   * GET /api/auth/sessions
   * Authorization: Bearer <access_token> (via HTTP-only cookie)
   * @returns
   * {
   *   "success": true,
   *   "data": [
   *     {
   *       "id": "session_id",
   *       "deviceInfo": "Chrome 91.0 on Windows 10",
   *       "ipAddress": "192.168.1.1",
   *       "lastActivity": "2023-12-01T10:30:00Z",
   *       "isCurrent": true
   *     }
   *   ]
   * }
   */
  public getSessions = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const requestId = ResponseHelper.extractRequestId(req);
      const contextLogger = req.logger ?? logger;

      if (!req.user) {
        return ResponseHelper.sendUnauthorized(
          res,
          t('auth.userNotFound'),
          requestId
        );
      }

      const sessions = await SessionService.getUserActiveSessions(req.user._id);

      contextLogger.info('User sessions retrieved', {
        userId: req.user._id,
        sessionCount: sessions.length,
        requestId,
      });

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
