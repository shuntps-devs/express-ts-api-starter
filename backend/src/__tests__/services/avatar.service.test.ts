import { promises as fs } from 'fs';
import path from 'path';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import { Profile } from '../../models';
import { AvatarService } from '../../services';

/**
 * Mock dependencies for AvatarService testing
 */
jest.mock('../../config');
jest.mock('../../i18n', () => ({
  t: jest.fn((key: string) => key),
}));
jest.mock('../../models');
jest.mock('../../utils', () => ({
  DateHelper: {
    now: () => new Date('2024-01-01T00:00:00.000Z'),
    timestamp: () => 1704067200000,
  },
  ErrorHelper: {
    createOperationalError: jest.fn(
      (message: string, statusCode: number, code: string) => {
        const error = new Error(message);
        (error as any).statusCode = statusCode;
        (error as any).code = code;
        (error as any).isOperational = true;
        return error;
      }
    ),
    createNotFoundError: jest.fn((resource: string, _id: string) => {
      const error = new Error(`${resource} not found`);
      (error as any).statusCode = 404;
      (error as any).code = 'NOT_FOUND';
      (error as any).isOperational = true;
      return error;
    }),
    isOperational: jest.fn((error: any) => error?.isOperational === true),
  },
}));
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    access: jest.fn(),
    readdir: jest.fn(),
    unlink: jest.fn(),
    writeFile: jest.fn(),
  },
}));

const mockFs = fs as jest.Mocked<typeof fs>;
const mockProfile = Profile as jest.Mocked<typeof Profile>;

describe('AvatarService', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('initializeUploadDirectory', () => {
    it('should create upload directory successfully', async () => {
      mockFs.mkdir.mockResolvedValueOnce(undefined);

      await AvatarService.initializeUploadDirectory(mockLogger as any);

      expect(mockFs.mkdir).toHaveBeenCalledWith('uploads/avatars', {
        recursive: true,
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Avatar upload directory initialized',
        { directory: 'uploads/avatars' }
      );
    });

    it('should handle directory creation failure', async () => {
      const error = new Error('Permission denied');
      mockFs.mkdir.mockRejectedValueOnce(error);

      /**
       * Test error handling when directory creation fails
       * Verifies error logging without depending on complex mocks
       */
      try {
        await AvatarService.initializeUploadDirectory(mockLogger as any);
      } catch {
        /** Expected error thrown for directory creation failure */
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to initialize upload directory',
        expect.objectContaining({
          directory: 'uploads/avatars',
          error: 'Permission denied',
        })
      );
    });
  });

  describe('getUserAvatarPath', () => {
    it('should return correct user avatar path', () => {
      const userId = '507f1f77bcf86cd799439011';
      const expected = path.join('uploads/avatars', userId);

      const result = AvatarService.getUserAvatarPath(userId);

      expect(result).toBe(expected);
    });
  });

  describe('getAvatarUrl', () => {
    it('should return correct avatar URL', () => {
      const userId = '507f1f77bcf86cd799439011';
      const filename = 'avatar-1234567890.jpg';
      const expected = `/uploads/avatars/${userId}/${filename}`;

      const result = AvatarService.getAvatarUrl(userId, filename);

      expect(result).toBe(expected);
    });
  });

  describe('isValidFormat', () => {
    it('should accept valid image formats', () => {
      expect(AvatarService.isValidFormat('image.jpg')).toBe(true);
      expect(AvatarService.isValidFormat('image.jpeg')).toBe(true);
      expect(AvatarService.isValidFormat('image.png')).toBe(true);
      expect(AvatarService.isValidFormat('image.webp')).toBe(true);
      expect(AvatarService.isValidFormat('IMAGE.JPG')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(AvatarService.isValidFormat('document.pdf')).toBe(false);
      expect(AvatarService.isValidFormat('image.gif')).toBe(false);
      expect(AvatarService.isValidFormat('image.bmp')).toBe(false);
      expect(AvatarService.isValidFormat('noextension')).toBe(false);
    });
  });

  describe('isValidSize', () => {
    it('should accept file sizes within limit', () => {
      expect(AvatarService.isValidSize(1024)).toBe(true);
      expect(AvatarService.isValidSize(1024 * 1024)).toBe(true);
      expect(AvatarService.isValidSize(5 * 1024 * 1024)).toBe(true);
    });

    it('should reject file sizes over limit', () => {
      expect(AvatarService.isValidSize(6 * 1024 * 1024)).toBe(false);
      expect(AvatarService.isValidSize(10 * 1024 * 1024)).toBe(false);
    });
  });

  describe('deleteExistingAvatar', () => {
    const userId = '507f1f77bcf86cd799439011';

    it('should delete existing avatar files successfully', async () => {
      mockFs.access.mockResolvedValueOnce(undefined);
      mockFs.readdir.mockResolvedValueOnce([
        'avatar-old.jpg',
        'avatar-older.png',
      ] as any);
      mockFs.unlink.mockResolvedValue(undefined);

      const result = await AvatarService.deleteExistingAvatar(
        userId,
        mockLogger as any
      );

      expect(result).toBe(true);
      expect(mockFs.unlink).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Existing avatar files deleted',
        expect.objectContaining({
          userId,
          deletedFiles: 2,
        })
      );
    });

    it('should handle non-existent directory gracefully', async () => {
      const error = new Error('ENOENT') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mockFs.access.mockRejectedValueOnce(error);

      const result = await AvatarService.deleteExistingAvatar(
        userId,
        mockLogger as any
      );

      expect(result).toBe(false);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'No existing avatar directory to delete',
        expect.objectContaining({ userId })
      );
    });

    it('should handle deletion errors gracefully', async () => {
      mockFs.access.mockResolvedValueOnce(undefined);
      mockFs.readdir.mockResolvedValueOnce(['avatar.jpg'] as any);
      mockFs.unlink.mockRejectedValueOnce(new Error('Permission denied'));

      const result = await AvatarService.deleteExistingAvatar(
        userId,
        mockLogger as any
      );

      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to delete existing avatar',
        expect.objectContaining({
          userId,
          error: 'Permission denied',
        })
      );
    });
  });

  describe('saveAvatar', () => {
    const userId = '507f1f77bcf86cd799439011';
    const mockBuffer = Buffer.from('fake image data');
    const originalName = 'avatar.jpg';

    it('should save avatar successfully', async () => {
      mockFs.mkdir.mockResolvedValueOnce(undefined);
      mockFs.access.mockRejectedValueOnce(new Error('ENOENT'));
      mockFs.writeFile.mockResolvedValueOnce(undefined);

      const result = await AvatarService.saveAvatar(
        userId,
        mockBuffer,
        originalName,
        mockLogger as any
      );

      expect(result).toEqual({
        success: true,
        avatar: {
          url: expect.stringContaining(`/uploads/avatars/${userId}/avatar-`),
          filename: expect.stringMatching(/^avatar-\d+\.jpg$/),
          uploadedAt: expect.any(Date),
        },
        previousAvatarDeleted: false,
      });

      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining(userId),
        { recursive: true }
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        mockBuffer
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Avatar uploaded successfully',
        expect.objectContaining({
          userId,
          originalName,
          fileSize: mockBuffer.length,
        })
      );
    });

    it('should reject invalid file format', async () => {
      /**
       * Test format validation without depending on complex mocks
       * PDF format is not in ALLOWED_FORMATS, so isValidFormat returns false
       */
      expect(AvatarService.isValidFormat('document.pdf')).toBe(false);
      expect(AvatarService.isValidFormat('image.jpg')).toBe(true);

      /**
       * Test with real call - expect error to be logged
       */
      try {
        await AvatarService.saveAvatar(
          userId,
          mockBuffer,
          'document.pdf',
          mockLogger as any
        );
      } catch {
        /** Expected error thrown for invalid format */
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Avatar upload failed',
        expect.objectContaining({
          userId,
          originalName: 'document.pdf',
        })
      );
    });

    it('should reject oversized files', async () => {
      /**
       * Create buffer larger than MAX_FILE_SIZE (5MB)
       */
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024);

      /**
       * Test size validation without depending on complex mocks
       * 6MB exceeds MAX_FILE_SIZE limit
       */
      expect(AvatarService.isValidSize(largeBuffer.length)).toBe(false);
      expect(AvatarService.isValidSize(1024)).toBe(true);

      /**
       * Test with real call - expect error to be logged
       */
      try {
        await AvatarService.saveAvatar(
          userId,
          largeBuffer,
          originalName,
          mockLogger as any
        );
      } catch {
        /** Expected error thrown for oversized file */
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Avatar upload failed',
        expect.objectContaining({
          userId,
          fileSize: largeBuffer.length,
        })
      );
    });

    it('should handle file system errors', async () => {
      mockFs.mkdir.mockResolvedValueOnce(undefined);
      mockFs.access.mockRejectedValueOnce(new Error('ENOENT'));
      mockFs.writeFile.mockRejectedValueOnce(new Error('Disk full'));

      /**
       * Test that file system error is handled and logged
       */
      try {
        await AvatarService.saveAvatar(
          userId,
          mockBuffer,
          originalName,
          mockLogger as any
        );
      } catch {
        /** Expected error thrown for file system error */
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Avatar upload failed',
        expect.objectContaining({
          userId,
          error: 'Disk full',
        })
      );
    });
  });

  describe('updateProfileAvatar', () => {
    const userId = '507f1f77bcf86cd799439011';
    const avatarData = {
      url: '/uploads/avatars/user123/avatar-123.jpg',
      filename: 'avatar-123.jpg',
      uploadedAt: new Date(),
    };

    it('should update profile avatar successfully', async () => {
      const mockProfileInstance = {
        _id: 'profile123',
        updateAvatar: jest.fn(),
      };

      mockProfile.findByUserId.mockResolvedValueOnce(
        mockProfileInstance as any
      );

      const result = await AvatarService.updateProfileAvatar(
        userId,
        avatarData,
        mockLogger as any
      );

      expect(result).toBe(mockProfileInstance);
      expect(mockProfile.findByUserId).toHaveBeenCalledWith(userId);
      expect(mockProfileInstance.updateAvatar).toHaveBeenCalledWith({
        url: avatarData.url,
        uploadedAt: avatarData.uploadedAt,
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Profile avatar updated successfully',
        expect.objectContaining({
          userId,
          profileId: 'profile123',
          avatarUrl: avatarData.url,
        })
      );
    });

    it('should handle profile not found', async () => {
      mockProfile.findByUserId.mockResolvedValueOnce(null);

      /**
       * Test that profile not found error is handled and logged
       */
      try {
        await AvatarService.updateProfileAvatar(
          userId,
          avatarData,
          mockLogger as any
        );
      } catch {
        /** Expected error thrown for profile not found */
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to update profile avatar',
        expect.objectContaining({ userId })
      );
    });
  });

  describe('removeAvatar', () => {
    const userId = '507f1f77bcf86cd799439011';

    it('should remove avatar successfully', async () => {
      const mockProfileInstance = {
        _id: 'profile123',
        removeAvatar: jest.fn(),
      };

      mockFs.access.mockResolvedValueOnce(undefined);
      mockFs.readdir.mockResolvedValueOnce(['avatar.jpg'] as any);
      mockFs.unlink.mockResolvedValueOnce(undefined);
      mockProfile.findByUserId.mockResolvedValueOnce(
        mockProfileInstance as any
      );

      const result = await AvatarService.removeAvatar(
        userId,
        mockLogger as any
      );

      expect(result).toBe(mockProfileInstance);
      expect(mockProfileInstance.removeAvatar).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Avatar removed successfully',
        expect.objectContaining({
          userId,
          profileId: 'profile123',
          filesDeleted: true,
        })
      );
    });
  });

  describe('getUploadConfig', () => {
    it('should return correct upload configuration', () => {
      const config = AvatarService.getUploadConfig();

      expect(config).toEqual({
        maxFileSize: 5 * 1024 * 1024,
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        maxFileSizeMB: 5,
      });
    });
  });
});
