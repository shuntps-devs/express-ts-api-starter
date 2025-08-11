import { NextFunction, Request, RequestHandler, Response } from 'express';

import { asyncHandler } from '../../middleware';
import { TestHelper } from '../helpers';

describe('Async Handler Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    const context = TestHelper.createMockContext();
    mockReq = context.req;
    mockRes = context.res;
    mockNext = context.next;

    jest.clearAllMocks();
  });

  describe('asyncHandler wrapper', () => {
    it('should handle synchronous functions without errors', () => {
      const syncHandler: RequestHandler = (_req, res, _next) => {
        (res as any).status(200).json({ success: true });
      };

      const wrappedHandler = asyncHandler(syncHandler);

      wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should catch errors from synchronous functions and pass to next', () => {
      const testError = new Error('Synchronous error');
      const syncErrorHandler: RequestHandler = (_req, _res, next) => {
        next(testError);
      };

      const wrappedHandler = asyncHandler(syncErrorHandler);

      wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(testError);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should catch errors from async functions and pass to next', (done) => {
      const asyncErrorHandler: RequestHandler = async (_req, _res, _next) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        throw new Error('Async error');
      };

      const wrappedHandler = asyncHandler(asyncErrorHandler);

      wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      setTimeout(() => {
        expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Async error',
          })
        );
        expect(mockRes.status).not.toHaveBeenCalled();
        expect(mockRes.json).not.toHaveBeenCalled();
        done();
      }, 50);
    });

    it('should handle rejected promises and pass to next', (done) => {
      const rejectedPromiseHandler: RequestHandler = (_req, _res, _next) => {
        return Promise.reject(new Error('Promise rejected'));
      };

      const wrappedHandler = asyncHandler(rejectedPromiseHandler);

      wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      setTimeout(() => {
        expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Promise rejected',
          })
        );
        done();
      }, 50);
    });

    it('should handle functions that call next() without error', () => {
      const nextCallHandler: RequestHandler = (_req, _res, next) => {
        next();
      };

      const wrappedHandler = asyncHandler(nextCallHandler);

      wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should handle functions that call next() with an error', () => {
      const error = new Error('Handler error');
      const nextWithErrorHandler: RequestHandler = (_req, _res, next) => {
        next(error);
      };

      const wrappedHandler = asyncHandler(nextWithErrorHandler);

      wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should preserve error types and properties', () => {
      class CustomError extends Error {
        public statusCode: number;
        public isOperational: boolean;

        constructor(message: string, statusCode: number) {
          super(message);
          this.statusCode = statusCode;
          this.isOperational = true;
        }
      }

      const customError = new CustomError('Custom validation failed', 400);
      const customErrorHandler: RequestHandler = (_req, _res, next) => {
        next(customError);
      };

      const wrappedHandler = asyncHandler(customErrorHandler);

      wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(customError);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Custom validation failed',
          statusCode: 400,
          isOperational: true,
        })
      );
    });

    it('should handle async functions that resolve successfully', (done) => {
      const asyncSuccessHandler: RequestHandler = async (_req, res, _next) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        (res as any).status(201).json({ message: 'Created successfully' });
      };

      const wrappedHandler = asyncHandler(asyncSuccessHandler);

      wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      setTimeout(() => {
        expect(mockRes.status).toHaveBeenCalledWith(201);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Created successfully',
        });
        expect(mockNext).not.toHaveBeenCalled();
        done();
      }, 50);
    });

    it('should correctly wrap and execute promise-based handlers', () => {
      const promiseHandler: RequestHandler = () => {
        return Promise.resolve();
      };

      const wrappedHandler = asyncHandler(promiseHandler);

      const result = wrappedHandler(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(result).toBeUndefined();
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
});
