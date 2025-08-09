import { NextFunction, Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { ZodError, ZodType } from 'zod';

import { logger } from '../config';
import { t } from '../i18n';
import { IValidationError } from '../interfaces';
import { ResponseHelper } from '../utils';

interface IValidateSchema {
  params?: ZodType<ParamsDictionary>;
  query?: ZodType<ParsedQs>;
  body?: ZodType<Record<string, unknown>>;
}

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
        logger.warn('Validation error:', error.issues);

        const validationErrors: IValidationError[] = error.issues.map(
          (issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
            value: 'received' in issue ? issue.received : undefined,
          })
        );

        const requestId = ResponseHelper.extractRequestId(req);
        return ResponseHelper.sendValidationError(
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
