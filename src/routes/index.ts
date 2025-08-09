import { Router } from 'express';

import { t } from '../i18n';

import authRoutes from './auth.routes';
import userRoutes from './user.routes';

const router = Router();

// Health check route
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'development',
    uptime: process.uptime(),
    service: t('api.service.name'),
  });
});

// Base routes
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: t('api.welcome.message'),
    data: {
      service: t('api.service.name'),
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        users: '/api/users',
        health: '/health',
      },
    },
  });
});

// API routes
router.use('/api/auth', authRoutes);
router.use('/api/users', userRoutes);

// Export the router
export default router;
