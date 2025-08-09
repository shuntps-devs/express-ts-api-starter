import { z } from 'zod';

import { t } from '../../i18n';

export const emailSchema = z
  .string()
  .email(t('validation.email.invalid'))
  .transform((email) => email.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, t('validation.password.minLength', { min: 8 }))
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: t('validation.password.complexity'),
  });

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

export const idSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, {
  message: 'Invalid MongoDB ID',
});
