import crypto from 'crypto';

import jwt from 'jsonwebtoken';
import { Logger } from 'winston';

import { env, logger } from '../config';
import { IUser } from '../interfaces';

export interface ITokenPayload {
  userId: string;
  email: string;
  sessionId: string;
  type: 'access' | 'refresh';
}

export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

export class TokenService {
  private static readonly ACCESS_TOKEN_EXPIRY = '15m';
  private static readonly REFRESH_TOKEN_EXPIRY = '7d';

  /**
   * Generate a pair of access and refresh tokens
   * @param user - User object containing user information
   * @param sessionId - Unique session identifier
   * @param contextLogger - Optional context logger for request tracing
   * @returns Token pair with access and refresh tokens and their expiration dates
   */
  static generateTokenPair(
    user: IUser,
    sessionId: string,
    contextLogger?: Logger
  ): ITokenPair {
    const requestLogger = contextLogger ?? logger;
    const accessTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const refreshTokenExpiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    requestLogger.info('Generating token pair', {
      userId: user._id,
      sessionId,
      email: user.email,
    });

    const accessTokenPayload: ITokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      sessionId,
      type: 'access',
    };

    const refreshTokenPayload: ITokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      sessionId,
      type: 'refresh',
    };

    const accessToken = jwt.sign(accessTokenPayload, env.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    });

    const refreshToken = jwt.sign(refreshTokenPayload, env.JWT_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
    });

    requestLogger.info('Token pair generated successfully', {
      userId: user._id,
      sessionId,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    });

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    };
  }

  /**
   * Verify and decode a JWT token
   * @param token - JWT token string to verify
   * @param contextLogger - Optional context logger for request tracing
   * @returns Decoded token payload or null if verification fails
   */
  static verifyToken(
    token: string,
    contextLogger?: Logger
  ): ITokenPayload | null {
    const requestLogger = contextLogger ?? logger;

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as ITokenPayload;

      requestLogger.info('Token verified successfully', {
        userId: decoded.userId,
        sessionId: decoded.sessionId,
        tokenType: decoded.type,
      });

      return decoded;
    } catch (error) {
      requestLogger.warn('Token verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tokenLength: token.length,
      });

      return null;
    }
  }

  /**
   * Generate a secure random session ID
   * @returns Randomly generated hexadecimal session identifier
   */
  static generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Extract token from Authorization header
   * @param authHeader - Authorization header string
   * @returns Extracted token string or null if invalid format
   */
  static extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Check if token is expired based on its expiry date
   * @param expiryDate - Token expiration date
   * @returns True if token is expired, false otherwise
   */
  static isTokenExpired(expiryDate: Date): boolean {
    return new Date() >= expiryDate;
  }

  /**
   * Get access token expiry time in milliseconds for cookie maxAge
   * @returns Access token maximum age in milliseconds (15 minutes)
   */
  static getAccessTokenMaxAge(): number {
    return 15 * 60 * 1000;
  }

  /**
   * Get refresh token expiry time in milliseconds for cookie maxAge
   * @returns Refresh token maximum age in milliseconds (7 days)
   */
  static getRefreshTokenMaxAge(): number {
    return 7 * 24 * 60 * 60 * 1000;
  }
}
