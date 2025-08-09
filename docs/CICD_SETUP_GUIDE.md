# 🚀 CI/CD Setup Guide

## GitHub Actions Workflow Configuration

This repository includes a comprehensive CI/CD pipeline that automatically runs on pushes and pull requests.

## 🔧 Setup Instructions

### 1. Repository Settings

#### Branch Protection Rules

```bash
# Navigate to: Settings → Branches → Add rule
Branch name pattern: main
✅ Require a pull request before merging
✅ Require status checks to pass before merging
✅ Require branches to be up to date before merging
✅ Include administrators
```

#### Environment Configuration

```bash
# Navigate to: Settings → Environments
Create environments:
- staging (auto-deploy from develop branch)
- production (auto-deploy from main branch)

# Add protection rules:
✅ Required reviewers
✅ Wait timer (optional)
✅ Deployment branches (specific branches only)
```

### 2. Secrets Configuration (Optional)

#### Repository Secrets

```bash
# Navigate to: Settings → Secrets and variables → Actions

# For Snyk security scanning (optional):
SNYK_TOKEN=your_snyk_token_here

# For production deployment (add as needed):
PROD_SERVER_HOST=your-server.com
PROD_SSH_KEY=your_private_ssh_key
DATABASE_URL=your_production_db_url
```

### 3. Environment Variables

#### Required for CI/CD

The pipeline automatically sets these:

```yaml
NODE_ENV: test
MONGODB_URI: mongodb://localhost:27017/express-ts-test
JWT_SECRET: test-jwt-secret-key-for-ci-cd
```

## 📋 Pipeline Overview

### Trigger Events

- **Push** to `main` or `develop` branches
- **Pull Request** to `main` or `develop` branches

### Jobs Overview

#### 1. **Test & Build** (`test`)

- **Node.js Versions**: 18.x, 20.x
- **Services**: MongoDB 7.0
- **Steps**:
  - Install dependencies
  - Run ESLint linting
  - TypeScript type checking
  - Execute tests with coverage
  - Upload coverage to Codecov
  - Build application
  - Security audit

#### 2. **Docker Build Test** (`docker-build`)

- Build Docker image
- Test container functionality
- Runs only on push events

#### 3. **Security Scan** (`security-scan`)

- npm audit for vulnerabilities
- CodeQL static analysis
- Runs only on pull requests

#### 4. **Deploy Staging** (`deploy-staging`)

- Auto-deploys `develop` branch
- Environment: staging
- Add your deployment commands

#### 5. **Deploy Production** (`deploy-production`)

- Auto-deploys `main` branch
- Environment: production
- Add your deployment commands

#### 6. **Notifications** (`notification`)

- Reports success/failure status
- Runs after main jobs complete

## 🛠️ Customization

### Adding Deployment Commands

#### Staging Deployment

```yaml
# In deploy-staging job, replace:
- name: Deploy to Staging
  run: |
    echo "🚀 Deploying to staging environment..."
    # Add your actual deployment commands:
    # ssh user@staging-server 'cd /app && git pull && npm run build && pm2 restart app'
    # docker build -t myapp:staging . && docker push registry.com/myapp:staging
    # kubectl apply -f k8s/staging/
```

#### Production Deployment

```yaml
# In deploy-production job, replace:
- name: Deploy to Production
  run: |
    echo "🚀 Deploying to production environment..."
    # Add your actual deployment commands:
    # ssh user@prod-server 'cd /app && git pull && npm run build && pm2 restart app'
    # docker build -t myapp:latest . && docker push registry.com/myapp:latest
    # kubectl apply -f k8s/production/
```

### Adding Slack/Teams Notifications

```yaml
- name: Slack Notification
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    channel: '#deployments'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
  if: always()
```

### Adding More Security Scans

```yaml
# Add to security-scan job:
- name: Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    scan-type: 'fs'
    scan-ref: '.'
    format: 'sarif'
    output: 'trivy-results.sarif'
```

## 🔍 Monitoring & Debugging

### Viewing Pipeline Results

1. Go to **Actions** tab in your repository
2. Click on any workflow run
3. Expand job sections to see detailed logs
4. Download artifacts (coverage reports, etc.)

### Common Issues

#### Tests Failing

```bash
# Run locally to debug:
npm run test
npm run lint:check
npm run type-check
```

#### Docker Build Failing

```bash
# Test locally:
docker build -t test-app .
docker run --rm test-app npm --version
```

#### Deployment Failing

- Check environment secrets are set
- Verify server connectivity
- Review deployment logs

## 📊 Coverage Reports

### Codecov Integration

- Coverage automatically uploaded after tests
- View detailed reports at codecov.io
- Set coverage thresholds in codecov.yml

### Local Coverage

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## 🎯 Best Practices

### Branch Strategy

```bash
main branch:     Production deployments
develop branch:  Staging deployments
feature/* :      Feature development
hotfix/*  :      Emergency fixes
```

### Commit Messages

```bash
feat(auth): add JWT token refresh
fix(user): resolve password validation
docs(api): update endpoint documentation
test(auth): add integration tests
chore(deps): update dependencies
```

### Pull Request Checklist

- [ ] All tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] Security considerations reviewed
- [ ] Performance impact assessed

## 🚨 Security Notes

1. **Never commit secrets** to repository
2. **Use environment-specific variables**
3. **Review dependency updates** regularly
4. **Monitor security audit results**
5. **Keep base images updated**

## 🎉 Ready to Deploy!

Your CI/CD pipeline is now configured and ready to use. Simply:

1. **Create a pull request** → Tests run automatically
2. **Merge to develop** → Deploys to staging
3. **Merge to main** → Deploys to production

Happy coding! 🚀
