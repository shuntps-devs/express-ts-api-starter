import { Logger } from 'winston';

import { logger } from '../config';
import { Session } from '../models';
import { VerificationService } from '../services';

/**
 * Cleanup Service
 * Handles periodic cleanup of expired sessions, tokens, and other stale data
 */
export class CleanupService {
  private static instance: CleanupService;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private verificationService: VerificationService;

  constructor() {
    this.verificationService = new VerificationService();
  }

  /**
   * Get singleton instance
   * @returns CleanupService instance
   */
  public static getInstance(): CleanupService {
    if (!CleanupService.instance) {
      CleanupService.instance = new CleanupService();
    }
    return CleanupService.instance;
  }

  /**
   * Start periodic cleanup tasks
   * @param intervalMinutes - Cleanup interval in minutes (default: 60)
   * @param contextLogger - Optional context logger for request tracing
   * @throws Error if cleanup service fails to start
   * @example
   * ```typescript
   * const cleanupService = CleanupService.getInstance();
   * cleanupService.startPeriodicCleanup(30);
   * ```
   */
  public startPeriodicCleanup(
    intervalMinutes: number = 60,
    contextLogger?: Logger
  ): void {
    const requestLogger = contextLogger ?? logger;

    if (this.cleanupInterval) {
      requestLogger.warn('Cleanup service already running');
      return;
    }

    const intervalMs = intervalMinutes * 60 * 1000;

    requestLogger.info('Starting periodic cleanup service', {
      intervalMinutes,
      nextCleanup: new Date(Date.now() + intervalMs),
    });

    this.runCleanupTasks(requestLogger).catch((error) => {
      requestLogger.error('Initial cleanup failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    });

    this.cleanupInterval = setInterval(() => {
      this.runCleanupTasks(requestLogger).catch((error) => {
        requestLogger.error('Scheduled cleanup failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });
    }, intervalMs);
  }

  /**
   * Stop periodic cleanup tasks
   * @param contextLogger - Optional context logger for request tracing
   */
  public stopPeriodicCleanup(contextLogger?: Logger): void {
    const requestLogger = contextLogger ?? logger;

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      requestLogger.info('Periodic cleanup service stopped');
    }
  }

  /**
   * Run all cleanup tasks manually
   * @param contextLogger - Optional context logger for request tracing
   * @returns Promise resolving to cleanup summary with counts of cleaned items
   * @throws Error if cleanup operation fails
   * @example
   * ```typescript
   * const cleanupService = CleanupService.getInstance();
   * const results = await cleanupService.runCleanupTasks();
   * console.log(`Cleaned ${results.totalCleaned} items`);
   * ```
   */
  public async runCleanupTasks(contextLogger?: Logger): Promise<{
    expiredSessions: number;
    inactiveSessions: number;
    expiredTokens: number;
    totalCleaned: number;
  }> {
    const requestLogger = contextLogger ?? logger;

    requestLogger.info('Starting cleanup tasks');
    const startTime = Date.now();

    try {
      const [expiredSessions, inactiveSessions, expiredTokens] =
        await Promise.all([
          this.cleanupExpiredSessions(requestLogger),
          this.cleanupInactiveSessions(requestLogger),
          this.verificationService.cleanupExpiredTokens(requestLogger),
        ]);

      const totalCleaned = expiredSessions + inactiveSessions + expiredTokens;
      const duration = Date.now() - startTime;

      requestLogger.info('Cleanup tasks completed', {
        expiredSessions,
        inactiveSessions,
        expiredTokens,
        totalCleaned,
        durationMs: duration,
      });

      return { expiredSessions, inactiveSessions, expiredTokens, totalCleaned };
    } catch (error) {
      requestLogger.error('Cleanup tasks failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        durationMs: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Cleanup expired sessions (using MongoDB TTL and manual cleanup)
   * @param contextLogger - Optional context logger for request tracing
   * @returns Promise resolving to number of cleaned sessions
   * @throws Error if database operation fails
   */
  public async cleanupExpiredSessions(contextLogger?: Logger): Promise<number> {
    const requestLogger = contextLogger ?? logger;

    try {
      const result = await Session.cleanupExpired();
      const deletedCount = result.deletedCount ?? 0;

      requestLogger.info('Expired sessions cleaned', {
        deletedCount,
      });

      return deletedCount;
    } catch (error) {
      requestLogger.error('Failed to cleanup expired sessions', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  /**
   * Cleanup inactive sessions (isActive: false) older than specified hours
   * @param contextLogger - Optional context logger for request tracing
   * @param olderThanHours - Remove inactive sessions older than X hours (default: 24)
   * @returns Promise resolving to number of cleaned sessions
   * @throws Error if database operation fails
   */
  public async cleanupInactiveSessions(
    contextLogger?: Logger,
    olderThanHours: number = 24
  ): Promise<number> {
    const requestLogger = contextLogger ?? logger;

    try {
      const cutoffDate = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

      const result = await Session.deleteMany({
        isActive: false,
        updatedAt: { $lt: cutoffDate },
      });

      const deletedCount = result.deletedCount ?? 0;

      requestLogger.info('Inactive sessions cleaned', {
        deletedCount,
        olderThanHours,
        cutoffDate,
      });

      return deletedCount;
    } catch (error) {
      requestLogger.error('Failed to cleanup inactive sessions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        olderThanHours,
      });
      return 0;
    }
  }

  /**
   * Force cleanup of ALL inactive sessions (for testing purposes)
   * @param contextLogger - Optional context logger for request tracing
   * @returns Promise resolving to number of cleaned sessions
   * @throws Error if database operation fails
   */
  public async forceCleanupAllInactiveSessions(
    contextLogger?: Logger
  ): Promise<number> {
    const requestLogger = contextLogger ?? logger;

    try {
      const result = await Session.deleteMany({
        isActive: false,
      });

      const deletedCount = result.deletedCount ?? 0;

      requestLogger.info('Force cleaned all inactive sessions', {
        deletedCount,
      });

      return deletedCount;
    } catch (error) {
      requestLogger.error('Failed to force cleanup inactive sessions', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  /**
   * Get cleanup statistics without performing cleanup
   * @param contextLogger - Optional context logger for request tracing
   * @returns Promise resolving to cleanup statistics with session counts
   * @throws Error if database query fails
   * @example
   * ```typescript
   * const cleanupService = CleanupService.getInstance();
   * const stats = await cleanupService.getCleanupStatistics();
   * console.log(`Total sessions: ${stats.totalSessions}, Active: ${stats.activeSessions}`);
   * ```
   */
  public async getCleanupStatistics(contextLogger?: Logger): Promise<{
    expiredSessions: number;
    inactiveSessions: number;
    totalSessions: number;
    activeSessions: number;
  }> {
    const requestLogger = contextLogger ?? logger;

    try {
      const [expiredSessions, inactiveSessions, totalSessions, activeSessions] =
        await Promise.all([
          Session.countDocuments({ expiresAt: { $lt: new Date() } }),
          Session.countDocuments({
            isActive: false,
            updatedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          }),
          Session.countDocuments({}),
          Session.countDocuments({ isActive: true }),
        ]);

      const stats = {
        expiredSessions,
        inactiveSessions,
        totalSessions,
        activeSessions,
      };

      requestLogger.info('Cleanup statistics retrieved', stats);

      return stats;
    } catch (error) {
      requestLogger.error('Failed to get cleanup statistics', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
