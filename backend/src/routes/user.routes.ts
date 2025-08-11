import { Router } from 'express';

import { UserController } from '../controllers';
import { UserRole } from '../interfaces';
import { authenticate, requireRole, validateRequest } from '../middleware';
import { getUsersQuerySchema, updateUserSchema } from '../schemas/user';

/**
 * User management routes router
 * Handles user profile operations and admin user management
 */
const router = Router();
const userController = new UserController();

/**
 * Apply authentication middleware to all user routes
 * All endpoints require valid authentication
 */
router.use(authenticate);

/**
 * Apply admin role requirement to remaining routes
 * All following endpoints require ADMIN role
 */
router.use(requireRole([UserRole.ADMIN]));

/**
 * Get all users endpoint (admin only)
 * Returns paginated list of all users with query filtering
 */
router.get(
  '/',
  validateRequest({ query: getUsersQuerySchema }),
  userController.getAllUsers
);

/**
 * Get user by ID endpoint (admin only)
 * Returns specific user information by user ID
 */
router.get('/:userId', userController.getUserById);

/**
 * Update user by ID endpoint (admin only)
 * Allows admins to update any user's information
 */
router.patch(
  '/:userId',
  validateRequest({ body: updateUserSchema }),
  userController.updateUserById
);

/**
 * Delete user by ID endpoint (admin only)
 * Allows admins to delete any user account
 */
router.delete('/:userId', userController.deleteUserById);

/**
 * User routes export
 */

/**
 * User routes export
 */
export default router;
