# Express TypeScript Starter 🚀

> **Production-ready Express.js API boilerplate** built with TypeScript, featuring comprehensive testing, automated CI/CD pipeline, and enterprise-grade security.

**Perfect for:** REST APIs, Microservices, SaaS backends, Enterprise applications

**Tech Stack:** Express.js • TypeScript • MongoDB • Jest • Docker • GitHub Actions

🚀 A modern, secure, and scalable Express.js API built with TypeScript, featuring comprehensive testing, CI/CD pipeline, and production-ready Docker configuration.

## ⚡ Quick Start

```bash
# Clone and install
git clone https://github.com/shuntps/express-typescript-starter.git
cd express-typescript-starter
npm install

# Environment setup
cp .env.example .env
# Edit .env with your configuration

# Development
npm run dev

# Production
npm run build
npm start
```

## 🏗️ Architecture

- **Express.js** - Fast, unopinionated web framework
- **TypeScript** - Type-safe JavaScript development
- **MongoDB** - Document database with Mongoose ODM
- **Security** - Helmet, CORS, rate limiting, input validation
- **Logging** - Winston with structured logging
- **i18n** - Multi-language support (EN/FR)

## 📁 Project Structure

```
├── src/
│   ├── controllers/     # Route handlers
│   ├── services/        # Business logic
│   ├── models/         # Database models
│   ├── middleware/     # Express middleware
│   ├── routes/         # Route definitions
│   ├── utils/          # Utility functions
│   ├── config/         # App configuration
│   └── __tests__/      # Test suites
├── docs/               # Documentation
├── .github/            # GitHub Actions workflows
└── docker-compose.yml  # Development environment
```

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# CI mode
npm run test:ci
```

## 🚀 Deployment

### Development Environment

```bash
# Using Docker Compose
npm run docker:dev

# Direct development
npm run dev
```

### Production

```bash
# Build Docker image
npm run docker:build

# Run production container
npm run docker:run
```

## 📊 Features

✅ **Security First** - Helmet, CORS, rate limiting, input validation  
✅ **Type Safety** - Full TypeScript with strict configuration  
✅ **Database** - MongoDB with Mongoose ODM and validation  
✅ **Authentication** - User registration, login, profile management  
✅ **Logging** - Structured logging with Winston  
✅ **i18n** - Multi-language support  
✅ **Testing** - Jest with 33 tests and 80%+ coverage  
✅ **CI/CD** - GitHub Actions pipeline  
✅ **Docker** - Multi-stage production builds  
✅ **Code Quality** - ESLint, Prettier, Husky git hooks

## 📚 Documentation

- [📋 CI/CD Setup Guide](./docs/CICD_SETUP_GUIDE.md)
- [🧪 Testing & CI/CD Report](./docs/TESTING_CICD_REPORT.md)
- [⚙️ Personal Instructions](./.github/instructions/personal.instructions.md)

## 🛡️ Security

- **Headers Protection** - Helmet with CSP
- **Rate Limiting** - 100 req/15min per IP
- **CORS** - Configured for specific origins
- **Input Validation** - Zod schema validation
- **Security Audits** - Automated dependency scanning

## 🌐 API Endpoints

```bash
GET    /health          # Health check
GET    /               # Welcome message
POST   /api/auth/login  # User authentication
POST   /api/auth/register # User registration
GET    /api/auth/profile/:id # Get user profile
```

## 🔧 Configuration

### Environment Variables

```bash
NODE_ENV=development|production|test
PORT=3000
MONGODB_URI=mongodb://localhost:27017/express-ts-app
JWT_SECRET=your-super-secret-jwt-key
```

### Scripts

```json
{
  "dev": "Development with hot reload",
  "build": "TypeScript compilation",
  "test": "Jest test runner",
  "lint": "ESLint code checking",
  "docker:dev": "Full Docker development environment"
}
```

## 📈 Performance

- **Compression** - Gzip compression enabled
- **Caching** - Appropriate HTTP headers
- **Database** - Indexed queries
- **Monitoring** - Health check endpoint with metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🎯 Next Steps

- [ ] Add JWT authentication middleware
- [ ] Implement email verification
- [ ] Add API rate limiting per user
- [ ] Implement caching with Redis
- [ ] Add API documentation with Swagger
- [ ] Set up monitoring with Prometheus

---

**Author:** [shuntps](https://github.com/shuntps)  
Built with ❤️ using modern Node.js best practices
