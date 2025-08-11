import mongoose from 'mongoose';

import { t } from '../i18n';

import { env } from './env';
import { logger } from './logger';

/**
 * MongoDB connection configuration options
 * Optimized for production use with connection pooling
 */
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  maxPoolSize: 50,
  minPoolSize: 10,
  connectTimeoutMS: 10000,
  heartbeatFrequencyMS: 5000,
  autoIndex: env.NODE_ENV !== 'production',
};

/**
 * Initialize database connection with error handling and graceful shutdown
 * Sets up connection event listeners and process signal handlers
 * @throws Error if connection fails in production environment
 */
const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, mongooseOptions);

    logger.info(t('database.connected', { host: conn.connection.host }));

    /**
     * Set up connection event listeners
     */
    mongoose.connection.on('disconnected', () => {
      logger.warn(t('database.disconnected'));
      if (env.NODE_ENV !== 'development') {
        process.exit(1);
      }
    });

    mongoose.connection.on('error', (err) => {
      logger.error(t('database.error'), err);
      if (env.NODE_ENV !== 'development') {
        process.exit(1);
      }
    });

    /**
     * Handle graceful shutdown on process signals
     */
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`Received ${signal}. Closing MongoDB connection...`);
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed gracefully');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    ['SIGINT', 'SIGTERM', 'SIGUSR2'].forEach((signal) => {
      process.once(signal, () => void gracefulShutdown(signal));
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      void gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      void gracefulShutdown('unhandledRejection');
    });
  } catch (error) {
    logger.error(t('database.connectionFailed'), error);
    if (env.NODE_ENV === 'development') {
      logger.info(t('database.continuingWithoutDb'));
    } else {
      process.exit(1);
    }
  }
};

export default connectDB;
