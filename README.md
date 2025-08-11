# 🚀 Express TypeScript Starter

> **Full-stack application starter** with Express.js backend, TypeScript, MongoDB, JWT authentication, comprehensive testing, and automated CI/CD pipeline.

[![CI/CD Pipeline](https://github.com/shuntps-devs/express-ts-api-starter/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/shuntps-devs/express-ts-api-starter/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ⚡ Quick Start

```bash
# Clone the repository
git clone https://github.com/shuntps-devs/express-ts-api-starter.git
cd express-ts-api-starter

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets

# Start development server
npm run dev
```

🎯 **Ready in 2 minutes!** The API will be running at `http://localhost:3000`

## 📁 Project Structure

```
express-typescript-starter/
├── 📁 backend/                  # Express.js API Server
│   ├── 📁 src/                     # Source code
│   ├── 📁 docs/                    # API documentation
│   ├── 📁 scripts/                 # Automation scripts
│   ├── 🐳 docker-compose.yml       # Development environment
│   ├── 🐳 Dockerfile              # Production container
│   └── 📄 README.md               # Backend-specific documentation
├── 📁 .github/                 # CI/CD workflows
└── 📄 README.md               # This file (project overview)
```

## 🏗️ What's Included

### 🔧 **Backend (Express.js API)**

Located in `/backend` - Production-ready REST API with:

- **🔐 Complete Authentication System** - JWT cookie-based auth with session management
- **🛡️ Enterprise Security** - Helmet, CORS, rate limiting, input validation
- **🗄️ Database Integration** - MongoDB with Mongoose ODM and TypeScript
- **🧪 Comprehensive Testing** - 249 tests across 17 suites with 100% success rate
- **🚀 Production Ready** - Docker support, CI/CD pipeline, structured logging
- **🌍 Internationalization** - Multi-language support (EN/FR ready)
- **📊 Monitoring** - Health checks, audit logging, performance metrics

### 🎨 **Frontend (Coming Soon)**

Planned frontend implementation with modern frameworks and seamless backend integration.

## 🔌 API Overview

The backend provides a comprehensive REST API:

- **Authentication** (`/api/auth/*`) - Registration, login, session management
- **User Management** (`/api/users/*`) - User CRUD operations
- **Profile Management** (`/api/profile/*`) - User profiles with avatar support
- **Admin Operations** (`/api/admin/*`) - Administrative functions
- **System Monitoring** (`/api/health`, `/api`) - Health checks and API info

## 🚀 Getting Started

### Backend Development

```bash
cd backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Configure your MongoDB URI and JWT secrets

# Start development server
npm run dev
```

See **[Backend README](./backend/README.md)** for detailed backend documentation.

### Docker Development

```bash
cd backend

# Start full development environment
docker-compose up --build
```

This starts:
- Express.js API server
- MongoDB database
- Redis cache
- Database admin interfaces

## 🧪 Testing & Quality

### Backend Testing
```bash
cd backend

# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

**Test Metrics:**
- ✅ 249 tests across 17 suites
- ✅ 100% success rate (17/17 suites passing)
- ✅ Comprehensive coverage (Controllers, Services, Middleware, Utils)

### Code Quality
```bash
cd backend

# Lint and format code
npm run lint:fix
npm run format

# Type checking
npm run type-check

# Full quality pipeline
npm run ci
```

## 🐳 Deployment

### Development
```bash
cd backend
docker-compose up --build
```

### Production
```bash
cd backend
docker build -t express-ts-app .
docker run -p 3000:3000 express-ts-app
```

### CI/CD Pipeline

Automated GitHub Actions workflow:
- ✅ Code Quality (ESLint, Prettier, TypeScript)
- ✅ Testing (Full test suite with coverage)
- ✅ Security (Dependency auditing)
- ✅ Building (TypeScript compilation & Docker)
- ✅ Deployment (Staging and production environments)

## 📚 Documentation

### Backend Documentation
- **[Backend README](./backend/README.md)** - Backend-specific documentation
- **[API Documentation](./backend/docs/API.md)** - Complete endpoint reference
- **[Setup Guide](./backend/docs/SETUP.md)** - Detailed installation guide
- **[Development Guide](./backend/docs/DEVELOPMENT.md)** - Development workflow
- **[Deployment Guide](./backend/docs/DEPLOYMENT.md)** - Production deployment

### Technical Documentation
- **[Architecture Overview](./backend/docs/ARCHITECTURE.md)** - System architecture
- **[Avatar API](./backend/docs/AVATAR_API.md)** - File upload documentation  
- **[Technical Summaries](./backend/docs/summaries/)** - Implementation decisions

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js with TypeScript
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT with HTTP-only cookies
- **Testing:** Jest with Supertest
- **Validation:** Zod schemas
- **Security:** Helmet, CORS, rate limiting
- **Logging:** Winston structured logging
- **DevOps:** Docker, GitHub Actions CI/CD

### Development Tools
- **TypeScript** - Strict type safety
- **ESLint & Prettier** - Code quality and formatting
- **Husky** - Git hooks for quality gates
- **Docker** - Containerized development and deployment

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)  
5. **Open** a Pull Request

### Development Standards
- TypeScript strict mode enabled
- ESLint with zero warnings policy
- Prettier for consistent formatting
- Tests required for new features
- Conventional Commits for clear history

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

### Backend
- [x] **Complete Authentication System** - Registration, login, sessions
- [x] **User & Profile Management** - CRUD operations with avatar support
- [x] **Admin Operations** - Session management and cleanup tasks
- [x] **Comprehensive Testing** - 249 tests with 100% success rate
- [x] **Production Deployment** - Docker and CI/CD pipeline

### Frontend (Planned)
- [ ] **React/Next.js Frontend** - Modern web interface
- [ ] **User Dashboard** - Profile management and settings
- [ ] **Admin Panel** - Administrative interface
- [ ] **Real-time Features** - WebSocket integration
- [ ] **Mobile App** - React Native implementation

### Platform Features
- [x] **Email Verification** - Complete registration flow with Resend API
- [x] **Password Reset** - Forgot password functionality with secure tokens
- [ ] **OAuth Integration** - Google, GitHub, Discord login
- [ ] **API Rate Limiting** - User-specific rate limits  
- [ ] **Redis Caching** - Performance optimization
- [ ] **Monitoring & Metrics** - Prometheus integration

---

**Built with ❤️ by [shuntps](https://github.com/shuntps)**

_Production-ready foundation for your next great application!_
