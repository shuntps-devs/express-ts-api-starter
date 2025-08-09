import { Router } from 'express';

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
    service: 'Express TypeScript API', // TODO: Use t('api.service.name') when types are updated
  });
});

// Base routes
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Express TypeScript API', // TODO: Use t('api.welcome.message') when types are updated
    data: {
      service: 'Express TypeScript API', // TODO: Use t('api.service.name') when types are updated
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
