# Tests Organization

This directory contains all test files for the Express TypeScript application.

## Structure

```
__tests__/
├── controllers/     # Controller layer tests
├── services/        # Service layer tests
├── utils/           # Utility function tests
├── middleware/      # Middleware tests (future)
├── helpers/         # Test utilities and helpers
│   ├── index.ts     # Barrel export
│   └── test.helper.ts # TestHelper class
└── README.md        # This file
```

## Test Helpers

### TestHelper Class

The `TestHelper` class provides consistent utilities for creating mock objects and test data:

```typescript
import { TestHelper } from '../helpers';

// Create mock Express objects
const mockReq = TestHelper.createMockRequest({ body: { name: 'John' } });
const mockRes = TestHelper.createMockResponse();
const mockNext = TestHelper.createMockNext();

// Create mock users
const mockUser = TestHelper.generateMockUser({ email: 'test@example.com' });

// Generate unique test data
const testEmail = TestHelper.generateTestEmail('user');
const testUsername = TestHelper.generateTestUsername('user');

// Database cleanup (for integration tests)
await TestHelper.clearDatabase();
```

## Best Practices

1. **Use TestHelper**: Always use `TestHelper` methods for creating mock objects instead of manual creation
2. **Consistent Mocking**: Use consistent mocking patterns across all test files
3. **English Only**: All test descriptions, messages, and data should be in English
4. **Clear Structure**: Organize tests with clear describe blocks and descriptive test names
5. **Mock Cleanup**: Always clear mocks in `beforeEach` or `afterEach` hooks

## Naming Conventions

- Test files: `*.test.ts`
- Mock objects: `mock*` (e.g., `mockUser`, `mockResponse`)
- Test data: `Test*` or `*TestData` (e.g., `TestData.validUser`)
- Helper functions: descriptive names in camelCase

## Coverage Goals

- Controllers: 100% line coverage
- Services: 100% line coverage
- Utils: 100% line coverage
- Critical paths: 100% branch coverage
