#!/usr/bin/env node

const { SuperDebugAgent } = require('../index.js');
const chalk = require('chalk');

const agent = new SuperDebugAgent();

async function main() {
  const command = process.argv[2] || 'start';
  
  console.log(chalk.blue('🚀 SUPER DEBUG BACKGROUND AGENT'));
  console.log(chalk.gray('Professional code quality monitoring system\n'));
  
  try {
    switch (command) {
      case 'start':
      case 'monitor':
        console.log(chalk.cyan('Starting continuous monitoring...'));
        await agent.startWatching();
        break;
        
      case 'check':
        console.log(chalk.cyan('Running one-time code quality check...'));
        await agent.runFullCheck();
        process.exit(0);
        break;
        
      case 'stop':
        console.log(chalk.cyan('Stopping agent...'));
        await agent.stop();
        process.exit(0);
        break;
        
      case 'stats': {
        const stats = agent.getStats();
        console.log(chalk.blue('\n📊 AGENT STATISTICS'));
        console.log(chalk.gray('─'.repeat(40)));
        console.log(`Status: ${stats.isRunning ? chalk.green('Running') : chalk.red('Stopped')}`);
        console.log(`Files Checked: ${chalk.cyan(stats.filesChecked)}`);
        console.log(`Issues Found: ${chalk.red(stats.issuesFound)}`);
        console.log(`Issues Fixed: ${chalk.green(stats.issuesFixed)}`);
        if (stats.lastCheck) {
          console.log(`Last Check: ${chalk.gray(stats.lastCheck.toLocaleString())}`);
        }
        process.exit(0);
        break;
      }
        
      case 'install':
        console.log(chalk.cyan('Installing Super Debug Agent...'));
        console.log(chalk.yellow('Use the install-super-debug.sh script instead'));
        break;
        
      case 'configure':
        console.log(chalk.cyan('Configuring Super Debug Agent...'));
        console.log(chalk.yellow('Edit .superdebugrc file to configure'));
        break;
        
      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;
        
      default:
        console.log(chalk.red(`❌ Unknown command: ${command}`));
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('❌ Error:', error.message));
    process.exit(1);
  }
}



function showHelp() {
  console.log(chalk.blue('📖 SUPER DEBUG AGENT - COMMAND REFERENCE'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(chalk.cyan('\nCommands:'));
  console.log(chalk.white('  start, monitor    Start continuous monitoring'));
  console.log(chalk.white('  check             Run one-time code quality check'));
  console.log(chalk.white('  stop              Stop the agent'));
  console.log(chalk.white('  stats             Show agent statistics'));
  console.log(chalk.white('  install           Install agent in current project'));
  console.log(chalk.white('  configure         Configure agent settings'));
  console.log(chalk.white('  help              Show this help message'));
  
  console.log(chalk.cyan('\nExamples:'));
  console.log(chalk.gray('  super-debug start          # Start monitoring'));
  console.log(chalk.gray('  super-debug check          # Run check'));
  console.log(chalk.gray('  super-debug install        # Install in project'));
  console.log(chalk.gray('  super-debug configure      # Configure settings'));
  
  console.log(chalk.cyan('\nNPM Scripts (after installation):'));
  console.log(chalk.gray('  npm run debug:start        # Run check'));
  console.log(chalk.gray('  npm run debug:monitor      # Start monitoring'));
  console.log(chalk.gray('  npm run debug:fix          # Run check with auto-fix'));
  
  console.log(chalk.gray('\nFor more information, visit: https://github.com/your-repo/super-debug-agent'));
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log(chalk.yellow('\n🛑 Shutting down...'));
  await agent.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log(chalk.yellow('\n🛑 Shutting down...'));
  await agent.stop();
  process.exit(0);
});

// Run the CLI
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('❌ Fatal error:', error.message));
    process.exit(1);
  });
}
