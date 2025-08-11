import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import { logger } from '../../config';
import { t } from '../../i18n';
import { validateRequest } from '../../middleware';
import { ErrorHelper } from '../../utils';
import { TestHelper } from '../helpers';

jest.mock('../../config', () => ({
  logger: {
    warn: jest.fn(),
  },
}));

jest.mock('../../i18n', () => ({
  t: jest.fn(),
}));

jest.mock('../../utils', () => ({
  ErrorHelper: {
    extractRequestId: jest.fn(),
    sendValidationError: jest.fn(),
  },
}));

describe('Validate Request Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    const context = TestHelper.createMockContext();
    mockReq = context.req;
    mockRes = context.res;
    mockNext = context.next;

    mockReq.params = {};
    mockReq.query = {};
    mockReq.body = {};

    jest.clearAllMocks();

    (t as jest.Mock).mockReturnValue('Validation failed');
    (ErrorHelper.extractRequestId as jest.Mock).mockReturnValue('req-123');
  });

  describe('validateRequest middleware', () => {
    it('should pass validation with valid data for all schemas', async () => {
      const schema = {
        params: z.object({
          id: z.string().uuid(),
        }),
        query: z.object({
          page: z.string(),
          limit: z.string().optional(),
        }),
        body: z.object({
          name: z.string().min(2),
          email: z.email(),
        }),
      };

      mockReq.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
      mockReq.query = { page: '1', limit: '10' };
      mockReq.body = { name: 'John Doe', email: 'john@example.com' };

      const middleware = validateRequest(schema as any);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(ErrorHelper.sendValidationError).not.toHaveBeenCalled();
    });

    it('should validate only body when only body schema is provided', async () => {
      const schema = {
        body: z.object({
          username: z.string().min(3),
          password: z.string().min(8),
        }),
      };

      mockReq.body = { username: 'testuser', password: 'password123' };

      const middleware = validateRequest(schema);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(ErrorHelper.sendValidationError).not.toHaveBeenCalled();
    });

    it('should validate only params when only params schema is provided', async () => {
      const schema = {
        params: z.object({
          userId: z.string().regex(/^[0-9]+$/),
        }),
      };

      mockReq.params = { userId: '12345' };

      const middleware = validateRequest(schema);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(ErrorHelper.sendValidationError).not.toHaveBeenCalled();
    });

    it('should validate only query when only query schema is provided', async () => {
      const schema = {
        query: z.object({
          search: z.string().optional(),
          sort: z.enum(['asc', 'desc']).default('asc'),
        }),
      };

      mockReq.query = { search: 'test', sort: 'desc' };

      const middleware = validateRequest(schema);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(ErrorHelper.sendValidationError).not.toHaveBeenCalled();
    });

    it('should handle params validation errors', async () => {
      const schema = {
        params: z.object({
          id: z.string().uuid('Invalid UUID format'),
        }),
      };

      mockReq.params = { id: 'invalid-uuid' };

      const middleware = validateRequest(schema);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(logger.warn).toHaveBeenCalledWith(
        'Validation error:',
        expect.any(Array)
      );
      expect(ErrorHelper.sendValidationError).toHaveBeenCalledWith(
        mockRes,
        expect.arrayContaining([
          expect.objectContaining({
            field: 'id',
            message: expect.any(String),
          }),
        ]),
        'Validation failed',
        'req-123'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle query validation errors', async () => {
      const schema = {
        query: z.object({
          page: z.string().min(1, 'Page is required'),
        }),
      };

      mockReq.query = { page: '' };

      const middleware = validateRequest(schema as any);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(logger.warn).toHaveBeenCalled();
      expect(ErrorHelper.sendValidationError).toHaveBeenCalledWith(
        mockRes,
        expect.arrayContaining([
          expect.objectContaining({
            field: 'page',
            message: expect.any(String),
          }),
        ]),
        'Validation failed',
        'req-123'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle body validation errors', async () => {
      const schema = {
        body: z.object({
          name: z.string().min(2, 'Name must be at least 2 characters'),
          email: z.string().email('Invalid email format'),
          age: z.number().min(18, 'Must be at least 18 years old'),
        }),
      };

      mockReq.body = {
        name: 'A',
        email: 'invalid-email',
        age: 16,
      };

      const middleware = validateRequest(schema);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(logger.warn).toHaveBeenCalled();
      expect(ErrorHelper.sendValidationError).toHaveBeenCalledWith(
        mockRes,
        expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: 'Name must be at least 2 characters',
          }),
          expect.objectContaining({
            field: 'email',
            message: 'Invalid email format',
          }),
          expect.objectContaining({
            field: 'age',
            message: 'Must be at least 18 years old',
          }),
        ]),
        'Validation failed',
        'req-123'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle multiple validation errors across different schemas', async () => {
      const schema = {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: z.object({
          name: z.string().min(2),
        }),
      };

      mockReq.params = { id: 'invalid-uuid' };
      mockReq.body = { name: 'A' };

      const middleware = validateRequest(schema as any);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(ErrorHelper.sendValidationError).toHaveBeenCalledWith(
        mockRes,
        expect.arrayContaining([
          expect.objectContaining({
            field: 'id',
          }),
        ]),
        'Validation failed',
        'req-123'
      );
    });

    it('should handle nested object validation errors', async () => {
      const schema = {
        body: z.object({
          user: z.object({
            profile: z.object({
              firstName: z.string().min(1, 'First name is required'),
              lastName: z.string().min(1, 'Last name is required'),
            }),
          }),
        }),
      };

      mockReq.body = {
        user: {
          profile: {
            firstName: '',
            lastName: '',
          },
        },
      };

      const middleware = validateRequest(schema);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(ErrorHelper.sendValidationError).toHaveBeenCalledWith(
        mockRes,
        expect.arrayContaining([
          expect.objectContaining({
            field: 'user.profile.firstName',
            message: 'First name is required',
          }),
          expect.objectContaining({
            field: 'user.profile.lastName',
            message: 'Last name is required',
          }),
        ]),
        'Validation failed',
        'req-123'
      );
    });

    it('should handle array validation errors', async () => {
      const schema = {
        body: z.object({
          tags: z
            .array(z.string().min(1))
            .min(1, 'At least one tag is required'),
        }),
      };

      mockReq.body = {
        tags: ['', 'valid-tag', ''],
      };

      const middleware = validateRequest(schema);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(ErrorHelper.sendValidationError).toHaveBeenCalledWith(
        mockRes,
        expect.arrayContaining([
          expect.objectContaining({
            field: 'tags.0',
          }),
          expect.objectContaining({
            field: 'tags.2',
          }),
        ]),
        'Validation failed',
        'req-123'
      );
    });

    it('should transform valid data correctly', async () => {
      const schema = {
        query: z.object({
          page: z.string(),
          active: z.string(),
        }),
        body: z.object({
          email: z.email().toLowerCase(),
        }),
      };

      mockReq.query = { page: '5', active: 'true' };
      mockReq.body = { email: 'TEST@EXAMPLE.COM' };

      const middleware = validateRequest(schema as any);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.query).toEqual({ page: '5', active: 'true' });
      expect(mockReq.body).toEqual({ email: 'test@example.com' });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle non-Zod errors by passing them to next', async () => {
      const schema = {
        body: z.object({
          name: z.string(),
        }),
      };

      jest
        .spyOn(schema.body, 'parseAsync')
        .mockRejectedValue(new Error('Unexpected error'));

      mockReq.body = { name: 'test' };

      const middleware = validateRequest(schema);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Unexpected error',
        })
      );
      expect(ErrorHelper.sendValidationError).not.toHaveBeenCalled();
    });

    it('should include error values in validation errors when available', async () => {
      const schema = {
        body: z.object({
          status: z.enum(['active', 'inactive']),
        }),
      };

      mockReq.body = { status: 'pending' };

      const middleware = validateRequest(schema);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(ErrorHelper.sendValidationError).toHaveBeenCalledWith(
        mockRes,
        expect.arrayContaining([
          expect.objectContaining({
            field: 'status',
            message: expect.any(String),
          }),
        ]),
        'Validation failed',
        'req-123'
      );
    });

    it('should use correct translation key for validation errors', async () => {
      (t as jest.Mock).mockReturnValue('La validation a échoué');

      const schema = {
        body: z.object({
          name: z.string().min(2),
        }),
      };

      mockReq.body = { name: 'A' };

      const middleware = validateRequest(schema);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(t).toHaveBeenCalledWith('errors.validationFailed');
      expect(ErrorHelper.sendValidationError).toHaveBeenCalledWith(
        mockRes,
        expect.any(Array),
        'La validation a échoué',
        'req-123'
      );
    });

    it('should extract and pass request ID correctly', async () => {
      (ErrorHelper.extractRequestId as jest.Mock).mockReturnValue(
        'custom-req-id'
      );

      const schema = {
        body: z.object({
          name: z.string().min(2),
        }),
      };

      mockReq.body = { name: 'A' };

      const middleware = validateRequest(schema);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(ErrorHelper.extractRequestId).toHaveBeenCalledWith(mockReq);
      expect(ErrorHelper.sendValidationError).toHaveBeenCalledWith(
        mockRes,
        expect.any(Array),
        'Validation failed',
        'custom-req-id'
      );
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
});
