/**
 * Profile creation data transfer object
 */
export interface ICreateProfileDto {
  username?: string;
  bio?: string;
  avatar?: {
    url?: string;
    publicId?: string;
  };
}

/**
 * Profile update data transfer object
 */
export interface IUpdateProfileDto {
  bio?: string;
  avatar?: {
    url?: string;
    publicId?: string;
    uploadedAt?: Date;
  };
  preferences?: {
    twoFactorAuth?: {
      isEnabled?: boolean;
      secret?: string;
      backupCodes?: string[];
      enabledAt?: Date;
    };
  };
}

/**
 * Profile response interface for API responses
 */
export interface IProfileResponse {
  id: string;
  userId: string;
  bio: string;
  avatar?: {
    url: string;
    publicId?: string;
    uploadedAt: Date;
  };
  preferences: {
    twoFactorAuth: {
      isEnabled: boolean;
      enabledAt?: Date;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}
