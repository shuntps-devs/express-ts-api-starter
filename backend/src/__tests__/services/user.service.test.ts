import { IUser, UserRole } from '../../interfaces';
import { User } from '../../models';
import { UserService } from '../../services';
import { TestHelper } from '../helpers';

jest.mock('../../models', () => ({
  User: {
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    prototype: {
      save: jest.fn(),
      comparePassword: jest.fn(),
      toObject: jest.fn(),
    },
  },
}));

jest.mock('../../config/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../i18n', () => ({
  t: jest.fn((key: string) => {
    const translations: Record<string, string> = {
      'auth.email.alreadyExists': 'Email already exists',
      'auth.username.alreadyExists': 'Username already exists',
    };
    return translations[key] || key;
  }),
}));

describe('UserService', () => {
  let userService: UserService;
  let mockUser: Partial<IUser>;
  let mockUserModel: any;

  beforeAll(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    userService = new UserService();
    mockUser = TestHelper.generateMockUser({
      _id: 'user123',
      username: 'testuser',
      email: 'test@example.com',
      role: UserRole.USER,
    }) as unknown as Partial<IUser>;

    mockUserModel = {
      save: jest.fn(),
      comparePassword: jest.fn(),
      toObject: jest.fn(() => mockUser),
      _id: 'user123',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user',
      isActive: true,
      isEmailVerified: false,
    };

    jest.clearAllMocks();
  });

  describe('findUserById', () => {
    it('should find user by ID successfully', async () => {
      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      (User.findById as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await userService.findUserById('user123');

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockSelect).toHaveBeenCalledWith('-password');
      expect(result).toEqual(mockUser);
    });

    it('should return null when user is not found', async () => {
      const mockSelect = jest.fn().mockResolvedValue(null);
      (User.findById as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await userService.findUserById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findUserByEmail', () => {
    it('should find user by email successfully', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.findUserByEmail('test@example.com');

      expect(User.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
        isActive: true,
      });
      expect(result).toEqual(mockUser);
    });

    it('should convert email to lowercase', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await userService.findUserByEmail('TEST@EXAMPLE.COM');

      expect(User.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
        isActive: true,
      });
    });

    it('should return null when user is not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const result = await userService.findUserByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findUserByUsername', () => {
    it('should find user by username successfully', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.findUserByUsername('testuser');

      expect(User.findOne).toHaveBeenCalledWith({
        username: 'testuser',
        isActive: true,
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user is not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const result = await userService.findUserByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findUserByIdentifier', () => {
    it('should find user by email identifier', async () => {
      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      (User.findOne as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await userService.findUserByIdentifier('test@example.com');

      expect(User.findOne).toHaveBeenCalledWith({
        $or: [{ email: 'test@example.com' }, { username: 'test@example.com' }],
        isActive: true,
      });
      expect(mockSelect).toHaveBeenCalledWith('+password');
      expect(result).toEqual(mockUser);
    });

    it('should find user by username identifier', async () => {
      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      (User.findOne as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await userService.findUserByIdentifier('testuser');

      expect(User.findOne).toHaveBeenCalledWith({
        $or: [{ email: 'testuser' }, { username: 'testuser' }],
        isActive: true,
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updateData = { username: 'updateduser' };
      const updatedUser = { ...mockUser, ...updateData };
      const mockSelect = jest.fn().mockResolvedValue(updatedUser);

      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await userService.updateUser('user123', updateData);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { ...updateData, updatedAt: expect.any(Date) },
        { new: true }
      );
      expect(mockSelect).toHaveBeenCalledWith('-password');
      expect(result).toEqual(updatedUser);
    });

    it('should return null when user is not found', async () => {
      const mockSelect = jest.fn().mockResolvedValue(null);
      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await userService.updateUser('nonexistent', {
        username: 'test',
      });

      expect(result).toBeNull();
    });
  });

  describe('deleteUser', () => {
    it('should soft delete user successfully', async () => {
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);

      const result = await userService.deleteUser('user123');

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('user123', {
        isActive: false,
        updatedAt: expect.any(Date),
      });
      expect(result).toBe(true);
    });

    it('should return false when user is not found', async () => {
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      const result = await userService.deleteUser('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('getAllUsers', () => {
    it('should get paginated users successfully', async () => {
      const mockUsers = [
        mockUser,
        { ...mockUser, _id: 'user456', username: 'user2' },
      ];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUsers),
      };

      (User.find as jest.Mock).mockReturnValue(mockQuery);
      (User.countDocuments as jest.Mock).mockResolvedValue(2);

      const result = await userService.getAllUsers({ page: 1, limit: 10 });

      expect(User.find).toHaveBeenCalledWith({ isActive: true });
      expect(mockQuery.select).toHaveBeenCalledWith('-password');
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should handle search queries', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };

      (User.find as jest.Mock).mockReturnValue(mockQuery);
      (User.countDocuments as jest.Mock).mockResolvedValue(0);

      await userService.getAllUsers({ page: 1, limit: 10, search: 'test' });

      expect(User.find).toHaveBeenCalledWith({
        isActive: true,
        $or: [
          { username: { $regex: 'test', $options: 'i' } },
          { email: { $regex: 'test', $options: 'i' } },
        ],
      });
    });

    it('should handle custom sorting', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };

      (User.find as jest.Mock).mockReturnValue(mockQuery);
      (User.countDocuments as jest.Mock).mockResolvedValue(0);

      await userService.getAllUsers({
        page: 1,
        limit: 10,
        sortBy: 'username',
        sortOrder: 'asc',
      });

      expect(mockQuery.sort).toHaveBeenCalledWith({ username: 1 });
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      mockUserModel.save.mockResolvedValue(mockUserModel);
      mockUserModel.emailVerificationToken = 'valid-token';
      (User.findOne as jest.Mock).mockResolvedValue(mockUserModel);

      const result = await userService.verifyEmail('valid-token');

      expect(User.findOne).toHaveBeenCalledWith({
        emailVerificationToken: 'valid-token',
        isActive: true,
      });
      expect(mockUserModel.isEmailVerified).toBe(true);
      expect(mockUserModel.emailVerificationToken).toBeUndefined();
      expect(mockUserModel.save).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false for invalid token', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const result = await userService.verifyEmail('invalid-token');

      expect(result).toBe(false);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      mockUserModel.comparePassword.mockResolvedValue(true);
      mockUserModel.save.mockResolvedValue(mockUserModel);
      const mockSelect = jest.fn().mockResolvedValue(mockUserModel);
      (User.findById as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await userService.changePassword('user123', {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword',
      });

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockSelect).toHaveBeenCalledWith('+password');
      expect(mockUserModel.comparePassword).toHaveBeenCalledWith('oldpassword');
      expect(mockUserModel.password).toBe('newpassword');
      expect(mockUserModel.save).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false for invalid current password', async () => {
      mockUserModel.comparePassword.mockResolvedValue(false);
      const mockSelect = jest.fn().mockResolvedValue(mockUserModel);
      (User.findById as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await userService.changePassword('user123', {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword',
      });

      expect(result).toBe(false);
      expect(mockUserModel.save).not.toHaveBeenCalled();
    });

    it('should return false when user is not found', async () => {
      const mockSelect = jest.fn().mockResolvedValue(null);
      (User.findById as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await userService.changePassword('nonexistent', {
        currentPassword: 'password',
        newPassword: 'newpassword',
      });

      expect(result).toBe(false);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      mockUserModel.passwordResetToken = 'valid-reset-token';
      mockUserModel.passwordResetExpires = new Date(Date.now() + 3600000);
      mockUserModel.save.mockResolvedValue(mockUserModel);
      (User.findOne as jest.Mock).mockResolvedValue(mockUserModel);

      const result = await userService.resetPassword(
        'valid-reset-token',
        'newpassword'
      );

      expect(User.findOne).toHaveBeenCalledWith({
        passwordResetToken: 'valid-reset-token',
        passwordResetExpires: { $gt: expect.any(Date) },
        isActive: true,
      });
      expect(mockUserModel.password).toBe('newpassword');
      expect(mockUserModel.passwordResetToken).toBeUndefined();
      expect(mockUserModel.passwordResetExpires).toBeUndefined();
      expect(mockUserModel.save).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false for invalid or expired token', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const result = await userService.resetPassword(
        'invalid-token',
        'newpassword'
      );

      expect(result).toBe(false);
    });
  });
});
