import { Router } from 'express';

import { AuthController } from '../controllers';
import { auditLogger, authenticate, validateRequest } from '../middleware';
import { loginSchema, registerSchema } from '../schemas/auth';
import { resendVerificationSchema, verifyEmailSchema } from '../schemas/email';

/**
 * Authentication routes router
 * Handles user registration, login, logout, and email verification
 */
const router = Router();
const authController = new AuthController();

/**
 * User registration endpoint
 * Validates registration data and tracks registration attempts
 */
router.post(
  '/register',
  validateRequest({ body: registerSchema }),
  auditLogger,
  authController.register
);

/**
 * User login endpoint
 * Validates login credentials and tracks login attempts
 */
router.post(
  '/login',
  validateRequest({ body: loginSchema }),
  auditLogger,
  authController.login
);

/**
 * User logout endpoint
 * Requires authentication and tracks logout actions
 */
router.post('/logout', authenticate, auditLogger, authController.logout);

/**
 * Logout from all devices endpoint
 * Requires authentication and tracks logout all actions
 */
router.post('/logout-all', authenticate, auditLogger, authController.logoutAll);

/**
 * Token refresh endpoint
 * Handles JWT token refresh and tracks refresh attempts
 */
router.post('/refresh', auditLogger, authController.refreshToken);

/**
 * Get user profile endpoint
 * Requires authentication to retrieve current user profile
 */
router.get('/profile', authenticate, authController.getProfile);

/**
 * Get active sessions endpoint
 * Requires authentication to retrieve user's active sessions
 */
router.get('/sessions', authenticate, authController.getSessions);

/**
 * Email verification endpoint
 * Validates verification token and tracks verification attempts
 */
router.post(
  '/verify-email',
  validateRequest({ body: verifyEmailSchema }),
  auditLogger,
  authController.verifyEmail
);

/**
 * Resend verification email endpoint
 * Validates email and tracks resend verification attempts
 */

/**
 * Resend verification email endpoint
 * Validates email and tracks resend verification attempts
 */
router.post(
  '/resend-verification',
  validateRequest({ body: resendVerificationSchema }),
  auditLogger,
  authController.resendVerification
);

/**
 * Authentication routes export
 */
export default router;
