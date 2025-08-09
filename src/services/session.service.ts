import { Request, Response } from 'express';
import { Types } from 'mongoose';

import { IUser } from '../interfaces/user.interface';
import Session, { ISession } from '../models/session.model';

import { ITokenPair, TokenService } from './token.service';

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
   */
  static async createSession(
    user: IUser,
    req: Request,
    res: Response
  ): Promise<ISession> {
    const sessionId = TokenService.generateSessionId();
    const tokenPair = TokenService.generateTokenPair(user, sessionId);

    // Deactivate all existing sessions for the user (single session approach)
    await Session.deactivateAllForUser(user._id);

    // Create new session
    const session = await Session.create({
      userId: user._id,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      accessTokenExpiresAt: tokenPair.accessTokenExpiresAt,
      refreshTokenExpiresAt: tokenPair.refreshTokenExpiresAt,
      ipAddress: this.getClientIP(req),
      userAgent: req.get('User-Agent') ?? 'Unknown',
      deviceInfo: this.parseUserAgent(req.get('User-Agent') ?? ''),
      location: {}, // Could integrate with IP geolocation service
      isActive: true,
      lastActivity: new Date(),
      expiresAt: tokenPair.refreshTokenExpiresAt,
    });

    // Set secure cookies
    this.setTokenCookies(res, tokenPair);

    return session;
  }

  /**
   * Refresh session tokens and update cookies
   */
  static async refreshSession(
    refreshToken: string,
    _req: Request,
    res: Response
  ): Promise<{ session: ISession; user: IUser } | null> {
    const session = await Session.findByRefreshToken(refreshToken);

    if (!session?.isValidForRefresh()) {
      return null;
    }

    const user = session.userId as unknown as IUser;
    const newTokenPair = TokenService.generateTokenPair(
      user,
      (session._id as Types.ObjectId).toString()
    );

    // Update session with new tokens
    await session.refreshTokens(
      newTokenPair.accessToken,
      newTokenPair.refreshToken,
      newTokenPair.accessTokenExpiresAt,
      newTokenPair.refreshTokenExpiresAt
    );

    // Update cookies
    this.setTokenCookies(res, newTokenPair);

    return { session, user };
  }

  /**
   * Validate access token and return session data
   */
  static async validateAccessToken(accessToken: string): Promise<{
    session: ISession;
    user: IUser;
  } | null> {
    const tokenPayload = TokenService.verifyToken(accessToken);
    if (!tokenPayload || tokenPayload.type !== 'access') {
      return null;
    }

    const session = await Session.findByAccessToken(accessToken);
    if (!session?.isActive || session.isAccessTokenExpired()) {
      return null;
    }

    // Update last activity
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
   */
  static async destroySession(sessionId: string, res: Response): Promise<void> {
    await Session.findByIdAndUpdate(sessionId, { isActive: false });
    this.clearTokenCookies(res);
  }

  /**
   * Destroy all sessions for a user and clear cookies
   */
  static async destroyAllUserSessions(
    userId: string | Types.ObjectId,
    res: Response
  ): Promise<void> {
    await Session.deactivateAllForUser(userId);
    this.clearTokenCookies(res);
  }

  /**
   * Set token cookies with security options
   */
  private static setTokenCookies(res: Response, tokenPair: ITokenPair): void {
    const cookieOptions = this.getCookieOptions();

    // Set access token cookie (shorter expiry)
    res.cookie(this.ACCESS_COOKIE_NAME, tokenPair.accessToken, {
      ...cookieOptions,
      maxAge: TokenService.getAccessTokenMaxAge(),
    });

    // Set refresh token cookie (longer expiry)
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
   * Get secure cookie options
   */
  private static getCookieOptions(): ICookieOptions {
    return {
      httpOnly: true, // Prevent XSS attacks
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict', // CSRF protection
      maxAge: 0, // Will be overridden when setting cookies
    };
  }

  /**
   * Extract client IP address
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
   * Parse User-Agent string for device info
   */
  private static parseUserAgent(userAgent: string) {
    // Simple parsing - could use a library like 'ua-parser-js' for better parsing
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
