import express from 'express';
import request from 'supertest';

import { AuthController } from '../../controllers/auth.controller';
import { configureRequestLogging } from '../../middleware/request-logging.middleware';
import { configureSecurity } from '../../middleware/security.middleware';
import { TestHelper } from '../helpers/test.helper';

// Mock the UserService
jest.mock('../../services/user.service', () => ({
  UserService: jest.fn().mockImplementation(() => ({
    findUserByIdentifier: jest.fn(),
    createUser: jest.fn(),
    findUserById: jest.fn(),
  })),
}));

// Mock the SessionService
jest.mock('../../services/session.service', () => ({
  SessionService: {
    createSession: jest.fn(),
    destroySession: jest.fn(),
    refreshSession: jest.fn(),
    getUserActiveSessions: jest.fn(),
    validateAccessToken: jest.fn(),
    extractTokensFromCookies: jest.fn(),
  },
}));

// Mock the TokenService
jest.mock('../../services/token.service', () => ({
  TokenService: {
    generateTokenPair: jest.fn(),
    generateSessionId: jest.fn(),
    verifyAccessToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
  },
}));

// Mock the Session model
jest.mock('../../models/session.model', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    deactivateAllForUser: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
  },
}));

// Mock env config
jest.mock('../../config/env', () => ({
  env: {
    JWT_SECRET: 'test-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    NODE_ENV: 'test',
  },
}));

// Mock i18n
jest.mock('../../i18n', () => ({
  t: jest.fn((key: string) => {
    const translations: Record<string, string> = {
      'success.userCreated': 'User created successfully',
      'success.loginSuccessful': 'Login successful',
      'success.profileRetrieved': 'Profile retrieved successfully',
      'auth.credentials.invalid': 'Invalid credentials',
      'auth.email.alreadyExists': 'Email already exists',
      'auth.username.alreadyExists': 'Username already exists',
      'auth.userNotFound': 'User not found',
      'validation.identifier.required': 'Identifier is required',
    };
    return translations[key] || key;
  }),
}));

// Mock the async handler
jest.mock('../../middleware/async-handler', () => ({
  asyncHandler: (fn: any) => fn,
}));

// Mock logger
jest.mock('../../config/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock authentication middleware
jest.mock('../../middleware/auth.middleware', () => ({
  authenticate: jest.fn((req, _res, next) => {
    // Mock authenticated user for profile tests
    if (req.path === '/profile/123' && req.method === 'GET') {
      req.user = {
        _id: '123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        isActive: true,
        isEmailVerified: true,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    next();
  }),
}));

describe('AuthController', () => {
  let app: express.Application;
  let authController: AuthController;
  let mockUserService: any;
  let mockSessionService: any;

  beforeEach(() => {
    // Create new instances for each test
    authController = new AuthController();
    mockUserService = (authController as any).userService;

    // Get the mocked SessionService
    const { SessionService } = jest.requireMock(
      '../../services/session.service'
    );
    mockSessionService = SessionService;

    app = express();
    configureSecurity(app);
    configureRequestLogging(app);

    // Setup JSON parsing
    app.use(express.json());

    // Import mocked middleware
    const { authenticate } = jest.requireMock(
      '../../middleware/auth.middleware'
    );

    // Setup auth routes
    app.post('/register', authController.register);
    app.post('/login', authController.login);
    app.get('/profile/:userId', authenticate, authController.getProfile);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    it('should register a new user successfully', async () => {
      // ✅ Using TestHelper instead of manual mock creation
      const mockUser = TestHelper.generateMockUser({
        _id: '123',
        email: 'test@example.com',
        username: 'testuser',
      });

      mockUserService.findUserByIdentifier.mockResolvedValue(null);
      mockUserService.createUser.mockResolvedValue(mockUser);

      const response = await request(app).post('/register').send({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
      expect(mockUserService.findUserByIdentifier).toHaveBeenCalledWith(
        'test@example.com'
      );
      expect(mockUserService.createUser).toHaveBeenCalled();
    });

    it('should handle existing user registration', async () => {
      // ✅ Using TestHelper for existing user mock
      const existingUser = TestHelper.generateMockUser({
        _id: '123',
        email: 'test@example.com',
        username: 'testuser',
      });

      mockUserService.findUserByIdentifier.mockResolvedValue(existingUser);

      const response = await request(app).post('/register').send({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
    });
  });

  describe('POST /login', () => {
    it('should login user successfully', async () => {
      // ✅ Using TestHelper with mock methods included
      const mockUser = TestHelper.generateMockUser({
        _id: '123',
        email: 'test@example.com',
        username: 'testuser',
        isEmailVerified: true,
        isLocked: false,
        loginAttempts: 0,
        lastLogin: new Date(),
        // Add save method mock
        save: jest.fn().mockResolvedValue(true),
        // TestHelper already includes comparePassword and resetLoginAttempts mocks
      });

      // Mock session creation
      const mockSession = { _id: 'session123' };
      mockSessionService.createSession.mockResolvedValue(mockSession);

      mockUserService.findUserByIdentifier.mockResolvedValue(mockUser);

      const response = await request(app).post('/login').send({
        identifier: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.sessionId).toBe('session123');
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      expect((mockUser as any).save).toHaveBeenCalled();
      expect(mockSessionService.createSession).toHaveBeenCalled();
    });

    it('should handle user not found', async () => {
      mockUserService.findUserByIdentifier.mockResolvedValue(null);

      const response = await request(app).post('/login').send({
        identifier: 'nonexistent@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should handle invalid password', async () => {
      // ✅ Using TestHelper with custom mock behavior
      const mockUser = TestHelper.generateMockUser({
        _id: '123',
        email: 'test@example.com',
        isLocked: false,
        comparePassword: jest.fn().mockResolvedValue(false), // Override to return false
        // TestHelper already includes incLoginAttempts mock
      });

      mockUserService.findUserByIdentifier.mockResolvedValue(mockUser);

      const response = await request(app).post('/login').send({
        identifier: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(mockUser.incLoginAttempts).toHaveBeenCalled();
    });
  });

  describe('GET /profile/:userId', () => {
    it('should get user profile successfully', async () => {
      // This test will use the mocked authenticate middleware
      const response = await request(app).get('/profile/123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should handle user not found', async () => {
      // Test with a different user ID that won't match our mock
      const response = await request(app).get('/profile/999');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
