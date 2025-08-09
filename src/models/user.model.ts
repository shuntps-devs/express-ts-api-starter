import crypto from 'crypto';

import bcrypt from 'bcryptjs';
import { Document, Schema, model } from 'mongoose';

/**
 * Enumeration of user roles in the system
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

/**
 * User document interface extending Mongoose Document
 */
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;

  isLocked: boolean;

  /**
   * Compare provided password with stored hash
   * @param candidatePassword - Password to compare
   * @returns Promise resolving to comparison result
   */
  comparePassword(candidatePassword: string): Promise<boolean>;

  /**
   * Increment failed login attempts and lock account if threshold reached
   * @returns Promise resolving to update result
   */
  incLoginAttempts(): Promise<unknown>;

  /**
   * Reset login attempts counter and update last login timestamp
   * @returns Promise resolving to update result
   */
  resetLoginAttempts(): Promise<unknown>;

  /**
   * Generate password reset token and expiration date
   * @returns Object containing token and expiration date
   */
  generatePasswordReset(): { token: string; expires: Date };

  /**
   * Generate email verification token and expiration date
   * @returns Object containing token and expiration date
   */
  generateEmailVerification(): { token: string; expires: Date };

  /**
   * Check if user has specific role
   * @param role - Role to check
   * @returns True if user has the role
   */
  hasRole(role: UserRole): boolean;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
      minlength: 6,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    emailVerificationToken: {
      type: String,
      sparse: true,
      index: true,
    },
    emailVerificationExpires: {
      type: Date,
      index: { expireAfterSeconds: 0 },
    },
    passwordResetToken: {
      type: String,
      sparse: true,
      index: true,
    },
    passwordResetExpires: {
      type: Date,
      index: { expireAfterSeconds: 0 },
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
    lastLogin: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Composite indexes for better query performance
 */
userSchema.index({ isActive: 1, isEmailVerified: 1 });
userSchema.index({ email: 1, isActive: 1 });

/**
 * Virtual property for account lock status
 */
userSchema.virtual('isLocked').get(function (this: IUser) {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

/**
 * Pre-save middleware to hash password before storing
 */
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Instance method to compare provided password with stored hash
 */
userSchema.methods.comparePassword = async function (
  this: IUser,
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Instance method to increment login attempts with account locking logic
 */
userSchema.methods.incLoginAttempts = function (this: IUser) {
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    });
  }

  const updates: Record<string, unknown> = { $inc: { loginAttempts: 1 } };

  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: new Date(Date.now() + 2 * 60 * 60 * 1000) };
  }

  return this.updateOne(updates);
};

/**
 * Instance method to reset login attempts and update last login
 */
userSchema.methods.resetLoginAttempts = function (this: IUser) {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: new Date() },
  });
};

/**
 * Instance method to generate password reset token
 */
userSchema.methods.generatePasswordReset = function (this: IUser): {
  token: string;
  expires: Date;
} {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 10 * 60 * 1000);

  this.passwordResetToken = token;
  this.passwordResetExpires = expires;

  return { token, expires };
};

/**
 * Instance method to generate email verification token
 */
userSchema.methods.generateEmailVerification = function (this: IUser): {
  token: string;
  expires: Date;
} {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  this.emailVerificationToken = token;
  this.emailVerificationExpires = expires;

  return { token, expires };
};

/**
 * Instance method to check if user has specific role
 */
userSchema.methods.hasRole = function (this: IUser, role: UserRole): boolean {
  return this.role === role;
};

/**
 * User model with comprehensive authentication and security features
 */
const User = model<IUser>('User', userSchema);

export default User;
