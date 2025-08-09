import { z } from 'zod';

import { t } from '../../i18n';
import { emailSchema, passwordSchema } from '../common';

export const loginSchema = z.object({
  identifier: z.string().min(1, t('validation.identifier.required')),
  password: passwordSchema,
});

// Alternative schema for email-only login
export const emailLoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type EmailLoginInput = z.infer<typeof emailLoginSchema>;
