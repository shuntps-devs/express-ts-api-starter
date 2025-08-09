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

describe('AuthController', () => {
  let app: express.Application;
  let authController: AuthController;
  let mockUserService: any;

  beforeEach(() => {
    // Create new instances for each test
    authController = new AuthController();
    mockUserService = (authController as any).userService;

    app = express();
    configureSecurity(app);
    configureRequestLogging(app);

    // Setup JSON parsing
    app.use(express.json());

    // Setup auth routes
    app.post('/register', authController.register);
    app.post('/login', authController.login);
    app.get('/profile/:userId', authController.getProfile);

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
        // TestHelper already includes comparePassword and resetLoginAttempts mocks
      });

      mockUserService.findUserByIdentifier.mockResolvedValue(mockUser);

      const response = await request(app).post('/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
    });

    it('should handle user not found', async () => {
      mockUserService.findUserByIdentifier.mockResolvedValue(null);

      const response = await request(app).post('/login').send({
        email: 'nonexistent@example.com',
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
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(mockUser.incLoginAttempts).toHaveBeenCalled();
    });
  });

  describe('GET /profile/:userId', () => {
    it('should get user profile successfully', async () => {
      // ✅ Using TestHelper for profile test
      const mockUser = TestHelper.generateMockUser({
        _id: '123',
        email: 'test@example.com',
        username: 'testuser',
      });

      mockUserService.findUserById.mockResolvedValue(mockUser);

      const response = await request(app).get('/profile/123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
      expect(mockUserService.findUserById).toHaveBeenCalledWith('123');
    });

    it('should handle user not found', async () => {
      mockUserService.findUserById.mockResolvedValue(null);

      const response = await request(app).get('/profile/999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });
});
