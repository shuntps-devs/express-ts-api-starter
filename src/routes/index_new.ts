import { Router } from 'express';

import authRoutes from './auth.routes';
import userRoutes from './user.routes';

// Simple env access
const NODE_ENV = process.env.NODE_ENV ?? 'development';
const APP_VERSION = process.env.npm_package_version ?? '0.0.2';

const router = Router();

// Health check route
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime(),
    service: 'Express TypeScript API',
  });
});

// Base routes
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Express TypeScript API',
    data: {
      service: 'Express TypeScript API',
      version: APP_VERSION,
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
