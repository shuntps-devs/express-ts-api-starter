/**
 * Error Helper - UNIFIED error handling utilities
 * Centralized error creation, logging, and HTTP response management
 * Following project standards: ONE helper for all error operations
 */

import { Request, Response } from 'express';
import { Logger } from 'winston';
import { ZodError } from 'zod';

import { env, logger } from '../config';
import { t } from '../i18n';
import { IApiErrorResponse, IValidationError } from '../interfaces';


export interface IOperationalError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;
}

export type IErrorResponse = IApiErrorResponse;

/**
 * Centralized error handling utilities
 * UNIFIED error creation, logging, and HTTP response management
 * Provides ALL error functionality in one place
 */
export class ErrorHelper {
  /**
   * Create formatted error response object
   * @param message - Error message
   * @param code - Error code identifier
   * @param details - Additional error details
   * @param requestId - Optional request identifier
   * @returns Formatted error response object
   */
  private static createErrorResponse(
    message: string,
    code: string | number = 'INTERNAL_SERVER_ERROR',
    details?: unknown,
    requestId?: string
  ): IErrorResponse {
    return {
      success: false,
      error: {
        message,
        code,
        details,
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
  }

  /**
   * Send HTTP error response directly
   * @param res - Express response object
   * @param message - Error message
   * @param statusCode - HTTP status code
   * @param code - Error code identifier
   * @param details - Additional error details
   * @param requestId - Optional request identifier
   */
  public static sendError(
    res: Response,
    message: string,
    statusCode: number = 500,
    code?: string | number,
    details?: unknown,
    requestId?: string
  ): void {
    res
      .status(statusCode)
      .json(
        this.createErrorResponse(
          message,
          code ?? statusCode,
          details,
          requestId
        )
      );
  }

  /**
   * Send validation error response
   * @param res - Express response object
   * @param errors - Array of validation errors
   * @param message - Error message
   * @param requestId - Optional request identifier
   */
  public static sendValidationError(
    res: Response,
    errors: IValidationError[],
    message?: string,
    requestId?: string
  ): void {
    res
      .status(422)
      .json(
        this.createErrorResponse(
          message ?? t('errors.validationFailed'),
          'VALIDATION_ERROR',
          { errors },
          requestId
        )
      );
  }

  /**
   * Send 400 Bad Request error
   * @param res - Express response object
   * @param message - Error message
   * @param details - Additional error details
   * @param requestId - Optional request identifier
   */
  public static sendBadRequest(
    res: Response,
    message?: string,
    details?: unknown,
    requestId?: string
  ): void {
    res
      .status(400)
      .json(
        this.createErrorResponse(
          message ?? t('errors.badRequest'),
          'BAD_REQUEST',
          details,
          requestId
        )
      );
  }

  /**
   * Send 401 Unauthorized error
   * @param res - Express response object
   * @param message - Error message
   * @param requestId - Optional request identifier
   */
  public static sendUnauthorized(
    res: Response,
    message?: string,
    requestId?: string
  ): void {
    res
      .status(401)
      .json(
        this.createErrorResponse(
          message ?? t('errors.unauthorized'),
          'UNAUTHORIZED',
          undefined,
          requestId
        )
      );
  }

  /**
   * Send 403 Forbidden error
   * @param res - Express response object
   * @param message - Error message
   * @param requestId - Optional request identifier
   */
  public static sendForbidden(
    res: Response,
    message?: string,
    requestId?: string
  ): void {
    res
      .status(403)
      .json(
        this.createErrorResponse(
          message ?? t('errors.forbidden'),
          'FORBIDDEN',
          undefined,
          requestId
        )
      );
  }

  /**
   * Send 404 Not Found error
   * @param res - Express response object
   * @param message - Error message
   * @param requestId - Optional request identifier
   */
  public static sendNotFound(
    res: Response,
    message?: string,
    requestId?: string
  ): void {
    res
      .status(404)
      .json(
        this.createErrorResponse(
          message ?? t('errors.resourceNotFound'),
          'NOT_FOUND',
          undefined,
          requestId
        )
      );
  }

  /**
   * Send 409 Conflict error
   * @param res - Express response object
   * @param message - Error message
   * @param details - Additional error details
   * @param requestId - Optional request identifier
   */
  public static sendConflict(
    res: Response,
    message?: string,
    details?: unknown,
    requestId?: string
  ): void {
    res
      .status(409)
      .json(
        this.createErrorResponse(
          message ?? t('errors.conflict'),
          'CONFLICT',
          details,
          requestId
        )
      );
  }

  /**
   * Send 429 Too Many Requests error
   * @param res - Express response object
   * @param message - Error message
   * @param retryAfter - Retry after seconds
   * @param requestId - Optional request identifier
   */
  public static sendTooManyRequests(
    res: Response,
    message?: string,
    retryAfter?: number,
    requestId?: string
  ): void {
    if (retryAfter) {
      res.set('Retry-After', retryAfter.toString());
    }
    res
      .status(429)
      .json(
        this.createErrorResponse(
          message ?? t('errors.tooManyRequests'),
          'TOO_MANY_REQUESTS',
          { retryAfter },
          requestId
        )
      );
  }

  /**
   * Send 500 Internal Server Error
   * @param res - Express response object
   * @param message - Error message
   * @param requestId - Optional request identifier
   * @param includeStack - Whether to include stack trace (development only)
   */
  public static sendInternalServerError(
    res: Response,
    message?: string,
    requestId?: string,
    includeStack: boolean = false
  ): void {
    res
      .status(500)
      .json(
        this.createErrorResponse(
          message ?? t('errors.internalServerError'),
          'INTERNAL_SERVER_ERROR',
          includeStack ? { stack: new Error().stack } : undefined,
          requestId
        )
      );
  }
  /**
   * Handle Zod validation errors with consistent formatting
   * @param error - Zod validation error
   * @param context - Context information for logging
   * @param res - Optional Express response object for HTTP responses
   * @param requestId - Optional request identifier
   * @param req - Optional Express request object for contextual logging
   * @returns Formatted validation errors or exits process if no response object
   * @throws Never throws - either responds or exits
   * @example
   * ```typescript
   * try {
   *   const result = schema.parse(data);
   * } catch (error) {
   *   if (error instanceof ZodError) {
   *     ErrorHelper.handleZodError(error, 'environment-validation', res, requestId, req);
   *   }
   * }
   * ```
   */
  public static handleZodError(
    error: ZodError,
    context: string,
    res?: Response,
    requestId?: string,
    req?: Request
  ): IValidationError[] {
    const validationErrors: IValidationError[] = error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
      value: 'input' in issue ? issue.input : undefined,
    }));

    const errorContext = {
      context,
      validationErrors,
      requestId,
    };


    const contextLogger = req?.logger ?? logger;

    if (res) {
      contextLogger.error('Validation error occurred', errorContext);

      ErrorHelper.sendValidationError(
        res,
        validationErrors,
        t('errors.validationFailed'),
        requestId
      );
      return validationErrors;
    }

    if (env.IS_TEST) {
      contextLogger.warn('Validation failed in test environment', errorContext);
      return validationErrors;
    }

    contextLogger.error(
      'Critical validation error - exiting process',
      errorContext
    );
    process.exit(1);
  }

  /**
   * Handle environment validation errors
   * Specialized handler for configuration validation failures
   * @param error - Zod validation error from environment parsing
   * @param fallbackConfig - Optional fallback configuration for tests
   * @returns Fallback configuration or exits process
   * @throws Never throws - either returns fallback or exits
   * @example
   * ```typescript
   * try {
   *   const env = envSchema.parse(process.env);
   * } catch (error) {
   *   if (error instanceof ZodError) {
   *     return ErrorHelper.handleEnvValidationError(error, createTestDefaults);
   *   }
   * }
   * ```
   */
  public static handleEnvValidationError<T>(
    error: ZodError,
    fallbackConfig?: () => T
  ): T {
    const validationErrors = ErrorHelper.handleZodError(
      error,
      'environment-validation'
    );

    if (env.IS_TEST && fallbackConfig) {
      logger.warn('Using test defaults due to validation failure', {
        validationErrors,
      });
      return fallbackConfig();
    }

    logger.error('Environment validation failed - application cannot start', {
      validationErrors,
      environment: env.NODE_ENV,
    });

    process.exit(1);
  }

  /**
   * Create operational error with consistent formatting
   * @param message - Error message
   * @param statusCode - HTTP status code
   * @param code - Error code identifier
   * @param isOperational - Whether error is operational (safe to expose)
   * @returns Error object with additional properties
   * @example
   * ```typescript
   * throw ErrorHelper.createOperationalError(
   *   'User not found',
   *   404,
   *   'USER_NOT_FOUND',
   *   true
   * );
   * ```
   */
  public static createOperationalError(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_SERVER_ERROR',
    isOperational: boolean = true
  ): Error & { statusCode: number; code: string; isOperational: boolean } {
    const error = new Error(message) as Error & {
      statusCode: number;
      code: string;
      isOperational: boolean;
    };

    error.statusCode = statusCode;
    error.code = code;
    error.isOperational = isOperational;

    return error;
  }

  /**
   * Handle database connection errors
   * @param error - Database connection error
   * @param context - Context information
   * @example
   * ```typescript
   * try {
   *   await mongoose.connect(uri);
   * } catch (error) {
   *   ErrorHelper.handleDatabaseError(error, 'initial-connection');
   * }
   * ```
   */
  public static handleDatabaseError(error: Error, context: string): void {
    logger.error('Database error occurred', {
      context,
      message: error.message,
      stack: error.stack,
    });

    if (env.IS_PRODUCTION) {
      throw ErrorHelper.createOperationalError(
        t('database.connectionFailed'),
        503,
        'DATABASE_UNAVAILABLE'
      );
    }

    throw error;
  }

  /**
   * Handle authentication errors
   * @param message - Error message
   * @param requestId - Request identifier
   * @returns Operational authentication error
   * @example
   * ```typescript
   * if (!token) {
   *   throw ErrorHelper.createAuthError('Token required', requestId);
   * }
   * ```
   */
  public static createAuthError(
    message?: string,
    _requestId?: string
  ): Error & { statusCode: number; code: string; isOperational: boolean } {
    return ErrorHelper.createOperationalError(
      message ?? t('auth.authenticationRequired'),
      401,
      'AUTHENTICATION_REQUIRED'
    );
  }

  /**
   * Handle authorization errors
   * @param message - Error message
   * @param requestId - Request identifier
   * @returns Operational authorization error
   * @example
   * ```typescript
   * if (!userHasPermission) {
   *   throw ErrorHelper.createAuthorizationError('Insufficient permissions', requestId);
   * }
   * ```
   */
  public static createAuthorizationError(
    message?: string,
    _requestId?: string
  ): Error & { statusCode: number; code: string; isOperational: boolean } {
    return ErrorHelper.createOperationalError(
      message ?? t('auth.insufficientPermissions'),
      403,
      'INSUFFICIENT_PERMISSIONS'
    );
  }

  /**
   * Handle not found errors
   * @param resource - Resource that was not found
   * @param requestId - Request identifier
   * @returns Operational not found error
   * @example
   * ```typescript
   * if (!user) {
   *   throw ErrorHelper.createNotFoundError('User', requestId);
   * }
   * ```
   */
  public static createNotFoundError(
    resource?: string,
    _requestId?: string
  ): Error & { statusCode: number; code: string; isOperational: boolean } {
    const message = resource
      ? t('errors.resourceNotFound', { resource })
      : t('errors.resourceNotFound');

    return ErrorHelper.createOperationalError(
      message,
      404,
      'RESOURCE_NOT_FOUND'
    );
  }

  /**
   * Check if error is operational (safe to expose to clients)
   * @param error - Error to check
   * @returns True if error is operational
   * @example
   * ```typescript
   * if (ErrorHelper.isOperational(error)) {
   *   ResponseHelper.sendError(res, error.message, error.statusCode);
   * }
   * ```
   */
  public static isOperational(error: unknown): boolean {
    if (error && typeof error === 'object' && 'isOperational' in error) {
      return Boolean((error as { isOperational?: boolean }).isOperational);
    }
    return false;
  }

  /**
   * Extract error message safely
   * @param error - Error object or unknown value
   * @returns Error message or generic message
   * @example
   * ```typescript
   * const message = ErrorHelper.extractMessage(error);
   * logger.error(message);
   * ```
   */
  public static extractMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return t('error.internalServer');
  }

  /**
   * Log error with consistent format and context
   * @param error - Error to log
   * @param context - Additional context information
   * @param requestId - Request identifier
   * @param req - Optional Express request object for contextual logging
   * @example
   * ```typescript
   *
   * ErrorHelper.logError(error, { operation: 'user-creation' }, requestId, req);
   *
   *
   * ErrorHelper.logError(error, { operation: 'app-initialization' });
   * ```
   */
  public static logError(
    error: unknown,
    context: Record<string, unknown> = {},
    requestId?: string,
    req?: Request
  ): void {
    const errorInfo = {
      message: ErrorHelper.extractMessage(error),
      stack: error instanceof Error ? error.stack : undefined,
      isOperational: ErrorHelper.isOperational(error),
      requestId,
      ...context,
    };


    const contextLogger = req?.logger ?? logger;
    contextLogger.error('Error occurred', errorInfo);
  }

  /**
   * Extract contextual logger from request or return global logger
   * @param req - Optional Express request object
   * @returns Winston logger instance (contextual if available, global otherwise)
   * @example
   * ```typescript
   * const contextLogger = ErrorHelper.getContextLogger(req);
   * contextLogger.info('Operation started');
   * ```
   */
  public static getContextLogger(req?: Request): Logger {
    return req?.logger ?? logger;
  }

  /**
   * Extract request ID from Express request
   * @param req - Express request-like object
   * @returns Request ID if present
   */
  public static extractRequestId(req: {
    id?: string;
    headers?: Record<string, string | string[] | undefined>;
  }): string | undefined {
    return (
      req.id ??
      (req.headers?.['x-request-id'] as string) ??
      (req.headers?.['x-correlation-id'] as string)
    );
  }
}
