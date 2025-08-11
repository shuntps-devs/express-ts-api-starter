import { NextFunction, Request, Response } from 'express';

import { UserRole } from '../../interfaces';
import {
  authenticate,
  authenticateHeader,
  optionalAuthenticate,
  requireRole,
} from '../../middleware';
import { SessionService, TokenService } from '../../services';
import { TestHelper } from '../helpers';

jest.mock('../../services', () => ({
  SessionService: {
    extractTokensFromCookies: jest.fn(),
    validateAccessToken: jest.fn(),
    refreshSession: jest.fn(),
  },
  TokenService: {
    extractTokenFromHeader: jest.fn(),
  },
}));

jest.mock('../../utils', () => ({
  ErrorHelper: {
    sendUnauthorized: jest.fn((res, message, requestId) => {
      res.status(401).json({
        success: false,
        error: {
          message: message ?? 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
        timestamp: new Date().toISOString(),
        requestId,
      });
    }),
    sendForbidden: jest.fn((res, message, requestId) => {
      res.status(403).json({
        success: false,
        error: {
          message: message ?? 'Forbidden',
          code: 'FORBIDDEN',
        },
        timestamp: new Date().toISOString(),
        requestId,
      });
    }),
    sendInternalServerError: jest.fn((res, message, requestId) => {
      res.status(500).json({
        success: false,
        error: {
          message: message ?? 'Internal Server Error',
          code: 'INTERNAL_SERVER_ERROR',
        },
        timestamp: new Date().toISOString(),
        requestId,
      });
    }),
    extractRequestId: jest.fn().mockReturnValue('test-request-id'),
  },
  ResponseHelper: {
    sendSuccess: jest.fn(),
  },
}));

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  const mockUser = TestHelper.generateMockUser({
    _id: 'user123',
    role: UserRole.USER,
  });

  const mockSession = {
    _id: 'session123',
    userId: 'user123',
    isActive: true,
  };

  beforeEach(() => {
    const context = TestHelper.createMockContext();
    mockReq = context.req;
    mockRes = context.res;
    mockNext = context.next;

    jest.clearAllMocks();
  });

  describe('authenticate middleware', () => {
    it('should authenticate user with valid access token', async () => {
      (SessionService.extractTokensFromCookies as jest.Mock).mockReturnValue({
        accessToken: 'valid-access-token',
        refreshToken: 'valid-refresh-token',
      });

      (SessionService.validateAccessToken as jest.Mock).mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toBe(mockUser);
      expect(mockReq.session).toBe(mockSession);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should refresh session when access token is invalid but refresh token is valid', async () => {
      (SessionService.extractTokensFromCookies as jest.Mock).mockReturnValue({
        accessToken: 'invalid-access-token',
        refreshToken: 'valid-refresh-token',
      });

      (SessionService.validateAccessToken as jest.Mock).mockResolvedValue(null);

      (SessionService.refreshSession as jest.Mock).mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(SessionService.refreshSession).toHaveBeenCalledWith(
        'valid-refresh-token',
        mockReq,
        mockRes
      );
      expect(mockReq.user).toBe(mockUser);
      expect(mockReq.session).toBe(mockSession);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when no tokens are present', async () => {
      (SessionService.extractTokensFromCookies as jest.Mock).mockReturnValue({
        accessToken: null,
        refreshToken: null,
      });

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
        timestamp: expect.any(String),
        requestId: 'test-request-id',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should clear cookies and return 401 when both tokens are invalid', async () => {
      (SessionService.extractTokensFromCookies as jest.Mock).mockReturnValue({
        accessToken: 'invalid-access-token',
        refreshToken: 'invalid-refresh-token',
      });

      (SessionService.validateAccessToken as jest.Mock).mockResolvedValue(null);
      (SessionService.refreshSession as jest.Mock).mockResolvedValue(null);

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.clearCookie).toHaveBeenCalledWith('access_token');
      expect(mockRes.clearCookie).toHaveBeenCalledWith('refresh_token');
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
        timestamp: expect.any(String),
        requestId: 'test-request-id',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle authentication errors gracefully', async () => {
      (SessionService.extractTokensFromCookies as jest.Mock).mockImplementation(
        () => {
          throw new Error('Database error');
        }
      );

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Internal Server Error',
          code: 'INTERNAL_SERVER_ERROR',
        },
        timestamp: expect.any(String),
        requestId: 'test-request-id',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should only use access token when refresh token is not present', async () => {
      (SessionService.extractTokensFromCookies as jest.Mock).mockReturnValue({
        accessToken: 'valid-access-token',
        refreshToken: null,
      });

      (SessionService.validateAccessToken as jest.Mock).mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(SessionService.validateAccessToken).toHaveBeenCalledWith(
        'valid-access-token'
      );
      expect(SessionService.refreshSession).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('optionalAuthenticate middleware', () => {
    it('should set user when valid access token is present', async () => {
      (SessionService.extractTokensFromCookies as jest.Mock).mockReturnValue({
        accessToken: 'valid-access-token',
        refreshToken: 'valid-refresh-token',
      });

      (SessionService.validateAccessToken as jest.Mock).mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });

      await optionalAuthenticate(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockReq.user).toBe(mockUser);
      expect(mockReq.session).toBe(mockSession);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without user when no tokens are present', async () => {
      (SessionService.extractTokensFromCookies as jest.Mock).mockReturnValue({
        accessToken: null,
        refreshToken: null,
      });

      await optionalAuthenticate(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockReq.user).toBeUndefined();
      expect(mockReq.session).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should try refresh when access token is invalid', async () => {
      (SessionService.extractTokensFromCookies as jest.Mock).mockReturnValue({
        accessToken: 'invalid-access-token',
        refreshToken: 'valid-refresh-token',
      });

      (SessionService.validateAccessToken as jest.Mock).mockResolvedValue(null);
      (SessionService.refreshSession as jest.Mock).mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });

      await optionalAuthenticate(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(SessionService.refreshSession).toHaveBeenCalledWith(
        'valid-refresh-token',
        mockReq,
        mockRes
      );
      expect(mockReq.user).toBe(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without blocking on authentication errors', async () => {
      (SessionService.extractTokensFromCookies as jest.Mock).mockImplementation(
        () => {
          throw new Error('Database error');
        }
      );

      await optionalAuthenticate(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('authenticateHeader middleware', () => {
    beforeEach(() => {
      mockReq.headers = {};
    });

    it('should authenticate user with valid Authorization header', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };

      (TokenService.extractTokenFromHeader as jest.Mock).mockReturnValue(
        'valid-token'
      );
      (SessionService.validateAccessToken as jest.Mock).mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });

      await authenticateHeader(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(TokenService.extractTokenFromHeader).toHaveBeenCalledWith(
        'Bearer valid-token'
      );
      expect(mockReq.user).toBe(mockUser);
      expect(mockReq.session).toBe(mockSession);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when no Authorization header is present', async () => {
      (TokenService.extractTokenFromHeader as jest.Mock).mockReturnValue(null);

      await authenticateHeader(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
        timestamp: expect.any(String),
        requestId: 'test-request-id',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };

      (TokenService.extractTokenFromHeader as jest.Mock).mockReturnValue(
        'invalid-token'
      );
      (SessionService.validateAccessToken as jest.Mock).mockResolvedValue(null);

      await authenticateHeader(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
        timestamp: expect.any(String),
        requestId: 'test-request-id',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle authentication errors gracefully', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };

      (TokenService.extractTokenFromHeader as jest.Mock).mockImplementation(
        () => {
          throw new Error('Token extraction error');
        }
      );

      await authenticateHeader(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Internal Server Error',
          code: 'INTERNAL_SERVER_ERROR',
        },
        timestamp: expect.any(String),
        requestId: 'test-request-id',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireRole middleware', () => {
    it('should allow access when user has required role', () => {
      mockReq.user = { ...mockUser, role: UserRole.ADMIN } as any;
      const middleware = requireRole([UserRole.ADMIN]);

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should allow access when user has one of multiple required roles', () => {
      mockReq.user = { ...mockUser, role: UserRole.USER } as any;
      const middleware = requireRole([UserRole.USER, UserRole.ADMIN]);

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle user with array of roles', () => {
      mockReq.user = {
        ...mockUser,
        role: [UserRole.USER, UserRole.MODERATOR],
      } as any;
      const middleware = requireRole([UserRole.MODERATOR]);

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      mockReq.user = undefined;
      const middleware = requireRole([UserRole.ADMIN]);

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
        timestamp: expect.any(String),
        requestId: 'test-request-id',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user lacks required role', () => {
      mockReq.user = { ...mockUser, role: UserRole.USER } as any;
      const middleware = requireRole([UserRole.ADMIN]);

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Forbidden',
          code: 'FORBIDDEN',
        },
        timestamp: expect.any(String),
        requestId: 'test-request-id',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user has none of the required roles', () => {
      mockReq.user = { ...mockUser, role: UserRole.USER } as any;
      const middleware = requireRole([UserRole.ADMIN, UserRole.MODERATOR]);

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Forbidden',
          code: 'FORBIDDEN',
        },
        timestamp: expect.any(String),
        requestId: 'test-request-id',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
});
