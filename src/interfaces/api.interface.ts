/**
 * API Response interfaces
 * Standardized response structures for consistent API responses
 */

export interface IApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: IApiError;
  timestamp: string;
  requestId?: string;
}

export interface IApiSuccessResponse<T = unknown> extends IApiResponse<T> {
  success: true;
  data: T;
}

export interface IApiErrorResponse extends IApiResponse {
  success: false;
  error: IApiError;
}

export interface IApiError {
  message: string;
  code: string | number;
  details?: unknown;
  stack?: string;
}

export interface IPaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface IPaginatedResponse<T = unknown> {
  success: true;
  message?: string;
  data: T[];
  pagination: IPaginationMeta;
  timestamp: string;
  requestId?: string;
}

export interface IValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface IValidationErrorResponse extends IApiErrorResponse {
  error: IApiError & {
    code: 'VALIDATION_ERROR';
    details: {
      errors: IValidationError[];
    };
  };
}

// Query interfaces
export interface IBaseQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ISearchQuery extends IBaseQuery {
  search?: string;
}

export interface IDateRangeQuery extends IBaseQuery {
  startDate?: string;
  endDate?: string;
}

export interface IFilterQuery extends IBaseQuery {
  status?: string;
  category?: string;
  tags?: string[];
}
