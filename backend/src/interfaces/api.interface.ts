/**
 * API Response interfaces
 * Standardized response structures for consistent API responses
 */

/**
 * Base API response interface with generic data type
 * @template T - Type of the response data
 */
export interface IApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: IApiError;
  timestamp: string;
  requestId?: string;
}

/**
 * Success API response interface with required data
 * @template T - Type of the response data
 */
export interface IApiSuccessResponse<T = unknown> extends IApiResponse<T> {
  success: true;
  data: T;
}

/**
 * Error API response interface with required error details
 */
export interface IApiErrorResponse extends IApiResponse {
  success: false;
  error: IApiError;
}

/**
 * API error details interface
 * Contains error message, code, and optional additional details
 */
export interface IApiError {
  message: string;
  code: string | number;
  details?: unknown;
  stack?: string;
}

/**
 * Pagination parameters for API requests
 * Contains common pagination and sorting options
 */
export interface IPaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

/**
 * Pagination metadata for API responses
 * Contains pagination state and navigation information
 */
export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Paginated API response interface
 * @template T - Type of the array data items
 */
export interface IPaginatedResponse<T = unknown> {
  success: true;
  message?: string;
  data: T[];
  pagination: IPaginationMeta;
  timestamp: string;
  requestId?: string;
}

/**
 * Individual validation error interface
 * Contains field-specific validation error details
 */
export interface IValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Validation error API response interface
 * Specialized error response for validation failures
 */
export interface IValidationErrorResponse extends IApiErrorResponse {
  error: IApiError & {
    code: 'VALIDATION_ERROR';
    details: {
      errors: IValidationError[];
    };
  };
}

/**
 * Query interfaces for API requests
 * Base and specialized query parameter interfaces
 */

/**
 * Base query interface with common parameters
 */
export interface IBaseQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Search query interface with text search capability
 */
export interface ISearchQuery extends IBaseQuery {
  search?: string;
}

/**
 * Date range query interface for time-based filtering
 */
export interface IDateRangeQuery extends IBaseQuery {
  startDate?: string;
  endDate?: string;
}

/**
 * Filter query interface with categorical filtering options
 */
export interface IFilterQuery extends IBaseQuery {
  status?: string;
  category?: string;
  tags?: string[];
}
