/**
 * Request logging configuration middleware
 * Sets up Morgan HTTP request logging with environment-specific formatting
 */

import { Application } from 'express';
import morgan from 'morgan';

import { env, logger } from '../config';
import { t } from '../i18n';

/**
 * Configure HTTP request logging middleware for the Express application
 * Uses Morgan with different formats based on environment (dev vs production)
 * @param app - Express application instance to configure
 */
export const configureRequestLogging = (app: Application): void => {
  if (env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
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

  logger.info(t('middleware.requestLoggingConfigured'), {
    format: env.NODE_ENV === 'development' ? 'dev' : 'combined',
  });
};
