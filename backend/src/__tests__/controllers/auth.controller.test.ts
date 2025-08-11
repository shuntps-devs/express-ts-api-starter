import express from 'express';
import request from 'supertest';

import { AuthController } from '../../controllers';
import { UserRole } from '../../interfaces';
import {
  configureRequestLogging,
  configureSecurity,
  errorHandler,
  validateRequest,
} from '../../middleware';
import { loginSchema, registerSchema } from '../../schemas/auth';
import { SessionService } from '../../services';


jest.mock('../../i18n', () => ({
  t: jest.fn((key: string) => {
    const translations: Record<string, string> = {
      'success.userCreated': 'User created successfully',
      'auth.email.alreadyExists': 'Email already exists',
      'auth.username.alreadyExists': 'Username already exists',
      'auth.login.success': 'Login successful',
      'errors.unauthorized': 'Unauthorized',
    };
    return translations[key] || key;
  }),
}));


jest.mock('../../services', () => {
  const mockUserService = {
    getUserByEmail: jest.fn(),
    getUserById: jest.fn(),
    updateUser: jest.fn(),
    createUser: jest.fn(),
    deleteUser: jest.fn(),
    getAllUsers: jest.fn(),
    updateUserProfileById: jest.fn(),
    updateUserLastLogin: jest.fn(),
    findUserByIdentifier: jest.fn(),
  };

  const mockVerificationService = {
    generateEmailVerificationCode: jest.fn(),
    verifyEmailVerificationCode: jest.fn(),
    sendEmailVerificationCode: jest.fn(),
    generatePasswordResetCode: jest.fn(),
    verifyPasswordResetCode: jest.fn(),
    sendPasswordResetCode: jest.fn(),
    deleteVerificationCode: jest.fn(),
    cleanupExpiredCodes: jest.fn(),
    sendVerificationEmail: jest.fn(),
  };

  const mockProfileService = {
    createProfile: jest.fn(),
    findProfileByUserId: jest.fn(),
    updateProfile: jest.fn(),
    deleteProfile: jest.fn(),
    getOrCreateProfile: jest.fn(),
    updateProfileAvatar: jest.fn(),
    removeProfileAvatar: jest.fn(),
  };

  const mockAvatarService = {
    saveAvatar: jest.fn(),
    removeAvatar: jest.fn(),
    updateProfileAvatar: jest.fn(),
    getUploadConfig: jest.fn(),
  };

  return {
    UserService: jest.fn().mockImplementation(() => mockUserService),
    VerificationService: jest
      .fn()
      .mockImplementation(() => mockVerificationService),
    ProfileService: jest.fn().mockImplementation(() => mockProfileService),
    AvatarService: jest.fn().mockImplementation(() => mockAvatarService),
    SessionService: {
      createSession: jest.fn(),
      refreshSession: jest.fn(),
      destroySession: jest.fn(),
      destroyAllUserSessions: jest.fn(),
      validateAccessToken: jest.fn(),
      extractTokensFromCookies: jest.fn(),
      getUserActiveSessions: jest.fn(),
    },
  };
});

describe('AuthController', () => {
  let app: express.Application;
  let authController: AuthController;
  let mockUserService: any;

  const mockUser = {
    _id: 'user123',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashed-password',
    role: UserRole.USER,
    isActive: true,
    isEmailVerified: false,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    loginAttempts: 0,
  };

  beforeAll(() => {
    console.log('🧪 Starting AuthController test suite...');
  });

  afterAll(() => {
    console.log('✅ AuthController test suite completed');
  });

  beforeEach(() => {
    app = express();
    app.use(express.json());


    configureSecurity(app);
    configureRequestLogging(app);

    authController = new AuthController();


    mockUserService = (authController as any).userService;


    app.post(
      '/register',
      validateRequest({ body: registerSchema }),
      authController.register
    );
    app.post(
      '/login',
      validateRequest({ body: loginSchema }),
      authController.login
    );
    app.post('/logout', authController.logout);
    app.post('/logout-all', authController.logoutAll);
    app.post('/refresh', authController.refreshToken);
    app.get('/sessions', authController.getSessions);


    app.use(errorHandler);


    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    it('should create a new user with valid data', async () => {
      const mockUserResponse = {
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
        isActive: true,
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserService.findUserByIdentifier.mockResolvedValue(null);
      mockUserService.createUser.mockResolvedValue(mockUserResponse);

      const response = await request(app).post('/register').send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'securePassword123!',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();
      expect(response.body.data).toBeDefined();
      expect(mockUserService.createUser).toHaveBeenCalled();
    });

    it('should fail if user already exists', async () => {
      mockUserService.findUserByIdentifier.mockResolvedValue(mockUser);

      const response = await request(app).post('/register').send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'securePassword123!',
      });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /login', () => {
    it('should login user with valid credentials', async () => {
      const activeUser = {
        ...mockUser,
        isActive: true,
        isEmailVerified: true,
        isLocked: false,
        loginAttempts: 0,
        comparePassword: jest.fn().mockResolvedValue(true),
        incLoginAttempts: jest.fn(),
        resetLoginAttempts: jest.fn(),
        save: jest.fn(),
      };

      const mockSession = {
        _id: 'session123',
        userId: 'user123',
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserService.findUserByIdentifier.mockResolvedValue(activeUser);
      (SessionService.createSession as jest.Mock).mockResolvedValue(
        mockSession
      );

      const response = await request(app).post('/login').send({
        identifier: 'test@example.com',
        password: 'CorrectPassword123',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe('testuser');
      expect(SessionService.createSession).toHaveBeenCalled();
    });

    it('should fail with invalid credentials', async () => {
      mockUserService.findUserByIdentifier.mockResolvedValue(null);

      const response = await request(app).post('/login').send({
        identifier: 'nonexistent@example.com',
        password: 'ValidPassword123',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail if account is locked', async () => {
      const lockedUser = {
        ...mockUser,
        isLocked: true,
        lockUntil: new Date(Date.now() + 30 * 60 * 1000),
      };
      mockUserService.findUserByIdentifier.mockResolvedValue(lockedUser);

      const response = await request(app).post('/login').send({
        identifier: 'test@example.com',
        password: 'CorrectPassword123',
      });

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /logout', () => {
    it('should succeed even without active session', async () => {
      const response = await request(app).post('/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /refresh', () => {
    it('should fail without refresh token', async () => {
      (SessionService.extractTokensFromCookies as jest.Mock).mockReturnValue(
        {}
      );

      const response = await request(app).post('/refresh');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should validate required fields for registration', async () => {
      const response = await request(app).post('/register').send({});

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should validate required fields for login', async () => {
      const response = await request(app).post('/login').send({});

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should handle service errors during registration', async () => {
      mockUserService.findUserByIdentifier.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).post('/register').send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'securePassword123!',
      });

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toBeDefined();
    });
  });
});
