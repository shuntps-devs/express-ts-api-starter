import { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Higher-order function that wraps async route handlers to catch errors
 * Automatically passes any thrown errors to Express error handling middleware
 * @param fn - Async request handler function to wrap
 * @returns Express middleware function that handles async errors
 * @example
 * ```typescript
 * export const someController = asyncHandler(async (req, res) => {
 *   const data = await someAsyncOperation();
 *   res.json(data);
 * });
 * ```
 */
export const asyncHandler =
  (fn: RequestHandler) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
