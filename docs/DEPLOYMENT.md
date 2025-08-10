# 🚀 Deployment Guide

This guide explains how to deploy the Express TypeScript Starter application.

## 🎯 Quick Start

### Development Environment

```bash
# Start in development mode
npm run dev

# Start with specific language
npm run dev:en  # English
npm run dev:fr  # French
```

### Production Deployment

#### 1. **Build & Validate**

```bash
# Run complete CI pipeline (lint, type-check, tests, validation)
npm run ci

# Build for production
npm run build

# Or use deployment script
npm run deploy:build
```

#### 2. **Deploy to Environment**

```bash
# Deploy to production
npm run deploy:prod

# Deploy to staging
npm run deploy:staging

# Run health checks only
npm run deploy:health
```

## 🔧 Environment Configuration

### Required Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=mongodb://localhost:27017/myapp

# Authentication
JWT_SECRET=your-super-secure-jwt-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Security
COOKIE_SECRET=your-super-secure-cookie-secret
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Internationalization
DEFAULT_LANGUAGE=en
SUPPORTED_LANGUAGES=en,fr

# Logging
LOG_LEVEL=info
LOG_FORMAT=combined
```

### Optional Environment Variables

```env
# Performance Monitoring
ENABLE_PERFORMANCE_MONITORING=true
PERFORMANCE_THRESHOLD_MS=1000

# Security Headers
SECURITY_CSP_ENABLED=true
SECURITY_HSTS_ENABLED=true

# Request Limits
MAX_REQUEST_SIZE=10mb
COMPRESSION_ENABLED=true
```

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Using Docker

```bash
# Build image
docker build -t express-ts-api-starter .

# Run container
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=your-db-url \
  -e JWT_SECRET=your-secret \
  express-ts-api-starter
```

## 🏥 Health Checks

### Automated Health Checks

The application includes built-in health check endpoints:

- `GET /health` - Basic health status
- `GET /health/detailed` - Detailed system status
- `GET /health/ready` - Readiness probe for Kubernetes

### Manual Health Verification

```bash
# Check if server is running
curl http://localhost:3000/api/health

# Detailed health check
npm run deploy:health
```

## 📊 Monitoring & Logging

### Application Logs

Logs are written to:

- `logs/combined.log` - All application logs
- `logs/error.log` - Error logs only
- Console output in development

### Performance Monitoring

- Request/response times tracked
- Memory usage monitoring
- API endpoint performance metrics
- Rate limiting statistics

## 🔒 Security Considerations

### Production Security Checklist

- [ ] Environment variables properly set
- [ ] HTTPS enabled (reverse proxy)
- [ ] Rate limiting configured
- [ ] CORS policies set
- [ ] Security headers enabled
- [ ] Input validation active
- [ ] Audit logging enabled

### Security Headers

The application automatically applies:

- Helmet.js security headers
- CORS with configurable origins
- Rate limiting
- Request size limits
- Cookie security (httpOnly, secure, sameSite)

## 🚨 Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear caches and reinstall
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Database Connection Issues

```bash
# Check database connectivity
npm run health:db

# Verify environment variables
echo $DATABASE_URL
```

#### Authentication Problems

```bash
# Verify JWT configuration
echo $JWT_SECRET
echo $JWT_ACCESS_EXPIRY

# Check cookie settings
curl -v http://localhost:3000/auth/login
```

### Debug Mode

```bash
# Start with debug logging
DEBUG=* npm start

# Development with debugging
npm run dev -- --inspect
```

## 📈 Performance Optimization

### Production Optimizations

- Gzip compression enabled
- Static file caching
- Database connection pooling
- Request/response logging optimized
- Memory usage monitoring

### Scaling Considerations

- Stateless design for horizontal scaling
- Session data in database/Redis
- Load balancer ready
- Health checks for container orchestration

## 🔄 CI/CD Integration

### GitHub Actions

The project includes a comprehensive CI/CD pipeline:

- Automated testing
- Code quality checks
- Security scanning
- Automated deployments

### Manual CI Pipeline

```bash
# Run complete CI pipeline locally
npm run ci

# Individual steps
npm run lint:check
npm run type-check
npm run test:ci
npm run validate
```

## 📝 Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Code quality checks pass
- [ ] Security scan complete
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Backup strategy in place

### Post-Deployment

- [ ] Health checks passing
- [ ] Logs are being written
- [ ] Performance metrics normal
- [ ] User authentication working
- [ ] API endpoints responding
- [ ] Database connectivity confirmed

---

## 🆘 Support

If you encounter issues during deployment:

1. **Check the logs**: `tail -f logs/combined.log`
2. **Run health checks**: `npm run deploy:health`
3. **Verify environment**: Check all required env vars are set
4. **Test locally**: Ensure the app works in your development environment
5. **Check dependencies**: Run `npm audit` for security issues

For more detailed troubleshooting, see the main [README.md](../README.md) file.
