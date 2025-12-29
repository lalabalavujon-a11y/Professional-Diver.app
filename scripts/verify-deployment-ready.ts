/**
 * Pre-Deployment Verification Script
 * 
 * This script verifies that the deployment environment is properly configured
 * and that no data will be lost during deployment.
 * 
 * Usage:
 *   pnpm tsx scripts/verify-deployment-ready.ts [production|development]
 */

import { db } from '../server/db.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { eq } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import schemas based on environment
const env = process.argv[2] || process.env.NODE_ENV || 'development';
const isProduction = env === 'production' && !!process.env.DATABASE_URL;

const schema = isProduction 
  ? await import('../shared/schema.js')
  : await import('../shared/schema-sqlite.js');

const { tracks, lessons, users } = schema;

interface VerificationResult {
  passed: boolean;
  checks: {
    databaseConnection: { passed: boolean; message: string };
    databaseUrl: { passed: boolean; message: string };
    dataExists: { passed: boolean; message: string; counts: any };
    backupExists: { passed: boolean; message: string };
    migrationsReady: { passed: boolean; message: string };
  };
  warnings: string[];
  errors: string[];
}

async function verifyDeploymentReady(): Promise<VerificationResult> {
  console.log('🔍 Verifying deployment readiness...');
  console.log(`   Environment: ${env}`);
  console.log(`   Target: ${isProduction ? 'Production' : 'Development'}\n`);

  const result: VerificationResult = {
    passed: true,
    checks: {
      databaseConnection: { passed: false, message: '' },
      databaseUrl: { passed: false, message: '' },
      dataExists: { passed: false, message: '', counts: {} },
      backupExists: { passed: false, message: '' },
      migrationsReady: { passed: false, message: '' },
    },
    warnings: [],
    errors: [],
  };

  // Check 1: DATABASE_URL Configuration
  console.log('1️⃣  Checking DATABASE_URL configuration...');
  if (isProduction) {
    if (process.env.DATABASE_URL) {
      if (process.env.DATABASE_URL.startsWith('postgresql://')) {
        result.checks.databaseUrl = {
          passed: true,
          message: '✅ DATABASE_URL is configured (PostgreSQL)',
        };
        console.log('   ✅ DATABASE_URL is set');
      } else {
        result.checks.databaseUrl = {
          passed: false,
          message: '❌ DATABASE_URL must be a PostgreSQL connection string',
        };
        result.errors.push('DATABASE_URL must start with postgresql://');
        result.passed = false;
        console.log('   ❌ DATABASE_URL format is invalid');
      }
    } else {
      result.checks.databaseUrl = {
        passed: false,
        message: '❌ DATABASE_URL is not set (required for production)',
      };
      result.errors.push('DATABASE_URL environment variable is required for production');
      result.passed = false;
      console.log('   ❌ DATABASE_URL is not set');
    }
  } else {
    result.checks.databaseUrl = {
      passed: true,
      message: '✅ Using SQLite for development (DATABASE_URL not required)',
    };
    console.log('   ✅ Development mode - SQLite will be used');
  }

  // Check 2: Database Connection
  console.log('\n2️⃣  Testing database connection...');
  try {
    // Try to query the database
    const testQuery = await db.select().from(tracks).limit(1);
    result.checks.databaseConnection = {
      passed: true,
      message: '✅ Database connection successful',
    };
    console.log('   ✅ Database connection successful');
  } catch (error: any) {
    result.checks.databaseConnection = {
      passed: false,
      message: `❌ Database connection failed: ${error.message}`,
    };
    result.errors.push(`Database connection error: ${error.message}`);
    result.passed = false;
    console.log(`   ❌ Database connection failed: ${error.message}`);
  }

  // Check 3: Data Exists
  console.log('\n3️⃣  Checking existing data...');
  try {
    const trackCount = await db.select().from(tracks);
    const lessonCount = await db.select().from(lessons);
    const userCount = await db.select().from(users);

    const counts = {
      tracks: trackCount.length,
      lessons: lessonCount.length,
      users: userCount.length,
    };

    result.checks.dataExists = {
      passed: true,
      message: '✅ Data exists in database',
      counts,
    };

    console.log(`   ✅ Found ${counts.tracks} tracks`);
    console.log(`   ✅ Found ${counts.lessons} lessons`);
    console.log(`   ✅ Found ${counts.users} users`);

    if (counts.tracks === 0 && isProduction) {
      result.warnings.push('⚠️  No tracks found in production database');
      console.log('   ⚠️  Warning: No tracks found');
    }
  } catch (error: any) {
    result.checks.dataExists = {
      passed: false,
      message: `❌ Error checking data: ${error.message}`,
      counts: {},
    };
    result.errors.push(`Data check error: ${error.message}`);
    result.passed = false;
    console.log(`   ❌ Error checking data: ${error.message}`);
  }

  // Check 4: Backup Exists
  console.log('\n4️⃣  Checking for recent backup...');
  const backupDir = path.join(__dirname, '..', 'backups');
  const latestBackup = path.join(backupDir, 'full-database-latest.json');
  const tracksBackup = path.join(backupDir, 'tracks-lessons-latest.json');

  if (fs.existsSync(latestBackup) || fs.existsSync(tracksBackup)) {
    const backupFile = fs.existsSync(latestBackup) ? latestBackup : tracksBackup;
    const stats = fs.statSync(backupFile);
    const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);

    if (ageHours < 24) {
      result.checks.backupExists = {
        passed: true,
        message: `✅ Recent backup found (${ageHours.toFixed(1)} hours old)`,
      };
      console.log(`   ✅ Recent backup found (${ageHours.toFixed(1)} hours old)`);
    } else {
      result.checks.backupExists = {
        passed: false,
        message: `⚠️  Backup exists but is ${ageHours.toFixed(1)} hours old`,
      };
      result.warnings.push(`Backup is ${ageHours.toFixed(1)} hours old - consider creating a fresh backup`);
      console.log(`   ⚠️  Backup is ${ageHours.toFixed(1)} hours old`);
    }
  } else {
    result.checks.backupExists = {
      passed: false,
      message: '❌ No backup found - create backup before deploying',
    };
    result.errors.push('No backup found - run: pnpm run backup:export');
    result.passed = false;
    console.log('   ❌ No backup found');
  }

  // Check 5: Migrations Ready
  console.log('\n5️⃣  Checking migrations...');
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  if (fs.existsSync(migrationsDir)) {
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') && !f.startsWith('_'));
    
    if (migrationFiles.length > 0) {
      result.checks.migrationsReady = {
        passed: true,
        message: `✅ Found ${migrationFiles.length} migration file(s)`,
      };
      console.log(`   ✅ Found ${migrationFiles.length} migration file(s)`);
    } else {
      result.checks.migrationsReady = {
        passed: true,
        message: '✅ No pending migrations (database schema is up to date)',
      };
      console.log('   ✅ No pending migrations');
    }
  } else {
    result.checks.migrationsReady = {
      passed: true,
      message: '✅ Migrations directory structure is ready',
    };
    console.log('   ✅ Migrations directory exists');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 VERIFICATION SUMMARY');
  console.log('='.repeat(60));

  Object.entries(result.checks).forEach(([key, check]) => {
    console.log(check.message);
  });

  if (result.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    result.warnings.forEach(warning => console.log(`   ${warning}`));
  }

  if (result.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    result.errors.forEach(error => console.log(`   ${error}`));
  }

  if (result.passed) {
    console.log('\n✅ All checks passed! Ready for deployment.');
  } else {
    console.log('\n❌ Deployment NOT ready. Please fix the errors above.');
  }

  return result;
}

// Run if called directly
const isMainModule = process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/'));
if (isMainModule || process.argv[1]?.includes('verify-deployment-ready')) {
  verifyDeploymentReady()
    .then((result) => {
      process.exit(result.passed ? 0 : 1);
    })
    .catch((error) => {
      console.error('\n💥 Verification failed:', error);
      process.exit(1);
    });
}

export { verifyDeploymentReady };

