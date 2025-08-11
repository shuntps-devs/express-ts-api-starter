import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Logger } from 'winston';

import { env, logger } from '../config';
import { IUser } from '../interfaces';
import { ISession, Session } from '../models';
import { ITokenPair, TokenService } from '../services';

export interface ISessionData {
  userId: string;
  email: string;
  sessionId: string;
}

export interface ICookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
}

export class SessionService {
  private static readonly ACCESS_COOKIE_NAME = 'access_token';
  private static readonly REFRESH_COOKIE_NAME = 'refresh_token';

  /**
   * Create a new session with tokens and set cookies
   * @param user - User object
   * @param req - Express request object
   * @param res - Express response object
   * @param contextLogger - Optional context logger for request tracing
   * @returns Promise resolving to created session
   */
  static async createSession(
    user: IUser,
    req: Request,
    res: Response,
    contextLogger?: Logger
  ): Promise<ISession> {
    const requestLogger = contextLogger ?? logger;
    const sessionId = TokenService.generateSessionId();
    const tokenPair = TokenService.generateTokenPair(
      user,
      sessionId,
      contextLogger
    );

    requestLogger.info('Creating new session', {
      userId: user._id,
      sessionId,
      userAgent: req.get('User-Agent'),
      ipAddress: this.getClientIP(req),
    });

    await Session.deactivateAllForUser(user._id);

    /**
     * Create new session document with token pair and device information
     */
    const session = await Session.create({
      userId: user._id,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      accessTokenExpiresAt: tokenPair.accessTokenExpiresAt,
      refreshTokenExpiresAt: tokenPair.refreshTokenExpiresAt,
      ipAddress: this.getClientIP(req),
      userAgent: req.get('User-Agent') ?? 'Unknown',
      deviceInfo: this.parseUserAgent(req.get('User-Agent') ?? ''),
      location: {},
      isActive: true,
      lastActivity: new Date(),
      expiresAt: tokenPair.refreshTokenExpiresAt,
    });

    this.setTokenCookies(res, tokenPair);

    requestLogger.info('Session created successfully', {
      userId: user._id,
      sessionId: (session._id as Types.ObjectId).toString(),
    });

    return session;
  }

  /**
   * Refresh session tokens and update cookies
   * @param refreshToken - Current refresh token
   * @param req - Express request object
   * @param res - Express response object
   * @param contextLogger - Optional context logger for request tracing
   * @returns Session and user data or null if invalid
   */
  static async refreshSession(
    refreshToken: string,
    _req: Request,
    res: Response,
    contextLogger?: Logger
  ): Promise<{ session: ISession; user: IUser } | null> {
    const requestLogger = contextLogger ?? logger;
    const session = await Session.findByRefreshToken(refreshToken);

    if (!session?.isValidForRefresh()) {
      requestLogger.warn('Invalid refresh token provided', { refreshToken });
      return null;
    }

    requestLogger.info('Refreshing session tokens', {
      sessionId: (session._id as Types.ObjectId).toString(),
      userId: session.userId,
    });

    const user = session.userId as unknown as IUser;
    const newTokenPair = TokenService.generateTokenPair(
      user,
      (session._id as Types.ObjectId).toString(),
      contextLogger
    );

    await session.refreshTokens(
      newTokenPair.accessToken,
      newTokenPair.refreshToken,
      newTokenPair.accessTokenExpiresAt,
      newTokenPair.refreshTokenExpiresAt
    );

    this.setTokenCookies(res, newTokenPair);

    requestLogger.info('Session tokens refreshed successfully', {
      sessionId: (session._id as Types.ObjectId).toString(),
      userId: session.userId,
    });

    return { session, user };
  }

  /**
   * Validate access token and return session data
   * @param accessToken - JWT access token to validate
   * @param contextLogger - Optional context logger for request tracing
   * @returns Session and user data or null if invalid
   */
  static async validateAccessToken(
    accessToken: string,
    contextLogger?: Logger
  ): Promise<{
    session: ISession;
    user: IUser;
  } | null> {
    const tokenPayload = TokenService.verifyToken(accessToken, contextLogger);
    if (!tokenPayload || tokenPayload.type !== 'access') {
      return null;
    }

    const session = await Session.findByAccessToken(accessToken);
    if (!session?.isActive || session.isAccessTokenExpired()) {
      return null;
    }

    await session.updateActivity();

    return {
      session,
      user: session.userId as unknown as IUser,
    };
  }

  /**
   * Extract tokens from cookies
   */
  static extractTokensFromCookies(req: Request): {
    accessToken?: string;
    refreshToken?: string;
  } {
    return {
      accessToken: req.cookies?.[this.ACCESS_COOKIE_NAME],
      refreshToken: req.cookies?.[this.REFRESH_COOKIE_NAME],
    };
  }

  /**
   * Destroy session and clear cookies
   * @param sessionId - Session identifier
   * @param res - Express response object
   * @param contextLogger - Optional context logger for request tracing
   * @returns Promise<void>
   */
  static async destroySession(
    sessionId: string,
    res: Response,
    contextLogger?: Logger
  ): Promise<void> {
    const requestLogger = contextLogger ?? logger;

    requestLogger.info('Destroying session', { sessionId });

    await Session.findByIdAndUpdate(sessionId, { isActive: false });
    this.clearTokenCookies(res);

    requestLogger.info('Session destroyed successfully', { sessionId });
  }

  /**
   * Destroy all sessions for a user and clear cookies
   * @param userId - User identifier
   * @param res - Express response object
   * @param contextLogger - Optional context logger for request tracing
   * @returns Promise<void>
   */
  static async destroyAllUserSessions(
    userId: string | Types.ObjectId,
    res: Response,
    contextLogger?: Logger
  ): Promise<void> {
    const requestLogger = contextLogger ?? logger;

    requestLogger.info('Destroying all user sessions', { userId });

    await Session.deactivateAllForUser(userId);
    this.clearTokenCookies(res);

    requestLogger.info('All user sessions destroyed successfully', { userId });
  }

  /**
   * Set token cookies with security options
   */
  private static setTokenCookies(res: Response, tokenPair: ITokenPair): void {
    const cookieOptions = this.getCookieOptions();

    res.cookie(this.ACCESS_COOKIE_NAME, tokenPair.accessToken, {
      ...cookieOptions,
      maxAge: TokenService.getAccessTokenMaxAge(),
    });

    res.cookie(this.REFRESH_COOKIE_NAME, tokenPair.refreshToken, {
      ...cookieOptions,
      maxAge: TokenService.getRefreshTokenMaxAge(),
    });
  }

  /**
   * Clear token cookies
   */
  private static clearTokenCookies(res: Response): void {
    const cookieOptions = this.getCookieOptions();

    res.clearCookie(this.ACCESS_COOKIE_NAME, cookieOptions);
    res.clearCookie(this.REFRESH_COOKIE_NAME, cookieOptions);
  }

  /**
   * Get secure cookie options for token storage
   * @returns Cookie configuration object with security settings
   */
  private static getCookieOptions(): ICookieOptions {
    return {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
    };
  }

  /**
   * Extract client IP address from request headers
   * @param req - Express request object
   * @returns Client IP address string
   */
  private static getClientIP(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ??
      req.connection.remoteAddress ??
      req.socket.remoteAddress ??
      'Unknown'
    );
  }

  /**
   * Get all active sessions for a user
   */
  static async getUserActiveSessions(
    userId: string | Types.ObjectId
  ): Promise<ISession[]> {
    return Session.findActiveByUserId(userId);
  }

  /**
   * Parse User-Agent string for device information
   * @param userAgent - Raw User-Agent string
   * @returns Parsed device information object
   */
  private static parseUserAgent(userAgent: string) {
    const browserMatch = userAgent.match(
      /(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/
    );
    const osMatch = userAgent.match(/(Windows|Macintosh|Linux|Android|iOS)/);
    const deviceMatch = userAgent.match(/(Mobile|Tablet|Desktop)/);

    return {
      browser: browserMatch?.[1] ?? 'Unknown',
      os: osMatch?.[1] ?? 'Unknown',
      device: deviceMatch?.[1] ?? 'Desktop',
    };
  }
}
