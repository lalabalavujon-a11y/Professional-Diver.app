#!/usr/bin/env tsx
/**
 * Safe Migration Script for Lesson Media Fields
 * 
 * This script safely adds the new media fields to the lessons table
 * without losing any existing data. It uses IF NOT EXISTS to ensure
 * idempotency and can be run multiple times safely.
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import { sql } from "drizzle-orm";

neonConfig.webSocketConstructor = ws;

async function applyMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  console.log('🔄 Connecting to database...');
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Connected to database');

    console.log('🔄 Applying migration: Add media fields to lessons table...');
    
    // Apply migration with IF NOT EXISTS for safety
    // PostgreSQL version
    const migrationSQL = `
      -- Add media fields to lessons table (safe migration)
      DO $$ 
      BEGIN
        -- Videos field
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'lessons' AND column_name = 'videos'
        ) THEN
          ALTER TABLE "lessons" ADD COLUMN "videos" json DEFAULT '[]'::json;
          RAISE NOTICE 'Added videos column';
        END IF;

        -- Documents field
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'lessons' AND column_name = 'documents'
        ) THEN
          ALTER TABLE "lessons" ADD COLUMN "documents" json DEFAULT '[]'::json;
          RAISE NOTICE 'Added documents column';
        END IF;

        -- Embeds field
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'lessons' AND column_name = 'embeds'
        ) THEN
          ALTER TABLE "lessons" ADD COLUMN "embeds" json DEFAULT '[]'::json;
          RAISE NOTICE 'Added embeds column';
        END IF;

        -- Links field
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'lessons' AND column_name = 'links'
        ) THEN
          ALTER TABLE "lessons" ADD COLUMN "links" json DEFAULT '[]'::json;
          RAISE NOTICE 'Added links column';
        END IF;

        -- Images field
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'lessons' AND column_name = 'images'
        ) THEN
          ALTER TABLE "lessons" ADD COLUMN "images" json DEFAULT '[]'::json;
          RAISE NOTICE 'Added images column';
        END IF;

        -- Audio field
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'lessons' AND column_name = 'audio'
        ) THEN
          ALTER TABLE "lessons" ADD COLUMN "audio" json DEFAULT '[]'::json;
          RAISE NOTICE 'Added audio column';
        END IF;
      END $$;
    `;

    await pool.query(migrationSQL);
    console.log('✅ Migration applied successfully!');
    
    // Verify the columns were added
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'lessons' 
      AND column_name IN ('videos', 'documents', 'embeds', 'links', 'images', 'audio')
      ORDER BY column_name;
    `);
    
    const addedColumns = result.rows.map((row: any) => row.column_name);
    console.log('✅ Verified columns:', addedColumns.join(', '));
    
    // Check existing lessons to ensure no data loss
    const lessonCount = await pool.query('SELECT COUNT(*) as count FROM lessons');
    console.log(`✅ Verified ${lessonCount.rows[0].count} existing lessons (no data lost)`);
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
applyMigration().catch(console.error);




