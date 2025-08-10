# 🚀 Setup Guide

This guide will get you up and running with the **Express TypeScript Starter** in minutes.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required

- **Node.js** 18.0 or higher ([Download](https://nodejs.org/))
- **npm** 9.0 or higher (comes with Node.js)
- **MongoDB** 4.4+ ([Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Git** ([Download](https://git-scm.com/downloads))

### Optional

- **Docker** & **Docker Compose** for containerized development ([Download](https://www.docker.com/))
- **VS Code** with recommended extensions (see [Development setup](#development-environment))

## ⚡ Quick Start

### 1. Clone the Repository

```bash
# Clone the project
git clone https://github.com/shuntps/express-typescript-starter.git

# Navigate to project directory
cd express-typescript-starter

# Install dependencies
npm install
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env
```

**Edit your `.env` file with the following configuration:**

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/express-ts-app

# JWT Configuration (Generate strong secrets!)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-key-at-least-32-characters-long

# Email Configuration (Optional - for email features)
RESEND_API_KEY=re_your_resend_api_key_here
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Express TypeScript Starter
FRONTEND_URL=http://localhost:3000
APP_NAME=Express TypeScript Starter

# Avatar Configuration (DiceBear Integration)
DEFAULT_AVATAR_PROVIDER=dicebear
DEFAULT_AVATAR_STYLE=avataaars
DEFAULT_AVATAR_BASE_URL=https://api.dicebear.com/7.x

# Optional Configuration
DEFAULT_LANGUAGE=en
LOG_LEVEL=info
```

### 3. Database Setup

#### Option A: Local MongoDB

```bash
# Start MongoDB service (varies by OS)
# macOS with Homebrew:
brew services start mongodb-community

# Windows:
net start MongoDB

# Ubuntu/Debian:
sudo systemctl start mongod
```

#### Option B: MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get connection string and update `MONGODB_URI` in `.env`
4. Whitelist your IP address

#### Option C: Docker

```bash
# Start MongoDB with Docker
docker run --name express-mongo -d -p 27017:27017 mongo:7.0
```

### 4. Start Development Server

```bash
# Start the development server
npm run dev
```

🎉 **Success!** Your API should now be running at `http://localhost:3000`

### 5. Verify Installation

```bash
# Test the health endpoint
curl http://localhost:3000/api/health

# Expected response:
# {
#   "status": "OK",
#   "timestamp": "2024-01-01T12:00:00.000Z",
#   "environment": "development",
#   "uptime": 0.123,
#   "service": "Express TypeScript API"
# }
```

## 🧪 Run Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🔧 Detailed Configuration

### Environment Variables Reference

| Variable             | Required | Default       | Description                            |
| -------------------- | -------- | ------------- | -------------------------------------- |
| `NODE_ENV`           | ✅       | `development` | Environment mode                       |
| `PORT`               | ❌       | `3000`        | Server port                            |
| `MONGODB_URI`        | ✅       | -             | MongoDB connection string              |
| `JWT_SECRET`         | ✅       | -             | JWT access token secret (32+ chars)    |
| `JWT_REFRESH_SECRET` | ✅       | -             | JWT refresh token secret (32+ chars)   |
| `DEFAULT_LANGUAGE`   | ❌       | `en`          | Default API language (`en` or `fr`)    |
| `LOG_LEVEL`          | ❌       | `info`        | Winston log level                      |
| `CORS_ORIGINS`       | ❌       | `*`           | Allowed CORS origins (comma-separated) |

### JWT Secret Generation

**Generate strong secrets using one of these methods:**

```bash
# Method 1: Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Method 2: OpenSSL
openssl rand -hex 64

# Method 3: Online generator
# Use: https://generate-secret.vercel.app/64
```

### MongoDB Configuration

#### Local Development

```env
MONGODB_URI=mongodb://localhost:27017/express-ts-app
```

#### MongoDB Atlas

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/express-ts-app?retryWrites=true&w=majority
```

#### Docker

```env
MONGODB_URI=mongodb://mongo:27017/express-ts-app
```

## 🐳 Docker Setup

### Development with Docker Compose

```bash
# Start all services (API + MongoDB)
npm run docker:dev

# Or manually
docker-compose up --build

# Stop services
docker-compose down
```

### Production Docker Image

```bash
# Build production image
npm run docker:build

# Run production container
npm run docker:run
```

## 🛠️ Development Environment

### VS Code Setup

Install recommended extensions:

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

### Git Hooks Setup

The project includes Husky git hooks for code quality:

```bash
# Hooks are automatically installed with npm install
# They will run on:
# - pre-commit: ESLint + Prettier
# - pre-push: Tests + Type checking
```

### Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm run dev:en           # Force English language
npm run dev:fr           # Force French language

# Building & Production
npm run build            # Compile TypeScript to JavaScript
npm run start            # Run compiled production build
npm run clean            # Remove dist directory

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues automatically
npm run format           # Run Prettier formatting
npm run format:check     # Check formatting without fixing
npm run type-check       # TypeScript type checking

# Testing
npm test                 # Run Jest tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run test:ci          # Run tests for CI (no watch)
npm run test:verbose     # Run tests with detailed output

# Docker
npm run docker:build     # Build Docker image
npm run docker:run       # Run Docker container
npm run docker:up        # Start Docker Compose
npm run docker:down      # Stop Docker Compose
npm run docker:dev       # Development with Docker

# CI/CD & Quality
npm run validate         # Run code quality validation
npm run ci               # Complete CI pipeline (lint + test + build)

# Deployment
npm run deploy:build     # Build for deployment
npm run deploy:staging   # Deploy to staging
npm run deploy:prod      # Deploy to production
```

## 🔍 Troubleshooting

### Common Issues

#### MongoDB Connection Error

```bash
# Error: MongoNetworkError: failed to connect to server
```

**Solutions:**

1. **Check MongoDB is running**:

   ```bash
   # Check if MongoDB process is running
   ps aux | grep mongod

   # Or check with service
   sudo systemctl status mongod
   ```

2. **Verify connection string** in `.env`
3. **Check firewall/network** settings
4. **For Atlas**: Whitelist your IP address

#### Port Already in Use

```bash
# Error: EADDRINUSE: address already in use :::3000
```

**Solutions:**

```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
echo "PORT=3001" >> .env
```

#### JWT Secret Error

```bash
# Error: JWT secret not defined
```

**Solution:**

```bash
# Generate and add JWT secrets to .env
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

#### TypeScript Compilation Error

```bash
# Run type checking to see detailed errors
npm run type-check

# Clean and rebuild
npm run clean && npm run build
```

### Performance Optimization

For development performance:

```bash
# Use local MongoDB instead of Atlas for development
# Enable TypeScript incremental compilation
echo '{"compilerOptions": {"incremental": true}}' > tsconfig.dev.json

# Use Docker with volume mounts for faster restarts
docker-compose -f docker-compose.dev.yml up
```

### Getting Help

1. **Check logs** in `logs/` directory
2. **Review error messages** carefully
3. **Search issues** on GitHub
4. **Create new issue** with:
   - Node.js version: `node --version`
   - npm version: `npm --version`
   - Operating system
   - Error message and steps to reproduce

## ✅ Next Steps

Once you have the project running:

1. **Explore the API** - Check out [API.md](./API.md) for endpoint documentation
2. **Understand the Architecture** - Read [Architecture.md](./ARCHITECTURE.md)
3. **Start Development** - Follow [Development.md](./DEVELOPMENT.md) workflow
4. **Deploy to Production** - See [Deployment.md](./DEPLOYMENT.md)

---

**Ready to build amazing APIs!** 🚀

Need help? [Open an issue](https://github.com/shuntps/express-typescript-starter/issues) or check our [Development Guide](./DEVELOPMENT.md).
