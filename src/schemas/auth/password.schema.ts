import { z } from 'zod';

import { t } from '../../i18n';

/**
 * Schema for password reset request
 * Validates email address for password reset functionality
 */
export const passwordResetRequestSchema = z.object({
  email: z.email().refine((email) => email.length > 0, {
    message: t('validation.email.invalid'),
  }),
});

/**
 * Schema for password reset confirmation
 * Validates token and new password for password reset completion
 */
export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, t('validation.token.resetRequired')),
  newPassword: z
    .string()
    .min(8, t('validation.password.minLength', { min: 8 }))
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: t('validation.password.complexity'),
    }),
});

/**
 * Schema for password change
 * Validates current and new password for password update
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, t('validation.password.current')),
  newPassword: z
    .string()
    .min(8, t('validation.password.minLength', { min: 8 }))
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: t('validation.password.complexity'),
    }),
});

/**
 * Type definitions for schema inputs
 */
export type PasswordResetRequestInput = z.infer<
  typeof passwordResetRequestSchema
>;
export type PasswordResetConfirmInput = z.infer<
  typeof passwordResetConfirmSchema
>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
