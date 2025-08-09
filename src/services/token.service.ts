import crypto from 'crypto';

import jwt from 'jsonwebtoken';

import { env } from '../config';
import { IUser } from '../interfaces/user.interface';

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
   */
  static generateTokenPair(user: IUser, sessionId: string): ITokenPair {
    const accessTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    const refreshTokenExpiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ); // 7 days

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

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    };
  }

  /**
   * Verify and decode a JWT token
   */
  static verifyToken(token: string): ITokenPayload | null {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as ITokenPayload;
      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * Generate a secure random session ID
   */
  static generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Check if token is expired based on its expiry date
   */
  static isTokenExpired(expiryDate: Date): boolean {
    return new Date() >= expiryDate;
  }

  /**
   * Get token expiry time in milliseconds for cookie maxAge
   */
  static getAccessTokenMaxAge(): number {
    return 15 * 60 * 1000; // 15 minutes in milliseconds
  }

  static getRefreshTokenMaxAge(): number {
    return 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  }
}
