import { NextFunction, Request, Response } from 'express';

import { env, logger } from '../../config';
import { t } from '../../i18n';
import { errorHandler } from '../../middleware';
import { TestHelper } from '../helpers';

jest.mock('../../config', () => ({
  logger: {
    error: jest.fn(),
  },
  env: {
    NODE_ENV: 'test',
  },
}));

jest.mock('../../i18n', () => ({
  t: jest.fn(),
}));

interface IError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

describe('Error Handler Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    const context = TestHelper.createMockContext();
    mockReq = context.req;
    mockRes = context.res;
    mockNext = context.next;

    jest.clearAllMocks();

    (t as jest.Mock).mockReturnValue('Internal server error');
  });

  describe('errorHandler middleware', () => {
    it('should handle basic error with default values', () => {
      const error: IError = new Error('Test error message');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(logger.error).toHaveBeenCalledWith('Error occurred', {
        statusCode: 500,
        message: 'Test error message',
        stack: expect.any(String),
        isOperational: undefined,
        userId: undefined,
      });
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Internal server error',
          code: 'error',
          details: undefined,
        },
        timestamp: expect.any(String),
        requestId: undefined,
      });
    });

    it('should preserve custom status code and status', () => {
      const error: IError = new Error('Validation failed');
      error.statusCode = 400;
      error.status = 'fail';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(logger.error).toHaveBeenCalledWith('Error occurred', {
        statusCode: 400,
        message: 'Validation failed',
        stack: expect.any(String),
        isOperational: undefined,
        userId: undefined,
      });
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Internal server error',
          code: 'fail',
          details: undefined,
        },
        timestamp: expect.any(String),
        requestId: undefined,
      });
    });

    it('should show operational error messages in production', () => {
      (env as any).NODE_ENV = 'production';
      const error: IError = new Error('User not found');
      error.statusCode = 404;
      error.isOperational = true;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'User not found',
          code: 'error',
          details: undefined,
        },
        timestamp: expect.any(String),
        requestId: undefined,
      });
    });

    it('should hide non-operational error messages in production', () => {
      (env as any).NODE_ENV = 'production';
      const error: IError = new Error('Database connection failed');
      error.statusCode = 500;
      error.isOperational = false;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(t).toHaveBeenCalledWith('error.internalServer');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Internal server error',
          code: 'error',
          details: undefined,
        },
        timestamp: expect.any(String),
        requestId: undefined,
      });
    });

    it('should provide full error details in development mode', () => {
      (env as any).NODE_ENV = 'development';
      const error: IError = new Error('Development error');
      error.statusCode = 422;
      error.status = 'fail';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Development error',
          code: 'fail',
          details: {
            stack: expect.any(String),
            error: error,
          },
        },
        timestamp: expect.any(String),
        requestId: undefined,
      });
    });

    it('should log error details regardless of environment', () => {
      const error: IError = new Error('Logging test error');
      error.statusCode = 403;
      error.isOperational = true;

      (env as any).NODE_ENV = 'production';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(logger.error).toHaveBeenCalledWith('Error occurred', {
        statusCode: 403,
        message: 'Logging test error',
        stack: expect.any(String),
        isOperational: true,
        userId: undefined,
      });
    });

    it('should handle errors without statusCode', () => {
      const error: IError = new Error('Error without status');

      delete error.statusCode;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(logger.error).toHaveBeenCalledWith('Error occurred', {
        statusCode: 500,
        message: 'Error without status',
        stack: expect.any(String),
        isOperational: undefined,
        userId: undefined,
      });
    });

    it('should handle errors without status property', () => {
      const error: IError = new Error('Error without status string');
      error.statusCode = 401;

      delete error.status;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Internal server error',
          code: 'error',
          details: undefined,
        },
        timestamp: expect.any(String),
        requestId: undefined,
      });
    });

    it('should handle null or undefined error messages', () => {
      const error: IError = new Error();
      error.message = '';
      error.statusCode = 400;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(logger.error).toHaveBeenCalledWith('Error occurred', {
        statusCode: 400,
        message: '',
        stack: expect.any(String),
        isOperational: undefined,
        userId: undefined,
      });
    });

    it('should handle errors with isOperational flag in development', () => {
      (env as any).NODE_ENV = 'development';
      const error: IError = new Error('Operational error in dev');
      error.statusCode = 400;
      error.isOperational = true;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Operational error in dev',
          code: 'error',
          details: {
            stack: expect.any(String),
            error: error,
          },
        },
        timestamp: expect.any(String),
        requestId: undefined,
      });
    });

    it('should use translated error message for non-operational errors', () => {
      (env as any).NODE_ENV = 'production';
      (t as jest.Mock).mockReturnValue('Erreur serveur interne');

      const error: IError = new Error('Technical error details');
      error.statusCode = 500;
      error.isOperational = false;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(t).toHaveBeenCalledWith('error.internalServer');
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Erreur serveur interne',
          code: 'error',
          details: undefined,
        },
        timestamp: expect.any(String),
        requestId: undefined,
      });
    });

    it('should handle different status codes correctly', () => {
      const testCases = [
        { statusCode: 400, status: 'fail' },
        { statusCode: 401, status: 'unauthorized' },
        { statusCode: 404, status: 'not_found' },
        { statusCode: 422, status: 'validation_error' },
        { statusCode: 500, status: 'internal_error' },
      ];

      testCases.forEach(({ statusCode, status }) => {
        jest.clearAllMocks();
        const error: IError = new Error(`Error ${statusCode}`);
        error.statusCode = statusCode;
        error.status = status;

        errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(statusCode);
        expect(logger.error).toHaveBeenCalledWith('Error occurred', {
          statusCode,
          message: `Error ${statusCode}`,
          stack: expect.any(String),
          isOperational: undefined,
          userId: undefined,
        });
      });
    });

    it('should handle errors with stack trace', () => {
      const error: IError = new Error('Error with stack');
      const originalStack = error.stack;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(logger.error).toHaveBeenCalledWith('Error occurred', {
        statusCode: 500,
        message: 'Error with stack',
        stack: originalStack,
        isOperational: undefined,
        userId: undefined,
      });
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
});
