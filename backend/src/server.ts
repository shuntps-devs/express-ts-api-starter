import { Server } from 'http';
import path from 'path';

import cookieParser from 'cookie-parser';
import express from 'express';
import i18next from 'i18next';
import middleware from 'i18next-http-middleware';

import './types/express';

import { connectDB, env, logger } from './config';
import { initI18n, t } from './i18n';
import {
  apiVersioning,
  auditLogger,
  configureRequestLogging,
  configureSecurity,
  errorHandler,
  performanceMonitor,
  requestSizeLimiter,
  userContext,
} from './middleware';
import router from './routes';
import { AvatarService, CleanupService } from './services';
import { ErrorHelper } from './utils';

export const app = express();

/**
 * Middleware chain configuration
 * Applied in specific order for optimal performance and security
 */

app.use(performanceMonitor);

app.use(apiVersioning);

app.use(requestSizeLimiter(10));

app.use(cookieParser());

app.use(middleware.handle(i18next));

app.use(userContext);

app.use(auditLogger);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Static file serving for avatar uploads
 * Serves avatar files from uploads/avatars directory
 * Only authenticated users can access avatar files
 */
app.use(
  '/uploads/avatars',
  express.static(path.join(process.cwd(), 'uploads/avatars'))
);

app.use('/', router);

/**
 * 404 handler for undefined routes
 * @description Creates and forwards 404 errors for unmatched routes using ErrorHelper
 */
app.use((req, _res, next) => {

  const error = ErrorHelper.createNotFoundError(`Route ${req.originalUrl}`);
  next(error);
});

/**
 * Global error handler middleware
 * @description Catches and processes all application errors
 */
app.use(errorHandler);

/**
 * Graceful shutdown handler for the Express server
 * @description Handles server shutdown with proper connection cleanup and timeout management
 * @param server - HTTP server instance to shutdown
 * @param signal - Signal that triggered the shutdown (SIGTERM, SIGINT, etc.)
 */
const gracefulShutdown = async (server: Server, signal: string) => {
  logger.info(t('server.shutdown.start', { signal }));

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(t('server.shutdown.timeout'))), 10000)
  );

  try {
    const shutdown = async () => {
      const activeConnections = await new Promise<number>((resolve) => {
        server.getConnections((_err: Error | null, count: number) => {
          resolve(count);
        });
      });

      logger.info(
        t('server.shutdown.connections', { count: activeConnections })
      );

      server.close((err?: Error) => {
        if (err) {
          logger.error('Error closing server:', err);
          process.exit(1);
        }
        logger.info(t('server.shutdown.success'));
      });

      if (activeConnections > 0) {
        logger.info(t('server.shutdown.waiting'));
      }
    };

    await Promise.race([shutdown(), timeout]);
    logger.info(t('server.shutdown.completed'));
    process.exit(0);
  } catch (error) {
    logger.error(t('server.shutdown.error'), error);
    process.exit(1);
  }
};

/**
 * Start the Express server with full configuration
 * @description Initializes i18n, security, database connection, and cleanup services
 * @returns Promise resolving to HTTP server instance
 * @throws Will exit process with code 1 if startup fails
 */
const startServer = async () => {
  try {
    await initI18n();

    configureSecurity(app);

    configureRequestLogging(app);

    await connectDB();


    await AvatarService.initializeUploadDirectory();

    const cleanupService = CleanupService.getInstance();
    cleanupService.startPeriodicCleanup(60);

    const server = app.listen(env.PORT, () => {
      logger.info(
        t('server.startup.success', { port: env.PORT, env: env.NODE_ENV })
      );
    });

    ['SIGTERM', 'SIGINT', 'SIGUSR2'].forEach((signal) => {
      process.once(signal, () => {
        void gracefulShutdown(server, signal);
      });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      void gracefulShutdown(server, 'uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      void gracefulShutdown(server, 'unhandledRejection');
    });

    return server;
  } catch (error) {
    logger.error(t('server.startup.failure'), error);
    process.exit(1);
  }
};

/**
 * Start server if module is executed directly
 * @description Allows server to be started via `node server.js` or imported as module
 */
if (require.main === module) {
  void startServer();
}

/**
 * Export server startup function for testing and module usage
 * @description Allows server to be started programmatically in tests or other modules
 */
export { startServer };
