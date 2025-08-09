import path from 'path';

import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load test environment variables from .env.test
dotenv.config({ path: path.join(__dirname, '.env.test') });

// Mock the database connection
jest.mock('../config/database', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
  disconnectDB: jest.fn().mockResolvedValue(undefined),
}));

// Mock Winston logger globally
jest.mock('../config/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Global test setup
beforeAll(() => {
  // Any global setup can go here
  // eslint-disable-next-line no-console
  console.log('🧪 Starting test suite...');
});

afterAll(async () => {
  // Close any open connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  // eslint-disable-next-line no-console
  console.log('✅ Test suite completed');
});

// Reset all mocks between tests
afterEach(() => {
  jest.clearAllMocks();
});

// Increase timeout for integration tests
jest.setTimeout(30000);

export {};
