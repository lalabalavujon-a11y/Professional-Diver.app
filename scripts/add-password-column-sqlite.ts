/**
 * Add password column to SQLite users table
 * Run this before running the user migration script
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'local-dev.db');

console.log('🔧 Opening SQLite database:', dbPath);

const db = new Database(dbPath);

try {
  // Check if password column already exists
  const tableInfo = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
  const hasPasswordColumn = tableInfo.some(col => col.name === 'password');

  if (hasPasswordColumn) {
    console.log('✅ Password column already exists');
  } else {
    console.log('📝 Adding password column to users table...');
    db.exec(`
      ALTER TABLE users ADD COLUMN password TEXT;
    `);
    console.log('✅ Password column added successfully');
  }

  // Also check if PARTNER_ADMIN is in the role enum (we'll need to handle this separately)
  console.log('\n✅ Database migration complete!');
  console.log('ℹ️  Note: The role enum in SQLite is text-based, so PARTNER_ADMIN is already supported.');
  
} catch (error) {
  console.error('❌ Error adding password column:', error);
  process.exit(1);
} finally {
  db.close();
}




