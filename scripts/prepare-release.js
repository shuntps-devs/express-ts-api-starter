#!/usr/bin/env node

/**
 * Release Preparation Script
 * Validates project status and prepares for GitHub release
 *
 * @description Runs comprehensive quality checks before release
 * @author Express TypeScript Starter Team
 * @version 1.0.0
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Color codes for console output
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Log message with color and timestamp
 * @param {string} message - Message to log
 * @param {string} color - Color code
 */
function log(message, color = colors.reset) {
  const timestamp = new Date().toISOString();
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

/**
 * Execute command with error handling
 * @param {string} command - Command to execute
 * @param {string} description - Description of the command
 * @returns {boolean} Success status
 */
function executeCommand(command, description) {
  try {
    log(`🔄 ${description}...`, colors.blue);
    const result = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    log(`✅ ${description} completed successfully`, colors.green);
    return true;
  } catch (error) {
    log(`❌ ${description} failed:`, colors.red);
    log(error.message, colors.red);
    return false;
  }
}

/**
 * Read package.json version
 * @returns {string} Current version
 */
function getCurrentVersion() {
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  return packageData.version;
}

/**
 * Check if all files are committed
 * @returns {boolean} True if working directory is clean
 */
function checkGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    return status.trim() === '';
  } catch (error) {
    log('❌ Git status check failed', colors.red);
    return false;
  }
}

/**
 * Get commit count since last tag
 * @returns {number} Number of commits
 */
function getCommitsSinceLastTag() {
  try {
    const result = execSync(
      'git rev-list --count HEAD ^$(git describe --tags --abbrev=0)',
      { encoding: 'utf-8' }
    );
    return parseInt(result.trim(), 10);
  } catch (error) {
    // If no tags exist, count all commits
    const result = execSync('git rev-list --count HEAD', { encoding: 'utf-8' });
    return parseInt(result.trim(), 10);
  }
}

/**
 * Main release preparation function
 */
async function prepareRelease() {
  console.log('\n' + '='.repeat(60));
  log(
    '🚀 EXPRESS TYPESCRIPT STARTER - RELEASE PREPARATION',
    colors.bright + colors.cyan
  );
  console.log('='.repeat(60));

  const version = getCurrentVersion();
  log(`📦 Current Version: ${version}`, colors.magenta);

  // Step 1: Check Git Status
  log('🔍 Step 1/7: Checking Git status...', colors.yellow);
  if (!checkGitStatus()) {
    log(
      '❌ Working directory is not clean. Please commit all changes first.',
      colors.red
    );
    process.exit(1);
  }
  log('✅ Working directory is clean', colors.green);

  // Step 2: ESLint Check
  log('🔍 Step 2/7: Running ESLint...', colors.yellow);
  if (!executeCommand('npm run lint:check', 'ESLint validation')) {
    process.exit(1);
  }

  // Step 3: TypeScript Check
  log('🔍 Step 3/7: TypeScript compilation check...', colors.yellow);
  if (!executeCommand('npm run type-check', 'TypeScript validation')) {
    process.exit(1);
  }

  // Step 4: Run Tests
  log('🔍 Step 4/7: Running test suite...', colors.yellow);
  if (!executeCommand('npm run test:ci', 'Test suite execution')) {
    process.exit(1);
  }

  // Step 5: Code Quality Validation
  log('🔍 Step 5/7: Running quality validation...', colors.yellow);
  if (!executeCommand('npm run validate', 'Code quality validation')) {
    process.exit(1);
  }

  // Step 6: Build Check
  log('🔍 Step 6/7: Production build check...', colors.yellow);
  if (!executeCommand('npm run build', 'Production build')) {
    process.exit(1);
  }

  // Step 7: Release Statistics
  log('🔍 Step 7/7: Generating release statistics...', colors.yellow);
  const commitsSinceLastTag = getCommitsSinceLastTag();

  console.log('\n' + '='.repeat(60));
  log('📊 RELEASE STATISTICS', colors.bright + colors.cyan);
  console.log('='.repeat(60));
  log(`📦 Version: ${version}`, colors.green);
  log(`🔄 Commits since last tag: ${commitsSinceLastTag}`, colors.green);
  log(
    `📅 Release Date: ${new Date().toISOString().split('T')[0]}`,
    colors.green
  );

  // Quality Metrics
  try {
    const testOutput = execSync('npm test -- --passWithNoTests --silent', {
      encoding: 'utf-8',
    });
    const testMatch = testOutput.match(/Tests:\s+(\d+)\s+passed.*total/);
    const testCount = testMatch ? testMatch[1] : 'Unknown';
    log(`🧪 Tests: ${testCount} passing`, colors.green);
  } catch (error) {
    log('🧪 Tests: Could not determine count', colors.yellow);
  }

  console.log('\n' + '='.repeat(60));
  log('✅ PRE-RELEASE VALIDATION COMPLETE', colors.bright + colors.green);
  console.log('='.repeat(60));
  log('🎉 Project is ready for release!', colors.green);

  console.log('\n📋 Next Steps:');
  log('1. Review CHANGELOG.md for completeness', colors.blue);
  log('2. Update RELEASE_NOTES.md if needed', colors.blue);
  log('3. Create and push git tag:', colors.blue);
  log(`   git tag -a v${version} -m "Release v${version}"`, colors.cyan);
  log('   git push origin --tags', colors.cyan);
  log('4. Push to GitHub:', colors.blue);
  log('   git push origin main', colors.cyan);
  log('5. Create GitHub release from tag', colors.blue);

  console.log('\n🏁 Release preparation completed successfully!\n');
}

// Execute if run directly
if (require.main === module) {
  prepareRelease().catch((error) => {
    log('💥 Release preparation failed:', colors.red);
    console.error(error);
    process.exit(1);
  });
}

module.exports = { prepareRelease };
