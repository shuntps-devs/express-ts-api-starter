import compression from 'compression';
import cors from 'cors';
import { Application } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import { env, logger } from '../config';

/**
 * Configure security middleware for the application
 */
export const configureSecurity = (app: Application): void => {
  // Helmet for security headers
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

  // CORS configuration
  const corsOptions: cors.CorsOptions = {
    origin:
      env.NODE_ENV === 'production'
        ? ['https://yourdomain.com'] // Replace with your actual domain
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

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: env.NODE_ENV === 'production' ? 100 : 1000, // More restrictive in production
    message: {
      error: 'Too many requests from this IP, please try again later.',
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
      res.status(429).json({
        success: false,
        error: {
          message: 'Too many requests from this IP, please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        timestamp: new Date().toISOString(),
      });
    },
  });

  app.use(limiter);

  // Compression for better performance
  app.use(
    compression({
      level: 6,
      threshold: 1024, // Only compress responses > 1KB
    })
  );

  logger.info('Security middleware configured', {
    helmet: true,
    cors: true,
    rateLimit: true,
    compression: true,
    environment: env.NODE_ENV,
  });
};
