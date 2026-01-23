# Agents in this Workspace

This repository employs automated agents to ensure code quality, consistency, and professional standards.

## 🚀 Super Debug Background Agent

The **Super Debug Background Agent** is a professional background debugging system that provides continuous code monitoring and issue detection. It is integrated directly into the workspace to maintain high code quality standards.

### 🎯 What It Does
- **Real-Time Monitoring**: Watches your files for changes and automatically analyzes them.
- **Automated Linting**: Runs ESLint on every file save to catch issues immediately.
- **Quality Feedback**: Provides real-time feedback on code quality and potential problems.
- **Cursor AI Integration**: Enforces specific rules for AI-generated code.

### 📋 Key Standards Enforced
The agent monitors and enforces the following standards:

#### Code Quality
- Strict adherence to ESLint rules
- TypeScript usage for all new code
- Proper error handling and meaningful naming conventions
- JSDoc comments for complex functions

#### React Best Practices
- Functional components with hooks
- Proper prop validation and state management
- Performance optimization using `React.memo`

#### TypeScript Guidelines
- Strong typing (avoiding `any`)
- Usage of interfaces and generics
- Proper error types

#### Security & Performance
- Input validation and data sanitization
- HTTPS usage and OWASP guidelines
- Memoization and lazy loading strategies

### 🛠️ Commands

You can interact with the Super Debug Agent using the following NPM scripts:

```bash
npm run debug:start    # Run one-time code quality check
npm run debug:fix      # Run check with auto-fix enabled
npm run debug:monitor  # Start continuous monitoring
```

### ⚙️ Configuration

The agent is configured via:
- **`.superdebugrc`**: Agent behavior (watch patterns, check intervals)
- **`.eslintrc.json`**: Linting rules and code standards
- **`.cursorrules`**: AI interaction rules

---
*For more detailed documentation, please refer to `super-debug-agent/README.md`.*
