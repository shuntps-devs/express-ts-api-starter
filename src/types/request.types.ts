import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

/**
 * Typed request body interface
 */
export interface ITypedRequestBody<T> extends Request {
  body: T;
}

/**
 * Typed request query interface
 */
export interface ITypedRequestQuery<T extends ParsedQs> extends Request {
  query: T;
}

/**
 * Typed request params interface
 */
export interface ITypedRequestParams<T extends ParamsDictionary>
  extends Request {
  params: T;
}

/**
 * Full typed request interface
 */
export interface ITypedRequest<
  TParams extends ParamsDictionary = ParamsDictionary,
  TQuery extends ParsedQs = ParsedQs,
  TBody = unknown,
> extends Request {
  params: TParams;
  query: TQuery;
  body: TBody;
}
