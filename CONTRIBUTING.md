# Contributing to Маркировочная система

Thank you for your interest in contributing to our project! This guide will help you get started.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

### Our Standards

- **Be respectful**: Treat everyone with respect and kindness
- **Be inclusive**: Welcome people of all backgrounds and experience levels
- **Be constructive**: Provide helpful feedback and suggestions
- **Be patient**: Help others learn and grow

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### Setup

1. **Fork the repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/markirovka.git
   cd markirovka
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

## 🔄 Development Workflow

### Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch for new features
- `feature/*`: New features
- `fix/*`: Bug fixes
- `docs/*`: Documentation updates

### Creating a Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### Making Changes

1. Make your changes in logical, atomic commits
2. Write tests for new functionality
3. Update documentation as needed
4. Ensure all tests pass
5. Follow code style guidelines

## 🎨 Code Style

We use ESLint and Prettier to maintain consistent code style.

### Automated Formatting

```bash
# Lint and fix issues
npm run lint:fix

# Format code
npm run format

# Check types
npm run type-check
```

### Style Guidelines

- **TypeScript**: Use strict mode, explicit types where helpful
- **React**: Functional components with hooks
- **CSS**: Tailwind utility classes, avoid custom CSS
- **File naming**: kebab-case for files, PascalCase for components
- **Import order**: External libraries → Internal modules → Relative imports

### Example Component

```tsx
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { validateInput } from '@/utils/validation';

interface Props {
  title: string;
  onSubmit: (data: string) => void;
}

export const ExampleComponent: React.FC<Props> = ({ title, onSubmit }) => {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (validateInput(value)) {
      onSubmit(value);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="px-3 py-2 border rounded"
      />
      <Button onClick={handleSubmit}>Submit</Button>
    </div>
  );
};
```

## 📝 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks
- **perf**: Performance improvements
- **ci**: CI/CD changes
- **build**: Build system changes

### Examples

```bash
feat(auth): add JWT token refresh functionality

fix(label-designer): resolve canvas rendering issue on mobile

docs(readme): update installation instructions

test(api): add unit tests for validation utilities
```

## 🔀 Pull Request Process

### Before Creating a PR

1. **Ensure your branch is up to date**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout your-branch
   git rebase develop
   ```

2. **Run all checks**
   ```bash
   npm run lint
   npm run type-check
   npm run test
   npm run build
   ```

3. **Update documentation** if needed

### Creating the PR

1. **Use the PR template** - fill out all relevant sections
2. **Write a clear title** following conventional commit format
3. **Describe your changes** with context and reasoning
4. **Link related issues** using "Closes #123" or "Fixes #123"
5. **Add screenshots** for UI changes
6. **Mark as draft** if work is still in progress

### Review Process

- All PRs require at least one review
- Address feedback promptly and professionally
- Update your branch if requested
- Ensure CI passes before merge

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in UI mode
npm run test:ui
```

### Writing Tests

- **Unit tests**: For utility functions and hooks
- **Component tests**: For React components
- **Integration tests**: For user workflows

### Test Example

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { ExampleComponent } from './ExampleComponent';

describe('ExampleComponent', () => {
  it('should call onSubmit when button is clicked', () => {
    const mockOnSubmit = vi.fn();
    render(<ExampleComponent title="Test" onSubmit={mockOnSubmit} />);
    
    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button', { name: /submit/i });
    
    fireEvent.change(input, { target: { value: 'test input' } });
    fireEvent.click(button);
    
    expect(mockOnSubmit).toHaveBeenCalledWith('test input');
  });
});
```

## 📚 Documentation

### Types of Documentation

- **README**: Project overview and setup
- **API docs**: Service and component APIs
- **Code comments**: Complex logic explanation
- **Storybook**: Component documentation

### Writing Guidelines

- Use clear, concise language
- Provide examples where helpful
- Keep documentation up to date with code changes
- Use proper markdown formatting

## 🐛 Issue Reporting

### Before Creating an Issue

1. **Search existing issues** to avoid duplicates
2. **Check the documentation** for solutions
3. **Try the latest version** to see if it's already fixed

### Creating a Good Issue

- **Use the appropriate template** (bug report, feature request, etc.)
- **Provide clear reproduction steps** for bugs
- **Include relevant information** (OS, browser, version)
- **Add screenshots or code examples** when helpful

### Issue Labels

- `bug`: Something isn't working
- `enhancement`: New feature or improvement
- `documentation`: Documentation related
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention needed
- `question`: Further information requested

## 🔧 Development Tools

### Recommended VS Code Extensions

- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- Auto Rename Tag
- Bracket Pair Colorizer

### Git Hooks

Pre-commit hooks are automatically set up to:
- Lint and format staged files
- Run type checking
- Validate commit messages

## 🌟 Recognition

Contributors are recognized in:
- GitHub contributors page
- Release notes (for significant contributions)
- Project documentation

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Email**: For security issues or private matters

## 🎯 Contribution Ideas

Looking for ways to contribute? Here are some ideas:

### For Beginners
- Fix typos in documentation
- Add examples to existing docs
- Write tests for uncovered code
- Improve error messages

### For Experienced Developers
- Performance optimizations
- New features
- Complex bug fixes
- Architecture improvements

### For Designers
- UI/UX improvements
- Design system enhancements
- Accessibility improvements
- Mobile responsiveness

## 📋 Checklist for Contributors

- [ ] I have read and understood the contributing guidelines
- [ ] I have set up the development environment
- [ ] I understand the code style requirements
- [ ] I know how to run tests and checks locally
- [ ] I understand the PR process
- [ ] I know where to ask for help

Thank you for contributing to make this project better! 🙏