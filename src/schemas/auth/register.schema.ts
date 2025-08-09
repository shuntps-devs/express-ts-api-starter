import { z } from 'zod';

import { t } from '../../i18n';
import { UserRole } from '../../models/user.model';
import { emailSchema, passwordSchema } from '../common';

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

export type RegisterInput = z.infer<typeof registerSchema>;
