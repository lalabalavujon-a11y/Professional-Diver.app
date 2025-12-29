#!/usr/bin/env node

const chokidar = require('chokidar');
const { ESLint } = require('eslint');
const chalk = require('chalk');
const ora = require('ora');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');

class SuperDebugAgent {
  constructor() {
    this.isRunning = false;
    this.watcher = null;
    this.eslint = null;
    this.spinner = null;
    this.config = this.loadConfig();
    this.stats = {
      filesChecked: 0,
      issuesFound: 0,
      issuesFixed: 0,
      lastCheck: null
    };
  }

  loadConfig() {
    const configPath = path.join(process.cwd(), '.superdebugrc');
    if (fs.existsSync(configPath)) {
      try {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (error) {
        console.log(chalk.yellow('⚠️  Using default configuration'));
      }
    }
    
    return {
      watchPatterns: ['**/*.{js,jsx,ts,tsx}'],
      ignorePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**'],
      autoFix: false,
      checkInterval: '*/5 * * * *', // Every 5 minutes
      verbose: true
    };
  }

  async initialize() {
    try {
      this.spinner = ora('Initializing Super Debug Agent...').start();
      
      // Initialize ESLint
      this.eslint = new ESLint({
        useEslintrc: true,
        fix: this.config.autoFix
      });

      this.spinner.succeed('Super Debug Agent initialized successfully!');
      console.log(chalk.blue('🔍 Monitoring patterns:', this.config.watchPatterns.join(', ')));
      console.log(chalk.blue('⏰ Check interval:', this.config.checkInterval));
      
    } catch (error) {
      this.spinner.fail('Failed to initialize Super Debug Agent');
      console.error(chalk.red('Error:', error.message));
      throw error;
    }
  }

  async startWatching() {
    if (this.isRunning) {
      console.log(chalk.yellow('⚠️  Agent is already running'));
      return;
    }

    try {
      await this.initialize();
      
      // Start file watcher
      this.watcher = chokidar.watch(this.config.watchPatterns, {
        ignored: this.config.ignorePatterns,
        persistent: true,
        ignoreInitial: false
      });

      this.watcher
        .on('add', (filePath) => this.handleFileChange(filePath, 'added'))
        .on('change', (filePath) => this.handleFileChange(filePath, 'modified'))
        .on('unlink', (filePath) => this.handleFileChange(filePath, 'removed'));

      // Start scheduled checks
      cron.schedule(this.config.checkInterval, () => {
        this.runFullCheck();
      });

      this.isRunning = true;
      console.log(chalk.green('🚀 Super Debug Agent is now monitoring your code!'));
      console.log(chalk.gray('Press Ctrl+C to stop monitoring'));
      
    } catch (error) {
      console.error(chalk.red('Failed to start agent:', error.message));
    }
  }

  async handleFileChange(filePath, event) {
    if (!this.eslint) return;

    const relativePath = path.relative(process.cwd(), filePath);
    
    if (this.config.verbose) {
      console.log(chalk.cyan(`📝 ${event}: ${relativePath}`));
    }

    try {
      const results = await this.eslint.lintFiles([filePath]);
      await this.processResults(results, [relativePath]);
    } catch (error) {
      if (this.config.verbose) {
        console.log(chalk.yellow(`⚠️  Could not lint ${relativePath}: ${error.message}`));
      }
    }
  }

  async runFullCheck() {
    if (!this.eslint) return;

    try {
      this.spinner = ora('Running full code quality check...').start();
      
      const results = await this.eslint.lintFiles(this.config.watchPatterns);
      const allFiles = results.map(result => path.relative(process.cwd(), result.filePath));
      
      await this.processResults(results, allFiles);
      
      this.stats.lastCheck = new Date();
      this.spinner.succeed('Full check completed!');
      
    } catch (error) {
      this.spinner.fail('Full check failed');
      console.error(chalk.red('Error:', error.message));
    }
  }

  async processResults(results, filePaths) {
    let totalIssues = 0;
    let fixableIssues = 0;

    for (const result of results) {
      if (result.messages.length > 0) {
        totalIssues += result.messages.length;
        fixableIssues += result.messages.filter(msg => msg.fix).length;
        
        const relativePath = path.relative(process.cwd(), result.filePath);
        
        if (this.config.verbose) {
          console.log(chalk.red(`\n❌ Issues in ${relativePath}:`));
          result.messages.forEach(message => {
            const icon = message.fix ? '🔧' : '⚠️';
            const severity = message.severity === 2 ? chalk.red : chalk.yellow;
            console.log(`  ${icon} ${severity(message.line + ':' + message.column)} ${message.message}`);
          });
        }
      }
    }

    this.stats.filesChecked += filePaths.length;
    this.stats.issuesFound += totalIssues;

    if (totalIssues > 0) {
      console.log(chalk.red(`\n📊 Found ${totalIssues} issues across ${filePaths.length} files`));
      if (fixableIssues > 0) {
        console.log(chalk.yellow(`🔧 ${fixableIssues} issues can be auto-fixed`));
      }
    } else if (this.config.verbose) {
      console.log(chalk.green(`✅ All ${filePaths.length} files passed quality checks!`));
    }
  }

  async stop() {
    if (this.watcher) {
      this.watcher.close();
    }
    
    if (this.spinner) {
      this.spinner.stop();
    }
    
    this.isRunning = false;
    console.log(chalk.blue('🛑 Super Debug Agent stopped'));
  }

  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      uptime: this.isRunning ? Date.now() - this.startTime : 0
    };
  }
}

// CLI interface
if (require.main === module) {
  const agent = new SuperDebugAgent();
  
  process.on('SIGINT', async () => {
    await agent.stop();
    process.exit(0);
  });

  agent.startWatching();
}

module.exports = { SuperDebugAgent };
