import crypto from 'crypto';

import jwt from 'jsonwebtoken';

import { IUser } from '../../interfaces';
import { ITokenPayload, TokenService } from '../../services/token.service';
import { TestHelper } from '../helpers';

// Mock jwt
jest.mock('jsonwebtoken');

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => 'mock-session-id'),
  })),
}));

// Mock environment variables
jest.mock('../../config/env', () => ({
  env: {
    JWT_SECRET: 'test-jwt-secret',
  },
}));

describe('TokenService', () => {
  let mockUser: IUser;
  const mockSessionId = 'mock-session-id';
  const mockAccessToken = 'mock-access-token';
  const mockRefreshToken = 'mock-refresh-token';

  beforeAll(() => {
    console.log('🧪 Starting TokenService test suite...');
  });

  afterAll(() => {
    console.log('✅ TokenService test suite completed');
  });

  beforeEach(() => {
    mockUser = TestHelper.generateMockUser({
      _id: 'user123',
      email: 'test@example.com',
      username: 'testuser',
    }) as unknown as IUser;

    jest.clearAllMocks();
  });

  describe('generateTokenPair', () => {
    beforeEach(() => {
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);
    });

    it('should generate valid token pair', () => {
      const result = TokenService.generateTokenPair(mockUser, mockSessionId);

      expect(result.accessToken).toBe(mockAccessToken);
      expect(result.refreshToken).toBe(mockRefreshToken);
      expect(result.accessTokenExpiresAt).toBeInstanceOf(Date);
      expect(result.refreshTokenExpiresAt).toBeInstanceOf(Date);
    });

    it('should call jwt.sign with correct access token payload', () => {
      TokenService.generateTokenPair(mockUser, mockSessionId);

      expect(jwt.sign).toHaveBeenNthCalledWith(
        1,
        {
          userId: 'user123',
          email: 'test@example.com',
          sessionId: mockSessionId,
          type: 'access',
        },
        'test-jwt-secret',
        { expiresIn: '15m' }
      );
    });

    it('should call jwt.sign with correct refresh token payload', () => {
      TokenService.generateTokenPair(mockUser, mockSessionId);

      expect(jwt.sign).toHaveBeenNthCalledWith(
        2,
        {
          userId: 'user123',
          email: 'test@example.com',
          sessionId: mockSessionId,
          type: 'refresh',
        },
        'test-jwt-secret',
        { expiresIn: '7d' }
      );
    });

    it('should set correct expiry dates', () => {
      const beforeTime = Date.now();
      const result = TokenService.generateTokenPair(mockUser, mockSessionId);
      const afterTime = Date.now();

      // Access token should expire in ~15 minutes
      const accessTokenExpiry = result.accessTokenExpiresAt.getTime();
      expect(accessTokenExpiry).toBeGreaterThan(beforeTime + 14 * 60 * 1000);
      expect(accessTokenExpiry).toBeLessThan(afterTime + 16 * 60 * 1000);

      // Refresh token should expire in ~7 days
      const refreshTokenExpiry = result.refreshTokenExpiresAt.getTime();
      expect(refreshTokenExpiry).toBeGreaterThan(
        beforeTime + 6 * 24 * 60 * 60 * 1000
      );
      expect(refreshTokenExpiry).toBeLessThan(
        afterTime + 8 * 24 * 60 * 60 * 1000
      );
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token successfully', () => {
      const mockPayload: ITokenPayload = {
        userId: 'user123',
        email: 'test@example.com',
        sessionId: mockSessionId,
        type: 'access',
      };

      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      const result = TokenService.verifyToken('valid-token');

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-jwt-secret');
      expect(result).toEqual(mockPayload);
    });

    it('should return null for invalid token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = TokenService.verifyToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null for expired token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.TokenExpiredError('Token expired', new Date());
      });

      const result = TokenService.verifyToken('expired-token');

      expect(result).toBeNull();
    });
  });

  describe('generateSessionId', () => {
    it('should generate a session ID', () => {
      const result = TokenService.generateSessionId();

      expect(result).toBe('mock-session-id');
    });

    it('should call crypto.randomBytes with correct parameters', () => {
      TokenService.generateSessionId();

      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const result = TokenService.extractTokenFromHeader(
        'Bearer valid-token-here'
      );

      expect(result).toBe('valid-token-here');
    });

    it('should return null for missing header', () => {
      const result = TokenService.extractTokenFromHeader(undefined);

      expect(result).toBeNull();
    });

    it('should return null for empty header', () => {
      const result = TokenService.extractTokenFromHeader('');

      expect(result).toBeNull();
    });

    it('should return null for header without Bearer prefix', () => {
      const result = TokenService.extractTokenFromHeader(
        'Token invalid-format'
      );

      expect(result).toBeNull();
    });

    it('should return null for Bearer header without token', () => {
      const result = TokenService.extractTokenFromHeader('Bearer ');

      expect(result).toBe('');
    });

    it('should handle Bearer header with extra spaces', () => {
      const result = TokenService.extractTokenFromHeader(
        'Bearer   token-with-spaces  '
      );

      expect(result).toBe('  token-with-spaces  ');
    });
  });

  describe('isTokenExpired', () => {
    it('should return true for expired date', () => {
      const expiredDate = new Date(Date.now() - 60000); // 1 minute ago
      const result = TokenService.isTokenExpired(expiredDate);

      expect(result).toBe(true);
    });

    it('should return false for future date', () => {
      const futureDate = new Date(Date.now() + 60000); // 1 minute from now
      const result = TokenService.isTokenExpired(futureDate);

      expect(result).toBe(false);
    });

    it('should return true for current date', () => {
      const currentDate = new Date();
      // Add a small delay to ensure current time has passed
      const result = TokenService.isTokenExpired(currentDate);

      expect(result).toBe(true);
    });
  });

  describe('getAccessTokenMaxAge', () => {
    it('should return correct max age in milliseconds', () => {
      const result = TokenService.getAccessTokenMaxAge();

      expect(result).toBe(15 * 60 * 1000); // 15 minutes in ms
    });
  });

  describe('getRefreshTokenMaxAge', () => {
    it('should return correct max age in milliseconds', () => {
      const result = TokenService.getRefreshTokenMaxAge();

      expect(result).toBe(7 * 24 * 60 * 60 * 1000); // 7 days in ms
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with different ID formats', () => {
      const userWithObjectId = {
        ...mockUser,
        _id: { toString: () => 'object-id-123' } as any,
      };

      (jwt.sign as jest.Mock)
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = TokenService.generateTokenPair(
        userWithObjectId,
        mockSessionId
      );

      expect(jwt.sign).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          userId: 'object-id-123',
        }),
        expect.any(String),
        expect.any(Object)
      );

      expect(result.accessToken).toBe('access-token');
    });

    it('should handle malformed JWT in verifyToken', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Malformed JWT');
      });

      const result = TokenService.verifyToken('malformed.jwt.token');

      expect(result).toBeNull();
    });
  });
});
