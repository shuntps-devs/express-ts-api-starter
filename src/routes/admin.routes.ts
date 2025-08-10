import { Router } from 'express';

import { AdminController } from '../controllers';
import { authenticate, requireRole } from '../middleware';
import { UserRole } from '../models';

/**
 * Admin routes router
 * @description Administrative endpoints for session management and system cleanup
 * @example
 * import adminRoutes from './admin.routes';
 * app.use('/api/admin', adminRoutes);
 */
const router = Router();
const adminController = new AdminController();

/**
 * Admin routes - All routes require ADMIN role
 * @description Administrative endpoints for session management and system cleanup
 * @access Admin only (UserRole.ADMIN required)
 */

/**
 * @route GET /api/admin/sessions/active
 * @description Get all active sessions with pagination
 * @access Admin only
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 20, max: 100)
 */
router.get(
  '/sessions/active',
  authenticate,
  requireRole([UserRole.ADMIN]),
  adminController.getActiveSessions
);

/**
 * @route GET /api/admin/sessions/inactive
 * @description Get all inactive sessions with pagination
 * @access Admin only
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 20, max: 100)
 */
router.get(
  '/sessions/inactive',
  authenticate,
  requireRole([UserRole.ADMIN]),
  adminController.getInactiveSessions
);

/**
 * @route GET /api/admin/sessions/stats
 * @description Get comprehensive session statistics
 * @access Admin only
 */
router.get(
  '/sessions/stats',
  authenticate,
  requireRole([UserRole.ADMIN]),
  adminController.getSessionStats
);

/**
 * @route DELETE /api/admin/sessions/inactive
 * @description Force cleanup of all inactive sessions
 * @access Admin only
 */
router.delete(
  '/sessions/inactive',
  authenticate,
  requireRole([UserRole.ADMIN]),
  adminController.forceCleanupInactiveSessions
);

/**
 * @route DELETE /api/admin/sessions/:sessionId
 * @description Deactivate a specific session by ID
 * @access Admin only
 * @param sessionId - Session identifier
 */
router.delete(
  '/sessions/:sessionId',
  authenticate,
  requireRole([UserRole.ADMIN]),
  adminController.deactivateSession
);

/**
 * @route POST /api/admin/cleanup
 * @description Run all cleanup tasks (sessions, tokens, etc.)
 * @access Admin only
 */
router.post(
  '/cleanup',
  authenticate,
  requireRole([UserRole.ADMIN]),
  adminController.runCleanupTasks
);

/**
 * Admin routes router export
 * @description Express router configured with all administrative endpoints
 */
export default router;
