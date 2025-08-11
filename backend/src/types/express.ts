/**
 * @fileoverview Express Request Interface Extensions
 * @description Extends the Express Request interface to include additional properties
 * that are added by our middleware (authentication, session management, etc.)
 * @version 1.0.0
 */

/* eslint-disable @typescript-eslint/no-namespace */

import { Logger } from 'winston';

import { IUser } from '../interfaces';
import { ISession } from '../models';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface Request {
      user?: IUser;
      session?: ISession;
      logger?: Logger;
    }
  }
}

export {};
