import { z } from 'zod';

import { t } from '../../i18n';
import { UserRole } from '../../interfaces';
import { emailSchema, passwordSchema } from '../common';

/**
 * User registration schema
 * Validates username, email, password, and optional role
 */
export const registerSchema = z.object({
  username: z
    .string()
    .min(3, t('validation.username.minLength', { min: 3 }))
    .max(30, t('validation.username.maxLength', { max: 30 }))
    .trim(),
  email: emailSchema,
  password: passwordSchema,
  role: z
    .enum([UserRole.USER, UserRole.ADMIN, UserRole.MODERATOR])
    .default(UserRole.USER),
});

/**
 * Type definition for registration input
 */
export type RegisterInput = z.infer<typeof registerSchema>;
