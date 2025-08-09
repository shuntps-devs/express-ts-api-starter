import { ResponseHelper } from '../../utils/response.helper';
import { TestHelper } from '../helpers/test.helper';

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

  beforeEach(() => {
    // ✅ Using TestHelper instead of manual mock creation
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
    it('should send success response', () => {
      const data = { id: 1, name: 'Test' };
      ResponseHelper.sendSuccess(mockResponse, data, 200, 'Success', 'req-123');

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data,
        timestamp: expect.any(String),
        requestId: 'req-123',
      });
    });

    it('should send error response', () => {
      ResponseHelper.sendError(mockResponse, 'Test error', 400, 'BAD_REQUEST');

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Test error',
          code: 'BAD_REQUEST',
          details: undefined,
        },
        timestamp: expect.any(String),
        requestId: undefined,
      });
    });

    it('should send not found response', () => {
      ResponseHelper.sendNotFound(
        mockResponse,
        'Resource not found',
        'req-123'
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Resource not found',
          code: 'NOT_FOUND',
          details: undefined,
        },
        timestamp: expect.any(String),
        requestId: 'req-123',
      });
    });

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
    it('should extract request ID from headers', () => {
      const req = {
        headers: {
          'x-request-id': 'test-req-123',
        },
      };

      const requestId = ResponseHelper.extractRequestId(req);
      expect(requestId).toBe('test-req-123');
    });

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
});
