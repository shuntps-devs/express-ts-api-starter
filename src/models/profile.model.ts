import mongoose, { Document, Model, Types } from 'mongoose';

export interface IAvatarData {
  url?: string;
  publicId?: string;
  uploadedAt?: Date;
}

export interface ITwoFactorAuth {
  isEnabled: boolean;
  secret?: string;
  backupCodes: string[];
  enabledAt?: Date;
}

export interface IPreferences {
  twoFactorAuth: ITwoFactorAuth;
}

export interface IProfile extends Document {
  userId: Types.ObjectId;
  avatar?: IAvatarData;
  bio: string;
  preferences: IPreferences;
  createdAt: Date;
  updatedAt: Date;

  updateAvatar(avatarData: Partial<IAvatarData>): Promise<IProfile>;
  removeAvatar(): Promise<IProfile>;
  updatePreferences(newPreferences: Partial<IPreferences>): Promise<IProfile>;
  enable2FA(secret: string, backupCodes: string[]): Promise<IProfile>;
  disable2FA(): Promise<IProfile>;
}

export interface IProfileModel extends Model<IProfile> {
  findByUserId(userId: string | Types.ObjectId): Promise<IProfile | null>;
  updateByUserId(
    userId: string | Types.ObjectId,
    updateData: Partial<IProfile>
  ): Promise<IProfile | null>;
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

profileSchema.index({ createdAt: -1 });

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

profileSchema.methods.removeAvatar = function (
  this: IProfile
): Promise<IProfile> {
  this.avatar = undefined;
  return this.save();
};

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

profileSchema.statics.findByUserId = function (
  userId: string | Types.ObjectId
) {
  return this.findOne({ userId }).populate('userId', 'username email');
};

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

const Profile = mongoose.model<IProfile, IProfileModel>(
  'Profile',
  profileSchema
);

export default Profile;
