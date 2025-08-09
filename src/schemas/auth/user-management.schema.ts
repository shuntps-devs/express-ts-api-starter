import { z } from 'zod';

import { t } from '../../i18n';

// Password reset request
export const passwordResetRequestSchema = z.object({
  email: z.string().email(t('validation.email.invalid')),
});

// Password reset confirmation
export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, t('validation.token.resetRequired')),
  newPassword: z
    .string()
    .min(8, t('validation.password.minLength', { min: 8 }))
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: t('validation.password.complexity'),
    }),
});

// Email verification
export const emailVerificationSchema = z.object({
  token: z.string().min(1, t('validation.token.verificationRequired')),
});

// Change password
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, t('validation.password.current')),
  newPassword: z
    .string()
    .min(8, t('validation.password.minLength', { min: 8 }))
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: t('validation.password.complexity'),
    }),
});

// Update profile
export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, t('validation.username.minLength', { min: 3 }))
    .max(30, t('validation.username.maxLength', { max: 30 }))
    .trim()
    .optional(),
  email: z.string().email(t('validation.email.invalid')).optional(),
});

export type PasswordResetRequestInput = z.infer<
  typeof passwordResetRequestSchema
>;
export type PasswordResetConfirmInput = z.infer<
  typeof passwordResetConfirmSchema
>;
export type EmailVerificationInput = z.infer<typeof emailVerificationSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
