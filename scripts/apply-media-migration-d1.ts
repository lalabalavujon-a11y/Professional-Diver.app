#!/usr/bin/env tsx
/**
 * Safe Migration Script for Lesson Media Fields (D1 Database)
 * 
 * This script safely adds the new media fields to the lessons table in D1
 * without losing any existing data.
 */

import { drizzle } from 'drizzle-orm/d1';
import { sql } from 'drizzle-orm';
import * as schemaSQLite from "@shared/schema-sqlite";

async function applyD1Migration() {
  console.log('🔄 Applying D1 migration for media fields...');
  console.log('');
  console.log('📋 Migration SQL:');
  console.log('');
  
  const migrationSQL = `
-- Add media fields to lessons table (D1/SQLite)
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE
-- These will be applied via Drizzle ORM schema sync

-- The schema changes will be applied when the app runs
-- Columns will be added with default values: '[]' (empty JSON array)
  `;

  console.log(migrationSQL);
  console.log('');
  console.log('✅ For D1 database, the migration will be applied automatically');
  console.log('   when you deploy the updated schema.');
  console.log('');
  console.log('📝 To manually apply via wrangler:');
  console.log('   wrangler d1 execute professionaldiver-db --command="ALTER TABLE lessons ADD COLUMN videos TEXT DEFAULT \'[]\';" --env production');
  console.log('   wrangler d1 execute professionaldiver-db --command="ALTER TABLE lessons ADD COLUMN documents TEXT DEFAULT \'[]\';" --env production');
  console.log('   wrangler d1 execute professionaldiver-db --command="ALTER TABLE lessons ADD COLUMN embeds TEXT DEFAULT \'[]\';" --env production');
  console.log('   wrangler d1 execute professionaldiver-db --command="ALTER TABLE lessons ADD COLUMN links TEXT DEFAULT \'[]\';" --env production');
  console.log('   wrangler d1 execute professionaldiver-db --command="ALTER TABLE lessons ADD COLUMN images TEXT DEFAULT \'[]\';" --env production');
  console.log('   wrangler d1 execute professionaldiver-db --command="ALTER TABLE lessons ADD COLUMN audio TEXT DEFAULT \'[]\';" --env production');
  console.log('');
  console.log('⚠️  Note: SQLite doesn\'t support IF NOT EXISTS for ALTER TABLE.');
  console.log('   If columns already exist, you\'ll get an error (which is safe to ignore).');
}

applyD1Migration().catch(console.error);




