# 🚀 Express TypeScript Starter

> **Production-ready Express.js API** with TypeScript, MongoDB, JWT authentication, comprehensive testing, and automated CI/CD pipeline.

[![CI/CD Pipeline](https://github.com/shuntps/express-typescript-starter/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/shuntps/express-typescript-starter/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ⚡ Quick Start

```bash
# Clone and setup
git clone https://github.com/shuntps/express-typescript-starter.git
cd express-typescript-starter
npm install

# Environment configuration
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets

# Start development server
npm run dev
```

🎯 **Ready in 2 minutes!** The API will be running at `http://localhost:3000`

## 🏗️ What's Included

### 🔐 **Complete Authentication System**

- **User Registration & Login** - Full user management with validation
- **JWT Cookie-based Auth** - Secure access & refresh tokens in HTTP-only cookies
- **Session Management** - Track user sessions across devices
- **Account Security** - Login attempts limiting, account locking
- **Password Hashing** - bcryptjs with secure salting

### 🛡️ **Enterprise Security**

- **Helmet.js** - Security headers and CSP
- **CORS Configuration** - Environment-specific origins
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **Input Validation** - Zod schema validation for all endpoints
- **Security Audits** - Automated dependency scanning in CI/CD

### 🗄️ **Database & Models**

- **MongoDB Integration** - Mongoose ODM with TypeScript
- **User Model** - Complete user schema with methods
- **Session Model** - JWT session tracking and management
- **Profile Model** - Extended user profile data
- **Database Indexing** - Optimized queries with proper indexes

### 🧪 **Testing Infrastructure**

- **Jest Test Suite** - 33+ comprehensive tests
- **80%+ Code Coverage** - Thorough test coverage reporting
- **Test Helpers** - Utilities for mocking and test data generation
- **Integration Tests** - Full API endpoint testing with supertest
- **CI/CD Testing** - Automated testing in GitHub Actions

### 🚀 **Production Ready**

- **Docker Support** - Multi-stage builds for development and production
- **GitHub Actions CI/CD** - Automated testing, building, and deployment
- **TypeScript** - Full type safety with strict configuration
- **ESLint & Prettier** - Code quality and formatting
- **Winston Logging** - Structured logging with different levels
- **Environment Management** - Separate configs for dev/staging/production

### 🌍 **Additional Features**

- **i18n Support** - Multi-language support (EN/FR ready)
- **Performance Monitoring** - Request timing and metrics
- **Audit Logging** - Track user actions and system events
- **Health Checks** - System status and uptime monitoring
- **API Versioning** - Built-in API version management

## 📁 Project Structure

```
express-typescript-starter/
├── 📁 src/
│   ├── 📁 controllers/          # Route handlers & business logic
│   │   ├── auth.controller.ts   # Authentication endpoints
│   │   └── user.controller.ts   # User management endpoints
│   ├── 📁 services/             # Business logic layer
│   │   ├── user.service.ts      # User operations
│   │   ├── session.service.ts   # Session & JWT management
│   │   └── token.service.ts     # Token generation & validation
│   ├── 📁 models/              # Database schemas
│   │   ├── user.model.ts       # User schema & methods
│   │   ├── session.model.ts    # Session tracking
│   │   └── profile.model.ts    # Extended user profiles
│   ├── 📁 middleware/          # Express middleware
│   │   ├── auth.middleware.ts  # JWT authentication
│   │   ├── security.middleware.ts # Security headers & CORS
│   │   ├── audit.middleware.ts # Action logging
│   │   └── error-handler.ts    # Global error handling
│   ├── 📁 routes/              # API route definitions
│   ├── 📁 schemas/             # Validation schemas (Zod)
│   ├── 📁 utils/               # Helper functions
│   ├── 📁 config/              # App configuration
│   ├── 📁 i18n/                # Internationalization
│   └── 📁 __tests__/           # Test suites
├── 📁 docs/                    # Documentation
├── 📁 scripts/                 # Build & deployment scripts
├── 📁 .github/                 # CI/CD workflows
├── 🐳 docker-compose.yml       # Development environment
├── 🐳 Dockerfile              # Production container
└── 📄 package.json            # Dependencies & scripts
```

## 🔌 API Endpoints

### 🔐 Authentication (`/api/auth`)

```http
POST   /api/auth/register      # Create new user account
POST   /api/auth/login         # User login with credentials
POST   /api/auth/logout        # Logout current session
POST   /api/auth/logout-all    # Logout from all devices
POST   /api/auth/refresh       # Refresh access token
GET    /api/auth/profile       # Get current user profile
GET    /api/auth/sessions      # Get active sessions
```

### 👥 Users (`/api/users`)

```http
GET    /api/users/:id          # Get user by ID
PUT    /api/users/:id          # Update user profile
DELETE /api/users/:id          # Delete user account
```

### 🏥 System

```http
GET    /health                 # Health check & system status
GET    /                       # API information & endpoints
```

## 🚀 Development

### Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** 4.4+ (local or Atlas)
- **Git** for version control

### Environment Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

**Configure your `.env` file:**

```env
# Server
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/express-ts-app

# JWT Secrets (generate strong secrets)
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# Optional
DEFAULT_LANGUAGE=en
LOG_LEVEL=info
```

### Available Scripts

```bash
# Development
npm run dev              # Start with hot reload
npm run dev:en           # Force English language
npm run dev:fr           # Force French language

# Building
npm run build            # Compile TypeScript
npm run start            # Run production build

# Testing
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Generate coverage report
npm run test:ci          # CI mode (no watch)

# Code Quality
npm run lint             # ESLint checking
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Prettier formatting
npm run type-check       # TypeScript validation

# Docker
npm run docker:build     # Build production image
npm run docker:run       # Run container
npm run docker:dev       # Development with Docker Compose

# Full Pipeline
npm run ci               # Complete CI pipeline
```

## 🧪 Testing

Comprehensive testing with **Jest** and **Supertest**:

```bash
# Run all tests
npm test

# Watch for changes
npm run test:watch

# Generate coverage report
npm run test:coverage
```

**Test Coverage Areas:**

- ✅ Authentication controllers (register, login, logout)
- ✅ User management operations
- ✅ Session management and JWT validation
- ✅ Middleware functionality (auth, security, validation)
- ✅ Database models and methods
- ✅ API endpoints integration testing

## � Docker Deployment

### Development Environment

```bash
# Start MongoDB + API with hot reload
npm run docker:dev

# Or manually
docker-compose up --build
```

### Production Deployment

```bash
# Build optimized image
npm run docker:build

# Run production container
npm run docker:run

# Or with docker-compose
docker-compose -f docker-compose.prod.yml up
```

## 🔧 Configuration

### Security Configuration

- **CORS**: Environment-specific allowed origins
- **Rate Limiting**: Configurable per environment
- **Helmet**: CSP and security headers
- **JWT**: Separate secrets for access and refresh tokens

### Database Configuration

- **Connection**: MongoDB with Mongoose ODM
- **Validation**: Zod schemas for request validation
- **Indexing**: Optimized database queries
- **Sessions**: JWT-based session management

### Logging Configuration

- **Winston**: Structured logging with levels
- **Audit Trail**: User action tracking
- **Performance**: Request timing monitoring
- **Error Tracking**: Comprehensive error logging

## � Deployment

### GitHub Actions CI/CD

Automated pipeline with:

- ✅ **Code Quality** - ESLint, Prettier, TypeScript
- ✅ **Testing** - Full test suite with coverage
- ✅ **Security** - Dependency auditing
- ✅ **Building** - TypeScript compilation & Docker
- ✅ **Deployment** - Staging and production environments

### Manual Deployment

```bash
# Build for production
npm run build

# Run validation pipeline
npm run ci

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod
```

## � Documentation

- **[Setup Guide](./docs/SETUP.md)** - Detailed installation and configuration
- **[API Documentation](./docs/API.md)** - Complete endpoint reference
- **[Development Guide](./docs/DEVELOPMENT.md)** - Development workflow and conventions
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Production deployment instructions
- **[Architecture Guide](./docs/ARCHITECTURE.md)** - System design and patterns

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Standards

- **TypeScript** strict mode enabled
- **ESLint** with zero warnings policy
- **Prettier** for consistent formatting
- **Tests required** for new features
- **Conventional Commits** for clear history

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

- [ ] **Email Verification** - Complete user registration flow
- [ ] **Password Reset** - Forgot password functionality
- [ ] **OAuth Integration** - Google, GitHub, Discord login
- [ ] **API Rate Limiting per User** - User-specific rate limits
- [ ] **Redis Caching** - Performance optimization
- [ ] **Swagger Documentation** - Auto-generated API docs
- [ ] **Monitoring & Metrics** - Prometheus integration
- [ ] **File Upload** - Profile images and attachments

---

**Built with ❤️ by [shuntps](https://github.com/shuntps)**

_Ready to build your next great API? Start with this production-ready foundation!_
