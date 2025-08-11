import { z } from 'zod';

import { t } from '../../i18n';

/**
 * Common email validation schema
 * Validates email format and transforms to lowercase
 */
export const emailSchema = z
  .email()
  .refine((email) => email.length > 0, {
    message: t('validation.email.invalid'),
  })
  .transform((email) => email.toLowerCase());

/**
 * Common password validation schema
 * Enforces minimum length and complexity requirements
 */
export const passwordSchema = z
  .string()
  .min(8, t('validation.password.minLength', { min: 8 }))
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: t('validation.password.complexity'),
  });

/**
 * Common pagination schema
 * Validates page and limit parameters for paginated endpoints
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

/**
 * Common MongoDB ID validation schema
 * Validates 24-character hexadecimal MongoDB ObjectId format
 */
export const idSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, {
  message: t('error.validation.invalidInput'),
});
