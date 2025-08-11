/**
 * Response Helper - SUCCESS responses and utilities only
 * All error handling is managed by ErrorHelper
 * Following personal instructions: separate helpers by responsibility
 */

import { Response } from 'express';

import { t } from '../i18n';
import { IApiSuccessResponse, IPaginatedResponse } from '../interfaces';

export type ISuccessResponse<T = unknown> = IApiSuccessResponse<T>;

/**
 * Response Helper for SUCCESS responses and utilities only
 * For error responses, use ErrorHelper.send* methods
 */
export class ResponseHelper {
  /**
   * Create success response object
   * @param data - Response data
   * @param message - Success message
   * @param requestId - Optional request identifier
   * @returns Formatted success response
   */
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

  /**
   * Create success response for created resources
   * @param data - Created resource data
   * @param message - Success message
   * @param requestId - Optional request identifier
   * @returns Formatted success response
   */
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

  /**
   * Create success response for updated resources
   * @param data - Updated resource data
   * @param message - Success message
   * @param requestId - Optional request identifier
   * @returns Formatted success response
   */
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

  /**
   * Create success response for deleted resources
   * @param message - Success message
   * @param requestId - Optional request identifier
   * @returns Formatted success response
   */
  static deleted(message?: string, requestId?: string): ISuccessResponse<null> {
    return this.success(
      null,
      message ?? t('success.resourceDeleted'),
      requestId
    );
  }

  /**
   * Create paginated response
   * @param data - Array of data items
   * @param page - Current page number
   * @param limit - Items per page
   * @param total - Total number of items
   * @param message - Success message
   * @param requestId - Optional request identifier
   * @returns Formatted paginated response
   */
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



  /**
   * Send success response via Express
   * @param res - Express response object
   * @param data - Response data
   * @param statusCode - HTTP status code (default: 200)
   * @param message - Success message
   * @param requestId - Optional request identifier
   */
  static sendSuccess<T>(
    res: Response,
    data: T,
    statusCode: number = 200,
    message?: string,
    requestId?: string
  ): void {
    res.status(statusCode).json(this.success(data, message, requestId));
  }

  /**
   * Send created response via Express
   * @param res - Express response object
   * @param data - Created resource data
   * @param message - Success message
   * @param requestId - Optional request identifier
   */
  static sendCreated<T>(
    res: Response,
    data: T,
    message?: string,
    requestId?: string
  ): void {
    res.status(201).json(this.created(data, message, requestId));
  }

  /**
   * Send paginated response via Express
   * @param res - Express response object
   * @param data - Array of data items
   * @param page - Current page number
   * @param limit - Items per page
   * @param total - Total number of items
   * @param message - Success message
   * @param requestId - Optional request identifier
   */
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



  /**
   * Extract request ID from Express request
   * @param req - Express request-like object
   * @returns Request ID if present
   */
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

  /**
   * Check if response is a success response
   * @param response - Response object to check
   * @returns True if success response
   */
  static isSuccessResponse(response: unknown): response is ISuccessResponse {
    return (
      typeof response === 'object' &&
      response !== null &&
      'success' in response &&
      response.success === true
    );
  }

  /**
   * Check if response is an error response
   * @param response - Response object to check
   * @returns True if error response
   */
  static isErrorResponse(response: unknown): boolean {
    return (
      typeof response === 'object' &&
      response !== null &&
      'success' in response &&
      (response as { success: boolean }).success === false
    );
  }
}
