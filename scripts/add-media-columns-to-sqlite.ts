/**
 * Script to add pdf_url and podcast_url columns to SQLite lessons table
 * Run this once to update the database schema
 */
import { existsSync } from 'fs';
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3") as typeof import("better-sqlite3");

const file = process.env.SQLITE_FILE ?? './.data/dev.sqlite';

if (!existsSync(file)) {
  console.error(`Database file not found: ${file}`);
  process.exit(1);
}

const db = new Database(file);

try {
  // Check if columns already exist
  const tableInfo = db.prepare("PRAGMA table_info(lessons)").all() as Array<{ name: string }>;
  const columnNames = tableInfo.map(col => col.name);
  
  console.log('Current columns:', columnNames);
  
  // Add pdf_url if it doesn't exist
  if (!columnNames.includes('pdf_url')) {
    console.log('Adding pdf_url column...');
    db.prepare('ALTER TABLE lessons ADD COLUMN pdf_url text').run();
    console.log('✓ pdf_url column added');
  } else {
    console.log('✓ pdf_url column already exists');
  }
  
  // Add podcast_url if it doesn't exist
  if (!columnNames.includes('podcast_url')) {
    console.log('Adding podcast_url column...');
    db.prepare('ALTER TABLE lessons ADD COLUMN podcast_url text').run();
    console.log('✓ podcast_url column added');
  } else {
    console.log('✓ podcast_url column already exists');
  }
  
  // Add podcast_duration if it doesn't exist
  if (!columnNames.includes('podcast_duration')) {
    console.log('Adding podcast_duration column...');
    db.prepare('ALTER TABLE lessons ADD COLUMN podcast_duration integer').run();
    console.log('✓ podcast_duration column added');
  } else {
    console.log('✓ podcast_duration column already exists');
  }
  
  // Add notebook_lm_url if it doesn't exist
  if (!columnNames.includes('notebook_lm_url')) {
    console.log('Adding notebook_lm_url column...');
    db.prepare('ALTER TABLE lessons ADD COLUMN notebook_lm_url text').run();
    console.log('✓ notebook_lm_url column added');
  } else {
    console.log('✓ notebook_lm_url column already exists');
  }
  
  console.log('\n✅ Database schema updated successfully!');
  
} catch (error: any) {
  console.error('Error updating database:', error);
  process.exit(1);
} finally {
  db.close();
}





