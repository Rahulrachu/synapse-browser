# Contributing to Synapse Browser

Thank you for your interest in contributing to Synapse Browser! This document provides guidelines and information for contributors.

## Code of Conduct

By participating in this project, you agree to abide by its terms. Be respectful, inclusive, and constructive in all interactions.

## How to Contribute

### Reporting Bugs

If you encounter a bug, please open an issue with the following information:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots or error logs if applicable
- Your environment (OS, Node.js version, Synapse version)

### Suggesting Features

Feature requests are welcome. Please open an issue describing:

- The feature you would like to see
- The problem it solves
- Any relevant use cases or examples

### Pull Requests

1. Fork the repository
2. Create a feature branch from `master`
3. Make your changes
4. Ensure all tests pass (`npm test`)
5. Run linting (`npm run lint` if available)
6. Write clear commit messages following [Conventional Commits](https://www.conventionalcommits.org/)
7. Push your branch and open a Pull Request

## Development Setup

```bash
# Clone the repository
git clone https://github.com/Rahulrachu/synapse-browser.git
cd synapse-browser

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Code Style

- Use TypeScript for all new code
- Follow existing patterns and conventions in the codebase
- Use functional components with hooks for React
- Keep IPC handlers in `background.ts` and preload script clean
- Add comments for complex logic
- Use meaningful variable and function names

## Project Structure

| Directory | Purpose |
|---|---|
| `src/main/` | Electron main process (background, IPC, window management) |
| `src/renderer/` | React UI components, hooks, and state stores |
| `src/agents/` | AI agent system (orchestrator, specialized agents) |
| `src/engine/` | AI engines (context, planning, memory) |
| `src/browser/` | Browser engine components |
| `src/git/` | Git integration |
| `src/tools/` | Tool runtime for agent actions |
| `src/workspace/` | Session and workspace management |
| `src/common/` | Shared utilities and type definitions |

## Architecture Overview

Synapse Browser uses a layered architecture:

1. **Electron Main Process** - Handles window lifecycle, IPC, and system operations
2. **IPC Bridge** - Secure communication between main and renderer processes
3. **React Renderer** - UI components organized into panels and workspaces
4. **Workspace Engine** - Manages panel layouts, sessions, and templates
5. **AI Runtime** - Orchestrates multi-agent task execution
6. **Storage Layer** - SQLite database and file system persistence

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run UI tests
npm run test:ui
```

## Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring
- `chore/description` - Maintenance tasks

## Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

Examples:

```
feat(browser): add tab grouping support
fix(ipc): resolve duplicate handler registration
docs(readme): update installation instructions
refactor(agents): simplify orchestrator logic
```

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md` with release notes
3. Create a release tag (`git tag -a v1.0.0 -m "Release v1.0.0"`)
4. Push tag to remote (`git push origin v1.0.0`)
5. Build and distribute platform installers

## Questions?

If you have questions, feel free to open an issue or reach out through the project discussions.
