import { z } from 'zod';

import { t } from '../../i18n';
import { emailSchema, passwordSchema } from '../common';

/**
 * Login schema for identifier-based authentication
 * Accepts email or username with password
 */
export const loginSchema = z.object({
  identifier: z.string().min(1, t('validation.identifier.required')),
  password: passwordSchema,
});

/**
 * Alternative login schema for email-only authentication
 * Accepts email address with password
 */
export const emailLoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Type definitions for login inputs
 */
export type LoginInput = z.infer<typeof loginSchema>;
export type EmailLoginInput = z.infer<typeof emailLoginSchema>;
