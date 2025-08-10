import express from 'express';
import request from 'supertest';

import { ProfileController } from '../../controllers';
import { UserRole } from '../../interfaces';
import {
  configureRequestLogging,
  configureSecurity,
  errorHandler,
} from '../../middleware';
import { AvatarService } from '../../services';
import { TestHelper } from '../helpers';

// Mock i18n
jest.mock('../../i18n', () => ({
  t: jest.fn((key: string) => {
    const translations: Record<string, string> = {
      'success.profileRetrieved': 'Profile retrieved successfully',
      'success.resourceUpdated': 'Profile updated successfully',
      'success.resourceDeleted': 'Avatar removed successfully',
      'auth.userNotFound': 'User not found',
      'errors.unauthorized': 'Unauthorized',
    };
    return translations[key] || key;
  }),
}));

// Mock services first
jest.mock('../../services', () => {
  const mockUserService = {
    getUserById: jest.fn(),
    updateUser: jest.fn(),
    updateUserProfileById: jest.fn(),
  };

  const mockAvatarService = {
    saveAvatar: jest.fn(),
    removeAvatar: jest.fn(),
    updateProfileAvatar: jest.fn(),
    getUploadConfig: jest.fn(),
  };

  return {
    UserService: jest.fn().mockImplementation(() => mockUserService),
    AvatarService: mockAvatarService, // Static service object
  };
});

// Mock middleware
jest.mock('../../middleware', () => ({
  ...jest.requireActual('../../middleware'),
  authenticate: jest.fn((req: any, _res: any, next: any) => {
    // Only add user if authorization header is present and valid
    if (req.headers.authorization === 'Bearer valid-token') {
      req.user = TestHelper.generateMockUser({
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
        isActive: true,
        isEmailVerified: true,
      });
    }
    next();
  }),
  validateRequest: jest.fn(() => (_req: any, _res: any, next: any) => next()),
  uploadAvatar: jest.fn((req: any, _res: any, next: any) => {
    req.fileBuffer = {
      buffer: Buffer.from('test-image-data'),
      originalName: 'test-avatar.jpg',
    };
    next();
  }),
  processAvatarImage: jest.fn((_req: any, _res: any, next: any) => next()),
  validateAvatarUpload: jest.fn((_req: any, _res: any, next: any) => next()),
}));

describe('ProfileController', () => {
  let app: express.Application;
  let profileController: ProfileController;
  let mockUserService: any;
  let mockAvatarService: any;

  // Use TestHelper for consistent test data
  const mockProfile = {
    _id: 'profile123',
    userId: 'user123',
    bio: 'Test bio',
    location: 'Test location',
    avatar: {
      fileName: 'avatar.jpg',
      filePath: '/uploads/avatars/avatar.jpg',
      fileSize: 1024,
      mimeType: 'image/jpeg',
      uploadedAt: new Date(),
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Generate mock user using TestHelper
  const testUser = TestHelper.generateMockUser({
    _id: 'user123',
    username: 'testuser',
    email: 'test@example.com',
    role: UserRole.USER,
    isActive: true,
    isEmailVerified: true,
    profile: mockProfile,
  });

  beforeAll(() => {
    console.log('🧪 Starting ProfileController test suite...');
  });

  afterAll(() => {
    console.log('✅ ProfileController test suite completed');
  });

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Apply security middleware
    configureSecurity(app);
    configureRequestLogging(app);

    profileController = new ProfileController();

    // Get the mocks from the controller instance and module
    mockUserService = (profileController as any).userService;
    mockAvatarService = AvatarService;

    // Setup routes like in profile.routes.ts
    const {
      authenticate,
      validateRequest,
      uploadAvatar,
      processAvatarImage,
      validateAvatarUpload,
    } = jest.requireMock('../../middleware');

    app.get('/profile', authenticate, profileController.getProfile);
    app.patch(
      '/profile',
      authenticate,
      validateRequest(),
      profileController.updateProfile
    );
    app.post(
      '/avatar',
      authenticate,
      uploadAvatar,
      processAvatarImage,
      validateAvatarUpload,
      profileController.uploadAvatar
    );
    app.delete('/avatar', authenticate, profileController.removeAvatar);
    app.get('/avatar/config', profileController.getAvatarConfig);

    // Apply error handling middleware
    app.use(errorHandler);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('GET /profile', () => {
    it('should return user profile successfully', async () => {
      const response = await request(app)
        .get('/profile')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile retrieved successfully');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe('user123');
    });

    it('should return 401 when user not found', async () => {
      const response = await request(app).get('/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should handle unauthenticated user', async () => {
      const response = await request(app).get('/profile');

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /profile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        bio: 'Updated bio',
        location: 'Updated location',
      };

      const updatedUser = TestHelper.generateMockUser({
        ...testUser,
        profile: {
          ...mockProfile,
          ...updateData,
        },
      });

      mockUserService.updateUser.mockResolvedValue(updatedUser);

      const response = await request(app)
        .patch('/profile')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(mockUserService.updateUser).toHaveBeenCalledWith(
        'user123',
        updateData
      );
    });

    it('should return 404 when profile not found', async () => {
      const updateData = { bio: 'Updated bio' };
      mockUserService.updateUser.mockResolvedValue(null);

      const response = await request(app)
        .patch('/profile')
        .set('Authorization', 'Bearer valid-token')
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /avatar', () => {
    it('should upload avatar successfully', async () => {
      const avatarData = {
        avatar: {
          fileName: 'new-avatar.jpg',
          filePath: '/uploads/avatars/new-avatar.jpg',
          fileSize: 2048,
          mimeType: 'image/jpeg',
          url: 'http://localhost:3000/uploads/avatars/new-avatar.jpg',
          uploadedAt: new Date(),
        },
      };

      mockAvatarService.saveAvatar.mockResolvedValue(avatarData);
      mockAvatarService.updateProfileAvatar.mockResolvedValue(null);

      const response = await request(app)
        .post('/avatar')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(mockAvatarService.saveAvatar).toHaveBeenCalled();
      expect(mockAvatarService.updateProfileAvatar).toHaveBeenCalled();
    });

    it('should handle upload errors', async () => {
      mockAvatarService.saveAvatar.mockRejectedValue(
        new Error('Upload failed')
      );

      const response = await request(app)
        .post('/avatar')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /avatar', () => {
    it('should remove avatar successfully', async () => {
      const updatedProfile = {
        ...mockProfile,
        avatar: undefined,
      };

      mockAvatarService.removeAvatar.mockResolvedValue(updatedProfile);

      const response = await request(app)
        .delete('/avatar')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Avatar removed successfully');
      expect(mockAvatarService.removeAvatar).toHaveBeenCalledWith(
        'user123',
        expect.any(Object)
      );
    });

    it('should handle removal errors', async () => {
      mockAvatarService.removeAvatar.mockRejectedValue(
        new Error('Removal failed')
      );

      const response = await request(app)
        .delete('/avatar')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /avatar/config', () => {
    it('should return avatar upload configuration', async () => {
      const config = {
        maxFileSize: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png'],
        allowedExtensions: ['.jpg', '.jpeg', '.png'],
        dimensions: { width: 512, height: 512 },
      };

      mockAvatarService.getUploadConfig.mockReturnValue(config);

      const response = await request(app).get('/avatar/config');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile retrieved successfully');
      expect(response.body.data).toEqual(config);
      expect(mockAvatarService.getUploadConfig).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      mockUserService.updateUser.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .patch('/profile')
        .set('Authorization', 'Bearer valid-token')
        .send({ bio: 'test' });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle authentication errors', async () => {
      const response = await request(app).get('/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
