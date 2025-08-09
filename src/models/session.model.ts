import mongoose, { Document, Model, Types } from 'mongoose';

export interface IDeviceInfo {
  browser?: string;
  os?: string;
  device?: string;
}

export interface ILocation {
  country?: string;
  city?: string;
  region?: string;
}

export interface ISession extends Document {
  userId: Types.ObjectId;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  ipAddress: string;
  userAgent: string;
  deviceInfo: IDeviceInfo;
  location: ILocation;
  isActive: boolean;
  lastActivity: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;

  updateActivity(): Promise<ISession>;
  deactivate(): Promise<ISession>;
  refreshTokens(
    newAccessToken: string,
    newRefreshToken: string,
    accessTokenExpiresAt: Date,
    refreshTokenExpiresAt: Date
  ): Promise<ISession>;
  isAccessTokenExpired(): boolean;
  isRefreshTokenExpired(): boolean;
  isValidForRefresh(): boolean;
}

export interface ISessionModel extends Model<ISession> {
  findActiveByUserId(userId: string | Types.ObjectId): Promise<ISession[]>;
  findByRefreshToken(refreshToken: string): Promise<ISession | null>;
  findByAccessToken(accessToken: string): Promise<ISession | null>;
  deactivateAllForUser(
    userId: string | Types.ObjectId
  ): Promise<mongoose.UpdateWriteOpResult>;
  cleanupExpired(): Promise<mongoose.mongo.DeleteResult>;
}

const sessionSchema = new mongoose.Schema<ISession>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    accessToken: {
      type: String,
      required: true,
      index: true,
    },
    refreshToken: {
      type: String,
      required: true,
      unique: true,
    },
    accessTokenExpiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    refreshTokenExpiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },

    deviceInfo: {
      browser: String,
      os: String,
      device: String,
    },
    location: {
      country: String,
      city: String,
      region: String,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
      index: -1,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Composite indexes for better query performance
sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ isActive: 1, expiresAt: 1 });
sessionSchema.index({ refreshToken: 1, isActive: 1 });
sessionSchema.index({ accessToken: 1, isActive: 1 });

sessionSchema.methods.updateActivity = function (
  this: ISession
): Promise<ISession> {
  this.lastActivity = new Date();
  return this.save();
};

sessionSchema.methods.deactivate = function (
  this: ISession
): Promise<ISession> {
  this.isActive = false;
  return this.save();
};

sessionSchema.methods.refreshTokens = function (
  this: ISession,
  newAccessToken: string,
  newRefreshToken: string,
  accessTokenExpiresAt: Date,
  refreshTokenExpiresAt: Date
): Promise<ISession> {
  this.accessToken = newAccessToken;
  this.refreshToken = newRefreshToken;
  this.accessTokenExpiresAt = accessTokenExpiresAt;
  this.refreshTokenExpiresAt = refreshTokenExpiresAt;
  this.lastActivity = new Date();
  return this.save();
};

sessionSchema.methods.isAccessTokenExpired = function (
  this: ISession
): boolean {
  return new Date() >= this.accessTokenExpiresAt;
};

sessionSchema.methods.isRefreshTokenExpired = function (
  this: ISession
): boolean {
  return new Date() >= this.refreshTokenExpiresAt;
};

sessionSchema.methods.isValidForRefresh = function (this: ISession): boolean {
  return this.isActive && !this.isRefreshTokenExpired();
};

sessionSchema.statics.findActiveByUserId = function (
  userId: string | Types.ObjectId
) {
  return this.find({
    userId,
    isActive: true,
    expiresAt: { $gt: new Date() },
  }).sort({ lastActivity: -1 });
};

sessionSchema.statics.findByRefreshToken = function (refreshToken: string) {
  return this.findOne({
    refreshToken,
    isActive: true,
    refreshTokenExpiresAt: { $gt: new Date() },
  }).populate('userId');
};

sessionSchema.statics.findByAccessToken = function (accessToken: string) {
  return this.findOne({
    accessToken,
    isActive: true,
    accessTokenExpiresAt: { $gt: new Date() },
  }).populate('userId');
};

sessionSchema.statics.deactivateAllForUser = function (
  userId: string | Types.ObjectId
) {
  return this.updateMany({ userId }, { isActive: false });
};

sessionSchema.statics.cleanupExpired = function () {
  return this.deleteMany({
    expiresAt: { $lt: new Date() },
  });
};

const Session = mongoose.model<ISession, ISessionModel>(
  'Session',
  sessionSchema
);

export default Session;
