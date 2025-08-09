import { Router } from 'express';

import authRoutes from './auth.routes';

const router = Router();

// Health check route
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'development',
    uptime: process.uptime(),
    service: 'Express TypeScript API',
  });
});

// Base routes
router.get('/', (_req, res) => {
  res.send('Hello Express + TypeScript!');
});

// API routes
router.use('/api/auth', authRoutes);

// Export the router
export default router;
