import dotenv from 'dotenv';
import { z } from 'zod';

import { logger } from './logger';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().positive().default(3000),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/express-ts-app'),
  JWT_SECRET: z
    .string()
    .min(32)
    .default('your-super-secret-jwt-key-change-in-production-min-32-chars'),
  DEFAULT_LANGUAGE: z.enum(['en', 'fr']).default('en'),
  API_KEY: z.string().min(1).optional(),
  REDIS_URL: z.string().url().optional(),
});

const validateEnv = () => {
  try {
    const env = envSchema.parse(process.env);
    return {
      ...env,
      IS_PRODUCTION: env.NODE_ENV === 'production',
      IS_DEV: env.NODE_ENV === 'development',
      IS_TEST: env.NODE_ENV === 'test',
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const treeifiedError = z.treeifyError(error);
      logger.error('Environment validation failed', treeifiedError);

      // Only exit in non-test environments
      if (process.env.NODE_ENV !== 'test') {
        process.exit(1);
      } else {
        // In test environment, continue with default values
        logger.warn('Continuing with default values in test environment');
        return {
          NODE_ENV: 'test' as const,
          PORT: 3000,
          MONGODB_URI: 'mongodb://localhost:27017/express-ts-app-test',
          JWT_SECRET: 'test-jwt-secret-at-least-32-characters-long-for-testing',
          DEFAULT_LANGUAGE: 'en' as const,
          IS_PRODUCTION: false,
          IS_DEV: false,
          IS_TEST: true,
        };
      }
    }
    throw error;
  }
};

export const env = validateEnv();
