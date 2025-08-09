/**
 * Express Request Interface Extensions
 *
 * This file extends the Express Request interface to include additional properties
 * that are added by our middleware (authentication, session management, etc.)
 */

/* eslint-disable @typescript-eslint/no-namespace */

import { Logger } from 'winston';

import { IUser } from '../interfaces';
import { ISession } from '../models';

// Extend Express Request interface
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

// This export makes this a module, enabling declaration merging
export {};
