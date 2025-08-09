import { Router } from 'express';

import { env } from '../config';
import { t } from '../i18n';
import { ResponseHelper } from '../utils';

import authRoutes from './auth.routes';
import userRoutes from './user.routes';

/**
 * Alternative main application router configuration
 * @deprecated Use index.ts instead - this file should be removed
 */
const router = Router();

/**
 * Health check endpoint for monitoring service status
 */
router.get('/health', (_req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    uptime: process.uptime(),
    service: t('api.service.name'),
  };

  res.status(200).json(healthData);
});

/**
 * Base welcome endpoint with API information
 */
router.get('/', (_req, res) => {
  const welcomeData = {
    service: t('api.service.name'),
    version: process.env.npm_package_version ?? '0.0.2',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      health: '/health',
    },
  };

  ResponseHelper.sendSuccess(res, welcomeData, 200, t('api.welcome.message'));
});

/**
 * Mount API route modules
 */
router.use('/api/auth', authRoutes);
router.use('/api/users', userRoutes);

/**
 * Deprecated router export - use index.ts instead
 * @deprecated
 */
export default router;
