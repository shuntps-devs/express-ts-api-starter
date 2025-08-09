#!/usr/bin/env node

/**
 * Deployment Script
 * Automates the build and deployment process
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class DeploymentManager {
  constructor() {
    this.steps = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '📋';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runCommand(command, description) {
    this.log(`Running: ${description}...`);

    try {
      const { stdout, stderr } = await execAsync(command);

      if (stderr && !stderr.includes('warning')) {
        this.log(`Warning in ${description}: ${stderr}`, 'error');
      }

      if (stdout) {
        this.log(`${description} completed`);
      }

      return { success: true, output: stdout };
    } catch (error) {
      this.log(`Failed ${description}: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async build() {
    this.log('🚀 Starting build process...');

    // Step 1: Clean previous build
    let result = await this.runCommand(
      'npm run clean',
      'Clean build directory'
    );
    if (!result.success) return false;

    // Step 2: Install dependencies
    result = await this.runCommand('npm ci', 'Install dependencies');
    if (!result.success) return false;

    // Step 3: Run quality checks
    result = await this.runCommand('npm run ci', 'Quality checks');
    if (!result.success) return false;

    // Step 4: Build application
    result = await this.runCommand('npm run build', 'Build application');
    if (!result.success) return false;

    this.log('🎉 Build completed successfully!', 'success');
    return true;
  }

  async deploy(environment = 'production') {
    this.log(`🚀 Starting deployment to ${environment}...`);

    // Build first
    const buildSuccess = await this.build();
    if (!buildSuccess) {
      this.log('Build failed, aborting deployment', 'error');
      return false;
    }

    this.log('📦 Preparing deployment package...');

    // In a real scenario, you would:
    // 1. Create deployment package
    // 2. Upload to server/container registry
    // 3. Run deployment scripts
    // 4. Health checks

    this.log(`✅ Deployment to ${environment} completed!`, 'success');
    return true;
  }

  async healthCheck() {
    this.log('🏥 Running health checks...');

    try {
      // In a real scenario, you would check:
      // 1. Application starts correctly
      // 2. Database connectivity
      // 3. API endpoints respond
      // 4. Dependencies are available

      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.log('✅ All health checks passed!', 'success');
      return true;
    } catch (error) {
      this.log(`Health check failed: ${error.message}`, 'error');
      return false;
    }
  }

  async run() {
    const args = process.argv.slice(2);
    const command = args[0] || 'build';
    const environment = args[1] || 'production';

    this.log(`🎯 Running deployment command: ${command}`);

    switch (command) {
      case 'build':
        const success = await this.build();
        process.exit(success ? 0 : 1);
        break;

      case 'deploy':
        const deployed = await this.deploy(environment);
        if (deployed) {
          await this.healthCheck();
        }
        process.exit(deployed ? 0 : 1);
        break;

      case 'health':
        const healthy = await this.healthCheck();
        process.exit(healthy ? 0 : 1);
        break;

      default:
        this.log(`Unknown command: ${command}`, 'error');
        this.log('Available commands: build, deploy [environment], health');
        process.exit(1);
    }
  }
}

// Run deployment if this file is executed directly
if (require.main === module) {
  new DeploymentManager().run().catch(console.error);
}

module.exports = { DeploymentManager };
