import { NextFunction, Request, Response } from 'express';

import { logger } from '../../config';
import { auditLogger } from '../../middleware';
import { TestHelper } from '../helpers';

// Mock logger
jest.mock('../../config', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Audit Middleware', () => {
  console.log('🧪 Starting Audit Middleware test suite...');

  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    const context = TestHelper.createMockContext();
    mockReq = context.req;
    mockRes = context.res;
    mockNext = context.next;

    // Setup common request properties
    (mockReq as any).method = 'GET';
    (mockReq as any).path = '/test';
    (mockReq as any).ip = '192.168.1.100';
    mockReq.get = jest.fn().mockReturnValue('Mozilla/5.0 Test Browser');
    mockReq.query = {};
    mockReq.body = {};

    // Add event emitter functionality to mockRes
    const eventListeners: Record<string, (() => void)[]> = {};
    (mockRes as any).on = jest.fn((event: string, callback: () => void) => {
      if (!eventListeners[event]) {
        eventListeners[event] = [];
      }
      eventListeners[event].push(callback);
    });

    // Helper to trigger events
    (mockRes as any).emit = (event: string) => {
      if (eventListeners[event]) {
        eventListeners[event].forEach((callback) => callback());
      }
    };

    // Mock statusCode
    (mockRes as any).statusCode = 200;

    // Clear logger mocks
    jest.clearAllMocks();
  });

  describe('auditLogger middleware', () => {
    it('should log user action with basic request information', () => {
      // Act
      auditLogger(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        'User action audit',
        expect.objectContaining({
          action: 'GET /test',
          method: 'GET',
          path: '/test',
          ip: '192.168.1.100',
          userAgent: 'Mozilla/5.0 Test Browser',
          userId: 'anonymous',
          sessionId: null,
          timestamp: expect.any(String),
          body: undefined,
          query: undefined,
        })
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should log authenticated user information', () => {
      // Arrange
      const mockUser = TestHelper.generateMockUser({ _id: 'user123' });
      const mockSession = { _id: 'session456' };
      mockReq.user = mockUser as any;
      mockReq.session = mockSession as any;

      // Act
      auditLogger(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        'User action audit',
        expect.objectContaining({
          userId: 'user123',
          sessionId: 'session456',
        })
      );
    });

    it('should include request body for non-GET requests', () => {
      // Arrange
      (mockReq as any).method = 'POST';
      mockReq.body = {
        name: 'Test User',
        email: 'test@example.com',
      };

      // Act
      auditLogger(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        'User action audit',
        expect.objectContaining({
          action: 'POST /test',
          method: 'POST',
          body: {
            name: 'Test User',
            email: 'test@example.com',
          },
        })
      );
    });

    it('should include query parameters when present', () => {
      // Arrange
      mockReq.query = {
        page: '1',
        limit: '10',
        search: 'test',
      };

      // Act
      auditLogger(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        'User action audit',
        expect.objectContaining({
          query: {
            page: '1',
            limit: '10',
            search: 'test',
          },
        })
      );
    });

    it('should use route path when available instead of req.path', () => {
      // Arrange
      (mockReq as any).route = { path: '/users/:id' };
      (mockReq as any).path = '/users/123';

      // Act
      auditLogger(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        'User action audit',
        expect.objectContaining({
          action: 'GET /users/:id',
        })
      );
    });

    it('should log completion when response finishes', () => {
      // Arrange
      const startTime = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(startTime + 150);

      // Act
      auditLogger(mockReq as Request, mockRes as Response, mockNext);

      // Trigger finish event
      (mockRes as any).emit('finish');

      // Assert
      expect(logger.info).toHaveBeenCalledTimes(2); // Initial + completion
      expect(logger.info).toHaveBeenLastCalledWith(
        'User action completed',
        expect.objectContaining({
          statusCode: 200,
          duration: expect.any(Number),
        })
      );
    });

    it('should handle different status codes in completion log', () => {
      // Arrange
      (mockRes as any).statusCode = 404;

      // Act
      auditLogger(mockReq as Request, mockRes as Response, mockNext);

      // Trigger finish event
      (mockRes as any).emit('finish');

      // Assert
      expect(logger.info).toHaveBeenLastCalledWith(
        'User action completed',
        expect.objectContaining({
          statusCode: 404,
        })
      );
    });

    it('should handle missing User-Agent header', () => {
      // Arrange
      (mockReq.get as jest.Mock).mockReturnValue(undefined);

      // Act
      auditLogger(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        'User action audit',
        expect.objectContaining({
          userAgent: undefined,
        })
      );
    });

    it('should handle empty query and body objects properly', () => {
      // Arrange
      (mockReq as any).method = 'PUT';
      mockReq.body = {};
      mockReq.query = {};

      // Act
      auditLogger(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(logger.info).toHaveBeenCalledWith(
        'User action audit',
        expect.objectContaining({
          body: {},
          query: undefined, // Empty query should be undefined
        })
      );
    });

    it('should create valid ISO timestamp', () => {
      // Act
      auditLogger(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      const logCall = (logger.info as jest.Mock).mock.calls[0];
      const auditInfo = logCall[1];
      const timestamp = auditInfo.timestamp;

      // Check if timestamp is valid ISO string
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
      expect(Date.parse(timestamp)).not.toBeNaN();
    });

    it('should calculate duration accurately', (done) => {
      // Act
      auditLogger(mockReq as Request, mockRes as Response, mockNext);

      // Wait a bit then trigger finish
      setTimeout(() => {
        // Trigger finish event
        (mockRes as any).emit('finish');

        // Assert after event processing
        setTimeout(() => {
          expect(logger.info).toHaveBeenCalledTimes(2); // Initial + completion

          const completionCall = (logger.info as jest.Mock).mock.calls[1];
          const completionInfo = completionCall[1];

          // Duration should be a positive number
          expect(completionInfo.duration).toEqual(expect.any(Number));
          expect(completionInfo.duration).toBeGreaterThanOrEqual(0);

          done();
        }, 10);
      }, 100); // Wait 100ms before finishing
    });

    it('should handle different HTTP methods correctly', () => {
      const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

      methods.forEach((method) => {
        // Arrange
        jest.clearAllMocks();
        (mockReq as any).method = method;

        // Act
        auditLogger(mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(logger.info).toHaveBeenCalledWith(
          'User action audit',
          expect.objectContaining({
            action: `${method} /test`,
            method,
          })
        );
      });
    });
  });

  afterAll(() => {
    console.log('✅ Audit Middleware test suite completed');
  });
});
