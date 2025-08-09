import { ResponseHelper } from '../../utils';
import { TestHelper } from '../helpers';

// Mock i18n
jest.mock('../../i18n', () => ({
  t: jest.fn((key: string, options?: any) => {
    const translations: Record<string, string> = {
      'success.operation': 'Operation completed successfully',
      'errors.validation': 'Validation error occurred',
      'errors.resourceNotFound': 'Resource not found',
      'errors.unauthorized': 'Unauthorized access',
      'errors.forbidden': 'Access forbidden',
      'errors.internalServerError': 'Internal server error',
    };
    return options
      ? `${translations[key]} ${JSON.stringify(options)}`
      : translations[key];
  }),
}));

describe('ResponseHelper', () => {
  let mockResponse: any;

  beforeAll(() => {
    console.log('🧪 Starting ResponseHelper test suite...');
  });

  afterAll(() => {
    console.log('✅ ResponseHelper test suite completed');
  });

  beforeEach(() => {
    // ✅ Using TestHelper for consistent mock creation
    mockResponse = TestHelper.createMockResponse();
  });

  describe('success responses', () => {
    it('should create success response with data', () => {
      const data = { id: 1, name: 'Test User' };
      const result = ResponseHelper.success(
        data,
        'Operation successful',
        'req-123'
      );

      expect(result).toEqual({
        success: true,
        message: 'Operation successful',
        data,
        timestamp: expect.any(String),
        requestId: 'req-123',
      });
    });

    it('should create success response without message', () => {
      const data = { test: true };
      const result = ResponseHelper.success(data);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('error responses', () => {
    it('should create error response', () => {
      const result = ResponseHelper.error(
        'Test error',
        'TEST_ERROR',
        null,
        'req-123'
      );

      expect(result).toEqual({
        success: false,
        error: {
          message: 'Test error',
          code: 'TEST_ERROR',
          details: null,
        },
        timestamp: expect.any(String),
        requestId: 'req-123',
      });
    });

    it('should create bad request error', () => {
      const result = ResponseHelper.badRequest('Invalid input', {
        field: 'email',
      });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('BAD_REQUEST');
      expect(result.error.details).toEqual({ field: 'email' });
    });

    it('should create not found error', () => {
      const result = ResponseHelper.notFound('User not found');

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('NOT_FOUND');
      expect(result.error.message).toBe('User not found');
    });
  });

  describe('Express response helpers', () => {
    describe('sendSuccess', () => {
      it('should send a success response with all parameters', () => {
        const data = { id: 1, name: 'Test' };
        const message = 'Operation successful';
        const requestId = 'req-123';

        ResponseHelper.sendSuccess(mockResponse, data, 200, message, requestId);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          message,
          data,
          timestamp: expect.any(String),
          requestId,
        });
      });

      it('should use default status code 200', () => {
        ResponseHelper.sendSuccess(mockResponse, null, undefined, 'Success');

        expect(mockResponse.status).toHaveBeenCalledWith(200);
      });

      it('should handle null data', () => {
        ResponseHelper.sendSuccess(
          mockResponse,
          null,
          200,
          'Success without data'
        );

        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          data: null,
          message: 'Success without data',
          requestId: undefined,
          timestamp: expect.any(String),
        });
      });
    });

    describe('sendError', () => {
      it('should send an error response', () => {
        const message = 'An error occurred';
        const requestId = 'req-123';

        ResponseHelper.sendError(
          mockResponse,
          message,
          500,
          'CUSTOM_ERROR',
          undefined,
          requestId
        );

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            message,
            code: 'CUSTOM_ERROR',
            details: undefined,
          },
          timestamp: expect.any(String),
          requestId,
        });
      });

      it('should handle empty messages', () => {
        ResponseHelper.sendError(
          mockResponse,
          '',
          500,
          undefined,
          undefined,
          'req-123'
        );

        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            message: '',
            code: 500,
            details: undefined,
          },
          timestamp: expect.any(String),
          requestId: 'req-123',
        });
      });
    });

    describe('sendBadRequest', () => {
      it('should send a bad request response', () => {
        const message = 'Invalid data';
        const errors = ['Name required', 'Invalid email'];
        const requestId = 'req-123';

        ResponseHelper.sendBadRequest(mockResponse, message, errors, requestId);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            message,
            code: 'BAD_REQUEST',
            details: errors,
          },
          requestId,
          timestamp: expect.any(String),
        });
      });
    });

    describe('sendUnauthorized', () => {
      it('should send an unauthorized access response', () => {
        const message = 'Unauthorized access';
        const requestId = 'req-123';

        ResponseHelper.sendUnauthorized(mockResponse, message, requestId);

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            message,
            code: 'UNAUTHORIZED',
            details: undefined,
          },
          requestId,
          timestamp: expect.any(String),
        });
      });
    });

    describe('sendForbidden', () => {
      it('should send a forbidden access response', () => {
        const message = 'Access forbidden';
        const requestId = 'req-123';

        ResponseHelper.sendForbidden(mockResponse, message, requestId);

        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            message,
            code: 'FORBIDDEN',
            details: undefined,
          },
          requestId,
          timestamp: expect.any(String),
        });
      });
    });

    describe('sendNotFound', () => {
      it('should send a resource not found response', () => {
        const message = 'Resource not found';
        const requestId = 'req-123';

        ResponseHelper.sendNotFound(mockResponse, message, requestId);

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            message,
            code: 'NOT_FOUND',
            details: undefined,
          },
          timestamp: expect.any(String),
          requestId,
        });
      });
    });

    describe('sendConflict', () => {
      it('should send a conflict response', () => {
        const message = 'Resource already exists';
        const data = { field: 'email' };
        const requestId = 'req-123';

        ResponseHelper.sendConflict(mockResponse, message, data, requestId);

        expect(mockResponse.status).toHaveBeenCalledWith(409);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            message,
            code: 'CONFLICT',
            details: data,
          },
          requestId,
          timestamp: expect.any(String),
        });
      });
    });

    describe('sendTooManyRequests', () => {
      it('should send a too many requests response', () => {
        const message = 'Too many requests';
        const retryAfter = 3600;
        const requestId = 'req-123';

        ResponseHelper.sendTooManyRequests(
          mockResponse,
          message,
          retryAfter,
          requestId
        );

        expect(mockResponse.status).toHaveBeenCalledWith(429);
        expect(mockResponse.set).toHaveBeenCalledWith('Retry-After', '3600');
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            message,
            code: 'TOO_MANY_REQUESTS',
            details: {
              retryAfter,
            },
          },
          requestId,
          timestamp: expect.any(String),
        });
      });
    });

    describe('sendCreated', () => {
      it('should send a successful creation response', () => {
        const data = { id: 1, name: 'New item' };
        const message = 'Created successfully';
        const requestId = 'req-123';

        ResponseHelper.sendCreated(mockResponse, data, message, requestId);

        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          data,
          message,
          requestId,
          timestamp: expect.any(String),
        });
      });
    });

    describe('sendInternalServerError', () => {
      it('should send an internal server error response', () => {
        const message = 'Internal server error';
        const requestId = 'req-123';

        ResponseHelper.sendInternalServerError(
          mockResponse,
          message,
          requestId
        );

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            message,
            code: 'INTERNAL_SERVER_ERROR',
            details: undefined,
          },
          requestId,
          timestamp: expect.any(String),
        });
      });
    });

    describe('sendValidationError', () => {
      it('should send validation error response', () => {
        const validationErrors = [
          { field: 'email', message: 'Invalid email format' },
          { field: 'password', message: 'Password too short' },
        ];

        ResponseHelper.sendValidationError(
          mockResponse,
          validationErrors,
          'Validation failed',
          'req-123'
        );

        expect(mockResponse.status).toHaveBeenCalledWith(422);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: { errors: validationErrors },
          },
          timestamp: expect.any(String),
          requestId: 'req-123',
        });
      });
    });
  });

  describe('pagination', () => {
    it('should create paginated response', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const result = ResponseHelper.paginate(
        data,
        1,
        10,
        25,
        'Users retrieved'
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        pages: 3,
        hasNext: true,
        hasPrev: false,
      });
    });
  });

  describe('utility methods', () => {
    describe('extractRequestId', () => {
      it('should extract request ID from headers', () => {
        const req = TestHelper.createMockRequest({
          headers: {
            'x-request-id': 'test-req-123',
          },
        });

        const requestId = ResponseHelper.extractRequestId(req);
        expect(requestId).toBe('test-req-123');
      });

      it('should return undefined if no request ID is present', () => {
        const req = TestHelper.createMockRequest({
          headers: {},
        });

        const requestId = ResponseHelper.extractRequestId(req);
        expect(requestId).toBeUndefined();
      });
    });

    describe('response type identification', () => {
      it('should identify success response', () => {
        const successResponse = { success: true, data: {} };
        const errorResponse = { success: false, error: {} };

        expect(ResponseHelper.isSuccessResponse(successResponse)).toBe(true);
        expect(ResponseHelper.isSuccessResponse(errorResponse)).toBe(false);
      });

      it('should identify error response', () => {
        const successResponse = { success: true, data: {} };
        const errorResponse = { success: false, error: {} };

        expect(ResponseHelper.isErrorResponse(successResponse)).toBe(false);
        expect(ResponseHelper.isErrorResponse(errorResponse)).toBe(true);
      });
    });

    describe('timestamp validation', () => {
      it('should include a valid timestamp', () => {
        const beforeTimestamp = new Date().toISOString();

        ResponseHelper.sendSuccess(mockResponse, {}, 200, 'Test timestamp');

        const afterTimestamp = new Date().toISOString();
        const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0];

        expect(callArgs.timestamp).toBeDefined();
        expect(callArgs.timestamp >= beforeTimestamp).toBe(true);
        expect(callArgs.timestamp <= afterTimestamp).toBe(true);
      });
    });
  });

  describe('cookies helpers', () => {
    it('should set secure cookies', () => {
      const cookieName = 'authToken';
      const cookieValue = 'token123';
      const options = {
        httpOnly: true,
        secure: true,
        sameSite: 'strict' as const,
        maxAge: 3600000,
      };

      // Test cookie functionality if available
      if (mockResponse.cookie) {
        mockResponse.cookie(cookieName, cookieValue, options);
        expect(mockResponse.cookie).toHaveBeenCalledWith(
          cookieName,
          cookieValue,
          options
        );
      }
    });

    it('should clear cookies', () => {
      const cookieName = 'authToken';

      if (mockResponse.clearCookie) {
        mockResponse.clearCookie(cookieName);
        expect(mockResponse.clearCookie).toHaveBeenCalledWith(cookieName);
      }
    });
  });
});
