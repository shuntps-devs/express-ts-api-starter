import { z } from 'zod';

import { t } from '../../i18n';

/**
 * Email verification schemas for email confirmation functionality
 */

/**
 * Schema for resending verification email
 * Validates email address for verification resend request
 */
export const resendVerificationSchema = z.object({
  email: z
    .email()
    .refine((email) => email.length >= 5 && email.length <= 100, {
      message: t('validation.email.invalid'),
    })
    .transform((email) => email.toLowerCase().trim()),
});

/**
 * Schema for email verification token validation
 * Validates verification token format and length
 */
export const verifyEmailSchema = z.object({
  token: z
    .string()
    .min(32, t('validation.token.verificationRequired'))
    .max(128, t('validation.token.verificationRequired'))
    .regex(/^[a-f0-9]+$/, t('validation.token.verificationRequired')),
});

/**
 * Schema for simple email verification (alternative format)
 * Validates verification token for email confirmation
 */
export const emailVerificationSchema = z.object({
  token: z.string().min(1, t('validation.token.verificationRequired')),
});

/**
 * Schema for email verification URL parameters
 * Validates token from URL parameters
 */
export const verifyEmailParamsSchema = z.object({
  token: z
    .string()
    .min(32, t('validation.token.verificationRequired'))
    .max(128, t('validation.token.verificationRequired')),
});

/**
 * Type definitions for email verification requests
 */
export type ResendVerificationRequest = z.infer<
  typeof resendVerificationSchema
>;
export type VerifyEmailRequest = z.infer<typeof verifyEmailSchema>;
export type EmailVerificationInput = z.infer<typeof emailVerificationSchema>;
export type VerifyEmailParams = z.infer<typeof verifyEmailParamsSchema>;
