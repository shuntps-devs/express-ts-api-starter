import crypto from 'crypto';

import bcrypt from 'bcryptjs';
import { Document, Schema, model } from 'mongoose';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

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

  // Virtual properties
  isLocked: boolean;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  incLoginAttempts(): Promise<unknown>;
  resetLoginAttempts(): Promise<unknown>;
  generatePasswordReset(): { token: string; expires: Date };
  generateEmailVerification(): { token: string; expires: Date };
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

// Composite indexes for better query performance
userSchema.index({ isActive: 1, isEmailVerified: 1 });
userSchema.index({ email: 1, isActive: 1 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function (this: IUser) {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

// Hash password before saving
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

// Compare password method
userSchema.methods.comparePassword = async function (
  this: IUser,
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Increment login attempts method
userSchema.methods.incLoginAttempts = function (this: IUser) {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    });
  }

  const updates: Record<string, unknown> = { $inc: { loginAttempts: 1 } };

  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: new Date(Date.now() + 2 * 60 * 60 * 1000) };
  }

  return this.updateOne(updates);
};

// Reset login attempts method
userSchema.methods.resetLoginAttempts = function (this: IUser) {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: new Date() },
  });
};

// Generate password reset token method
userSchema.methods.generatePasswordReset = function (this: IUser): {
  token: string;
  expires: Date;
} {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  this.passwordResetToken = token;
  this.passwordResetExpires = expires;

  return { token, expires };
};

// Generate email verification token method
userSchema.methods.generateEmailVerification = function (this: IUser): {
  token: string;
  expires: Date;
} {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  this.emailVerificationToken = token;
  this.emailVerificationExpires = expires;

  return { token, expires };
};

// Check user role method
userSchema.methods.hasRole = function (this: IUser, role: UserRole): boolean {
  return this.role === role;
};

// Create and export the model
const User = model<IUser>('User', userSchema);

export default User;
