/**
 * Safe migration runner for Railway deployments
 * 
 * Only runs migrations if:
 * 1. DATABASE_URL is set and points to PostgreSQL
 * 2. Database is reachable
 * 3. RUN_MIGRATIONS_ON_START is not explicitly set to 'false'
 * 
 * This prevents restart loops from migration failures and avoids
 * running migrations on SQLite or when DB is unreachable.
 */

import { execSync } from 'child_process';

const databaseUrl = process.env.DATABASE_URL || '';
const runMigrations = process.env.RUN_MIGRATIONS_ON_START !== 'false';
const isPostgres = databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://');

console.log('🔍 Migration check:');
console.log(`   DATABASE_URL present: ${!!databaseUrl}`);
console.log(`   Is PostgreSQL: ${isPostgres}`);
console.log(`   RUN_MIGRATIONS_ON_START: ${process.env.RUN_MIGRATIONS_ON_START || 'not set (default: true)'}`);

if (!runMigrations) {
  console.log('⏭️  Skipping migrations: RUN_MIGRATIONS_ON_START=false');
  process.exit(0);
}

if (!databaseUrl) {
  console.log('⏭️  Skipping migrations: DATABASE_URL not set (using SQLite)');
  process.exit(0);
}

if (!isPostgres) {
  console.log('⏭️  Skipping migrations: DATABASE_URL does not point to PostgreSQL');
  process.exit(0);
}

// Test database connectivity before running migrations
console.log('🔌 Testing database connectivity...');
try {
  // Import db to test connection
  const { db } = await import('../server/db.js');
  const { sql } = await import('drizzle-orm');
  
  if (typeof (db as any).execute === 'function') {
    await db.execute(sql`SELECT 1`);
    console.log('✅ Database is reachable');
  } else {
    console.log('⚠️  Database connection method not available');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Database connectivity test failed');
  if (error instanceof Error) {
    console.error('   Error message:', error.message);
    console.error('   Error name:', error.name);
    if (error.stack) {
      console.error('   Stack trace:', error.stack.split('\n').slice(0, 3).join('\n'));
    }
  } else {
    console.error('   Error details:', JSON.stringify(error, null, 2));
  }
  console.error('⏭️  Skipping migrations to prevent restart loop');
  console.error('💡 Check: DATABASE_URL format, password, network access, IPv4 compatibility');
  process.exit(1);
}

// Run migrations
console.log('🚀 Running database migrations...');
try {
  execSync('npm run db:migrate', { stdio: 'inherit' });
  console.log('✅ Migrations completed successfully');
  process.exit(0);
} catch (error) {
  console.error('❌ Migration failed:', error instanceof Error ? error.message : 'unknown');
  console.error('⚠️  Exiting with error - app will not start until migrations succeed');
  process.exit(1);
}
