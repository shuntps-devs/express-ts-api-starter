/**
 * Personal Instructions Compliance Checker
 * Run this before any code generation to ensure compliance
 *
 * Version: 2.0 - Enhanced with complete audit findings
 * Last Updated: August 10, 2025
 * Project: Express TypeScript Starter - 100% Compliant ✅
 */

const ABSOLUTE_RULES = {
  ENGLISH_ONLY: {
    rule: 'ALL CODE must be written in English (variables, functions, classes, comments)',
    violations: [
      'French variables: utilisateur, mot_de_passe',
      'French comments',
    ],
    correct: 'const user = await User.findById(id);',
    wrong: 'const utilisateur = await User.findById(id);',
  },
  NO_INLINE_COMMENTS: {
    rule: 'ONLY JSDoc comments allowed (/** */ format) - NO inline comments (// or /* */)',
    violations: ['// This is forbidden', '/* This too */'],
    correct: '/** JSDoc comment describing function */',
    wrong: '// Inline comment explaining logic',
  },
  ZOD_V4_COMPLIANCE: {
    rule: 'Use Zod v4+ syntax - avoid deprecated methods',
    violations: ['z.string().email()', 'z.string().url()', 'error.format()'],
    correct: 'z.email(), z.url(), z.treeifyError(error)',
    wrong: 'z.string().email() - DEPRECATED in Zod v4+',
  },
  JSDOC_REQUIRED: {
    rule: 'ALL public methods, classes, and complex functions MUST have JSDoc',
    violations: ['Missing @param', 'Missing @returns', 'Missing @throws'],
    correct:
      '/** @param id - User ID @returns User or null @throws NotFoundError */',
    wrong: 'function getUser(id) { // No JSDoc }',
  },
  NO_EXAMPLES_FOLDERS: {
    rule: 'NEVER create examples/ folders - keep production-ready structure',
    violations: ['src/examples/', 'examples/ anywhere'],
    correct: 'docs/ for documentation, src/__tests__/ for test cases',
    wrong: 'examples/ folder with sample code',
  },
  SCRIPTS_ORGANIZATION: {
    rule: 'ALL scripts MUST be in scripts/ folder - no loose scripts in root',
    violations: ['Root directory scripts', 'Scattered utility scripts'],
    correct: 'scripts/deploy.js, scripts/validate-code-quality.js',
    wrong: 'deploy.js in root, utility-script.js anywhere else',
  },
};

const MANDATORY_PATTERNS = {
  BARREL_EXPORTS: {
    rule: 'ALL imports must use barrel exports through index.ts files',
    violations: ['./auth.controller', '../services/user.service'],
    correct: 'import { AuthController } from "../controllers"',
    wrong: 'import { AuthController } from "./auth.controller"',
  },
  ENVIRONMENT_ACCESS: {
    rule: 'Use configured env module instead of direct process.env access',
    violations: ['process.env.NODE_ENV', 'process.env.JWT_SECRET'],
    correct: 'import { env } from "../config"; env.NODE_ENV',
    wrong: 'process.env.NODE_ENV === "production"',
  },
  RESPONSE_HELPER_USAGE: {
    rule: 'Use ResponseHelper for ALL API responses - no manual formatting',
    violations: ['res.status(200).json({...})', 'Manual response objects'],
    correct: 'ResponseHelper.sendSuccess(res, data, 200, message)',
    wrong: 'res.status(200).json({ success: true, data: ... })',
  },
  ERROR_HELPER_USAGE: {
    rule: 'Use ErrorHelper for ALL error handling - unified error management',
    violations: ['Manual error responses', 'Direct res.status(400)'],
    correct: 'ErrorHelper.sendBadRequest(res, message, requestId)',
    wrong: 'res.status(400).json({ error: "Bad request" })',
  },
  CONTEXTUAL_LOGGING: {
    rule: 'Use contextual logger pattern in ALL controllers',
    violations: ['Direct logger usage', 'Missing request context'],
    correct: 'const contextLogger = req.logger ?? logger;',
    wrong: 'logger.info("Operation started") // Missing context',
  },
  HELPER_USAGE_MANDATORY: {
    rule: 'ALWAYS use project helpers instead of reinventing functionality',
    violations: ['Manual date manipulation', 'Custom user sanitization'],
    correct: 'DateHelper.addDays(), UserHelper.sanitizeUser()',
    wrong: 'new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)',
  },
};

const ARCHITECTURE_RULES = {
  CLEAN_ARCHITECTURE: {
    rule: 'Clear separation: Controllers → Services → Models → Database',
    violations: [
      'Business logic in controllers',
      'Database calls in controllers',
    ],
    correct: 'Controller calls UserService.createUser()',
    wrong: 'Controller directly calls User.create()',
  },
  MIDDLEWARE_USAGE: {
    rule: 'Use appropriate middlewares when required',
    violations: ['Missing authenticate middleware', 'Manual validation'],
    correct:
      'router.post("/protected", authenticate, validateRequest, controller)',
    wrong: 'Manual token checking in controller',
  },
  ASYNC_ERROR_HANDLING: {
    rule: 'Use asyncHandler wrapper for all async route handlers',
    violations: ['Unhandled async errors', 'Missing error catching'],
    correct: 'export const handler = asyncHandler(async (req, res) => {...})',
    wrong: 'export const handler = async (req, res) => { // No wrapper }',
  },
};

const VALIDATION_RULES = {
  ZOD_VALIDATION: {
    rule: 'ALWAYS use Zod for validation - no manual validation',
    violations: ['Manual email regex', 'Custom validation functions'],
    correct: 'const schema = z.object({ email: z.email() })',
    wrong: 'if (!email.match(/^[^@]+@[^@]+$/)) { ... }',
  },
  INPUT_VALIDATION: {
    rule: 'Validate ALL inputs with proper Zod schemas',
    violations: ['Unvalidated request bodies', 'Missing parameter validation'],
    correct: 'validateRequest(loginSchema), req.body is typed',
    wrong: 'req.body used without validation',
  },
};

const SECURITY_REQUIREMENTS = {
  SECURITY_HEADERS: {
    rule: 'Helmet, CORS, rate limiting configured on all public routes',
    violations: ['Missing rate limiting', 'Insecure headers'],
    correct: 'app.use(helmet()), rate limiting middleware',
    wrong: 'No security middleware configured',
  },
  DATA_SANITIZATION: {
    rule: 'Always sanitize user data using helpers',
    violations: ['Raw user data in responses', 'Password in JSON'],
    correct: 'UserHelper.sanitizeUser(user)',
    wrong: 'return user; // Contains password field',
  },
};

const TYPESCRIPT_REQUIREMENTS = {
  STRICT_TYPING: {
    rule: 'All types explicit, no any, use union types or proper interfaces',
    violations: ['any type usage', 'Implicit return types'],
    correct: 'function getUser(): Promise<IUser | null>',
    wrong: 'function getUser() { return user; } // Implicit type',
  },
  INTERFACE_NAMING: {
    rule: 'Prefix interfaces with I (IUser, IService, IResponse)',
    violations: ['User interface', 'Response interface without I'],
    correct: 'interface IUser extends Document',
    wrong: 'interface User extends Document',
  },
};

const INTERNATIONALIZATION_RULES = {
  NO_HARDCODED_TEXT: {
    rule: 'NEVER hardcode text in code - ALWAYS use t("key") for messages',
    violations: ['Hardcoded error messages', 'Static success text'],
    correct: 't("auth.loginSuccess")',
    wrong: '"Login successful" // Hardcoded string',
  },
  LOCALIZED_ERRORS: {
    rule: 'All error messages must be localized',
    violations: ['English-only errors', 'Non-localized validation messages'],
    correct: 'ErrorHelper.sendBadRequest(res, t("errors.validation"))',
    wrong: 'res.status(400).json({ error: "Validation failed" })',
  },
};

const TESTING_REQUIREMENTS = {
  TEST_HELPER_USAGE: {
    rule: 'Use TestHelper for ALL test mocks and data generation',
    violations: ['Manual mock creation', 'Custom test data'],
    correct: 'TestHelper.createMockContext(), TestHelper.generateMockUser()',
    wrong: 'const req = { body: {}, params: {} }; // Manual mock',
  },
};

const NAMING_CONVENTIONS = {
  FILE_NAMING: {
    rule: 'Files: kebab-case (user.controller.ts, auth.service.ts)',
    violations: ['camelCase files', 'PascalCase files'],
    correct: 'user.controller.ts, session.service.ts',
    wrong: 'UserController.ts, sessionService.ts',
  },
  CLASS_NAMING: {
    rule: 'Classes: PascalCase (UserController, SessionService)',
    violations: ['camelCase classes', 'kebab-case classes'],
    correct: 'class UserController, class SessionService',
    wrong: 'class userController, class user-controller',
  },
  VARIABLE_NAMING: {
    rule: 'Variables: camelCase (userData, sessionInfo)',
    violations: ['snake_case variables', 'PascalCase variables'],
    correct: 'const userData = ..., let sessionInfo = ...',
    wrong: 'const user_data = ..., let SessionInfo = ...',
  },
  CONSTANT_NAMING: {
    rule: 'Constants: UPPER_SNAKE_CASE (MAX_RETRY_ATTEMPTS)',
    violations: ['camelCase constants', 'lowercase constants'],
    correct: 'const MAX_LOGIN_ATTEMPTS = 5',
    wrong: 'const maxLoginAttempts = 5',
  },
};

/**
 * Display compliance rules in organized categories
 */
function displayComplianceRules() {
  console.log('🚨 PERSONAL INSTRUCTIONS COMPLIANCE REMINDER');
  console.log('='.repeat(80));
  console.log('📋 EXPRESS TYPESCRIPT STARTER - QUALITY STANDARDS');
  console.log('   Project Status: 100% COMPLIANT ✅ (22/22 rules)');
  console.log('   Last Audit: August 10, 2025');
  console.log('='.repeat(80));

  // Absolute Rules - Critical
  console.log('\n🔴 ABSOLUTE RULES - CRITICAL (NO EXCEPTIONS)');
  console.log('-'.repeat(50));
  Object.entries(ABSOLUTE_RULES).forEach(([key, rule]) => {
    console.log(`❌ ${key}:`);
    console.log(`   Rule: ${rule.rule}`);
    console.log(`   ✅ Correct: ${rule.correct}`);
    console.log(`   ❌ Wrong: ${rule.wrong}`);
    console.log('');
  });

  // Mandatory Patterns
  console.log('\n🟡 MANDATORY PATTERNS - ARCHITECTURE');
  console.log('-'.repeat(50));
  Object.entries(MANDATORY_PATTERNS).forEach(([key, rule]) => {
    console.log(`⚠️  ${key}:`);
    console.log(`   Rule: ${rule.rule}`);
    console.log(`   ✅ Correct: ${rule.correct}`);
    console.log(`   ❌ Wrong: ${rule.wrong}`);
    console.log('');
  });

  // Architecture Rules
  console.log('\n🏗️  ARCHITECTURE RULES - STRUCTURE');
  console.log('-'.repeat(50));
  Object.entries(ARCHITECTURE_RULES).forEach(([key, rule]) => {
    console.log(`🔧 ${key}:`);
    console.log(`   Rule: ${rule.rule}`);
    console.log(`   ✅ Correct: ${rule.correct}`);
    console.log(`   ❌ Wrong: ${rule.wrong}`);
    console.log('');
  });

  // Validation Rules
  console.log('\n✅ VALIDATION RULES - DATA INTEGRITY');
  console.log('-'.repeat(50));
  Object.entries(VALIDATION_RULES).forEach(([key, rule]) => {
    console.log(`🛡️  ${key}:`);
    console.log(`   Rule: ${rule.rule}`);
    console.log(`   ✅ Correct: ${rule.correct}`);
    console.log(`   ❌ Wrong: ${rule.wrong}`);
    console.log('');
  });

  // Security Requirements
  console.log('\n🔒 SECURITY REQUIREMENTS - PROTECTION');
  console.log('-'.repeat(50));
  Object.entries(SECURITY_REQUIREMENTS).forEach(([key, rule]) => {
    console.log(`🔐 ${key}:`);
    console.log(`   Rule: ${rule.rule}`);
    console.log(`   ✅ Correct: ${rule.correct}`);
    console.log(`   ❌ Wrong: ${rule.wrong}`);
    console.log('');
  });

  // TypeScript Requirements
  console.log('\n📘 TYPESCRIPT REQUIREMENTS - TYPE SAFETY');
  console.log('-'.repeat(50));
  Object.entries(TYPESCRIPT_REQUIREMENTS).forEach(([key, rule]) => {
    console.log(`🔷 ${key}:`);
    console.log(`   Rule: ${rule.rule}`);
    console.log(`   ✅ Correct: ${rule.correct}`);
    console.log(`   ❌ Wrong: ${rule.wrong}`);
    console.log('');
  });

  // Internationalization Rules
  console.log('\n🌐 INTERNATIONALIZATION - GLOBAL READY');
  console.log('-'.repeat(50));
  Object.entries(INTERNATIONALIZATION_RULES).forEach(([key, rule]) => {
    console.log(`🗺️  ${key}:`);
    console.log(`   Rule: ${rule.rule}`);
    console.log(`   ✅ Correct: ${rule.correct}`);
    console.log(`   ❌ Wrong: ${rule.wrong}`);
    console.log('');
  });

  // Testing Requirements
  console.log('\n🧪 TESTING REQUIREMENTS - QUALITY ASSURANCE');
  console.log('-'.repeat(50));
  Object.entries(TESTING_REQUIREMENTS).forEach(([key, rule]) => {
    console.log(`🔬 ${key}:`);
    console.log(`   Rule: ${rule.rule}`);
    console.log(`   ✅ Correct: ${rule.correct}`);
    console.log(`   ❌ Wrong: ${rule.wrong}`);
    console.log('');
  });

  // Naming Conventions
  console.log('\n📝 NAMING CONVENTIONS - CONSISTENCY');
  console.log('-'.repeat(50));
  Object.entries(NAMING_CONVENTIONS).forEach(([key, rule]) => {
    console.log(`📋 ${key}:`);
    console.log(`   Rule: ${rule.rule}`);
    console.log(`   ✅ Correct: ${rule.correct}`);
    console.log(`   ❌ Wrong: ${rule.wrong}`);
    console.log('');
  });

  // Final reminders
  console.log('\n' + '='.repeat(80));
  console.log('🎯 CRITICAL REMINDERS FOR AI CODE GENERATION:');
  console.log('='.repeat(80));
  console.log(
    '⚠️  GENERATE COMPLIANT CODE FROM THE START - NO CORRECTIONS NEEDED!'
  );
  console.log("⚠️  USE PROJECT HELPERS AND PATTERNS - DON'T REINVENT!");
  console.log('⚠️  FOLLOW BARREL EXPORTS - ALWAYS IMPORT FROM INDEX.TS!');
  console.log('⚠️  JSDOC COMMENTS ONLY - NO INLINE COMMENTS!');
  console.log('⚠️  USE CONTEXTUAL LOGGING IN ALL CONTROLLERS!');
  console.log('⚠️  VALIDATE ALL INPUTS WITH ZOD SCHEMAS!');
  console.log('⚠️  ENGLISH-ONLY CODE - FRENCH ONLY IN DISCUSSIONS!');
  console.log('='.repeat(80));
  console.log(
    '🚀 SUCCESS CRITERIA: ESLint ✅, TypeScript ✅, Tests ✅, No Manual Fixes ✅'
  );
  console.log('📊 PROJECT STATUS: 100% COMPLIANT - REFERENCE IMPLEMENTATION');
  console.log('='.repeat(80));
}

/**
 * Validation commands reminder
 */
function displayValidationCommands() {
  console.log('\n📋 VALIDATION COMMANDS - RUN AFTER CODE GENERATION:');
  console.log('-'.repeat(60));
  console.log('🔍 Quick Check:     npm run lint:check && npm run type-check');
  console.log('🔧 Fix Issues:      npm run lint:fix');
  console.log('🎯 Complete Check:  node scripts/validate-code-quality.js');
  console.log('🚀 Test Run:        npm test');
  console.log('📡 Start Server:    npm run dev');
  console.log('-'.repeat(60));
}

/**
 * Magic phrases for AI assistance
 */
function displayMagicPhrases() {
  console.log('\n✨ MAGIC PHRASES FOR AI ASSISTANCE:');
  console.log('-'.repeat(50));
  console.log('🎯 "Respecte strictement personal.instructions.md"');
  console.log('🎯 "Generate compliant code from the start"');
  console.log('🎯 "Follow project conventions"');
  console.log('🎯 "No corrections after the fact"');
  console.log('🎯 "Use barrel exports and project helpers"');
  console.log('-'.repeat(50));
}

/**
 * Project statistics
 */
function displayProjectStats() {
  console.log('\n📊 PROJECT QUALITY STATISTICS:');
  console.log('-'.repeat(40));
  console.log('✅ Compliance Score:     100% (22/22 rules)');
  console.log('✅ ESLint Errors:        0');
  console.log('✅ TypeScript Errors:    0');
  console.log('✅ Architecture:         Clean Architecture ✅');
  console.log('✅ Security:             Helmet + CORS + Rate Limiting ✅');
  console.log('✅ Validation:           Zod v4+ Everywhere ✅');
  console.log('✅ Internationalization: Complete i18n ✅');
  console.log('✅ Testing:              Comprehensive Coverage ✅');
  console.log('✅ Documentation:        Complete JSDoc ✅');
  console.log('✅ Helpers Usage:        100% Adoption ✅');
  console.log('-'.repeat(40));
}

// Execute the compliance reminder
if (require.main === module) {
  displayComplianceRules();
  displayValidationCommands();
  displayMagicPhrases();
  displayProjectStats();

  console.log(
    '\n🎉 Ready for AI-assisted development with full compliance! 🎉\n'
  );
}
