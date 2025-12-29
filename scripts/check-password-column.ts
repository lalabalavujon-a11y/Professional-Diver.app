/**
 * Check if password column exists in users table
 */

import { Pool } from '@neondatabase/serverless';
import ws from "ws";
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

async function checkPasswordColumn() {
  const pool = new Pool({ connectionString: databaseUrl });
  
  try {
    console.log('🔍 Checking if password column exists in users table...\n');
    
    const result = await pool.query(`
      SELECT 
          column_name, 
          data_type, 
          is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'password'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Password column EXISTS!');
      console.log('   Column details:');
      console.log(`   - Name: ${result.rows[0].column_name}`);
      console.log(`   - Type: ${result.rows[0].data_type}`);
      console.log(`   - Nullable: ${result.rows[0].is_nullable}`);
      console.log('\n✅ All good! The column is there.');
    } else {
      console.log('❌ Password column DOES NOT EXIST');
      console.log('\n📋 Next steps:');
      console.log('   1. Run the add_password_column.sql script in Supabase SQL Editor');
      console.log('   2. Or run: ALTER TABLE "users" ADD COLUMN "password" text;');
    }
    
    // Also show all columns in users table
    console.log('\n📋 All columns in users table:');
    const allColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    allColumns.rows.forEach((col, index) => {
      const marker = col.column_name === 'password' ? ' ✅' : '';
      console.log(`   ${index + 1}. ${col.column_name} (${col.data_type})${marker}`);
    });
    
  } catch (error: any) {
    console.error('❌ Error checking password column:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkPasswordColumn();

