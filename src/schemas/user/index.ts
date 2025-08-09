import { z } from 'zod';

/**
 * Schema for updating user profile
 */
export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    )
    .optional(),
  email: z.string().email('Invalid email format').optional(),
});

/**
 * Schema for updating user by admin
 */
export const updateUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    )
    .optional(),
  email: z.string().email('Invalid email format').optional(),
  role: z.enum(['USER', 'MODERATOR', 'ADMIN']).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Schema for query parameters
 */
export const getUsersQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
  search: z.string().min(1, 'Search term must not be empty').optional(),
  sortBy: z
    .enum(['username', 'email', 'createdAt', 'updatedAt', 'lastLogin'])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
