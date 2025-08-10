import { ResponseHelper } from '../../utils';
import { TestHelper } from '../helpers';

// Mock i18n
jest.mock('../../i18n', () => ({
  t: jest.fn((key: string, options?: any) => {
    const translations: Record<string, string> = {
      'success.operation': 'Operation completed successfully',
      'success.resourceCreated': 'Resource created successfully',
      'success.resourceUpdated': 'Resource updated successfully',
      'success.resourceDeleted': 'Resource deleted successfully',
    };
    return options
      ? `${translations[key]} ${JSON.stringify(options)}`
      : translations[key];
  }),
}));

describe('ResponseHelper - Success Operations', () => {
  console.log('🧪 Starting ResponseHelper Success Operations test suite...');

  describe('success response creation', () => {
    it('should create basic success response', () => {
      const data = { id: 1, name: 'Test User' };
      const message = 'Success';
      const requestId = 'req-123';

      const result = ResponseHelper.success(data, message, requestId);

      expect(result).toEqual({
        success: true,
        message,
        data,
        timestamp: expect.any(String),
        requestId,
      });
    });

    it('should create success response without message and requestId', () => {
      const data = { test: 'data' };

      const result = ResponseHelper.success(data);

      expect(result).toEqual({
        success: true,
        message: undefined,
        data,
        timestamp: expect.any(String),
        requestId: undefined,
      });
    });

    it('should create created response', () => {
      const data = { id: 1, name: 'New Resource' };
      const requestId = 'req-123';

      const result = ResponseHelper.created(data, undefined, requestId);

      expect(result).toEqual({
        success: true,
        message: 'Resource created successfully',
        data,
        timestamp: expect.any(String),
        requestId,
      });
    });

    it('should create updated response', () => {
      const data = { id: 1, name: 'Updated Resource' };

      const result = ResponseHelper.updated(data);

      expect(result).toEqual({
        success: true,
        message: 'Resource updated successfully',
        data,
        timestamp: expect.any(String),
        requestId: undefined,
      });
    });

    it('should create deleted response', () => {
      const requestId = 'req-123';

      const result = ResponseHelper.deleted(undefined, requestId);

      expect(result).toEqual({
        success: true,
        message: 'Resource deleted successfully',
        data: null,
        timestamp: expect.any(String),
        requestId,
      });
    });

    it('should create paginated response', () => {
      const data = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];
      const page = 1;
      const limit = 10;
      const total = 25;

      const result = ResponseHelper.paginate(data, page, limit, total);

      expect(result).toEqual({
        success: true,
        message: undefined,
        data,
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          pages: 3,
          hasNext: true,
          hasPrev: false,
        },
        timestamp: expect.any(String),
        requestId: undefined,
      });
    });
  });

  describe('HTTP response sending', () => {
    let mockResponse: any;

    beforeEach(() => {
      const context = TestHelper.createMockContext();
      mockResponse = context.res;
    });

    it('should send success response', () => {
      const data = { id: 1, name: 'Test' };
      const statusCode = 200;
      const message = 'Success';
      const requestId = 'req-123';

      ResponseHelper.sendSuccess(
        mockResponse,
        data,
        statusCode,
        message,
        requestId
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message,
        data,
        timestamp: expect.any(String),
        requestId,
      });
    });

    it('should send created response', () => {
      const data = { id: 1, name: 'New Item' };

      ResponseHelper.sendCreated(mockResponse, data);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Resource created successfully',
        data,
        timestamp: expect.any(String),
        requestId: undefined,
      });
    });

    it('should send paginated response', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const page = 1;
      const limit = 10;
      const total = 15;

      ResponseHelper.sendPaginated(mockResponse, data, page, limit, total);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: undefined,
        data,
        pagination: {
          page: 1,
          limit: 10,
          total: 15,
          pages: 2,
          hasNext: true,
          hasPrev: false,
        },
        timestamp: expect.any(String),
        requestId: undefined,
      });
    });
  });

  describe('utility methods', () => {
    it('should extract request ID from request', () => {
      const mockReq = {
        id: 'test-id',
        headers: {
          'x-request-id': 'header-id',
        },
      };

      const result = ResponseHelper.extractRequestId(mockReq);

      expect(result).toBe('test-id');
    });

    it('should extract request ID from headers when no id property', () => {
      const mockReq = {
        headers: {
          'x-request-id': 'header-id',
        },
      };

      const result = ResponseHelper.extractRequestId(mockReq);

      expect(result).toBe('header-id');
    });

    it('should identify success response', () => {
      const successResponse = {
        success: true,
        data: {},
        timestamp: new Date().toISOString(),
      };

      const result = ResponseHelper.isSuccessResponse(successResponse);

      expect(result).toBe(true);
    });

    it('should identify error response', () => {
      const errorResponse = {
        success: false,
        error: { message: 'Error' },
        timestamp: new Date().toISOString(),
      };

      const result = ResponseHelper.isErrorResponse(errorResponse);

      expect(result).toBe(true);
    });

    it('should not identify success as error response', () => {
      const successResponse = {
        success: true,
        data: {},
        timestamp: new Date().toISOString(),
      };

      const result = ResponseHelper.isErrorResponse(successResponse);

      expect(result).toBe(false);
    });
  });
});
