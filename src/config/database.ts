import mongoose from 'mongoose';

import { t } from '../i18n';

import { env } from './env';
import { logger } from './logger';

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

let isConnecting = false;
const connectionAttempts = {
  count: 0,
  lastAttempt: 0,
  maxRetries: 3,
  resetTimer: null as NodeJS.Timeout | null,
};

const connectWithRetry = async (): Promise<typeof mongoose | null> => {
  try {
    if (isConnecting) {
      logger.warn('Connection attempt already in progress');
      return null;
    }

    isConnecting = true;
    const startTime = Date.now();
    const conn = await mongoose.connect(env.MONGODB_URI, mongooseOptions);

    const connectionTime = Date.now() - startTime;
    const poolSize = (
      conn.connection as unknown as {
        client: { s: { options: { maxPoolSize: number } } };
      }
    ).client.s.options.maxPoolSize;

    logger.info(t('database.connected', { host: conn.connection.host }), {
      connectionTime,
      poolSize,
    });

    connectionAttempts.count = 0;
    if (connectionAttempts.resetTimer) {
      clearTimeout(connectionAttempts.resetTimer);
    }

    conn.connection.on('connected', () => {
      logger.info('Mongoose connected to MongoDB');
    });

    conn.connection.on('disconnected', () => {
      logger.warn(t('database.disconnected'));
      if (env.NODE_ENV !== 'development') {
        process.exit(1);
      }
    });

    conn.connection.on('error', (err) => {
      logger.error(t('database.error'), err);
      if (env.NODE_ENV !== 'development') {
        process.exit(1);
      }
    });

    setInterval(() => {
      const pool = (
        conn.connection as unknown as {
          client: {
            topology: {
              s: {
                pool: {
                  totalConnectionCount: number;
                  availableConnectionCount: number;
                  pendingConnectionCount: number;
                };
              };
            };
          };
        }
      ).client.topology.s.pool;
      if (pool) {
        logger.debug('MongoDB connection pool stats', {
          totalConnections: pool.totalConnectionCount,
          availableConnections: pool.availableConnectionCount,
          pendingConnections: pool.pendingConnectionCount,
        });
      }
    }, 60000);

    return conn;
  } catch (error) {
    connectionAttempts.count++;
    const now = Date.now();
    const timeSinceLastAttempt = now - connectionAttempts.lastAttempt;

    if (timeSinceLastAttempt > 30000) {
      connectionAttempts.count = 1;
    }
    connectionAttempts.lastAttempt = now;

    if (
      connectionAttempts.count <= connectionAttempts.maxRetries &&
      env.NODE_ENV === 'development'
    ) {
      const delay = Math.min(
        1000 * Math.pow(2, connectionAttempts.count),
        10000
      );
      logger.warn(
        `Retrying connection in ${delay / 1000}s... (Attempt ${
          connectionAttempts.count
        }/${connectionAttempts.maxRetries})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      isConnecting = false;
      return connectWithRetry();
    }

    isConnecting = false;
    throw error;
  }
};

const connectDB = async () => {
  try {
    const conn = await connectWithRetry();

    if (!conn && env.NODE_ENV !== 'development') {
      process.exit(1);
    }

    if (conn) {
      const gracefulShutdown = async (signal: string) => {
        logger.info(`Received ${signal}. Starting graceful shutdown...`);

        try {
          const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Shutdown timeout')), 5000)
          );

          const shutdown = async () => {
            if (mongoose.connection.readyState === 1) {
              const pool = (
                mongoose.connection as unknown as {
                  client: {
                    topology: {
                      s: {
                        pool: {
                          totalConnectionCount: number;
                          activeConnectionCount: number;
                          pendingConnectionCount: number;
                        };
                      };
                    };
                  };
                }
              ).client.topology.s.pool;
              if (pool) {
                logger.info('Connection pool stats before shutdown:', {
                  totalConnections: pool.totalConnectionCount,
                  activeConnections: pool.activeConnectionCount,
                  pendingConnections: pool.pendingConnectionCount,
                });
              }

              await mongoose.connection.close(false);
              logger.info('MongoDB connection closed gracefully');
            }
          };

          await Promise.race([shutdown(), timeout]);
          logger.info('Graceful shutdown completed');
        } catch (error) {
          logger.error('Error during graceful shutdown:', error);
        }

        process.exit(0);
      };

      ['SIGINT', 'SIGTERM', 'SIGUSR2'].forEach((signal) => {
        process.once(signal, () => {
          void gracefulShutdown(signal);
        });
      });

      process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception:', error);
        void gracefulShutdown('uncaughtException');
      });

      process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
        void gracefulShutdown('unhandledRejection');
      });
    }
  } catch (error) {
    logger.error(t('database.connectionFailed'), error);
    if (env.NODE_ENV === 'development') {
      logger.info(t('database.continuingWithoutDb'));
    } else {
      process.exit(1);
    }
  } finally {
    isConnecting = false;
  }
};

export default connectDB;
