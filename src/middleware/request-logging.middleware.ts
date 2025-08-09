import { Application } from 'express';
import morgan from 'morgan';

import { env, logger } from '../config';

/**
 * Configure request logging middleware
 */
export const configureRequestLogging = (app: Application): void => {
  if (env.NODE_ENV === 'development') {
    // Colorful console logging for development
    app.use(morgan('dev'));
  } else {
    // JSON logging for production (compatible with log aggregation)
    app.use(
      morgan('combined', {
        stream: {
          write: (message: string) => {
            logger.info(message.trim());
          },
        },
      })
    );
  }

  logger.info('Request logging configured', {
    format: env.NODE_ENV === 'development' ? 'dev' : 'combined',
  });
};
