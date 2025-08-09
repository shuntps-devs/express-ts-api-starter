import { Server } from 'http';

import cookieParser from 'cookie-parser';
import express from 'express';
import i18next from 'i18next';
import middleware from 'i18next-http-middleware';

// Import types to ensure declaration merging is loaded
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

export const app = express();

// Configure security middleware first
configureSecurity(app);

// Configure request logging
configureRequestLogging(app);

// Performance monitoring
app.use(performanceMonitor);

// API versioning
app.use(apiVersioning);

// Request size limiting
app.use(requestSizeLimiter(10)); // 10MB limit

// Cookie parsing middleware
app.use(cookieParser());

// i18n middleware
app.use(middleware.handle(i18next));

// User context middleware (after i18n to have access to t())
app.use(userContext);

// Audit middleware for tracking user actions
app.use(auditLogger);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/', router);

app.use((req, _res, next) => {
  const err = new Error(`Route ${req.originalUrl} not found`) as {
    message: string;
    statusCode?: number;
    status?: string;
  };
  err.statusCode = 404;
  err.status = 'fail';
  next(err);
});

app.use(errorHandler);

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

const startServer = async () => {
  try {
    // Initialize i18n first
    await initI18n();

    // Connect to database
    await connectDB();

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

if (require.main === module) {
  void startServer();
}

export { startServer };
