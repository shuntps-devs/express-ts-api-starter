# Security Policy

## Security Scanning

This repository uses automated security scanning to detect vulnerabilities and maintain code quality.

### Enabled Features:

- ✅ Dependency vulnerability scanning (npm audit)
- ✅ Automated testing with security checks
- ✅ Docker security best practices
- ✅ Input validation and sanitization

### Reporting Security Issues:

If you discover a security vulnerability, please report it by:

1. Creating a private security advisory on GitHub
2. Or emailing the maintainers directly

### Security Best Practices:

- Dependencies are regularly audited
- All inputs are validated using Zod schemas
- Secure HTTP headers are implemented
- Rate limiting is configured
- Non-root Docker containers are used
