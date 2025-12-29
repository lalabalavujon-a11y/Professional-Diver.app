#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

class SuperDebugInstaller {
  constructor() {
    // If we're in the super-debug-agent directory, go up one level to the project root
    this.projectRoot = process.cwd().includes('super-debug-agent') 
      ? path.join(process.cwd(), '..') 
      : process.cwd();
    this.agentDir = path.join(__dirname, '..');
  }

  async install() {
    console.log(chalk.blue('🚀 SUPER DEBUG BACKGROUND AGENT - INSTALLER'));
    console.log(chalk.gray('Professional code quality monitoring system\n'));

    try {
      // Check if already installed
      if (this.isAlreadyInstalled()) {
        console.log(chalk.yellow('⚠️  Super Debug Agent appears to be already installed'));
        const answer = await this.askQuestion('Do you want to reinstall? (y/n): ');
        if (answer.toLowerCase() !== 'y') {
          console.log(chalk.blue('Installation cancelled'));
          return;
        }
      }

      // Install dependencies
      await this.installDependencies();
      
      // Create configuration files
      await this.createConfigFiles();
      
      // Update package.json
      await this.updatePackageJson();
      
      // Create Cursor AI rules
      await this.createCursorRules();
      
      // Test installation
      await this.testInstallation();
      
      console.log(chalk.green('\n🎉 SUPER DEBUG BACKGROUND AGENT INSTALLED SUCCESSFULLY!'));
      this.showNextSteps();
      
    } catch (error) {
      console.error(chalk.red('\n❌ Installation failed:', error.message));
      process.exit(1);
    }
  }

  isAlreadyInstalled() {
    return fs.existsSync(path.join(this.projectRoot, '.superdebugrc')) || 
           fs.existsSync(path.join(this.projectRoot, '.eslintrc.json')) ||
           fs.existsSync(path.join(this.projectRoot, 'node_modules/super-debug-agent'));
  }

  async installDependencies() {
    console.log(chalk.cyan('📦 Installing dependencies...'));
    
    const dependencies = [
      'chokidar@^3.5.3',
      'eslint@^8.57.1',
      'eslint-config-next@^15.0.0',
      'eslint-plugin-react@^7.34.0',
      'eslint-plugin-react-hooks@^4.6.0',
      '@typescript-eslint/eslint-plugin@^8.42.0',
      '@typescript-eslint/parser@^8.42.0',
      'chalk@^4.1.2',
      'ora@^5.4.1',
      'node-cron@^3.0.3'
    ];

    try {
      execSync(`npm install --save-dev ${dependencies.join(' ')}`, { 
        stdio: 'inherit',
        cwd: this.projectRoot 
      });
      console.log(chalk.green('✅ Dependencies installed successfully'));
    } catch (error) {
      throw new Error(`Failed to install dependencies: ${error.message}`);
    }
  }

  async createConfigFiles() {
    console.log(chalk.cyan('⚙️  Creating configuration files...'));
    
    // Create .superdebugrc
    const superDebugConfig = {
      watchPatterns: ['**/*.{js,jsx,ts,tsx}'],
      ignorePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**'],
      autoFix: false,
      checkInterval: '*/5 * * * *', // Every 5 minutes
      verbose: true,
      projectName: path.basename(this.projectRoot)
    };
    
    fs.writeFileSync(
      path.join(this.projectRoot, '.superdebugrc'),
      JSON.stringify(superDebugConfig, null, 2)
    );
    console.log(chalk.green('✅ Created .superdebugrc'));
    
    // Create .eslintrc.json
    const eslintConfig = {
      extends: [
        'next/core-web-vitals',
        '@typescript-eslint/recommended'
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      plugins: [
        '@typescript-eslint',
        'react',
        'react-hooks'
      ],
      rules: {
        '@typescript-eslint/no-unused-vars': 'warn',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/explicit-function-return-type': 'off',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'react/prop-types': 'off',
        'react/react-in-jsx-scope': 'off'
      },
      settings: {
        react: {
          version: 'detect'
        }
      }
    };
    
    fs.writeFileSync(
      path.join(this.projectRoot, '.eslintrc.json'),
      JSON.stringify(eslintConfig, null, 2)
    );
    console.log(chalk.green('✅ Created .eslintrc.json'));
    
    // Create .eslintignore
    const eslintIgnore = [
      'node_modules/',
      'dist/',
      'build/',
      '.next/',
      'coverage/',
      '*.min.js',
      '*.bundle.js'
    ].join('\n');
    
    fs.writeFileSync(
      path.join(this.projectRoot, '.eslintignore'),
      eslintIgnore
    );
    console.log(chalk.green('✅ Created .eslintignore'));
  }

  async updatePackageJson() {
    console.log(chalk.cyan('📝 Updating package.json...'));
    
    const packagePath = path.join(this.projectRoot, 'package.json');
    if (!fs.existsSync(packagePath)) {
      console.log(chalk.yellow('⚠️  No package.json found, skipping script updates'));
      return;
    }
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      if (!packageJson.scripts) packageJson.scripts = {};
      
      // Add debug scripts
      packageJson.scripts['debug:start'] = 'eslint . --ext .js,.jsx,.ts,.tsx';
      packageJson.scripts['debug:fix'] = 'eslint . --ext .js,.jsx,.ts,.tsx --fix';
      packageJson.scripts['debug:monitor'] = 'node ./super-debug-agent/index.js';
      packageJson.scripts['debug:install'] = 'node ./super-debug-agent/scripts/install.js';
      packageJson.scripts['debug:configure'] = 'node ./super-debug-agent/scripts/configure.js';
      
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
      console.log(chalk.green('✅ Updated package.json with debug scripts'));
      
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not update package.json:', error.message));
    }
  }

  async createCursorRules() {
    console.log(chalk.cyan('🤖 Creating Cursor AI integration...'));
    
    const cursorRules = `# SUPER DEBUG BACKGROUND AGENT - CURSOR AI RULES

## Code Quality Standards
- Follow ESLint rules strictly
- Use TypeScript for all new code
- Implement proper error handling
- Write meaningful variable and function names
- Add JSDoc comments for complex functions

## React Best Practices
- Use functional components with hooks
- Implement proper prop validation
- Follow React Hooks rules
- Use React.memo for performance optimization
- Implement proper state management

## TypeScript Guidelines
- Define proper types for all variables
- Use interfaces for object shapes
- Avoid 'any' type - use proper typing
- Implement proper error types
- Use generics where appropriate

## File Organization
- Group related functionality together
- Use consistent file naming conventions
- Separate concerns into different files
- Implement proper module exports
- Use index files for clean imports

## Testing Considerations
- Write testable code
- Use dependency injection where possible
- Implement proper error boundaries
- Add logging for debugging
- Consider edge cases

## Performance Guidelines
- Implement proper memoization
- Use lazy loading where appropriate
- Optimize bundle size
- Implement proper caching strategies
- Monitor memory usage

## Security Best Practices
- Validate all inputs
- Sanitize data before rendering
- Use HTTPS in production
- Implement proper authentication
- Follow OWASP guidelines

## Debugging Support
- Add comprehensive logging
- Implement proper error tracking
- Use source maps in development
- Add debugging information
- Implement health checks

Remember: The Super Debug Background Agent is monitoring your code quality in real-time. Write clean, maintainable, and professional code! 🚀
`;
    
    fs.writeFileSync(
      path.join(this.projectRoot, '.cursorrules'),
      cursorRules
    );
    console.log(chalk.green('✅ Created .cursorrules for Cursor AI integration'));
  }

  async testInstallation() {
    console.log(chalk.cyan('🧪 Testing installation...'));
    
    try {
      // Test ESLint
      execSync('npx eslint --version', { 
        stdio: 'pipe',
        cwd: this.projectRoot 
      });
      console.log(chalk.green('✅ ESLint is working'));
      
      // Test basic linting
      execSync('npx eslint . --ext .js,.jsx,.ts,.tsx --max-warnings 0', { 
        stdio: 'pipe',
        cwd: this.projectRoot 
      });
      console.log(chalk.green('✅ Code quality check passed'));
      
    } catch (error) {
      if (error.status === 1) {
        console.log(chalk.yellow('⚠️  Code quality check found issues (this is normal for existing projects)'));
      } else {
        throw new Error(`Installation test failed: ${error.message}`);
      }
    }
  }

  showNextSteps() {
    console.log(chalk.blue('\n🚀 NEXT STEPS:'));
    console.log(chalk.gray('─'.repeat(40)));
    console.log(chalk.cyan('\n1. Run a code quality check:'));
    console.log(chalk.gray('   npm run debug:start'));
    
    console.log(chalk.cyan('\n2. Start continuous monitoring:'));
    console.log(chalk.gray('   npm run debug:monitor'));
    
    console.log(chalk.cyan('\n3. Auto-fix simple issues:'));
    console.log(chalk.gray('   npm run debug:fix'));
    
    console.log(chalk.cyan('\n4. Configure agent settings:'));
    console.log(chalk.gray('   npm run debug:configure'));
    
    console.log(chalk.cyan('\n5. View agent statistics:'));
    console.log(chalk.gray('   node ./super-debug-agent/bin/super-debug.js stats'));
    
    console.log(chalk.blue('\n📚 Documentation:'));
    console.log(chalk.gray('   README.md in super-debug-agent directory'));
    
    console.log(chalk.blue('\n🎯 The agent is now monitoring your code quality!'));
    console.log(chalk.gray('   Every file save will trigger automatic analysis'));
  }

  async askQuestion(question) {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }
}

// Run installer if called directly
if (require.main === module) {
  const installer = new SuperDebugInstaller();
  installer.install().catch(error => {
    console.error(chalk.red('❌ Installation failed:', error.message));
    process.exit(1);
  });
}

module.exports = SuperDebugInstaller;
