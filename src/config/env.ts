import dotenv from 'dotenv';
import { z } from 'zod';

import { logger } from './logger';

dotenv.config();

/**
 * Environment variables validation schema using Zod
 * Defines all required and optional configuration values with defaults
 */
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
  REDIS_URL: z.url().optional(),
  RESEND_API_KEY: z.string().min(1).default('resend-api-key-placeholder'),
  EMAIL_FROM: z.email().default('noreply@yourdomain.com'),
  EMAIL_FROM_NAME: z.string().default('Express TypeScript Starter'),
  EMAIL_REPLY_TO: z.email().default('support@yourdomain.com'),
  EMAIL_SUPPORT: z.email().default('support@yourdomain.com'),
  FRONTEND_URL: z.url().default('http://localhost:3000'),
  APP_NAME: z.string().default('Express TypeScript Starter'),
});

/**
 * Validate and parse environment variables against schema
 * @returns Parsed environment configuration with computed properties
 * @throws Error if validation fails in non-test environments
 */
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

      if (process.env.NODE_ENV === 'test') {
        logger.warn('Continuing with test defaults due to validation failure');
        return createTestDefaults();
      }

      process.exit(1);
    }
    throw error;
  }
};

/**
 * Create default test environment configuration
 * @returns Test environment configuration object
 */
const createTestDefaults = () => ({
  NODE_ENV: 'test' as const,
  PORT: 3000,
  MONGODB_URI: 'mongodb://localhost:27017/express-ts-app-test',
  JWT_SECRET: 'test-jwt-secret-at-least-32-characters-long-for-testing',
  DEFAULT_LANGUAGE: 'en' as const,
  RESEND_API_KEY: 'test-resend-api-key',
  EMAIL_FROM: 'test@example.com',
  EMAIL_FROM_NAME: 'Test App',
  EMAIL_REPLY_TO: 'test-support@example.com',
  EMAIL_SUPPORT: 'test-support@example.com',
  FRONTEND_URL: 'http://localhost:3000',
  APP_NAME: 'Test App',
  IS_PRODUCTION: false,
  IS_DEV: false,
  IS_TEST: true,
});

/**
 * Validated environment configuration
 * Contains all environment variables with proper types and computed flags
 */
export const env = validateEnv();
