# Contributing to Express TypeScript Starter

First off, thank you for considering contributing to Express TypeScript Starter! It's people like you that make this project great.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible using our bug report template.

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please use our feature request template and provide as much detail as possible.

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/express-ts-api-starter.git
cd express-ts-api-starter

# Backend setup
cd backend
npm install
cp .env.example .env
# Configure your environment variables

# Run tests
npm test

# Start development server  
npm run dev
```

## Coding Standards

- Use TypeScript strict mode
- Follow ESLint rules (zero warnings policy)
- Use Prettier for code formatting
- Write tests for new features
- Use conventional commits for clear history
- Add JSDoc comments for functions and classes

### Commit Message Format

We use conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

## Testing

- Write unit tests for new functions
- Write integration tests for new endpoints
- Ensure all tests pass before submitting PR
- Aim for good test coverage

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Documentation

- Update README.md if needed
- Add JSDoc comments for new functions
- Update API documentation for new endpoints
- Update CHANGELOG.md following Keep a Changelog format

## Questions?

Feel free to open an issue for any questions about contributing!
