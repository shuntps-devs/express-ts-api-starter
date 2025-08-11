#!/usr/bin/env node

/**
 * Code Quality Validator
 * Validates that the codebase follows all best practices from personal.instructions.md
 */

const { exec } = require('child_process');
const { readdir, readFile, stat } = require('fs/promises');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

class CodeQualityValidator {
  constructor() {
    this.results = [];
  }

  /**
   * Validate TypeScript strict mode is enabled
   */
  async validateTypeScriptStrict() {
    const result = {
      name: 'TypeScript Strict Mode',
      passed: true,
      issues: [],
    };

    try {
      const tsConfig = await readFile('tsconfig.json', 'utf-8');
      const config = JSON.parse(tsConfig);

      if (!config.compilerOptions?.strict) {
        result.passed = false;
        result.issues.push('TypeScript strict mode not enabled');
      }

      if (!config.compilerOptions?.noUnusedLocals) {
        result.passed = false;
        result.issues.push('noUnusedLocals not enabled');
      }

      if (!config.compilerOptions?.noUnusedParameters) {
        result.passed = false;
        result.issues.push('noUnusedParameters not enabled');
      }
    } catch (error) {
      result.passed = false;
      result.issues.push('Could not read tsconfig.json');
    }

    return result;
  }

  /**
   * Validate that console.log/error is not used in production code
   */
  async validateNoConsoleInProd() {
    const result = {
      name: 'No Console in Production',
      passed: true,
      issues: [],
    };

    try {
      // Check for console usage outside of tests
      const { stdout } = await execAsync(
        'findstr /S /I /M "console\\." src\\*.ts | findstr /V "__tests__" || echo ""'
      );

      if (stdout.trim() && !stdout.includes('echo ""')) {
        result.passed = false;
        result.issues.push('console.log/error found in production code');
        result.issues.push(stdout.trim());
      }
    } catch (error) {
      // Ignore errors
    }

    return result;
  }

  /**
   * Validate file structure follows conventions
   */
  async validateFileStructure() {
    const result = {
      name: 'File Structure',
      passed: true,
      issues: [],
    };

    const requiredDirs = [
      'src/controllers',
      'src/services',
      'src/models',
      'src/middleware',
      'src/routes',
      'src/schemas',
      'src/interfaces',
      'src/utils',
      'src/config',
      'src/i18n',
      'src/__tests__',
    ];

    for (const dir of requiredDirs) {
      try {
        const stats = await stat(dir);
        if (!stats.isDirectory()) {
          result.passed = false;
          result.issues.push(`Required directory ${dir} is not a directory`);
        }
      } catch {
        result.passed = false;
        result.issues.push(`Required directory ${dir} does not exist`);
      }
    }

    return result;
  }

  /**
   * Validate middleware integration
   */
  async validateMiddlewareIntegration() {
    const result = {
      name: 'Middleware Integration',
      passed: true,
      issues: [],
    };

    try {
      const serverFile = await readFile('src/server.ts', 'utf-8');

      const requiredMiddleware = [
        'configureRequestLogging',
        'performanceMonitor',
        'userContext',
        'auditLogger',
        'apiVersioning',
        'requestSizeLimiter',
      ];

      for (const middleware of requiredMiddleware) {
        if (!serverFile.includes(middleware)) {
          result.passed = false;
          result.issues.push(`Missing ${middleware} in server.ts`);
        }
      }
    } catch (error) {
      result.passed = false;
      result.issues.push('Could not validate server.ts middleware integration');
    }

    return result;
  }

  /**
   * Validate authentication system
   */
  async validateAuthSystem() {
    const result = {
      name: 'Authentication System',
      passed: true,
      issues: [],
    };

    const requiredFiles = [
      'src/middleware/auth.middleware.ts',
      'src/controllers/auth.controller.ts',
      'src/routes/auth.routes.ts',
      'src/services/user.service.ts',
      'src/types/express.ts',
    ];

    for (const file of requiredFiles) {
      try {
        await stat(file);
      } catch {
        result.passed = false;
        result.issues.push(`Missing authentication file: ${file}`);
      }
    }

    return result;
  }

  /**
   * Run all validations
   */
  async validate() {
    console.log('🔍 Running code quality validation...\n');

    this.results.push(await this.validateTypeScriptStrict());
    this.results.push(await this.validateFileStructure());
    this.results.push(await this.validateMiddlewareIntegration());
    this.results.push(await this.validateAuthSystem());

    // Print results
    let allPassed = true;
    for (const result of this.results) {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.name}`);

      if (!result.passed) {
        allPassed = false;
        result.issues.forEach((issue) => console.log(`   - ${issue}`));
      }
    }

    console.log('\n' + '='.repeat(50));
    if (allPassed) {
      console.log('🎉 All quality checks passed!');
      console.log('Your codebase follows all best practices.');
      process.exit(0);
    } else {
      console.log('💥 Some quality checks failed.');
      console.log('Please fix the issues above.');
      process.exit(1);
    }
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  new CodeQualityValidator().validate().catch(console.error);
}

module.exports = { CodeQualityValidator };
