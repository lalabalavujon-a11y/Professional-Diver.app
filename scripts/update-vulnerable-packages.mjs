#!/usr/bin/env node

/**
 * Safe Package Update Script
 * Updates vulnerable packages with proper testing and rollback capability
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const updates = [
  {
    package: 'esbuild',
    current: '^0.19.12',
    target: '^0.27.2',
    type: 'devDependency',
    breaking: true,
    notes: 'May require testing build process. Breaking changes likely.'
  },
  {
    package: 'react-syntax-highlighter',
    current: '^15.6.3',
    target: '^16.1.0',
    type: 'dependency',
    breaking: true,
    notes: 'Check syntax highlighting still works. Breaking changes in API.'
  },
  {
    package: 'drizzle-kit',
    current: '^0.30.6',
    target: '^0.31.8',
    type: 'devDependency',
    breaking: false,
    notes: 'May resolve esbuild dependency issues. Minor update.'
  },
  {
    package: 'vite',
    current: '^5.4.21',
    target: '^5.4.21',
    type: 'devDependency',
    breaking: false,
    notes: 'Check for latest patch version. May include esbuild update.'
  },
  {
    package: 'tsx',
    current: '^4.7.0',
    target: '^4.7.0',
    type: 'devDependency',
    breaking: false,
    notes: 'Check for latest patch version. May include esbuild update.'
  }
];

function readPackageJson() {
  const packageJsonPath = join(projectRoot, 'package.json');
  return JSON.parse(readFileSync(packageJsonPath, 'utf8'));
}

function writePackageJson(packageJson) {
  const packageJsonPath = join(projectRoot, 'package.json');
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
}

function backupPackageJson() {
  const packageJson = readPackageJson();
  const backupPath = join(projectRoot, 'package.json.backup');
  writeFileSync(backupPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log('✅ Created backup: package.json.backup');
}

function restorePackageJson() {
  const backupPath = join(projectRoot, 'package.json.backup');
  const packageJson = JSON.parse(readFileSync(backupPath, 'utf8'));
  writePackageJson(packageJson);
  console.log('✅ Restored from backup');
}

function updatePackage(pkgName, targetVersion, type) {
  console.log(`\n📦 Updating ${pkgName} to ${targetVersion}...`);
  
  try {
    // Use npm install to update
    const depType = type === 'devDependency' ? '--save-dev' : '--save';
    execSync(`npm install ${pkgName}@${targetVersion} ${depType}`, {
      cwd: projectRoot,
      stdio: 'inherit'
    });
    console.log(`✅ Successfully updated ${pkgName}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to update ${pkgName}:`, error.message);
    return false;
  }
}

function updatePackageJsonVersions() {
  const packageJson = readPackageJson();
  let updated = false;

  for (const update of updates) {
    const deps = update.type === 'devDependency' 
      ? packageJson.devDependencies 
      : packageJson.dependencies;

    if (deps && deps[update.package]) {
      // Update version range
      const currentVersion = deps[update.package];
      if (currentVersion !== update.target) {
        deps[update.package] = update.target;
        updated = true;
        console.log(`📝 Updated ${update.package}: ${currentVersion} → ${update.target}`);
      }
    }
  }

  if (updated) {
    writePackageJson(packageJson);
    console.log('✅ Updated package.json');
  }

  return updated;
}

function runTests() {
  console.log('\n🧪 Running tests...');
  try {
    execSync('npm run typecheck', { cwd: projectRoot, stdio: 'inherit' });
    console.log('✅ Type checking passed');
    
    // Try build if typecheck passes
    execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });
    console.log('✅ Build passed');
    
    return true;
  } catch (error) {
    console.error('❌ Tests failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔒 Safe Package Update Script');
  console.log('==============================\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const skipTests = args.includes('--skip-tests');
  const updateOnly = args.find(arg => arg.startsWith('--update='))?.split('=')[1];

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  // Show what will be updated
  console.log('Packages to update:');
  updates.forEach(update => {
    const deps = update.type === 'devDependency' 
      ? readPackageJson().devDependencies 
      : readPackageJson().dependencies;
    
    if (deps && deps[update.package]) {
      const icon = update.breaking ? '⚠️' : '✅';
      console.log(`  ${icon} ${update.package}: ${deps[update.package]} → ${update.target}`);
      console.log(`     ${update.notes}`);
    }
  });

  if (dryRun) {
    console.log('\n🔍 Dry run complete. Run without --dry-run to apply changes.');
    return;
  }

  // Backup package.json
  backupPackageJson();

  try {
    // Filter updates if --update flag is used
    const updatesToApply = updateOnly 
      ? updates.filter(u => u.package === updateOnly)
      : updates;

    // Update package.json versions first
    updatePackageJsonVersions();

    // Install updated packages
    let allSuccess = true;
    for (const update of updatesToApply) {
      const deps = update.type === 'devDependency' 
        ? readPackageJson().devDependencies 
        : readPackageJson().dependencies;

      if (deps && deps[update.package]) {
        const success = updatePackage(update.package, update.target, update.type);
        if (!success && update.breaking) {
          console.log(`⚠️  Breaking change update failed for ${update.package}`);
          console.log(`   You may need to manually update and test this package.`);
        }
        allSuccess = allSuccess && success;
      }
    }

    if (!allSuccess) {
      console.log('\n⚠️  Some updates failed. Check errors above.');
    }

    // Run tests if not skipped
    if (!skipTests) {
      const testsPassed = runTests();
      
      if (!testsPassed) {
        console.log('\n❌ Tests failed after update. Restoring backup...');
        restorePackageJson();
        console.log('\n💡 To fix manually:');
        console.log('   1. Review the errors above');
        console.log('   2. Update packages one at a time with: --update=package-name');
        console.log('   3. Test after each update');
        process.exit(1);
      }
    }

    console.log('\n✅ All updates completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Test your application thoroughly');
    console.log('   2. Check for breaking changes in updated packages');
    console.log('   3. Run: npm run build && npm run start (test production build)');
    console.log('   4. If everything works, commit the changes');
    console.log('   5. Delete package.json.backup when satisfied');

  } catch (error) {
    console.error('\n❌ Update process failed:', error.message);
    console.log('🔄 Restoring backup...');
    restorePackageJson();
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

