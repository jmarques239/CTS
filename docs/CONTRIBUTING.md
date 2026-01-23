# Contributing to CTS

Thank you for your interest in contributing to CTS (Code Test Studio)! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Please be respectful and constructive in all interactions. We welcome contributions from everyone regardless of experience level.

## How to Contribute

### Reporting Issues

**Before reporting an issue:**
- Check existing issues to avoid duplicates
- Test with the latest version of CTS
- Provide clear reproduction steps

**Issue template:**
```
## Description
[Clear description of the issue]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior
[What you expected to happen]

## Actual Behavior
[What actually happened]

## Environment
- OS: [e.g., Windows 10, Ubuntu 20.04]
- Python Version: [e.g., 3.8.5]
- Browser: [e.g., Chrome 90]

## Additional Context
[Any additional information]
```

### Feature Requests

**Feature request template:**
```
## Feature Description
[Clear description of the feature]

## Use Case
[How this feature would be used]

## Proposed Implementation
[Optional: technical details]

## Alternatives Considered
[Other ways to achieve the same goal]
```

### Code Contributions

## Development Setup

### Prerequisites
- Python 3.6+
- GCC or Clang compiler
- Git

### Setup Steps
1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/jmarques239/CTS.git
   cd CTS
   ```
3. Test the setup:
   ```bash
   python3 backend/server.py
   ```

## Development Process

### Branch Strategy
- Create a feature branch from `main`:
  ```bash
  git checkout -b feature/your-feature-name
  ```
- Use descriptive branch names:
  - `feature/add-python-support`
  - `bugfix/fix-memory-leak`
  - `docs/improve-readme`

### Code Standards

**Python Code:**
- Follow PEP 8 style guide
- Use type hints for function signatures
- Add docstrings for public functions
- Handle exceptions appropriately

**JavaScript Code:**
- Use modern ES6+ features
- Follow consistent naming conventions
- Use async/await for asynchronous operations
- Maintain browser compatibility

**Documentation:**
- Update relevant documentation
- Add comments for complex logic
- Keep README.md user-focused

### Testing Your Changes

**Backend Testing:**
- Test C code compilation
- Verify executable testing
- Check error handling
- Test resource limits
- Ensure cleanup works

**Frontend Testing:**
- Test file upload and parsing
- Verify test creation and management
- Check result display
- Test theme switching
- Verify localStorage persistence

### Commit Guidelines

**Commit Message Format:**
```
type(scope): description

[Optional body]

[Optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(backend): add Python language support
fix(frontend): resolve file upload issue
docs: update API reference documentation
```

### Pull Request Process

1. **Ensure tests pass**: Verify your changes work correctly
2. **Update documentation**: Modify relevant docs files
3. **Follow style guidelines**: Check code formatting
4. **Create pull request**: From your feature branch to main

**PR Description Template:**
```
## Description
[What this PR does]

## Changes
- [Change 1]
- [Change 2]
- [Change 3]

## Testing
- [ ] Backend testing completed
- [ ] Frontend testing completed
- [ ] Documentation updated

## Related Issues
Fixes #123
```

## Areas Needing Contributions

### High Priority
- **Testing**: Comprehensive test suite
- **Documentation**: Technical documentation improvements
- **Security**: Security audit and improvements

### Medium Priority
- **Performance**: Optimization opportunities
- **UI/UX**: User interface improvements
- **Accessibility**: WCAG compliance

### Low Priority
- **New Features**: Additional programming language support
- **Integration**: CI/CD pipeline setup
- **Localization**: Multi-language support

## Review Process

### Code Review Checklist
- [ ] Code follows style guidelines
- [ ] Proper error handling implemented
- [ ] Security considerations addressed
- [ ] Documentation updated
- [ ] Testing performed
- [ ] No breaking changes introduced

### Review Timeline
- Initial review within 3-5 days
- Feedback and iterations as needed
- Merge when all criteria met

## Recognition

Contributors will be recognized in:
- Project README.md
- Release notes
- Contributor hall of fame (if established)

## Getting Help

### Communication Channels
- GitHub Issues for bug reports and feature requests
- GitHub Discussions for questions and ideas
- Pull requests for code contributions

### Questions?
- Check existing documentation
- Search existing issues and discussions
- Create a discussion for unanswered questions

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

For development guidelines, see [DEVELOPMENT.md](./DEVELOPMENT.md)
For API reference, see [API_REFERENCE.md](./API_REFERENCE.md)
For architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md)
