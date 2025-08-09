# 🧪 Tests Organization

This directory contains all test files for the Express TypeScript Starter application.

## 📊 Coverage Overview

```
Overall Coverage: 65.6%
Total Tests: 221 across 14 test suites
Test Files: 15 (100% passing)
```

## 📁 Structure

```
__tests__/
├── controllers/            # API endpoint tests (2 suites)
│   ├── auth.controller.test.ts     # Authentication endpoints
│   └── user.controller.test.ts     # User management endpoints
├── services/              # Business logic tests (3 suites)
│   ├── session.service.test.ts     # JWT session management
│   ├── token.service.test.ts       # Token generation & validation
│   └── user.service.test.ts        # User operations
├── middleware/            # Complete middleware testing (7 suites)
│   ├── async-handler.test.ts       # Async error handling (9 tests)
│   ├── audit.middleware.test.ts    # Audit logging (12 tests)
│   ├── auth.middleware.test.ts     # JWT authentication (20 tests)
│   ├── context.middleware.test.ts  # User context enrichment (17 tests)
│   ├── error-handler.test.ts       # Global error handling (13 tests)
│   ├── security.test.ts            # Security headers & CORS (12 tests)
│   └── validate-request.test.ts    # Zod validation (14 tests)
├── utils/                 # Utility function tests (1 suite)
│   └── response.helper.test.ts     # Response formatting utilities
├── helpers/               # Test utilities and helpers
│   ├── index.ts                    # Barrel exports
│   └── test.helper.ts              # TestHelper class utilities
├── server.test.ts         # Integration tests (1 suite)
└── README.md              # This documentation
```

## 🎯 Coverage Breakdown

### High Coverage Areas (80%+)

- **Middleware Layer**: 84.92% - Complete middleware testing
- **Service Layer**: 89.55% - Business logic coverage
- **Authentication**: 100% - JWT flow testing
- **Validation**: 100% - Request validation testing

### Areas for Improvement

- **Models**: 49.59% - Database schema testing
- **Routes**: 0% - Route configuration testing
- **Utils**: 53.16% - Utility function testing

## 🛠️ Test Helpers

### TestHelper Class

The `TestHelper` class provides consistent utilities for creating mock objects and test data:

```typescript
import { TestHelper } from '../helpers';

// Create mock Express context (req, res, next)
const { req, res, next } = TestHelper.createMockContext();

// Create individual mock objects
const mockReq = TestHelper.createMockRequest({ body: { name: 'John' } });
const mockRes = TestHelper.createMockResponse();
const mockNext = TestHelper.createMockNext();

// Generate test users with custom properties
const mockUser = TestHelper.generateMockUser({
  email: 'test@example.com',
  role: 'admin',
});

// Generate unique test identifiers
const testEmail = TestHelper.generateTestEmail('user');

// Database utilities (for integration tests)
await TestHelper.clearDatabase();
```

## ✅ Best Practices

1. **Use TestHelper**: Always use `TestHelper` methods for creating mock objects
2. **Consistent Mocking**: Use consistent patterns across all test files
3. **English Only**: All test descriptions and data in English (per project standards)
4. **Clear Structure**: Organize tests with descriptive `describe` blocks
5. **Mock Cleanup**: Clear mocks in `beforeEach`/`afterEach` hooks
6. **Coverage Focus**: Prioritize testing critical paths and business logic

## 📝 Naming Conventions

- **Test files**: `*.test.ts`
- **Mock objects**: `mock*` (e.g., `mockUser`, `mockResponse`)
- **Test data**: `test*` or `*TestData` (e.g., `testUserData`)
- **Helper functions**: descriptive camelCase names

## 🎯 Coverage Goals

### Current Status

- [x] Controllers: 66.12% (Good API endpoint coverage)
- [x] Services: 89.55% (Excellent business logic coverage)
- [x] Middleware: 84.92% (Complete middleware testing)
- [ ] Models: 49.59% (Needs improvement)
- [ ] Routes: 0% (Not tested - configuration files)
- [ ] Utils: 53.16% (Partial utility coverage)

### Target Coverage

- **Critical paths**: 100% branch coverage
- **Business logic**: 90%+ line coverage
- **API endpoints**: 80%+ integration coverage
- **Security middleware**: 100% coverage (achieved)
