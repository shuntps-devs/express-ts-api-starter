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
  DEFAULT_LANGUAGE: z.enum(['en', 'fr']).default('fr'),
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
      process.exit(1);
    }
    throw error;
  }
};

export const env = validateEnv();
