# 📜 Scripts Directory

This directory contains automation scripts for development, testing, and deployment workflows.

## 📂 Available Scripts

### `validate-code-quality.js`

**Purpose**: Validates that the codebase follows all best practices defined in `personal.instructions.md`

**Usage**:

```bash
npm run validate
# or
node scripts/validate-code-quality.js
```

**What it checks**:

- ✅ TypeScript strict mode enabled
- ✅ Required directory structure
- ✅ Middleware integration in server.ts
- ✅ Authentication system files
- ✅ No console.log/error in production code

### `deploy.js`

**Purpose**: Automates build and deployment processes

**Usage**:

```bash
# Build only
npm run deploy:build
# or
node scripts/deploy.js build

# Deploy to production
npm run deploy:prod
# or
node scripts/deploy.js deploy production

# Deploy to staging
npm run deploy:staging
# or
node scripts/deploy.js deploy staging

# Health checks
npm run deploy:health
# or
node scripts/deploy.js health
```

**Features**:

- 🚀 Complete build pipeline
- 🔍 Quality checks integration
- 🏥 Health monitoring
- 📦 Deployment automation
- ⚡ Environment-specific deployments

### `test-avatar.js`

**Purpose**: Test script for avatar generation functionality

**Usage**:

```bash
node scripts/test-avatar.js
```

**Features**:

- 🧪 Tests default avatar generation
- 🎲 Shows different avatar seeds
- 🔗 Generates testable avatar URLs
- 👤 Multiple test identifiers

### `compliance-reminder.js`

**Purpose**: Comprehensive compliance checker displaying all quality standards and rules for AI-assisted development

**Usage**:

```bash
node scripts/compliance-reminder.js
```

**Features**:

- 🚨 Complete quality standards from personal.instructions.md
- 🔴 ABSOLUTE RULES (critical - no exceptions)
- 🟡 MANDATORY PATTERNS (architecture requirements)
- 🏗️ ARCHITECTURE RULES (Clean Architecture structure)
- ✅ VALIDATION RULES (data integrity with Zod)
- 🔒 SECURITY REQUIREMENTS (protection measures)
- 📘 TYPESCRIPT REQUIREMENTS (type safety)
- 🌐 INTERNATIONALIZATION (global ready)
- 🧪 TESTING REQUIREMENTS (quality assurance)
- 📝 NAMING CONVENTIONS (consistency standards)

**Enhanced Version 2.0**:

- ✅ 22 compliance rules with examples
- 📊 Project status: 100% COMPLIANT
- 🎯 Magic phrases for AI assistance
- 📋 Validation commands reference
- 📈 Real-time project statistics
- 🎨 Organized categorical display
- � Correct vs Wrong examples for each rule

**Perfect for**:

- Pre-development rule reminder
- AI code generation guidance
- Team onboarding and training
- Quality gate enforcement
- Compliance auditing reference

## 🔧 Script Development

### Adding New Scripts

1. Create the script file in `/scripts/` directory
2. Make it executable: `chmod +x scripts/your-script.js`
3. Add shebang: `#!/usr/bin/env node`
4. Add to `package.json` scripts section
5. Document in this README

### Script Conventions

- Use Node.js CommonJS format (`.js` extension)
- Include comprehensive error handling
- Provide clear logging with timestamps
- Follow the existing code style
- Add JSDoc comments for functions
- Export classes/functions for testing

### Testing Scripts

Scripts should be testable and maintainable:

```javascript
// Example script structure
#!/usr/bin/env node

class YourScriptClass {
  // Implementation
}

// Allow running as script or importing as module
if (require.main === module) {
  new YourScriptClass().run().catch(console.error);
}

module.exports = { YourScriptClass };
```

## 🚀 Integration with CI/CD

### npm scripts

All scripts are integrated into the npm scripts workflow:

- `npm run validate` - Code quality validation
- `npm run ci` - Complete CI pipeline
- `npm run deploy:*` - Deployment workflows

### GitHub Actions

Scripts can be used in GitHub Actions workflows:

```yaml
- name: Validate Code Quality
  run: npm run validate

- name: Deploy to Production
  run: npm run deploy:prod
```

## 🛡️ Security Considerations

### Script Security

- Scripts don't contain sensitive data
- Environment variables used for configuration
- No hardcoded credentials or secrets
- Input validation for user parameters

### Permissions

- Scripts run with user permissions
- No sudo/admin privileges required
- Safe file system operations only
- Network requests only to trusted endpoints

## 📝 Maintenance

### Regular Tasks

- Review script logs for errors
- Update dependencies if used
- Test scripts in different environments
- Keep documentation updated

### Monitoring

- Script execution times
- Success/failure rates
- Resource usage
- Integration points

---

**Note**: These scripts are designed to work cross-platform (Windows/Linux/macOS) and integrate seamlessly with the Express TypeScript Starter project structure.
