import { logger } from '../config';
import { t } from '../i18n';
import {
  IChangePassword,
  ICreateUserDto,
  IPaginatedResponse,
  ISearchQuery,
  IUpdateUserDto,
  IUserResponse,
} from '../interfaces';
import { IUser, User } from '../models';

export class UserService {
  async createUser(userData: ICreateUserDto): Promise<IUser> {
    const { username, email, password: userPassword, role } = userData;

    logger.info('Creating new user', { email: email.toLowerCase(), username });

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      const errorMessage =
        existingUser.email === email.toLowerCase()
          ? t('auth.email.alreadyExists')
          : t('auth.username.alreadyExists');

      logger.warn('User creation failed - user already exists', {
        email: email.toLowerCase(),
        username,
        reason: errorMessage,
      });

      throw new Error(errorMessage);
    }

    try {
      // Create new user
      const user = new User({
        username,
        email: email.toLowerCase(),
        password: userPassword,
        role: role ?? 'user',
      });

      await user.save();
      logger.info('User created successfully', {
        userId: user._id,
        email: email.toLowerCase(),
        username,
      });

      return user.toObject() as IUser;
    } catch (error) {
      logger.error('Failed to create user', {
        email: email.toLowerCase(),
        username,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async findUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId).select('-password');
  }

  async findUserByEmail(email: string): Promise<IUser | null> {
    return User.findOne({
      email: email.toLowerCase(),
      isActive: true,
    });
  }

  async findUserByUsername(username: string): Promise<IUser | null> {
    return User.findOne({
      username,
      isActive: true,
    });
  }

  async findUserByIdentifier(identifier: string): Promise<IUser | null> {
    return User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
      isActive: true,
    }).select('+password');
  }

  async updateUser(id: string, data: IUpdateUserDto): Promise<IUser | null> {
    const user = await User.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true }
    ).select('-password');
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await User.findByIdAndUpdate(id, {
      isActive: false,
      updatedAt: new Date(),
    });
    return !!result;
  }

  async getAllUsers(
    query: ISearchQuery
  ): Promise<IPaginatedResponse<IUserResponse>> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter: Record<string, unknown> = { isActive: true };
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const userResponses: IUserResponse[] = users.map((user) => ({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return {
      success: true,
      data: userResponses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      timestamp: new Date().toISOString(),
    };
  }

  async verifyEmail(token: string): Promise<boolean> {
    const user = await User.findOne({
      emailVerificationToken: token,
      isActive: true,
    });

    if (!user) {
      return false;
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    return true;
  }

  async changePassword(
    userId: string,
    data: IChangePassword
  ): Promise<boolean> {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return false;
    }

    const isValidCurrentPassword = await user.comparePassword(
      data.currentPassword
    );
    if (!isValidCurrentPassword) {
      return false;
    }

    user.password = data.newPassword;
    await user.save();

    return true;
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
      isActive: true,
    });

    if (!user) {
      return false;
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return true;
  }
}
