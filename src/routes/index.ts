import { Router } from 'express';

import { env } from '../config';
import { t } from '../i18n';
import { ResponseHelper } from '../utils';

import adminRoutes from './admin.routes';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';

/**
 * Main application router with health check and API routes
 */
const router = Router();

/**
 * Health check endpoint for monitoring service status
 */
router.get('/api/health', (_req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    uptime: process.uptime(),
    service: t('api.service.name'),
  };

  ResponseHelper.sendSuccess(res, healthData, 200, 'Health check successful');
});

/**
 * Base welcome endpoint with API information
 */
router.get('/api', (_req, res) => {
  const welcomeData = {
    service: t('api.service.name'),
    version: env.APP_VERSION,
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      admin: '/api/admin',
      health: '/api/health',
    },
  };

  ResponseHelper.sendSuccess(res, welcomeData, 200, t('api.welcome.message'));
});

/**
 * Mount API route modules
 */
router.use('/api/admin', adminRoutes);
router.use('/api/auth', authRoutes);
router.use('/api/users', userRoutes);

/**
 * Main router export for Express application
 */
export default router;
