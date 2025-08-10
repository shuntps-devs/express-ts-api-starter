import express from 'express';
import request from 'supertest';

import { UserController } from '../../controllers';
import { IUser, UserRole } from '../../interfaces';
import { configureRequestLogging, configureSecurity } from '../../middleware';
import { TestHelper } from '../helpers';

// Mock the services first with their implementations
jest.mock('../../services', () => ({
  UserService: jest.fn().mockImplementation(() => ({
    findUserById: jest.fn(),
    updateUser: jest.fn(),
    getAllUsers: jest.fn(),
    deleteUser: jest.fn(),
  })),
  SessionService: {
    createSession: jest.fn(),
    refreshSession: jest.fn(),
    destroySession: jest.fn(),
    destroyAllUserSessions: jest.fn(),
    validateAccessToken: jest.fn(),
    extractTokensFromCookies: jest.fn(),
    getUserActiveSessions: jest.fn(),
  },
}));

// Variables to access mocks
let mockUserService: any;

// Mock i18n
jest.mock('../../i18n', () => ({
  t: jest.fn((key: string) => {
    const translations: Record<string, string> = {
      'success.userDeleted': 'User deleted successfully',
      'success.usersRetrieved': 'Users retrieved successfully',
      'success.userRetrieved': 'User retrieved successfully',
      'success.userUpdated': 'User updated successfully',
      'success.resourceDeleted': 'Resource deleted successfully',
      'error.userNotFound': 'User not found',
      'error.unauthorized': 'Unauthorized access',
      'error.forbidden': 'Forbidden action',
      'validation.required': 'This field is required',
      'auth.userNotFound': 'User not found',
    };
    return translations[key] || key;
  }),
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
const mockAuthenticatedUser: IUser = TestHelper.generateMockUser({
  _id: 'user123',
  username: 'testuser',
  email: 'test@example.com',
  role: UserRole.USER,
  lastLogin: new Date(),
}) as unknown as IUser;

const mockAuthenticatedAdmin: IUser = TestHelper.generateMockUser({
  _id: 'admin123',
  username: 'adminuser',
  email: 'admin@example.com',
  role: UserRole.ADMIN,
  lastLogin: new Date(),
}) as unknown as IUser;

// Mock authentication middleware with flexible user management
const mockAuth = {
  currentUser: mockAuthenticatedUser,
  setUser: (user: IUser) => {
    mockAuth.currentUser = user;
  },
};

jest.mock('../../middleware', () => ({
  ...jest.requireActual('../../middleware'),
  authenticate: (
    req: express.Request,
    _res: express.Response,
    next: express.NextFunction
  ) => {
    req.user = mockAuth.currentUser;
    next();
  },
  requireRole:
    (_role: string) =>
    (
      _req: express.Request,
      _res: express.Response,
      next: express.NextFunction
    ) => {
      // For tests, we always allow access
      next();
    },
}));

describe('UserController', () => {
  let app: express.Application;
  let userController: UserController;

  beforeAll(() => {
    console.log('🧪 Starting UserController test suite...');
  });

  afterAll(() => {
    console.log('✅ UserController test suite completed');
  });

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Apply security middleware
    configureSecurity(app);
    configureRequestLogging(app);

    userController = new UserController();

    // Get the mocks
    mockUserService = (userController as any).userService;

    // Setup routes according to real API routes
    const { authenticate, requireRole } = jest.requireMock('../../middleware');

    // Admin only routes
    app.get(
      '/',
      authenticate,
      requireRole([UserRole.ADMIN]),
      userController.getAllUsers
    );
    app.get(
      '/:userId',
      authenticate,
      requireRole([UserRole.ADMIN]),
      userController.getUserById
    );
    app.patch(
      '/:userId',
      authenticate,
      requireRole([UserRole.ADMIN]),
      userController.updateUserById
    );
    app.delete(
      '/:userId',
      authenticate,
      requireRole([UserRole.ADMIN]),
      userController.deleteUserById
    );

    // Add error handling middleware
    const { errorHandler } = jest.requireMock('../../middleware');
    app.use(errorHandler);

    // Reset mocks and default user
    jest.clearAllMocks();
    mockAuth.setUser(mockAuthenticatedUser);
  });

  describe('GET / (Admin: Get all users)', () => {
    it('should return all users for administrators', async () => {
      // Switch to admin user
      mockAuth.setUser(mockAuthenticatedAdmin);

      const users = [
        mockAuthenticatedUser,
        {
          ...mockAuthenticatedUser,
          _id: 'user456',
          username: 'anotherUser',
        },
      ];
      mockUserService.getAllUsers.mockResolvedValue({
        data: users,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
      });

      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockUserService.getAllUsers).toHaveBeenCalled();

      // Reset to normal user
      mockAuth.setUser(mockAuthenticatedUser);
    });
  });

  describe('GET /:userId (Admin: Get user by ID)', () => {
    it('should return a specific user', async () => {
      // Switch to admin user
      mockAuth.setUser(mockAuthenticatedAdmin);

      mockUserService.findUserById.mockResolvedValue(mockAuthenticatedUser);

      const response = await request(app).get('/user123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockUserService.findUserById).toHaveBeenCalledWith('user123');

      // Reset to normal user
      mockAuth.setUser(mockAuthenticatedUser);
    });

    it("should return 404 if user doesn't exist", async () => {
      // Switch to admin user
      mockAuth.setUser(mockAuthenticatedAdmin);

      mockUserService.findUserById.mockResolvedValue(null);

      const response = await request(app).get('/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();

      // Reset to normal user
      mockAuth.setUser(mockAuthenticatedUser);
    });
  });

  describe('PATCH /:userId (Admin: Update user)', () => {
    it('should update a specific user', async () => {
      // Switch to admin user
      mockAuth.setUser(mockAuthenticatedAdmin);

      const updatedUser = {
        ...mockAuthenticatedUser,
        username: 'updatedUser',
      };
      mockUserService.updateUser.mockResolvedValue(updatedUser);

      const response = await request(app)
        .patch('/user123')
        .send({ username: 'updatedUser' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockUserService.updateUser).toHaveBeenCalledWith('user123', {
        username: 'updatedUser',
      });

      // Reset to normal user
      mockAuth.setUser(mockAuthenticatedUser);
    });
  });

  describe('DELETE /:userId (Admin: Delete user)', () => {
    it('should delete a user', async () => {
      // Switch to admin user
      mockAuth.setUser(mockAuthenticatedAdmin);

      mockUserService.deleteUser.mockResolvedValue(true);

      const response = await request(app).delete('/user123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockUserService.deleteUser).toHaveBeenCalledWith('user123');

      // Reset to normal user
      mockAuth.setUser(mockAuthenticatedUser);
    });

    it("should return 404 if user doesn't exist", async () => {
      // Switch to admin user
      mockAuth.setUser(mockAuthenticatedAdmin);

      mockUserService.deleteUser.mockResolvedValue(false);

      const response = await request(app).delete('/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();

      // Reset to normal user
      mockAuth.setUser(mockAuthenticatedUser);
    });
  });
});
