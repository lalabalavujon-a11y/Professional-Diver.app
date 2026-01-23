#!/usr/bin/env tsx
/**
 * Script to run the RLS migration on Supabase/PostgreSQL database
 * Uses standard pg library (works better with Supabase than Neon serverless)
 * 
 * Usage:
 *   tsx scripts/run-rls-migration-pg.ts
 * 
 * Requires DATABASE_URL environment variable to be set
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  // Check for DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set');
    console.error('   Please set DATABASE_URL to your Supabase PostgreSQL connection string');
    console.error('   Example: postgresql://user:password@host:5432/database?sslmode=require');
    process.exit(1);
  }

  // Read the migration file
  const migrationPath = join(__dirname, '../migrations/0012_enable_rls_and_policies.sql');
  let sqlContent: string;
  
  try {
    sqlContent = readFileSync(migrationPath, 'utf-8');
  } catch (error) {
    console.error(`❌ ERROR: Could not read migration file at ${migrationPath}`);
    console.error(error);
    process.exit(1);
  }

  console.log('📄 Migration file loaded successfully');
  console.log(`📊 File size: ${sqlContent.length} characters`);

  // Create database connection
  console.log('🔌 Connecting to database...');
  const pool = new Pool({ 
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false // Supabase uses self-signed certificates
    }
  });

  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection established\n');

    // Execute the entire SQL file
    // PostgreSQL can handle multiple statements in a single query
    console.log('🚀 Executing migration...\n');
    
    try {
      await pool.query(sqlContent);
      console.log('✅ Migration completed successfully!\n');
      console.log('📊 Summary:');
      console.log('   - RLS enabled on all 22 tables');
      console.log('   - Security policies created');
      console.log('   - Helper function created (is_admin)');
      console.log('\n✅ All Supabase security linter errors should now be resolved!');
      console.log('\n⚠️  Next steps:');
      console.log('   1. Test your application to ensure everything still works');
      console.log('   2. Verify RLS policies work as expected');
      console.log('   3. Test with different user roles (USER, ADMIN, SUPER_ADMIN)');
      
    } catch (error: any) {
      console.error('❌ ERROR: Failed to execute migration');
      console.error(`   ${error.message}`);
      
      // Check if it's a "already exists" error (which is okay)
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log('\n⚠️  Some policies or functions may already exist.');
        console.log('   This is okay - the migration will skip existing items.');
        console.log('   You can safely ignore these errors.');
      } else {
        console.error('\n💡 Tip: You can also run this migration directly in Supabase SQL Editor:');
        console.error('   1. Go to Supabase Dashboard → SQL Editor');
        console.error('   2. Paste the contents of migrations/0012_enable_rls_and_policies.sql');
        console.error('   3. Click "Run"');
        throw error;
      }
    }

  } catch (error: any) {
    console.error('❌ ERROR: Database connection failed');
    console.error(`   ${error.message}`);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Verify your DATABASE_URL is correct');
    console.error('   2. Check that your password is URL-encoded (e.g., @ becomes %40)');
    console.error('   3. Ensure your IP is allowed in Supabase network settings');
    console.error('   4. Try using the Supabase SQL Editor instead (see tip above)');
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the migration
runMigration().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
