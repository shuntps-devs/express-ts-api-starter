# 🔧 Backend - Express TypeScript API

> **Production-ready Express.js API** with TypeScript, MongoDB, JWT authentication, comprehensive testing, and enterprise-grade security.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Environment configuration
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets

# Start development server
npm run dev
```

🎯 **API will be running at** `http://localhost:3000`

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** 4.4+ (local or Atlas)
- **Git** for version control

## 🔌 API Endpoints

### 🌍 **System & Monitoring**

```bash
GET    /api              # API information and endpoints
GET    /api/health       # System health and uptime status
```

### 🔐 **Authentication** (`/api/auth`)

```http
POST   /api/auth/register      # Create new user account
POST   /api/auth/login         # User login with credentials
POST   /api/auth/logout        # Logout current session
POST   /api/auth/logout-all    # Logout from all devices
POST   /api/auth/refresh       # Refresh access token
GET    /api/auth/profile       # Get current user profile
GET    /api/auth/sessions      # Get active sessions
```

### 👤 **Profile Management** (`/api/profile`)

```http
GET    /api/profile            # Get user profile
PUT    /api/profile            # Update profile
POST   /api/profile/avatar     # Upload avatar
DELETE /api/profile/avatar     # Delete avatar
```

### 👥 **Users** (`/api/users`)

```http
GET    /api/users/:id          # Get user by ID
PUT    /api/users/:id          # Update user profile
DELETE /api/users/:id          # Delete user account
```

### 🔧 **Admin** (`/api/admin`)

```http
GET    /api/admin/sessions     # Get all active sessions
DELETE /api/admin/sessions/:id # Terminate session
POST   /api/admin/cleanup      # Run cleanup tasks
```

## 🏗️ Architecture & Features

### 🔐 **Authentication & Security**

- **JWT Cookie-based Auth** - Secure access & refresh tokens in HTTP-only cookies
- **Session Management** - Track user sessions across devices
- **Account Security** - Login attempts limiting, account locking
- **Password Hashing** - bcryptjs with secure salting
- **Helmet.js** - Security headers and CSP
- **CORS Configuration** - Environment-specific origins
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **Input Validation** - Zod schema validation for all endpoints

### 🗄️ **Database & Models**

- **MongoDB Integration** - Mongoose ODM with TypeScript
- **User Model** - Complete user schema with methods
- **Session Model** - JWT session tracking and management
- **Profile Model** - Extended user profile data
- **Database Indexing** - Optimized queries with proper indexes

### 🧪 **Testing Infrastructure**

- **Jest Test Suite** - 249 comprehensive tests across 17 test suites
- **100% Test Success Rate** - Professional test reliability (17/17 suites passing)
- **Controllers Testing** - Complete API endpoint coverage
- **Services Testing** - Full business logic validation
- **Middleware Testing** - Complete middleware layer coverage
- **TestHelper Utilities** - Professional test data generation and mocking system
- **Integration Tests** - Full API endpoint testing with supertest

### 🌍 **Additional Features**

- **i18n Support** - Multi-language support (EN/FR ready)
- **Performance Monitoring** - Request timing and metrics
- **Audit Logging** - Track user actions and system events
- **Health Checks** - System status and uptime monitoring
- **Winston Logging** - Structured logging with different levels

## 📁 Project Structure

```
backend/
├── 📁 src/
│   ├── 📁 controllers/          # Route handlers & business logic
│   ├── 📁 services/             # Business logic layer
│   ├── 📁 models/              # Database schemas
│   ├── 📁 middleware/          # Express middleware
│   ├── 📁 routes/              # API route definitions
│   ├── 📁 schemas/             # Validation schemas (Zod)
│   ├── 📁 utils/               # Helper functions
│   ├── 📁 config/              # App configuration
│   ├── 📁 i18n/                # Internationalization
│   ├── 📁 types/               # TypeScript declarations
│   └── 📁 __tests__/           # Comprehensive test suites
├── 📁 docs/                    # API documentation
├── 📁 scripts/                 # Automation & deployment scripts
├── 🐳 docker-compose.yml       # Development environment
├── 🐳 Dockerfile              # Production container
└── 📄 package.json            # Dependencies & scripts
```

## ⚙️ Environment Configuration

Create a `.env` file from `.env.example`:

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

## 🛠️ Available Scripts

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

```bash
# Run all tests (249 tests across 17 suites)
npm test

# Watch for changes during development
npm run test:watch

# Generate detailed coverage report
npm run test:coverage
```

### 📊 **Test Coverage Metrics**

```
Test Suites: 17 passed, 17 total
Tests:       249 passed, 249 total
Success Rate: 100% (17/17 suites passing)
Coverage:    54.9% overall (focused on critical business logic)
├── Controllers (4 suites) - Auth, User, Profile, Admin API testing
├── Services (6 suites) - User, Session, Token, Avatar, Email, Cleanup
├── Middleware (7 suites) - Complete middleware layer coverage
└── Utils (1 suite) - Response helper and utility testing
```

## 🐳 Docker Deployment

### Development Environment

```bash
# Start MongoDB + API with hot reload
npm run docker:dev

# Or manually with docker-compose
docker-compose up --build
```

### Production Deployment

```bash
# Build optimized image
npm run docker:build

# Run production container
npm run docker:run
```

## 📚 Documentation

- **[API Documentation](./docs/API.md)** - Complete endpoint reference with examples
- **[Setup Guide](./docs/SETUP.md)** - Detailed installation and configuration
- **[Development Guide](./docs/DEVELOPMENT.md)** - Development workflow and conventions
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Production deployment instructions
- **[Avatar API](./docs/AVATAR_API.md)** - Avatar upload system documentation
- **[Technical Summaries](./docs/summaries/)** - Implementation summaries and decisions

## 🤝 Development Standards

- **TypeScript** strict mode enabled
- **ESLint** with zero warnings policy
- **Prettier** for consistent formatting
- **Tests required** for new features
- **Conventional Commits** for clear history
- **Barrel Exports** - Clean import structure
- **JSDoc Comments** - Complete API documentation

---

**Part of the Express TypeScript Starter project**
