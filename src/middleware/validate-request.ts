/**
 * Request validation middleware using Zod schemas
 * Validates request parameters, query strings, and body against provided schemas
 */

import { NextFunction, Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { ZodError, ZodType } from 'zod';

import { logger } from '../config';
import { t } from '../i18n';
import { IValidationError } from '../interfaces';
import { ErrorHelper } from '../utils';

/**
 * Schema validation configuration interface
 * Defines optional Zod schemas for different parts of the request
 * @interface IValidateSchema
 */
interface IValidateSchema {
  /** Schema for URL parameters validation */
  params?: ZodType<ParamsDictionary>;
  /** Schema for query string parameters validation */
  query?: ZodType<ParsedQs>;
  /** Schema for request body validation */
  body?: ZodType<Record<string, unknown>>;
}

/**
 * Middleware factory for request validation using Zod schemas
 * Validates incoming request data against provided schemas and formats errors
 * @param schema - Object containing optional Zod schemas for params, query, and body
 * @returns Express middleware function that validates the request
 * @throws 400 if validation fails with detailed error information
 * @example
 * ```typescript
 * const userSchema = { body: z.object({ name: z.string(), email: z.email() }) };
 * router.post('/users', validateRequest(userSchema), controller.createUser);
 * ```
 */
export const validateRequest = (schema: IValidateSchema) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (schema.params) {
        const params = await schema.params.parseAsync(req.params);
        req.params = params as ParamsDictionary;
      }
      if (schema.query) {
        const query = await schema.query.parseAsync(req.query);
        req.query = query;
      }
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const contextLogger = req.logger ?? logger;
        contextLogger.warn('Validation error:', error.issues);

        const validationErrors: IValidationError[] = error.issues.map(
          (issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
            value: 'received' in issue ? issue.received : undefined,
          })
        );

        const requestId = ErrorHelper.extractRequestId(req);
        return ErrorHelper.sendValidationError(
          res,
          validationErrors,
          t('errors.validationFailed'),
          requestId
        );
      }
      next(error);
    }
  };
};
