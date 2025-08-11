/**
 * English language translations
 * Contains all text content for the English locale
 * @description Provides structured translations for API responses, errors, validation messages, and system notifications
 */
export const en = {
  api: {
    service: {
      name: 'Express TypeScript API',
    },
    welcome: {
      message: 'Welcome to Express TypeScript API',
    },
  },
  server: {
    startup: {
      success: 'Server running in {{env}} mode on http://localhost:{{port}}',
      failure: 'Failed to start server',
    },
    shutdown: {
      start: 'Received {{signal}}. Starting graceful shutdown...',
      timeout: 'Server shutdown timeout reached',
      connections: 'Active connections before shutdown: {{count}}',
      waiting: 'Waiting for active connections to close...',
      success: 'Server closed successfully',
      completed: 'Graceful shutdown completed',
      error: 'Error during graceful shutdown',
    },
  },
  database: {
    connected: 'MongoDB Connected: {{host}}',
    error: 'Error connecting to MongoDB',
    disconnected: 'MongoDB disconnected',
    connectionFailed: 'Failed to connect to MongoDB',
    continuingWithoutDb: 'Continuing without database in development mode',
  },
  middleware: {
    requestLoggingConfigured: 'Request logging configured',
    securityConfigured: 'Security middleware configured',
    rateLimitExceeded:
      'Too many requests from this IP, please try again later.',
  },
  auth: {
    invalidToken: 'Invalid authentication token',
    userNotFound: 'User not found',
    refreshTokenRequired: 'Refresh token required',
    invalidRefreshToken: 'Invalid or expired refresh token',
    authenticationRequired: 'Authentication required',
    sessionExpired: 'Session expired. Please login again.',
    authenticationError: 'Authentication error',
    accessTokenRequired: 'Access token required',
    invalidOrExpiredToken: 'Invalid or expired token',
    insufficientPermissions: 'Insufficient permissions',
    email: {
      alreadyExists: 'Email already exists',
      alreadyVerified: 'Email is already verified',
    },
    username: {
      alreadyExists: 'Username already exists',
    },
    account: {
      locked:
        'Account is temporarily locked due to too many failed login attempts',
      inactive: 'Account is inactive. Cannot perform email operations.',
    },
    credentials: {
      invalid: 'Invalid credentials',
    },
    token: {
      invalidOrExpired: 'Invalid or expired token',
    },
    verification: {
      tokenInvalid: 'Invalid or expired email verification token',
      required:
        'Email verification required. Please verify your email before accessing this resource.',
      requiredWithDays: 'Your account has been active for {{days}} days.',
    },
    password: {
      resetSent: 'If this email exists, a password reset link has been sent',
      resetTokenInvalid: 'Invalid or expired password reset token',
    },
  },
  error: {
    internalServer: 'Something went wrong',
    payloadTooLarge: 'Request entity too large',
    validation: {
      invalidInput: 'Invalid input data',
    },
  },
  env: {
    validationError: 'Environment validation failed',
  },
  success: {
    userCreated:
      'User created successfully. Please check your email to verify your account.',
    loginSuccessful: 'Login successful',
    logoutSuccessful: 'Logout successful',
    logoutAllSuccessful: 'Logged out from all devices successfully',
    tokenRefreshed: 'Token refreshed successfully',
    sessionsRetrieved: 'Sessions retrieved successfully',
    profileRetrieved: 'Profile retrieved successfully',
    resourceCreated: 'Resource created successfully',
    resourceUpdated: 'Resource updated successfully',
    resourceDeleted: 'Resource deleted successfully',
    statisticsRetrieved: 'Statistics retrieved successfully',
    cleanupCompleted: 'Cleanup completed successfully',
    emailVerified: 'Email verified successfully',
    verificationEmailSent: 'Verification email sent successfully',
    verificationEmailSentIfExists:
      'If the email exists, verification email has been sent',
  },
  errors: {
    badRequest: 'Bad Request',
    unauthorized: 'Unauthorized',
    forbidden: 'Forbidden',
    resourceNotFound: 'Resource not found',
    conflict: 'Conflict',
    validationFailed: 'Validation failed',
    tooManyRequests: 'Too many requests',
    internalServerError: 'Internal server error',
  },
  validation: {
    email: {
      invalid: 'Invalid email format',
      required: 'Email is required',
    },
    password: {
      minLength: 'Password must be at least {{min}} characters',
      complexity:
        'Password must contain at least one uppercase, lowercase and number',
      required: 'Password is required',
      current: 'Current password is required',
    },
    username: {
      minLength: 'Username must be at least {{min}} characters',
      maxLength: 'Username must be at most {{max}} characters',
      required: 'Username is required',
    },
    token: {
      required: 'Token is required',
      resetRequired: 'Reset token is required',
      verificationRequired: 'Verification token is required',
    },
    identifier: {
      required: 'Email or username is required',
    },
  },
  email: {
    verification: {
      subject: 'Verify your email for {{appName}}',
      title: 'Email Verification',
      greeting: 'Hello {{username}}',
      intro: 'Thank you for signing up for <strong>{{appName}}</strong>',
      instruction: 'To activate your account, please click the button below',
      button: 'Verify Email',
      expiration: 'This link expires in {{time}}',
      ignore:
        "If you didn't create an account, you can safely ignore this email",
      buttonFallback: "If the button doesn't work, copy this link",
      support: 'Need help? Contact us',
    },
    welcome: {
      subject: 'Welcome to {{appName}}!',
      title: 'Welcome',
      greeting: 'Welcome {{username}}!',
      intro:
        'Your email has been verified successfully. Your account is now active',
      instruction:
        'You can now enjoy all the features of <strong>{{appName}}</strong>',
      button: 'Login Now',
      support: 'Need help? Our support team is here for you',
    },
    passwordReset: {
      subject: 'Password Reset - {{appName}}',
      title: 'Password Reset',
      greeting: 'Hello {{username}}',
      intro: 'You requested a password reset for your {{appName}} account',
      button: 'Reset Password',
      expiration: 'This link expires in {{time}}',
      ignore: "If you didn't request this reset, please ignore this email",
      support: 'Support',
    },
    service: {
      sendSuccess: 'Email sent successfully',
      sendFailure: 'Failed to send email',
      sendFailed: 'Failed to send verification email',
      serviceError: 'Email service error',
      sending: 'Sending email',
      sendingFailed: 'Email sending failed',
    },
  },
  profile: {
    alreadyExists: 'Profile already exists',
    creationFailed: 'Failed to create profile',
    updateFailed: 'Failed to update profile',
    deletionFailed: 'Failed to delete profile',
    avatarUpdateFailed: 'Failed to update profile avatar',
    avatarRemovalFailed: 'Failed to remove profile avatar',
    notFound: 'Profile not found',
    retrieved: 'Profile retrieved successfully',
    created: 'Profile created successfully',
    updated: 'Profile updated successfully',
    deleted: 'Profile deleted successfully',
  },
  avatar: {
    directoryCreationFailed: 'Failed to create avatar directory',
    invalidFormat: 'Invalid file format. Allowed formats: JPG, JPEG, PNG, WEBP',
    fileTooLarge: 'File size exceeds maximum limit of 5MB',
    uploadFailed: 'Failed to upload avatar',
    profileUpdateFailed: 'Failed to update profile with avatar',
    removalFailed: 'Failed to remove avatar',
    uploaded: 'Avatar uploaded successfully',
    removed: 'Avatar removed successfully',
    retrieved: 'Avatar retrieved successfully',
    uploadLimits: 'Avatar upload limits retrieved successfully',
  },
};
