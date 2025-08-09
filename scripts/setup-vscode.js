#!/usr/bin/env node

/**
 * VS Code Automatic Setup Script
 * Configures optimal settings to avoid cache issues
 */

const fs = require('fs');
const path = require('path');

// Console colors
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Optimized VS Code Configuration
 */
const vscodeSettings = {
  // === Disable tab restoration ===
  'window.restoreWindows': 'none',
  'workbench.startup.editor': 'none',

  // === Disable automatic state saving ===
  'files.hotExit': 'off',
  'workbench.editor.restoreViewState': false,
  'workbench.editor.enablePreview': false,

  // === File exclusions and monitoring ===
  'files.exclude': {
    '**/node_modules': true,
    '**/dist': true,
    '**/coverage': true,
    '**/.git': true,
    '**/logs': true,
    '**/.nyc_output': true,
    '**/tmp': true,
    '**/temp': true,
  },

  'search.exclude': {
    '**/node_modules': true,
    '**/dist': true,
    '**/coverage': true,
    '**/logs': true,
    '**/.nyc_output': true,
  },

  'files.watcherExclude': {
    '**/.git/objects/**': true,
    '**/.git/subtree-cache/**': true,
    '**/node_modules/*/**': true,
    '**/dist/**': true,
    '**/coverage/**': true,
    '**/.vscode/**': true,
    '**/logs/**': true,
    '**/.nyc_output/**': true,
  },

  // === Désactiver les fonctions automatiques ===
  'git.autofetch': false,
  'extensions.autoUpdate': false,
  'typescript.disableAutomaticTypeAcquisition': true,

  // === File configuration ===
  'files.autoSave': 'off',
  'editor.formatOnSave': true,
  'editor.codeActionsOnSave': {
    'source.fixAll.eslint': 'explicit',
  },

  // === TypeScript configuration ===
  'typescript.preferences.includePackageJsonAutoImports': 'off',
  'typescript.suggest.autoImports': false,

  // === Performance ===
  'editor.minimap.enabled': false,
  'workbench.editor.enablePreviewFromQuickOpen': false,
  'workbench.editor.enablePreviewFromCodeNavigation': false,

  // === Security ===
  'security.workspace.trust.untrustedFiles': 'prompt',
  'extensions.ignoreRecommendations': true,

  // === Project-specific configuration ===
  'eslint.validate': [
    'javascript',
    'javascriptreact',
    'typescript',
    'typescriptreact',
  ],
  'eslint.run': 'onSave',
  'prettier.requireConfig': true,

  // === Terminal ===
  'terminal.integrated.persistentSessionReviveProcess': 'never',
  'terminal.integrated.enablePersistentSessions': false,
};

/**
 * Recommended extensions for the project
 */
const recommendedExtensions = {
  recommendations: [
    'ms-vscode.vscode-typescript-next',
    'dbaeumer.vscode-eslint',
    'esbenp.prettier-vscode',
    'bradlc.vscode-tailwindcss',
    'ms-vscode.vscode-json',
  ],
};

/**
 * VS Code tasks for the project
 */
const vscodeModifikats = {
  version: '2.0.0',
  tasks: [
    {
      label: 'Clean VS Code Cache',
      type: 'shell',
      command: './scripts/clean-vscode-cache.bat',
      group: 'build',
      presentation: {
        echo: true,
        reveal: 'always',
        focus: false,
        panel: 'shared',
      },
      problemMatcher: [],
    },
    {
      label: 'Setup Development',
      type: 'shell',
      command: 'npm',
      args: ['run', 'dev:setup'],
      group: 'build',
      presentation: {
        echo: true,
        reveal: 'always',
        focus: true,
        panel: 'shared',
      },
    },
  ],
};

/**
 * Créer les dossiers VS Code
 */
function createVSCodeDirectories() {
  const vscodeDir = path.join(process.cwd(), '.vscode');

  if (!fs.existsSync(vscodeDir)) {
    fs.mkdirSync(vscodeDir, { recursive: true });
    log('✅ .vscode directory created', 'green');
  } else {
    log('📁 .vscode directory already exists', 'yellow');
  }

  return vscodeDir;
}

/**
 * Write configuration file
 */
function writeConfigFile(filePath, content, description) {
  try {
    let existingContent = {};

    // Read existing file if it exists
    if (fs.existsSync(filePath)) {
      const existingData = fs.readFileSync(filePath, 'utf8');
      try {
        existingContent = JSON.parse(existingData);
      } catch (e) {
        log(`⚠️  Existing ${description} file invalid, replacing...`, 'yellow');
      }
    }

    // Merge configurations
    const mergedContent = { ...existingContent, ...content };

    // Write file
    fs.writeFileSync(filePath, JSON.stringify(mergedContent, null, 2));
    log(`✅ ${description} configured`, 'green');

    return true;
  } catch (error) {
    log(`❌ Error writing ${description}: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Main configuration
 */
function setupVSCode() {
  log(
    `${colors.bold}🔧 VS Code Automatic Configuration${colors.reset}`,
    'blue'
  );
  log('================================================', 'blue');

  const vscodeDir = createVSCodeDirectories();

  const files = [
    {
      path: path.join(vscodeDir, 'settings.json'),
      content: vscodeSettings,
      description: 'VS Code Settings',
    },
    {
      path: path.join(vscodeDir, 'extensions.json'),
      content: recommendedExtensions,
      description: 'Recommended Extensions',
    },
    {
      path: path.join(vscodeDir, 'tasks.json'),
      content: vscodeModifikats,
      description: 'VS Code Tasks',
    },
  ];

  let successCount = 0;
  files.forEach((file) => {
    if (writeConfigFile(file.path, file.content, file.description)) {
      successCount++;
    }
  });

  log('================================================', 'blue');

  if (successCount === files.length) {
    log(`✅ VS Code configuration completed successfully!`, 'green');
    log('', 'reset');
    log('📋 Next steps:', 'blue');
    log('  1. Restart VS Code', 'reset');
    log('  2. Install recommended extensions', 'reset');
    log('  3. Run: npm run clean:cache', 'reset');
    log('  4. Test with: Ctrl+Shift+P > "Tasks: Run Task"', 'reset');
  } else {
    log(
      `⚠️  Partially successful configuration (${successCount}/${files.length})`,
      'yellow'
    );
  }

  return successCount === files.length;
}

/**
 * Check prerequisites
 */
function checkPrerequisites() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    log(
      '❌ package.json not found. Run this script from the project root.',
      'red'
    );
    process.exit(1);
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    log(`📦 Project detected: ${packageJson.name || 'Unnamed'}`, 'blue');
    return true;
  } catch (error) {
    log('❌ Invalid package.json', 'red');
    process.exit(1);
  }
}

/**
 * Main entry point
 */
function main() {
  try {
    checkPrerequisites();
    const success = setupVSCode();

    if (success) {
      log('', 'reset');
      log(
        `${colors.bold}🎉 Configuration complete! Your VS Code is now optimized.${colors.reset}`,
        'green'
      );
    }

    process.exit(success ? 0 : 1);
  } catch (error) {
    log(`❌ Critical error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  setupVSCode,
  vscodeSettings,
  recommendedExtensions,
};
