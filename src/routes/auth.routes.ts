import { Router } from 'express';

import { AuthController } from '../controllers';
import { auditLogger, authenticate, validateRequest } from '../middleware';
import { loginSchema, registerSchema } from '../schemas/auth';
import { resendVerificationSchema, verifyEmailSchema } from '../schemas/email';

/**
 * Authentication routes router
 * @description Handles user registration, login, logout, and email verification endpoints
 * @example
 * import authRoutes from './auth.routes';
 * app.use('/api/auth', authRoutes);
 */
const router = Router();
const authController = new AuthController();

/**
 * User registration endpoint
 * @description Validates registration data and tracks registration attempts
 * @route POST /api/auth/register
 * @access Public
 * @middleware validateRequest, auditLogger
 */
router.post(
  '/register',
  validateRequest({ body: registerSchema }),
  auditLogger,
  authController.register
);

/**
 * User login endpoint
 * @description Validates login credentials and tracks login attempts
 * @route POST /api/auth/login
 * @access Public
 * @middleware validateRequest, auditLogger
 */
router.post(
  '/login',
  validateRequest({ body: loginSchema }),
  auditLogger,
  authController.login
);

/**
 * User logout endpoint
 * @description Requires authentication and tracks logout actions
 * @route POST /api/auth/logout
 * @access Private
 * @middleware authenticate, auditLogger
 */
router.post('/logout', authenticate, auditLogger, authController.logout);

/**
 * Logout from all devices endpoint
 * @description Requires authentication and tracks logout all actions
 * @route POST /api/auth/logout-all
 * @access Private
 * @middleware authenticate, auditLogger
 */
router.post('/logout-all', authenticate, auditLogger, authController.logoutAll);

/**
 * Token refresh endpoint
 * @description Handles JWT token refresh and tracks refresh attempts
 * @route POST /api/auth/refresh
 * @access Public (requires refresh token cookie)
 * @middleware auditLogger
 */
router.post('/refresh', auditLogger, authController.refreshToken);

/**
 * User profile endpoint
 * @description Retrieves authenticated user's profile information with security filtering
 * @route GET /api/auth/profile
 * @access Private
 * @middleware authenticate, auditLogger
 */
router.get('/profile', authenticate, auditLogger, authController.getProfile);

/**
 * Get active sessions endpoint
 * @description Requires authentication to retrieve user's active sessions
 * @route GET /api/auth/sessions
 * @access Private
 * @middleware authenticate
 */
router.get('/sessions', authenticate, authController.getSessions);

/**
 * Email verification endpoint
 * @description Validates verification token and tracks verification attempts
 * @route POST /api/auth/verify-email
 * @access Public
 * @middleware validateRequest, auditLogger
 */
router.post(
  '/verify-email',
  validateRequest({ body: verifyEmailSchema }),
  auditLogger,
  authController.verifyEmail
);

/**
 * Resend verification email endpoint
 * @description Validates email and tracks resend verification attempts
 * @route POST /api/auth/resend-verification
 * @access Public
 * @middleware validateRequest, auditLogger
 */
router.post(
  '/resend-verification',
  validateRequest({ body: resendVerificationSchema }),
  auditLogger,
  authController.resendVerification
);

/**
 * Authentication routes router export
 * @description Express router configured with all authentication endpoints
 */
export default router;
