# 🛠️ Development Guide

A comprehensive guide for developing, testing, and contributing to the **Express TypeScript Starter** project.

## 📋 Development Workflow

### 1. Getting Started

```bash
# Clone and setup
git clone https://github.com/shuntps/express-typescript-starter.git
cd express-typescript-starter
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start development
npm run dev
```

### 2. Development Process

1. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes** following our [coding standards](#coding-standards)

3. **Test Your Changes**

   ```bash
   npm test
   npm run lint
   npm run type-check
   ```

4. **Commit Changes**

   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create Pull Request on GitHub
   ```

## 🏗️ Project Architecture

### Directory Structure

```
src/
├── 📁 controllers/          # Route handlers & API logic
│   ├── auth.controller.ts   # Authentication endpoints
│   └── user.controller.ts   # User management
├── 📁 services/            # Business logic layer
│   ├── user.service.ts     # User operations
│   ├── session.service.ts  # Session management
│   └── token.service.ts    # JWT operations
├── 📁 models/              # Database schemas
│   ├── user.model.ts       # User schema
│   ├── session.model.ts    # Session tracking
│   └── profile.model.ts    # Extended profiles
├── 📁 middleware/          # Express middleware
│   ├── auth.middleware.ts  # Authentication
│   ├── security.middleware.ts # Security headers
│   ├── audit.middleware.ts # Logging
│   └── error-handler.ts    # Error handling
├── 📁 routes/              # Route definitions
│   ├── auth.routes.ts      # Auth endpoints
│   └── user.routes.ts      # User endpoints
├── 📁 schemas/             # Validation schemas
│   ├── auth/               # Auth validations
│   └── user/               # User validations
├── 📁 utils/               # Helper functions
│   ├── response.helper.ts  # API responses
│   └── date.helper.ts      # Date utilities
├── 📁 config/              # Configuration
│   ├── env.ts              # Environment variables
│   ├── logger.ts           # Winston setup
│   └── database.ts         # MongoDB connection
├── 📁 i18n/                # Internationalization
│   └── locales/            # Language files
└── 📁 __tests__/           # Test suites
    ├── controllers/        # Controller tests
    ├── services/           # Service tests
    └── helpers/            # Test utilities
```

### Architecture Patterns

#### 1. **Controller Pattern**

Controllers handle HTTP requests and responses:

```typescript
export class AuthController {
  private userService: UserService;

  public register = asyncHandler(async (req: Request, res: Response) => {
    const userData: ICreateUserDto = req.body;

    // Business logic is delegated to service
    const user = await this.userService.createUser(userData);

    // Response handled by helper
    ResponseHelper.sendCreated(res, user, 'User created successfully');
  });
}
```

#### 2. **Service Pattern**

Services contain business logic:

```typescript
export class UserService {
  async createUser(userData: ICreateUserDto): Promise<IUser> {
    // Validation and business rules
    const existingUser = await this.findUserByIdentifier(userData.email);
    if (existingUser) {
      throw new ConflictError('User already exists');
    }

    // Database interaction
    return await User.create(userData);
  }
}
```

#### 3. **Middleware Pattern**

Middleware for cross-cutting concerns:

```typescript
export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token = TokenService.extractAccessToken(req);
    const user = await TokenService.validateAccessToken(token);

    req.user = user;
    next();
  }
);
```

## 🧪 Testing

### Testing Strategy

We use **Jest** with comprehensive testing at multiple levels:

1. **Unit Tests** - Individual functions/methods
2. **Integration Tests** - API endpoints
3. **Service Tests** - Business logic
4. **Middleware Tests** - Request/response flow

### Running Tests

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- auth.controller.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should register user"
```

### Writing Tests

#### Controller Tests

```typescript
describe('AuthController', () => {
  describe('POST /register', () => {
    it('should register user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(userData.email);
    });

    it('should handle validation errors', async () => {
      const invalidData = { email: 'invalid' };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
```

#### Service Tests

```typescript
describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  describe('createUser', () => {
    it('should create user with hashed password', async () => {
      const userData = TestHelper.generateMockUser();

      const user = await userService.createUser(userData);

      expect(user.email).toBe(userData.email);
      expect(user.password).not.toBe(userData.password); // Should be hashed
    });
  });
});
```

### Test Helpers

Use the `TestHelper` class for consistent test data:

```typescript
import { TestHelper } from '../helpers/test.helper';

// Generate mock user
const mockUser = TestHelper.generateMockUser({
  email: 'custom@example.com',
  username: 'customuser',
});

// Generate test JWT
const token = TestHelper.generateTestToken(userId);

// Create test request
const mockRequest = TestHelper.createMockRequest({
  body: { email: 'test@example.com' },
});
```

## 📝 Coding Standards

### TypeScript Configuration

We use **strict TypeScript** configuration:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### ESLint Rules

Key linting rules enforced:

```json
{
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### Code Style Guidelines

#### 1. **Naming Conventions**

```typescript
// Classes: PascalCase
export class UserService {}

// Functions/Variables: camelCase
const getUserById = () => {};
let currentUser: IUser;

// Constants: UPPER_SNAKE_CASE
const JWT_SECRET = process.env.JWT_SECRET;

// Interfaces: PascalCase with 'I' prefix
interface IUser {
  id: string;
  email: string;
}

// Enums: PascalCase
enum UserRole {
  Admin = 'admin',
  User = 'user',
}
```

#### 2. **File Organization**

```typescript
// 1. External imports
import express from 'express';
import { Request, Response } from 'express';

// 2. Internal imports (relative paths)
import { logger } from '../config';
import { UserService } from '../services';

// 3. Types/Interfaces
interface IControllerOptions {
  // ...
}

// 4. Implementation
export class AuthController {
  // ...
}
```

#### 3. **Error Handling**

```typescript
// Use custom error classes
throw new ValidationError('Invalid email format');
throw new NotFoundError('User not found');
throw new UnauthorizedError('Authentication required');

// Async error handling with wrapper
export const register = asyncHandler(async (req: Request, res: Response) => {
  // This will automatically catch and forward errors
  const user = await userService.createUser(req.body);
  ResponseHelper.sendCreated(res, user, 'User created');
});
```

#### 4. **Response Formatting**

```typescript
// Always use ResponseHelper for consistent responses
ResponseHelper.sendSuccess(res, data, 200, 'Success message');
ResponseHelper.sendError(res, error, 400, 'Error message');
ResponseHelper.sendCreated(res, data, 'Resource created');
```

### Database Patterns

#### 1. **Model Definition**

```typescript
const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  // ... other fields
});

// Instance methods
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Static methods
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email });
};
```

#### 2. **Service Layer Database Access**

```typescript
export class UserService {
  async findUserById(id: string): Promise<IUser | null> {
    try {
      return await User.findById(id);
    } catch (error) {
      logger.error('Error finding user by ID', { id, error });
      throw new DatabaseError('Failed to find user');
    }
  }
}
```

## 🔧 Development Tools

### VS Code Extensions

Recommended extensions (auto-installed):

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json"
  ]
}
```

### Git Hooks

Pre-commit hooks automatically run:

```bash
# Before each commit
npm run lint:fix    # Fix linting issues
npm run format      # Format code
npm run type-check  # Check types

# Before each push
npm test           # Run test suite
```

### Environment Management

```bash
# Development
NODE_ENV=development npm run dev

# Staging
NODE_ENV=staging npm start

# Production
NODE_ENV=production npm start

# Force language
DEFAULT_LANGUAGE=en npm run dev
DEFAULT_LANGUAGE=fr npm run dev
```

## 🔍 Debugging

### Debug Configuration

VS Code debug configuration (`.vscode/launch.json`):

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/server.ts",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal"
    }
  ]
}
```

### Logging

Use structured logging with Winston:

```typescript
import { logger } from '../config';

// Info level
logger.info('User registered successfully', {
  userId: user.id,
  email: user.email,
  requestId,
});

// Warning level
logger.warn('Invalid login attempt', {
  email: loginData.email,
  ip: req.ip,
  userAgent: req.get('User-Agent'),
});

// Error level
logger.error('Database connection failed', {
  error: error.message,
  stack: error.stack,
});
```

### Debug API with cURL

```bash
# Test with verbose output
curl -v -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test@example.com","password":"password123"}'

# Save cookies for subsequent requests
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test@example.com","password":"password123"}'

# Use saved cookies
curl -b cookies.txt http://localhost:3000/api/auth/profile
```

## 🔄 CI/CD Integration

### GitHub Actions

Our CI/CD pipeline runs on every push and PR:

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint:check

      - name: Run type checking
        run: npm run type-check

      - name: Run tests
        run: npm run test:ci
```

### Local CI Simulation

Run the complete CI pipeline locally:

```bash
# Full CI pipeline
npm run ci

# Individual steps
npm run lint:check
npm run type-check
npm run test:ci
npm run validate
```

## 🔐 Security Considerations

### Input Validation

Always validate inputs using Zod schemas:

```typescript
import { z } from 'zod';

const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8),
});

// In route handler
router.post(
  '/register',
  validateRequest({ body: registerSchema }),
  controller.register
);
```

### Authentication

Never store plain text passwords:

```typescript
// Hash password before saving
const hashedPassword = await bcrypt.hash(password, 12);

// Always exclude password from queries
const user = await User.findById(id).select('-password');
```

### Environment Variables

Never commit secrets:

```typescript
// ✅ Good
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}

// ❌ Bad - never do this
const JWT_SECRET = 'hardcoded-secret';
```

## 🐛 Troubleshooting

### Common Issues

#### TypeScript Compilation Errors

```bash
# Clear compiled files and rebuild
npm run clean
npm run build

# Check for type errors
npm run type-check
```

#### Test Failures

```bash
# Run tests with detailed output
npm run test:verbose

# Run specific failing test
npm test -- --testNamePattern="failing test name"

# Debug test with console logs
DEBUG=1 npm test
```

#### Database Connection Issues

```bash
# Check MongoDB status
brew services list | grep mongodb  # macOS
sudo systemctl status mongod       # Linux
net start MongoDB                  # Windows

# Test connection
mongosh $MONGODB_URI
```

#### Port Already in Use

```bash
# Find process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
export PORT=3001
npm run dev
```

### Performance Issues

#### Slow Tests

```bash
# Run tests in parallel
npm test -- --maxWorkers=4

# Skip coverage for faster tests
npm test -- --coverage=false
```

#### Memory Issues

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run dev
```

## 📦 Contributing

### Pull Request Process

1. **Fork** the repository
2. **Create feature branch** from `main`
3. **Make changes** following coding standards
4. **Add/update tests** for new functionality
5. **Update documentation** if needed
6. **Ensure CI passes** locally
7. **Create Pull Request** with clear description

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings introduced
```

### Code Review Guidelines

**For Reviewers:**

- Check code style and patterns
- Verify test coverage
- Look for security issues
- Ensure documentation is updated

**For Authors:**

- Keep PRs small and focused
- Write clear commit messages
- Respond to feedback promptly
- Update PR based on reviews

---

## 🚀 Next Steps

Ready to contribute? Here are some good first issues:

- [ ] Add email verification feature
- [ ] Implement password reset functionality
- [ ] Add user profile image upload
- [ ] Create API rate limiting per user
- [ ] Add Swagger documentation
- [ ] Implement OAuth providers

**Need help?** [Open an issue](https://github.com/shuntps/express-typescript-starter/issues) or check our [API documentation](./API.md).

Happy coding! 🎉
