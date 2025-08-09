import mongoose, { Document, Model, Types } from 'mongoose';

/**
 * Avatar data interface for user profile
 */
export interface IAvatarData {
  url?: string;
  publicId?: string;
  uploadedAt?: Date;
}

/**
 * Two-factor authentication configuration interface
 */
export interface ITwoFactorAuth {
  isEnabled: boolean;
  secret?: string;
  backupCodes: string[];
  enabledAt?: Date;
}

/**
 * User preferences interface
 */
export interface IPreferences {
  twoFactorAuth: ITwoFactorAuth;
}

/**
 * Profile document interface extending Mongoose Document
 */
export interface IProfile extends Document {
  userId: Types.ObjectId;
  avatar?: IAvatarData;
  bio: string;
  preferences: IPreferences;
  createdAt: Date;
  updatedAt: Date;

  /**
   * Update user avatar data
   * @param avatarData - Partial avatar data to update
   * @returns Promise resolving to updated profile
   */
  updateAvatar(avatarData: Partial<IAvatarData>): Promise<IProfile>;

  /**
   * Remove user avatar
   * @returns Promise resolving to updated profile
   */
  removeAvatar(): Promise<IProfile>;

  /**
   * Update user preferences
   * @param newPreferences - Partial preferences data to update
   * @returns Promise resolving to updated profile
   */
  updatePreferences(newPreferences: Partial<IPreferences>): Promise<IProfile>;

  /**
   * Enable two-factor authentication
   * @param secret - 2FA secret key
   * @param backupCodes - Array of backup codes
   * @returns Promise resolving to updated profile
   */
  enable2FA(secret: string, backupCodes: string[]): Promise<IProfile>;

  /**
   * Disable two-factor authentication
   * @returns Promise resolving to updated profile
   */
  disable2FA(): Promise<IProfile>;
}

/**
 * Profile model interface with static methods
 */
export interface IProfileModel extends Model<IProfile> {
  /**
   * Find profile by user ID
   * @param userId - User identifier
   * @returns Promise resolving to profile or null
   */
  findByUserId(userId: string | Types.ObjectId): Promise<IProfile | null>;

  /**
   * Update profile by user ID
   * @param userId - User identifier
   * @param updateData - Partial profile data to update
   * @returns Promise resolving to updated profile or null
   */
  updateByUserId(
    userId: string | Types.ObjectId,
    updateData: Partial<IProfile>
  ): Promise<IProfile | null>;

  /**
   * Cleanup inactive profiles older than specified days
   * @param daysSinceLastActivity - Number of days for cleanup threshold
   * @returns Promise resolving to deletion result
   */
  cleanupInactiveProfiles(
    daysSinceLastActivity: number
  ): Promise<mongoose.mongo.DeleteResult>;
}

const profileSchema = new mongoose.Schema<IProfile>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    avatar: {
      url: String,
      publicId: String,
      uploadedAt: Date,
    },
    bio: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500,
    },
    preferences: {
      twoFactorAuth: {
        isEnabled: { type: Boolean, default: false },
        secret: String,
        backupCodes: [String],
        enabledAt: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Index for better query performance on creation date
 */
profileSchema.index({ createdAt: -1 });

/**
 * Instance method to update user avatar
 */
profileSchema.methods.updateAvatar = function (
  this: IProfile,
  avatarData: Partial<IAvatarData>
): Promise<IProfile> {
  this.avatar = {
    ...this.avatar,
    ...avatarData,
    uploadedAt: new Date(),
  };
  return this.save();
};

/**
 * Instance method to remove user avatar
 */
profileSchema.methods.removeAvatar = function (
  this: IProfile
): Promise<IProfile> {
  this.avatar = undefined;
  return this.save();
};

/**
 * Instance method to update user preferences
 */
profileSchema.methods.updatePreferences = function (
  this: IProfile,
  newPreferences: Partial<IPreferences>
): Promise<IProfile> {
  if (newPreferences.twoFactorAuth) {
    this.preferences.twoFactorAuth = {
      ...this.preferences.twoFactorAuth,
      ...newPreferences.twoFactorAuth,
    };
  }
  this.markModified('preferences');
  return this.save();
};

/**
 * Instance method to enable two-factor authentication
 */
profileSchema.methods.enable2FA = function (
  this: IProfile,
  secret: string,
  backupCodes: string[]
): Promise<IProfile> {
  this.preferences.twoFactorAuth = {
    isEnabled: true,
    secret,
    backupCodes,
    enabledAt: new Date(),
  };
  return this.save();
};

/**
 * Instance method to disable two-factor authentication
 */
profileSchema.methods.disable2FA = function (
  this: IProfile
): Promise<IProfile> {
  this.preferences.twoFactorAuth = {
    isEnabled: false,
    secret: undefined,
    backupCodes: [],
    enabledAt: undefined,
  };
  return this.save();
};

/**
 * Static method to find profile by user ID
 */
profileSchema.statics.findByUserId = function (
  userId: string | Types.ObjectId
) {
  return this.findOne({ userId }).populate('userId', 'username email');
};

/**
 * Static method to update profile by user ID
 */
profileSchema.statics.updateByUserId = function (
  userId: string | Types.ObjectId,
  updateData: Partial<IProfile>
) {
  return this.findOneAndUpdate({ userId }, updateData, {
    new: true,
    upsert: true,
    runValidators: true,
  });
};

/**
 * Static method to cleanup inactive profiles
 */
profileSchema.statics.cleanupInactiveProfiles = function (
  daysSinceLastActivity: number = 365
) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastActivity);

  return this.deleteMany({
    updatedAt: { $lt: cutoffDate },
    'preferences.twoFactorAuth.isEnabled': false,
  });
};

/**
 * Profile model with user preferences and avatar management
 */

const Profile = mongoose.model<IProfile, IProfileModel>(
  'Profile',
  profileSchema
);

export default Profile;
