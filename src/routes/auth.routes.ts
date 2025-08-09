import { Router } from 'express';

import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware';
import { loginSchema, registerSchema } from '../schemas/auth';

const router = Router();
const authController = new AuthController();

// Registration route
router.post(
  '/register',
  validateRequest({ body: registerSchema }),
  authController.register
);

// Login route
router.post(
  '/login',
  validateRequest({ body: loginSchema }),
  authController.login
);

// Get profile route (temporary - will need auth middleware later)
router.get('/profile/:userId', authController.getProfile);

export default router;
