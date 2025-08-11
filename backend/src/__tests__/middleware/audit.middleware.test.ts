import { NextFunction, Request, Response } from 'express';

import { logger } from '../../config';
import { auditLogger } from '../../middleware';
import { TestHelper } from '../helpers';

jest.mock('../../config', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Audit Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    const context = TestHelper.createMockContext();
    mockReq = context.req;
    mockRes = context.res;
    mockNext = context.next;

    (mockReq as any).method = 'GET';
    (mockReq as any).path = '/test';
    (mockReq as any).ip = '192.168.1.100';
    mockReq.get = jest.fn().mockReturnValue('Mozilla/5.0 Test Browser');
    mockReq.query = {};
    mockReq.body = {};

    const eventListeners: Record<string, (() => void)[]> = {};
    (mockRes as any).on = jest.fn((event: string, callback: () => void) => {
      if (!eventListeners[event]) {
        eventListeners[event] = [];
      }
      eventListeners[event].push(callback);
    });

    (mockRes as any).emit = (event: string) => {
      if (eventListeners[event]) {
        eventListeners[event].forEach((callback) => callback());
      }
    };

    (mockRes as any).statusCode = 200;

    jest.clearAllMocks();
  });

  describe('auditLogger middleware', () => {
    it('should log user action with basic request information', () => {
      auditLogger(mockReq as Request, mockRes as Response, mockNext);

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
      const mockUser = TestHelper.generateMockUser({ _id: 'user123' });
      const mockSession = { _id: 'session456' };
      mockReq.user = mockUser as any;
      mockReq.session = mockSession as any;

      auditLogger(mockReq as Request, mockRes as Response, mockNext);

      expect(logger.info).toHaveBeenCalledWith(
        'User action audit',
        expect.objectContaining({
          userId: 'user123',
          sessionId: 'session456',
        })
      );
    });

    it('should include request body for non-GET requests', () => {
      (mockReq as any).method = 'POST';
      mockReq.body = {
        name: 'Test User',
        email: 'test@example.com',
      };

      auditLogger(mockReq as Request, mockRes as Response, mockNext);

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
      mockReq.query = {
        page: '1',
        limit: '10',
        search: 'test',
      };

      auditLogger(mockReq as Request, mockRes as Response, mockNext);

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
      (mockReq as any).route = { path: '/users/:id' };
      (mockReq as any).path = '/users/123';

      auditLogger(mockReq as Request, mockRes as Response, mockNext);

      expect(logger.info).toHaveBeenCalledWith(
        'User action audit',
        expect.objectContaining({
          action: 'GET /users/:id',
        })
      );
    });

    it('should log completion when response finishes', () => {
      const startTime = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(startTime + 150);

      auditLogger(mockReq as Request, mockRes as Response, mockNext);

      (mockRes as any).emit('finish');

      expect(logger.info).toHaveBeenCalledTimes(2);
      expect(logger.info).toHaveBeenLastCalledWith(
        'User action completed',
        expect.objectContaining({
          statusCode: 200,
          duration: expect.any(Number),
        })
      );
    });

    it('should handle different status codes in completion log', () => {
      (mockRes as any).statusCode = 404;

      auditLogger(mockReq as Request, mockRes as Response, mockNext);

      (mockRes as any).emit('finish');

      expect(logger.info).toHaveBeenLastCalledWith(
        'User action completed',
        expect.objectContaining({
          statusCode: 404,
        })
      );
    });

    it('should handle missing User-Agent header', () => {
      (mockReq.get as jest.Mock).mockReturnValue(undefined);

      auditLogger(mockReq as Request, mockRes as Response, mockNext);

      expect(logger.info).toHaveBeenCalledWith(
        'User action audit',
        expect.objectContaining({
          userAgent: undefined,
        })
      );
    });

    it('should handle empty query and body objects properly', () => {
      (mockReq as any).method = 'PUT';
      mockReq.body = {};
      mockReq.query = {};

      auditLogger(mockReq as Request, mockRes as Response, mockNext);

      expect(logger.info).toHaveBeenCalledWith(
        'User action audit',
        expect.objectContaining({
          body: {},
          query: undefined,
        })
      );
    });

    it('should create valid ISO timestamp', () => {
      auditLogger(mockReq as Request, mockRes as Response, mockNext);

      const logCall = (logger.info as jest.Mock).mock.calls[0];
      const auditInfo = logCall[1];
      const timestamp = auditInfo.timestamp;

      expect(new Date(timestamp).toISOString()).toBe(timestamp);
      expect(Date.parse(timestamp)).not.toBeNaN();
    });

    it('should calculate duration accurately', (done) => {
      auditLogger(mockReq as Request, mockRes as Response, mockNext);

      setTimeout(() => {
        (mockRes as any).emit('finish');

        setTimeout(() => {
          expect(logger.info).toHaveBeenCalledTimes(2);

          const completionCall = (logger.info as jest.Mock).mock.calls[1];
          const completionInfo = completionCall[1];

          expect(completionInfo.duration).toEqual(expect.any(Number));
          expect(completionInfo.duration).toBeGreaterThanOrEqual(0);

          done();
        }, 10);
      }, 100);
    });

    it('should handle different HTTP methods correctly', () => {
      const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

      methods.forEach((method) => {
        jest.clearAllMocks();
        (mockReq as any).method = method;

        auditLogger(mockReq as Request, mockRes as Response, mockNext);

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
    jest.restoreAllMocks();
  });
});
