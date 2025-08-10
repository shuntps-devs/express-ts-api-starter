import express from 'express';

import { profileController } from '../controllers';
import {
  authenticate,
  processAvatarImage,
  uploadAvatar,
  validateAvatarUpload,
} from '../middleware';

const router = express.Router();

/**
 * Profile Routes
 * @description All routes for user profile management and avatar operations
 * @route /api/profile
 */

/**
 * @route GET /api/profile
 * @description Get authenticated user's profile
 * @access Private
 */
router.get('/', authenticate, profileController.getProfile);

/**
 * @route PATCH /api/profile
 * @description Update authenticated user's profile
 * @access Private
 */
router.patch('/', authenticate, profileController.updateProfile);

/**
 * @route POST /api/profile/avatar
 * @description Upload user avatar
 * @access Private
 */
router.post(
  '/avatar',
  authenticate,
  uploadAvatar,
  processAvatarImage,
  validateAvatarUpload,
  profileController.uploadAvatar
);

/**
 * @route DELETE /api/profile/avatar
 * @description Remove user avatar
 * @access Private
 */
router.delete('/avatar', authenticate, profileController.removeAvatar);

/**
 * @route GET /api/profile/avatar/config
 * @description Get avatar upload configuration
 * @access Public
 */
router.get('/avatar/config', profileController.getAvatarConfig);

export default router;
