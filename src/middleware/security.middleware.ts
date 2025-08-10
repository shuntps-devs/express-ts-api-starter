/**
 * Security middleware configuration for Express application
 * Implements comprehensive security measures including Helmet, CORS, rate limiting, and compression
 */

import compression from 'compression';
import cors from 'cors';
import { Application } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import { env, logger } from '../config';
import { t } from '../i18n';
import { ErrorHelper } from '../utils';

/**
 * Configure comprehensive security middleware for the Express application
 * Sets up Helmet security headers, CORS policies, rate limiting, and compression
 * @param app - Express application instance to secure
 */
export const configureSecurity = (app: Application): void => {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    })
  );

  const corsOptions: cors.CorsOptions = {
    origin:
      env.NODE_ENV === 'production'
        ? ['https://yourdomain.com']
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Request-ID',
      'X-Correlation-ID',
    ],
    exposedHeaders: ['X-Request-ID', 'X-Correlation-ID'],
  };

  app.use(cors(corsOptions));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.NODE_ENV === 'production' ? 100 : 1000,
    message: {
      error: t('middleware.rateLimitExceeded'),
      retryAfter: '15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });

      ErrorHelper.sendError(
        res,
        t('middleware.rateLimitExceeded'),
        429,
        'RATE_LIMIT_EXCEEDED',
        { retryAfter: '15 minutes' }
      );
    },
  });

  app.use(limiter);

  app.use(
    compression({
      level: 6,
      threshold: 1024,
    })
  );

  logger.info(t('middleware.securityConfigured'), {
    helmet: true,
    cors: true,
    rateLimit: true,
    compression: true,
    environment: env.NODE_ENV,
  });
};
