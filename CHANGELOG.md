# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.2] - 2024-01-15

### Added
- Project root README.md with comprehensive overview
- Complete project structure documentation
- Tech stack overview and roadmap
- Contributing guidelines and development standards

### Changed
- **COMPLIANCE**: Removed all console.log statements from test files
- **COMPLIANCE**: Converted all inline comments to JSDoc format
- **COMPLIANCE**: Updated all documentation to English
- **COMPLIANCE**: Standardized comment formatting across codebase
- **TESTING**: Improved test cleanup and mock management
- **TESTING**: Enhanced TestHelper consistency across all test files
- **CONFIG**: Updated ESLint configuration for better compliance
- **DOCS**: Translated French documentation to English

### Fixed
- Test console output violations in middleware tests
- Inline comment violations across entire codebase
- Language consistency in documentation files
- ESLint violations in configuration and type files

### Technical Details
- 249 tests maintained at 100% success rate
- Zero ESLint errors or warnings
- Full TypeScript compliance
- Complete JSDoc coverage for comments
- Standardized barrel imports pattern

## [0.2.1] - 2024-01-10

### Added
- Complete middleware test suite with 100% coverage
- Avatar upload system with Sharp image processing
- Comprehensive admin API with session management
- Profile management with avatar support
- Email verification system with Resend integration
- Password reset functionality
- Cleanup service for expired sessions and tokens
- Audit logging middleware
- Performance monitoring middleware

### Changed
- Enhanced security middleware configuration
- Improved error handling with contextual logging
- Updated authentication system with session management
- Refactored user service for better modularity

### Fixed
- Session management edge cases
- Avatar upload validation
- Error response consistency
- Test stability and reliability

## [0.2.0] - 2024-01-05

### Added
- JWT authentication system with HTTP-only cookies
- User registration and login endpoints
- MongoDB integration with Mongoose
- Comprehensive test suite with Jest and Supertest
- Docker development environment
- CI/CD pipeline with GitHub Actions
- API documentation with Postman collections

### Changed
- Migrated from JavaScript to TypeScript
- Enhanced security with Helmet and CORS
- Implemented structured logging with Winston
- Added input validation with Zod schemas

### Fixed
- Authentication middleware edge cases
- Database connection handling
- Environment variable validation

## [0.1.0] - 2024-01-01

### Added
- Initial Express.js server setup
- Basic TypeScript configuration
- ESLint and Prettier setup
- Docker configuration
- Project structure and documentation

---

### Version Guidelines

- **MAJOR** version when making incompatible API changes
- **MINOR** version when adding functionality in a backwards compatible manner  
- **PATCH** version when making backwards compatible bug fixes

### Commit Categories

- **feat**: New features
- **fix**: Bug fixes
- **docs**: Documentation changes
- **style**: Formatting, missing semi colons, etc
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvements
- **test**: Adding missing tests
- **chore**: Changes to the build process or auxiliary tools
