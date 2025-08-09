import { z } from 'zod';

import { t } from '../../i18n';

/**
 * User profile and management schemas
 */

/**
 * Schema for updating user profile
 * Validates username and email for user profile modifications
 */
export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, t('validation.username.minLength', { min: 3 }))
    .max(30, t('validation.username.maxLength', { max: 30 }))
    .regex(/^[a-zA-Z0-9_-]+$/, t('validation.username.required'))
    .trim()
    .optional(),
  email: z
    .email()
    .refine((email) => email.length > 0, {
      message: t('validation.email.invalid'),
    })
    .optional(),
});

/**
 * Schema for updating user by admin
 * Validates user data for administrative user modifications
 */
export const updateUserSchema = z.object({
  username: z
    .string()
    .min(3, t('validation.username.minLength', { min: 3 }))
    .max(30, t('validation.username.maxLength', { max: 30 }))
    .regex(/^[a-zA-Z0-9_-]+$/, t('validation.username.required'))
    .trim()
    .optional(),
  email: z
    .email()
    .refine((email) => email.length > 0, {
      message: t('validation.email.invalid'),
    })
    .optional(),
  role: z.enum(['USER', 'MODERATOR', 'ADMIN']).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Schema for query parameters in user listing
 * Validates pagination, search, and sorting parameters
 */
export const getUsersQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, t('error.validation.invalidInput'))
    .optional(),
  limit: z
    .string()
    .regex(/^\d+$/, t('error.validation.invalidInput'))
    .optional(),
  search: z.string().min(1, t('error.validation.invalidInput')).optional(),
  sortBy: z
    .enum(['username', 'email', 'createdAt', 'updatedAt', 'lastLogin'])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Type definitions for schema inputs
 */
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type GetUsersQueryInput = z.infer<typeof getUsersQuerySchema>;
