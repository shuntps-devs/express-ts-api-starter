# Security Policy

## Code Scanning

This repository uses GitHub CodeQL for automated code analysis and security scanning.

### Enabled Features:

- ✅ Dependency vulnerability scanning (npm audit)
- ✅ Static code analysis (CodeQL)
- ✅ Security-focused queries
- ✅ Automated SARIF upload

### Configuration:

- Languages: JavaScript/TypeScript
- Query suites: security-and-quality
- Paths: src/, _.js, _.ts
- Excluded: node_modules, coverage, dist

For security issues, please check the Security tab in this repository.
