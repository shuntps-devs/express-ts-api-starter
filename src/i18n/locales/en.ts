export const en = {
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
  auth: {
    invalidToken: 'Invalid authentication token',
    userNotFound: 'User not found',
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
    },
    credentials: {
      invalid: 'Invalid credentials',
    },
    verification: {
      tokenInvalid: 'Invalid or expired email verification token',
    },
    password: {
      resetSent: 'If this email exists, a password reset link has been sent',
      resetTokenInvalid: 'Invalid or expired password reset token',
    },
  },
  error: {
    internalServer: 'Something went wrong',
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
    profileRetrieved: 'Profile retrieved successfully',
    resourceCreated: 'Resource created successfully',
    resourceUpdated: 'Resource updated successfully',
    resourceDeleted: 'Resource deleted successfully',
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
};
