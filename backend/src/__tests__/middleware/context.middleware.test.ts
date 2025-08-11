import { NextFunction, Request, Response } from 'express';

import { logger } from '../../config';
import { getRequestLogger, userContext } from '../../middleware';
import { TestHelper } from '../helpers';

jest.mock('../../config', () => ({
  logger: {
    child: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Context Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockChildLogger: any;

  beforeEach(() => {
    const context = TestHelper.createMockContext();
    mockReq = context.req;
    mockRes = context.res;
    mockNext = context.next;

    mockChildLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    (mockReq as any).path = '/test';
    (mockReq as any).method = 'GET';

    jest.clearAllMocks();

    (logger.child as jest.Mock).mockReturnValue(mockChildLogger);
  });

  describe('userContext middleware', () => {
    it('should establish user context when user is authenticated', () => {
      const mockUser = TestHelper.generateMockUser({
        _id: 'user123',
        email: 'test@example.com',
        role: 'USER',
      });

      const mockSession = { _id: 'session456' };
      mockReq.user = mockUser as any;
      mockReq.session = mockSession as any;

      userContext(mockReq as Request, mockRes as Response, mockNext);

      expect(logger.child).toHaveBeenCalledWith({
        userId: 'user123',
        userEmail: 'test@example.com',
        userRole: 'USER',
        sessionId: 'session456',
      });

      expect(mockReq.logger).toBe(mockChildLogger);

      expect(mockChildLogger.debug).toHaveBeenCalledWith(
        'User context established',
        {
          path: '/test',
          method: 'GET',
        }
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle authenticated user without session', () => {
      const mockUser = TestHelper.generateMockUser({
        _id: 'user456',
        email: 'user@test.com',
        role: 'ADMIN',
      });

      mockReq.user = mockUser as any;
      mockReq.session = undefined;

      userContext(mockReq as Request, mockRes as Response, mockNext);

      expect(logger.child).toHaveBeenCalledWith({
        userId: 'user456',
        userEmail: 'user@test.com',
        userRole: 'ADMIN',
        sessionId: undefined,
      });

      expect(mockReq.logger).toBe(mockChildLogger);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should establish anonymous context when user is not authenticated', () => {
      mockReq.user = undefined;
      mockReq.session = undefined;

      userContext(mockReq as Request, mockRes as Response, mockNext);

      expect(logger.child).toHaveBeenCalledWith({
        userId: 'anonymous',
        sessionId: null,
      });

      expect(mockReq.logger).toBe(mockChildLogger);
      expect(mockChildLogger.debug).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle different user roles correctly', () => {
      const roles = ['USER', 'ADMIN', 'MODERATOR'];

      roles.forEach((role) => {
        jest.clearAllMocks();
        const mockUser = TestHelper.generateMockUser({
          _id: `user_${role.toLowerCase()}`,
          email: `${role.toLowerCase()}@example.com`,
          role,
        });

        mockReq.user = mockUser as any;

        userContext(mockReq as Request, mockRes as Response, mockNext);

        expect(logger.child).toHaveBeenCalledWith({
          userId: `user_${role.toLowerCase()}`,
          userEmail: `${role.toLowerCase()}@example.com`,
          userRole: role,
          sessionId: undefined,
        });
      });
    });

    it('should handle user with minimal required properties', () => {
      const minimalUser = {
        _id: 'minimal123',
        email: 'minimal@test.com',
        role: 'USER',
      };

      mockReq.user = minimalUser as any;

      userContext(mockReq as Request, mockRes as Response, mockNext);

      expect(logger.child).toHaveBeenCalledWith({
        userId: 'minimal123',
        userEmail: 'minimal@test.com',
        userRole: 'USER',
        sessionId: undefined,
      });

      expect(mockNext).toHaveBeenCalled();
    });

    it('should log with correct request path and method information', () => {
      (mockReq as any).path = '/users/profile';
      (mockReq as any).method = 'PATCH';

      const mockUser = TestHelper.generateMockUser();
      mockReq.user = mockUser as any;

      userContext(mockReq as Request, mockRes as Response, mockNext);

      expect(mockChildLogger.debug).toHaveBeenCalledWith(
        'User context established',
        {
          path: '/users/profile',
          method: 'PATCH',
        }
      );
    });

    it('should not call debug for anonymous users', () => {
      mockReq.user = undefined;

      userContext(mockReq as Request, mockRes as Response, mockNext);

      expect(mockChildLogger.debug).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should attach logger to request object', () => {
      const mockUser = TestHelper.generateMockUser();
      mockReq.user = mockUser as any;

      userContext(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.logger).toBeDefined();
      expect(mockReq.logger).toBe(mockChildLogger);
    });
  });

  describe('getRequestLogger helper', () => {
    it('should return request logger when available', () => {
      mockReq.logger = mockChildLogger;

      const result = getRequestLogger(mockReq as Request);

      expect(result).toBe(mockChildLogger);
    });

    it('should return default logger when request logger is not available', () => {
      mockReq.logger = undefined;

      const result = getRequestLogger(mockReq as Request);

      expect(result).toBe(logger);
    });

    it('should return default logger when request logger is null', () => {
      mockReq.logger = null as any;

      const result = getRequestLogger(mockReq as Request);

      expect(result).toBe(logger);
    });

    it('should handle request object without logger property', () => {
      const reqWithoutLogger = { path: '/test' } as Request;

      const result = getRequestLogger(reqWithoutLogger);

      expect(result).toBe(logger);
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
});
