import { Router } from 'express';

import { AuthController } from '../controllers';
import { auditLogger, authenticate, validateRequest } from '../middleware';
import { loginSchema, registerSchema } from '../schemas/auth';

const router = Router();
const authController = new AuthController();

// Registration route
router.post(
  '/register',
  validateRequest({ body: registerSchema }),
  auditLogger, // Track registration attempts
  authController.register
);

// Login route
router.post(
  '/login',
  validateRequest({ body: loginSchema }),
  auditLogger, // Track login attempts
  authController.login
);

// Logout route (requires authentication)
router.post(
  '/logout',
  authenticate,
  auditLogger, // Track logout actions
  authController.logout
);

// Logout from all devices (requires authentication)
router.post(
  '/logout-all',
  authenticate,
  auditLogger, // Track logout all actions
  authController.logoutAll
);

// Refresh token route
router.post(
  '/refresh',
  auditLogger, // Track token refresh attempts
  authController.refreshToken
);

// Get profile route (requires authentication)
router.get('/profile', authenticate, authController.getProfile);

// Get active sessions (requires authentication)
router.get('/sessions', authenticate, authController.getSessions);

export default router;
