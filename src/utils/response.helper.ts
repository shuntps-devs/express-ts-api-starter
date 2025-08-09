import { Response } from 'express';

import { t } from '../i18n';
import {
  IApiErrorResponse,
  IApiSuccessResponse,
  IPaginatedResponse,
  IValidationError,
} from '../interfaces';

// Re-export types for compatibility
export type ISuccessResponse<T = unknown> = IApiSuccessResponse<T>;
export type IErrorResponse = IApiErrorResponse;

export class ResponseHelper {
  // Success responses
  static success<T>(
    data: T,
    message?: string,
    requestId?: string
  ): ISuccessResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      requestId,
    };
  }

  static created<T>(
    data: T,
    message?: string,
    requestId?: string
  ): ISuccessResponse<T> {
    return this.success(
      data,
      message ?? t('success.resourceCreated'),
      requestId
    );
  }

  static updated<T>(
    data: T,
    message?: string,
    requestId?: string
  ): ISuccessResponse<T> {
    return this.success(
      data,
      message ?? t('success.resourceUpdated'),
      requestId
    );
  }

  static deleted(message?: string, requestId?: string): ISuccessResponse<null> {
    return this.success(
      null,
      message ?? t('success.resourceDeleted'),
      requestId
    );
  }

  // Error responses
  static error(
    message: string,
    code: string | number = 'INTERNAL_SERVER_ERROR',
    details?: unknown,
    requestId?: string,
    includeStack: boolean = false
  ): IErrorResponse {
    const error: IErrorResponse = {
      success: false,
      error: {
        message,
        code,
        details,
      },
      timestamp: new Date().toISOString(),
      requestId,
    };

    if (includeStack && details instanceof Error) {
      error.error.stack = details.stack;
    }

    return error;
  }

  static badRequest(
    message?: string,
    details?: unknown,
    requestId?: string
  ): IErrorResponse {
    return this.error(
      message ?? t('errors.badRequest'),
      'BAD_REQUEST',
      details,
      requestId
    );
  }

  static unauthorized(message?: string, requestId?: string): IErrorResponse {
    return this.error(
      message ?? t('errors.unauthorized'),
      'UNAUTHORIZED',
      undefined,
      requestId
    );
  }

  static forbidden(message?: string, requestId?: string): IErrorResponse {
    return this.error(
      message ?? t('errors.forbidden'),
      'FORBIDDEN',
      undefined,
      requestId
    );
  }

  static notFound(message?: string, requestId?: string): IErrorResponse {
    return this.error(
      message ?? t('errors.resourceNotFound'),
      'NOT_FOUND',
      undefined,
      requestId
    );
  }

  static conflict(
    message?: string,
    details?: unknown,
    requestId?: string
  ): IErrorResponse {
    return this.error(
      message ?? t('errors.conflict'),
      'CONFLICT',
      details,
      requestId
    );
  }

  static validationError(
    errors: IValidationError[],
    message?: string,
    requestId?: string
  ): IErrorResponse {
    return this.error(
      message ?? t('errors.validationFailed'),
      'VALIDATION_ERROR',
      { errors },
      requestId
    );
  }

  static tooManyRequests(
    message?: string,
    retryAfter?: number,
    requestId?: string
  ): IErrorResponse {
    return this.error(
      message ?? t('errors.tooManyRequests'),
      'TOO_MANY_REQUESTS',
      { retryAfter },
      requestId
    );
  }

  static internalServerError(
    message?: string,
    requestId?: string,
    includeStack: boolean = false
  ): IErrorResponse {
    return this.error(
      message ?? t('errors.internalServerError'),
      'INTERNAL_SERVER_ERROR',
      undefined,
      requestId,
      includeStack
    );
  }

  // Pagination response
  static paginate<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string,
    requestId?: string
  ): IPaginatedResponse<T> {
    const pages = Math.ceil(total / limit);

    return {
      success: true,
      message,
      data,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
  }

  // Express response helpers
  static sendSuccess<T>(
    res: Response,
    data: T,
    statusCode: number = 200,
    message?: string,
    requestId?: string
  ): void {
    res.status(statusCode).json(this.success(data, message, requestId));
  }

  static sendCreated<T>(
    res: Response,
    data: T,
    message?: string,
    requestId?: string
  ): void {
    res.status(201).json(this.created(data, message, requestId));
  }

  static sendError(
    res: Response,
    message: string,
    statusCode: number = 500,
    code?: string | number,
    details?: unknown,
    requestId?: string
  ): void {
    res
      .status(statusCode)
      .json(this.error(message, code ?? statusCode, details, requestId));
  }

  static sendBadRequest(
    res: Response,
    message?: string,
    details?: unknown,
    requestId?: string
  ): void {
    res.status(400).json(this.badRequest(message, details, requestId));
  }

  static sendUnauthorized(
    res: Response,
    message?: string,
    requestId?: string
  ): void {
    res.status(401).json(this.unauthorized(message, requestId));
  }

  static sendForbidden(
    res: Response,
    message?: string,
    requestId?: string
  ): void {
    res.status(403).json(this.forbidden(message, requestId));
  }

  static sendNotFound(
    res: Response,
    message?: string,
    requestId?: string
  ): void {
    res.status(404).json(this.notFound(message, requestId));
  }

  static sendConflict(
    res: Response,
    message?: string,
    details?: unknown,
    requestId?: string
  ): void {
    res.status(409).json(this.conflict(message, details, requestId));
  }

  static sendValidationError(
    res: Response,
    errors?: IValidationError[],
    message?: string,
    requestId?: string
  ): void {
    res
      .status(422)
      .json(this.validationError(errors ?? [], message, requestId));
  }

  static sendTooManyRequests(
    res: Response,
    message?: string,
    retryAfter?: number,
    requestId?: string
  ): void {
    const response = this.tooManyRequests(message, retryAfter, requestId);
    if (retryAfter) {
      res.set('Retry-After', retryAfter.toString());
    }
    res.status(429).json(response);
  }

  static sendInternalServerError(
    res: Response,
    message?: string,
    requestId?: string,
    includeStack: boolean = false
  ): void {
    res
      .status(500)
      .json(this.internalServerError(message, requestId, includeStack));
  }

  static sendPaginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string,
    requestId?: string
  ): void {
    res
      .status(200)
      .json(this.paginate(data, page, limit, total, message, requestId));
  }

  // Utility methods
  static extractRequestId(req: {
    id?: string;
    headers?: Record<string, string | string[] | undefined>;
  }): string | undefined {
    return (
      req.id ??
      (req.headers?.['x-request-id'] as string) ??
      (req.headers?.['x-correlation-id'] as string)
    );
  }

  static isSuccessResponse(response: unknown): response is ISuccessResponse {
    return (
      typeof response === 'object' &&
      response !== null &&
      'success' in response &&
      response.success === true
    );
  }

  static isErrorResponse(response: unknown): response is IErrorResponse {
    return (
      typeof response === 'object' &&
      response !== null &&
      'success' in response &&
      response.success === false
    );
  }
}
