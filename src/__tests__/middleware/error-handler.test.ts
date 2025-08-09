import { NextFunction, Request, Response } from 'express';

import { env, logger } from '../../config';
import { t } from '../../i18n';
import { errorHandler } from '../../middleware';
import { TestHelper } from '../helpers';

// Mock dependencies
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
  console.log('🧪 Starting Error Handler Middleware test suite...');

  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    const context = TestHelper.createMockContext();
    mockReq = context.req;
    mockRes = context.res;
    mockNext = context.next;

    // Clear all mocks
    jest.clearAllMocks();

    // Setup default mock returns
    (t as jest.Mock).mockReturnValue('Internal server error');
  });

  describe('errorHandler middleware', () => {
    it('should handle basic error with default values', () => {
      // Arrange
      const error: IError = new Error('Test error message');

      // Act
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(logger.error).toHaveBeenCalledWith('Error:', {
        statusCode: 500,
        message: 'Test error message',
        stack: expect.any(String),
        isOperational: undefined,
      });
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Internal server error',
      });
    });

    it('should preserve custom status code and status', () => {
      // Arrange
      const error: IError = new Error('Validation failed');
      error.statusCode = 400;
      error.status = 'fail';

      // Act
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(logger.error).toHaveBeenCalledWith('Error:', {
        statusCode: 400,
        message: 'Validation failed',
        stack: expect.any(String),
        isOperational: undefined,
      });
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Internal server error',
      });
    });

    it('should show operational error messages in production', () => {
      // Arrange
      (env as any).NODE_ENV = 'production';
      const error: IError = new Error('User not found');
      error.statusCode = 404;
      error.isOperational = true;

      // Act
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'User not found',
      });
    });

    it('should hide non-operational error messages in production', () => {
      // Arrange
      (env as any).NODE_ENV = 'production';
      const error: IError = new Error('Database connection failed');
      error.statusCode = 500;
      error.isOperational = false;

      // Act
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(t).toHaveBeenCalledWith('error.internalServer');
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Internal server error',
      });
    });

    it('should provide full error details in development mode', () => {
      // Arrange
      (env as any).NODE_ENV = 'development';
      const error: IError = new Error('Development error');
      error.statusCode = 422;
      error.status = 'fail';

      // Act
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        error: error,
        message: 'Development error',
        stack: expect.any(String),
      });
    });

    it('should log error details regardless of environment', () => {
      // Arrange
      const error: IError = new Error('Logging test error');
      error.statusCode = 403;
      error.isOperational = true;

      // Test in production
      (env as any).NODE_ENV = 'production';

      // Act
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(logger.error).toHaveBeenCalledWith('Error:', {
        statusCode: 403,
        message: 'Logging test error',
        stack: expect.any(String),
        isOperational: true,
      });
    });

    it('should handle errors without statusCode', () => {
      // Arrange
      const error: IError = new Error('Error without status');
      // Explicitly ensure no statusCode
      delete error.statusCode;

      // Act
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(logger.error).toHaveBeenCalledWith('Error:', {
        statusCode: 500,
        message: 'Error without status',
        stack: expect.any(String),
        isOperational: undefined,
      });
    });

    it('should handle errors without status property', () => {
      // Arrange
      const error: IError = new Error('Error without status string');
      error.statusCode = 401;
      // Explicitly ensure no status
      delete error.status;

      // Act
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Internal server error',
      });
    });

    it('should handle null or undefined error messages', () => {
      // Arrange
      const error: IError = new Error();
      error.message = '';
      error.statusCode = 400;

      // Act
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(logger.error).toHaveBeenCalledWith('Error:', {
        statusCode: 400,
        message: '',
        stack: expect.any(String),
        isOperational: undefined,
      });
    });

    it('should handle errors with isOperational flag in development', () => {
      // Arrange
      (env as any).NODE_ENV = 'development';
      const error: IError = new Error('Operational error in dev');
      error.statusCode = 400;
      error.isOperational = true;

      // Act
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        error: error,
        message: 'Operational error in dev',
        stack: expect.any(String),
      });
    });

    it('should use translated error message for non-operational errors', () => {
      // Arrange
      (env as any).NODE_ENV = 'production';
      (t as jest.Mock).mockReturnValue('Erreur serveur interne');

      const error: IError = new Error('Technical error details');
      error.statusCode = 500;
      error.isOperational = false;

      // Act
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(t).toHaveBeenCalledWith('error.internalServer');
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Erreur serveur interne',
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
        // Arrange
        jest.clearAllMocks();
        const error: IError = new Error(`Error ${statusCode}`);
        error.statusCode = statusCode;
        error.status = status;

        // Act
        errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(statusCode);
        expect(logger.error).toHaveBeenCalledWith('Error:', {
          statusCode,
          message: `Error ${statusCode}`,
          stack: expect.any(String),
          isOperational: undefined,
        });
      });
    });

    it('should handle errors with stack trace', () => {
      // Arrange
      const error: IError = new Error('Error with stack');
      const originalStack = error.stack;

      // Act
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(logger.error).toHaveBeenCalledWith('Error:', {
        statusCode: 500,
        message: 'Error with stack',
        stack: originalStack,
        isOperational: undefined,
      });
    });
  });

  afterAll(() => {
    console.log('✅ Error Handler Middleware test suite completed');
  });
});
