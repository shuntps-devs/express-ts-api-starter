import { Router } from 'express';

import { UserController } from '../controllers';
import { UserRole } from '../interfaces';
import { authenticate, requireRole, validateRequest } from '../middleware';
import {
  getUsersQuerySchema,
  updateProfileSchema,
  updateUserSchema,
} from '../schemas/user';

const router = Router();
const userController = new UserController();

// All user routes require authentication
router.use(authenticate);

// Get current user profile
router.get('/profile', userController.getProfile);

// Update current user profile
router.patch(
  '/profile',
  validateRequest({ body: updateProfileSchema }),
  userController.updateProfile
);

// Admin only routes
router.use(requireRole([UserRole.ADMIN]));

// Get all users (admin only)
router.get(
  '/',
  validateRequest({ query: getUsersQuerySchema }),
  userController.getAllUsers
);

// Get user by ID (admin only)
router.get('/:userId', userController.getUserById);

// Update user by ID (admin only)
router.patch(
  '/:userId',
  validateRequest({ body: updateUserSchema }),
  userController.updateUserById
);

// Delete user by ID (admin only)
router.delete('/:userId', userController.deleteUserById);

export default router;
