import mongoose, { Document, Model, Types } from 'mongoose';

/**
 * Device information interface for session tracking
 */
export interface IDeviceInfo {
  browser?: string;
  os?: string;
  device?: string;
}

/**
 * Location information interface for session tracking
 */
export interface ILocation {
  country?: string;
  city?: string;
  region?: string;
}

/**
 * Session document interface extending Mongoose Document
 */
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

  /**
   * Update session's last activity timestamp
   * @returns Promise resolving to updated session
   */
  updateActivity(): Promise<ISession>;

  /**
   * Deactivate the session
   * @returns Promise resolving to updated session
   */
  deactivate(): Promise<ISession>;

  /**
   * Refresh session tokens with new values
   * @param newAccessToken - New access token
   * @param newRefreshToken - New refresh token
   * @param accessTokenExpiresAt - Access token expiration date
   * @param refreshTokenExpiresAt - Refresh token expiration date
   * @returns Promise resolving to updated session
   */
  refreshTokens(
    newAccessToken: string,
    newRefreshToken: string,
    accessTokenExpiresAt: Date,
    refreshTokenExpiresAt: Date
  ): Promise<ISession>;

  /**
   * Check if access token is expired
   * @returns True if access token is expired
   */
  isAccessTokenExpired(): boolean;

  /**
   * Check if refresh token is expired
   * @returns True if refresh token is expired
   */
  isRefreshTokenExpired(): boolean;

  /**
   * Check if session is valid for token refresh
   * @returns True if session can be refreshed
   */
  isValidForRefresh(): boolean;
}

/**
 * Session model interface with static methods
 */
export interface ISessionModel extends Model<ISession> {
  /**
   * Find active sessions for a specific user
   * @param userId - User identifier
   * @returns Promise resolving to array of active sessions
   */
  findActiveByUserId(userId: string | Types.ObjectId): Promise<ISession[]>;

  /**
   * Find session by refresh token
   * @param refreshToken - Refresh token to search for
   * @returns Promise resolving to session or null
   */
  findByRefreshToken(refreshToken: string): Promise<ISession | null>;

  /**
   * Find session by access token
   * @param accessToken - Access token to search for
   * @returns Promise resolving to session or null
   */
  findByAccessToken(accessToken: string): Promise<ISession | null>;

  /**
   * Deactivate all sessions for a specific user
   * @param userId - User identifier
   * @returns Promise resolving to update result
   */
  deactivateAllForUser(
    userId: string | Types.ObjectId
  ): Promise<mongoose.UpdateWriteOpResult>;

  /**
   * Remove expired sessions from database
   * @returns Promise resolving to deletion result
   */
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

/**
 * Composite indexes for better query performance
 */
sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ isActive: 1, expiresAt: 1 });
sessionSchema.index({ refreshToken: 1, isActive: 1 });
sessionSchema.index({ accessToken: 1, isActive: 1 });

/**
 * Instance method to update session activity timestamp
 */
sessionSchema.methods.updateActivity = function (
  this: ISession
): Promise<ISession> {
  this.lastActivity = new Date();
  return this.save();
};

/**
 * Instance method to deactivate session
 */
sessionSchema.methods.deactivate = function (
  this: ISession
): Promise<ISession> {
  this.isActive = false;
  return this.save();
};

/**
 * Instance method to refresh session tokens
 */
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

/**
 * Instance method to check if access token is expired
 */
sessionSchema.methods.isAccessTokenExpired = function (
  this: ISession
): boolean {
  return new Date() >= this.accessTokenExpiresAt;
};

/**
 * Instance method to check if refresh token is expired
 */
sessionSchema.methods.isRefreshTokenExpired = function (
  this: ISession
): boolean {
  return new Date() >= this.refreshTokenExpiresAt;
};

/**
 * Instance method to check if session is valid for refresh
 */
sessionSchema.methods.isValidForRefresh = function (this: ISession): boolean {
  return this.isActive && !this.isRefreshTokenExpired();
};

/**
 * Static method to find active sessions by user ID
 */
sessionSchema.statics.findActiveByUserId = function (
  userId: string | Types.ObjectId
) {
  return this.find({
    userId,
    isActive: true,
    expiresAt: { $gt: new Date() },
  }).sort({ lastActivity: -1 });
};

/**
 * Static method to find session by refresh token
 */
sessionSchema.statics.findByRefreshToken = function (refreshToken: string) {
  return this.findOne({
    refreshToken,
    isActive: true,
    refreshTokenExpiresAt: { $gt: new Date() },
  }).populate('userId');
};

/**
 * Static method to find session by access token
 */
sessionSchema.statics.findByAccessToken = function (accessToken: string) {
  return this.findOne({
    accessToken,
    isActive: true,
    accessTokenExpiresAt: { $gt: new Date() },
  }).populate('userId');
};

/**
 * Static method to deactivate all sessions for a user
 */
sessionSchema.statics.deactivateAllForUser = function (
  userId: string | Types.ObjectId
) {
  return this.updateMany({ userId }, { isActive: false });
};

/**
 * Static method to cleanup expired sessions
 */
sessionSchema.statics.cleanupExpired = function () {
  return this.deleteMany({
    expiresAt: { $lt: new Date() },
  });
};

/**
 * Session model with comprehensive token management and device tracking
 */

const Session = mongoose.model<ISession, ISessionModel>(
  'Session',
  sessionSchema
);

export default Session;
