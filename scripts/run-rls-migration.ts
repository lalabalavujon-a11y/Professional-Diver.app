#!/usr/bin/env tsx
/**
 * Script to run the RLS migration on Supabase/PostgreSQL database
 * 
 * Usage:
 *   tsx scripts/run-rls-migration.ts
 * 
 * Requires DATABASE_URL environment variable to be set
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

neonConfig.webSocketConstructor = ws;

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
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection established');

    // Parse SQL statements more intelligently
    // Handle function definitions that contain semicolons
    const statements: string[] = [];
    let currentStatement = '';
    let inFunction = false;
    let dollarQuoteTag = '';
    
    const lines = sqlContent.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip comment-only lines
      if (trimmedLine.startsWith('--') || trimmedLine.length === 0) {
        continue;
      }
      
      // Check for function definition start
      if (trimmedLine.includes('CREATE OR REPLACE FUNCTION')) {
        inFunction = true;
        currentStatement = line;
        // Look for dollar quote tag ($$ or $tag$)
        const dollarMatch = line.match(/\$([^$]*)\$/);
        if (dollarMatch) {
          dollarQuoteTag = dollarMatch[0];
        }
        continue;
      }
      
      // Check for function end (dollar quote closing)
      if (inFunction && dollarQuoteTag && trimmedLine.includes(dollarQuoteTag)) {
        currentStatement += '\n' + line;
        statements.push(currentStatement.trim());
        currentStatement = '';
        inFunction = false;
        dollarQuoteTag = '';
        continue;
      }
      
      // If in function, accumulate lines
      if (inFunction) {
        currentStatement += '\n' + line;
        continue;
      }
      
      // Regular statement accumulation
      currentStatement += (currentStatement ? '\n' : '') + line;
      
      // Check if line ends with semicolon (end of statement)
      if (trimmedLine.endsWith(';')) {
        const statement = currentStatement.trim();
        if (statement.length > 0) {
          statements.push(statement);
        }
        currentStatement = '';
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim().length > 0) {
      statements.push(currentStatement.trim());
    }

    console.log(`📝 Parsed ${statements.length} SQL statements to execute`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty statements
      if (!statement || statement.trim().length === 0) {
        continue;
      }

      try {
        await pool.query(statement);
        successCount++;
        
        // Show progress for key operations
        if (statement.includes('ENABLE ROW LEVEL SECURITY')) {
          const tableMatch = statement.match(/ALTER TABLE\s+"public"\."(\w+)"/);
          if (tableMatch) {
            console.log(`  ✅ [${i + 1}/${statements.length}] Enabled RLS on table: ${tableMatch[1]}`);
          }
        } else if (statement.includes('CREATE OR REPLACE FUNCTION')) {
          const funcMatch = statement.match(/CREATE OR REPLACE FUNCTION\s+"public"\."(\w+)"/);
          if (funcMatch) {
            console.log(`  ✅ [${i + 1}/${statements.length}] Created function: ${funcMatch[1]}`);
          }
        } else if (statement.includes('CREATE POLICY')) {
          const policyMatch = statement.match(/CREATE POLICY\s+"(\w+)"\s+ON\s+"public"\."(\w+)"/);
          if (policyMatch) {
            console.log(`  ✅ [${i + 1}/${statements.length}] Created policy: ${policyMatch[1]} on ${policyMatch[2]}`);
          }
        }
      } catch (error: any) {
        errorCount++;
        const errorMsg = error.message || String(error);
        console.error(`  ❌ [${i + 1}/${statements.length}] Error executing statement:`);
        console.error(`     ${errorMsg}`);
        
        // Show first 150 chars of the statement for debugging
        const preview = statement.substring(0, 150).replace(/\n/g, ' ').replace(/\s+/g, ' ');
        console.error(`     Statement preview: ${preview}...`);
        
        // Don't stop on errors - continue with other statements
        // Some statements might fail if they already exist (like policies)
        if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
          console.log(`     ⚠️  This is expected if the policy/function already exists`);
        }
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
    if (errorCount > 0) {
      console.log('\n⚠️  Some statements had errors. This might be expected if:');
      console.log('   - Policies or functions already exist');
      console.log('   - Tables don\'t exist yet');
      console.log('   - You need to review the errors above');
    }

    console.log('\n✅ Migration completed!');
    console.log('   Please verify your application still works correctly.');
    console.log('   Test with different user roles (USER, ADMIN, SUPER_ADMIN) to ensure RLS policies work as expected.');

  } catch (error: any) {
    console.error('❌ ERROR: Failed to execute migration');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
runMigration().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
