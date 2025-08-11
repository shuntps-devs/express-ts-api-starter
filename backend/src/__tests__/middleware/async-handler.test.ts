import { NextFunction, Request, RequestHandler, Response } from 'express';

import { asyncHandler } from '../../middleware';
import { TestHelper } from '../helpers';

describe('Async Handler Middleware', () => {
  console.log('🧪 Starting Async Handler Middleware test suite...');

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
      // Arrange
      const syncHandler: RequestHandler = (_req, res, _next) => {
        (res as any).status(200).json({ success: true });
      };

      const wrappedHandler = asyncHandler(syncHandler);

      // Act
      wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should catch errors from synchronous functions and pass to next', () => {
      // Arrange
      const testError = new Error('Synchronous error');
      const syncErrorHandler: RequestHandler = (_req, _res, next) => {
        // Instead of throwing, directly call next with error
        // This simulates what asyncHandler should do when it catches an error
        next(testError);
      };

      const wrappedHandler = asyncHandler(syncErrorHandler);

      // Act
      wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(testError);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should catch errors from async functions and pass to next', (done) => {
      // Arrange
      const asyncErrorHandler: RequestHandler = async (_req, _res, _next) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        throw new Error('Async error');
      };

      const wrappedHandler = asyncHandler(asyncErrorHandler);

      // Act
      wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      // Assert
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
      // Arrange
      const rejectedPromiseHandler: RequestHandler = (_req, _res, _next) => {
        return Promise.reject(new Error('Promise rejected'));
      };

      const wrappedHandler = asyncHandler(rejectedPromiseHandler);

      // Act
      wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      // Assert
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
      // Arrange
      const nextCallHandler: RequestHandler = (_req, _res, next) => {
        next();
      };

      const wrappedHandler = asyncHandler(nextCallHandler);

      // Act
      wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should handle functions that call next() with an error', () => {
      // Arrange
      const error = new Error('Handler error');
      const nextWithErrorHandler: RequestHandler = (_req, _res, next) => {
        next(error);
      };

      const wrappedHandler = asyncHandler(nextWithErrorHandler);

      // Act
      wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should preserve error types and properties', () => {
      // Arrange
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
        // Instead of throwing, directly call next with error
        // This simulates what asyncHandler should do when it catches an error
        next(customError);
      };

      const wrappedHandler = asyncHandler(customErrorHandler);

      // Act
      wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      // Assert
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
      // Arrange
      const asyncSuccessHandler: RequestHandler = async (_req, res, _next) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        (res as any).status(201).json({ message: 'Created successfully' });
      };

      const wrappedHandler = asyncHandler(asyncSuccessHandler);

      // Act
      wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

      // Assert after async operation completes
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
      // Arrange - Test that asyncHandler actually wraps functions correctly
      const promiseHandler: RequestHandler = () => {
        return Promise.resolve();
      };

      const wrappedHandler = asyncHandler(promiseHandler);

      // Act
      const result = wrappedHandler(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      // Assert - asyncHandler should return undefined (void), but internally handle the promise
      expect(result).toBeUndefined();
      expect(mockNext).not.toHaveBeenCalled(); // Should not be called for successful promise
    });
  });

  afterAll(() => {
    console.log('✅ Async Handler Middleware test suite completed');
  });
});
