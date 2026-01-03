#!/usr/bin/env node

/**
 * Automated Vulnerability Checking Script (Node.js version)
 * Cross-platform script to check and fix dependency vulnerabilities
 * 
 * Usage:
 *   node scripts/check-vulnerabilities.js
 *   node scripts/check-vulnerabilities.js --fix
 *   node scripts/check-vulnerabilities.js --level=high --json
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    fix: false,
    level: 'moderate',
    json: false,
    dir: process.cwd(),
    help: false,
  };

  args.forEach(arg => {
    if (arg === '--fix') options.fix = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--help') options.help = true;
    else if (arg.startsWith('--level=')) options.level = arg.split('=')[1];
    else if (arg.startsWith('--dir=')) options.dir = arg.split('=')[1];
  });

  return options;
}

function showHelp() {
  console.log(`
Usage: node scripts/check-vulnerabilities.js [options]

Options:
  --fix              Automatically fix vulnerabilities (safe updates only)
  --level=LEVEL      Set audit level (low|moderate|high|critical)
  --json             Output results in JSON format
  --dir=DIRECTORY    Specify directory to check (default: current)
  --help             Show this help message

Examples:
  node scripts/check-vulnerabilities.js
  node scripts/check-vulnerabilities.js --fix
  node scripts/check-vulnerabilities.js --level=high --json
  node scripts/check-vulnerabilities.js --dir=./client
`);
}

function checkPackageJson(dir) {
  const packageJsonPath = path.join(dir, 'package.json');
  return fs.existsSync(packageJsonPath);
}

function detectPackageManager(dir) {
  if (fs.existsSync(path.join(dir, 'package-lock.json'))) return 'npm';
  if (fs.existsSync(path.join(dir, 'yarn.lock'))) return 'yarn';
  if (fs.existsSync(path.join(dir, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(dir, 'bun.lockb'))) return 'bun';
  return 'npm'; // Default
}

function runAudit(dir, pm, level, json) {
  log(`📦 Checking: ${dir}`, 'blue');
  log(`📋 Package Manager: ${pm}`, 'blue');
  console.log('');

  try {
    let command;
    switch (pm) {
      case 'npm':
        command = json
          ? `npm audit --audit-level=${level} --json`
          : `npm audit --audit-level=${level}`;
        break;
      case 'yarn':
        command = json
          ? `yarn audit --level ${level} --json`
          : `yarn audit --level ${level}`;
        break;
      case 'pnpm':
        command = json
          ? `pnpm audit --audit-level=${level} --json`
          : `pnpm audit --audit-level=${level}`;
        break;
      default:
        log('⚠️  Package manager not fully supported', 'yellow');
        return;
    }

    log('Running security audit...', 'yellow');
    const output = execSync(command, {
      cwd: dir,
      encoding: 'utf8',
      stdio: json ? 'pipe' : 'inherit',
    });

    if (json) {
      console.log(output);
    }
  } catch (error) {
    // npm audit exits with non-zero code if vulnerabilities are found
    // This is expected behavior, so we don't treat it as a fatal error
    if (error.status !== null && error.status !== 0) {
      log('⚠️  Vulnerabilities detected (see output above)', 'yellow');
    } else {
      log(`❌ Error running audit: ${error.message}`, 'red');
    }
  }
  console.log('');
}

function fixVulnerabilities(dir, pm) {
  log(`🔧 Attempting to fix vulnerabilities in ${dir}...`, 'green');

  try {
    let command;
    switch (pm) {
      case 'npm':
        command = 'npm audit fix';
        break;
      case 'yarn':
        command = 'yarn upgrade --latest';
        break;
      case 'pnpm':
        command = 'pnpm update --latest';
        break;
      default:
        log('⚠️  Package manager not fully supported', 'yellow');
        return;
    }

    log(`Running: ${command}`, 'yellow');
    execSync(command, {
      cwd: dir,
      encoding: 'utf8',
      stdio: 'inherit',
    });
    log('✅ Fix command completed', 'green');
  } catch (error) {
    log(`⚠️  Some vulnerabilities could not be fixed automatically: ${error.message}`, 'yellow');
  }
  console.log('');
}

function checkSubdirectories(baseDir, level, json, fix) {
  const subdirs = ['client', 'server', 'packages', 'apps'];
  let found = false;

  for (const subdir of subdirs) {
    const fullPath = path.join(baseDir, subdir);
    if (fs.existsSync(fullPath) && checkPackageJson(fullPath)) {
      found = true;
      const pm = detectPackageManager(fullPath);
      runAudit(fullPath, pm, level, json);

      if (fix) {
        fixVulnerabilities(fullPath, pm);
        log('✅ Re-running audit after fixes...', 'green');
        console.log('');
        runAudit(fullPath, pm, level, json);
      }
    }
  }

  return found;
}

function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  log('╔════════════════════════════════════════════════════════╗', 'blue');
  log('║     Dependency Vulnerability Checker                  ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝', 'blue');
  console.log('');

  // Check main directory
  if (checkPackageJson(options.dir)) {
    const pm = detectPackageManager(options.dir);
    runAudit(options.dir, pm, options.level, options.json);

    if (options.fix) {
      fixVulnerabilities(options.dir, pm);
      log('✅ Re-running audit after fixes...', 'green');
      console.log('');
      runAudit(options.dir, pm, options.level, options.json);
    }
  } else {
    log(`⚠️  No package.json found in ${options.dir}`, 'yellow');
    log('Checking subdirectories...', 'yellow');
    console.log('');

    const found = checkSubdirectories(options.dir, options.level, options.json, options.fix);
    
    if (!found) {
      log('❌ No package.json files found in common locations', 'red');
      log('💡 Make sure you\'re in the correct directory or specify --dir=path', 'cyan');
      process.exit(1);
    }
  }

  log('✅ Vulnerability check complete!', 'green');
  console.log('');
  log('💡 Tips:', 'blue');
  log('  - Review the output above for vulnerabilities', 'cyan');
  log('  - Use --fix to automatically fix safe updates', 'cyan');
  log('  - Check GitHub Security tab for detailed information', 'cyan');
  log('  - Review Dependabot PRs for security updates', 'cyan');
}

main();

