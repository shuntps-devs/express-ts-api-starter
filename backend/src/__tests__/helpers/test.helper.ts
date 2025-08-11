import { Response } from 'express';

import { User } from '../../models';

/**
 * Test utilities for creating mock data and managing test database
 *
 * @example
 * ```typescript
 * import { TestHelper } from '../helpers/test.helper';
 *
 * const mockUser = TestHelper.generateMockUser({ email: 'custom@test.com' });
 * const mockReq = TestHelper.createMockRequest({ body: { name: 'John' } });
 * const mockRes = TestHelper.createMockResponse();
 * ```
 */
export class TestHelper {
  /**
   * Generate a complete mock user object for testing
   * @param overrides - Properties to override in the mock user
   * @returns Mock user object with all required properties
   */
  static generateMockUser(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      username: 'testuser',
      password: 'Password123!',
      role: 'USER',
      isActive: true,
      isEmailVerified: false,
      loginAttempts: 0,
      isLocked: false,
      lastLogin: null,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      comparePassword: jest.fn().mockResolvedValue(true),
      incLoginAttempts: jest.fn().mockResolvedValue(undefined),
      resetLoginAttempts: jest.fn().mockResolvedValue(undefined),
      ...overrides,
    };
  }

  /**
   * Generate mock Express request object for testing
   * @param overrides - Properties to override in the mock request
   * @returns Mock request object
   */
  static createMockRequest(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      body: {},
      params: {},
      query: {},
      headers: {},
      ip: '127.0.0.1',
      method: 'GET',
      url: '/',
      get: jest.fn(),
      header: jest.fn(),
      ...overrides,
    };
  }

  /**
   * Generate mock Express response object for testing
   * @returns Mock response object with chainable methods
   */
  static createMockResponse(): Partial<Response> {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.set = jest.fn().mockReturnValue(res);
    res.header = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    res.redirect = jest.fn().mockReturnValue(res);
    return res;
  }

  /**
   * Generate mock Next function for middleware testing
   * @returns Mock next function
   */
  static createMockNext() {
    return jest.fn();
  }

  /**
   * Create complete mock Express context (req, res, next)
   * @param reqOverrides - Request overrides
   * @param resOverrides - Response overrides
   * @returns Object with req, res, next
   */
  static createMockContext(
    reqOverrides: Partial<Record<string, unknown>> = {},
    resOverrides: Partial<Record<string, unknown>> = {}
  ) {
    return {
      req: this.createMockRequest(reqOverrides),
      res: { ...this.createMockResponse(), ...resOverrides },
      next: this.createMockNext(),
    };
  }

  /**
   * Clear all test database collections
   * @returns Promise that resolves when cleanup is complete
   */
  static async clearDatabase() {
    try {
      // Clear all test collections
      await User.deleteMany({});
      // Add other model clearings as needed:
      // await Profile.deleteMany({});
      // await Session.deleteMany({});
    } catch (error) {
      // Use logger instead of console.warn
      // eslint-disable-next-line no-console
      console.warn('Database cleanup failed:', error);
    }
  }

  /**
   * Generate unique test email addresses
   * @param prefix - Email prefix (default: 'test')
   * @returns Unique email address
   */
  static generateTestEmail(prefix = 'test'): string {
    return `${prefix}+${Date.now()}@example.com`;
  }

  /**
   * Generate unique test usernames
   * @param prefix - Username prefix (default: 'testuser')
   * @returns Unique username
   */
  static generateTestUsername(prefix = 'testuser'): string {
    return `${prefix}_${Date.now()}`;
  }

  /**
   * Wait for a specific amount of time (useful for async tests)
   * @param ms - Milliseconds to wait
   * @returns Promise that resolves after the specified time
   */
  static async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Create test data objects for different entities
   */
  static readonly TestData = {
    validUser: {
      email: 'valid@example.com',
      username: 'validuser',
      password: 'ValidPassword123!',
    },
    invalidUser: {
      email: 'invalid-email',
      username: 'ab', // too short
      password: '123', // too weak
    },
    loginData: {
      identifier: 'test@example.com',
      password: 'Password123!',
    },
  };
}
