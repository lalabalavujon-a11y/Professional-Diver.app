import { db } from '../server/db.js';

/**
 * Migration script to add podcast and Notebook LM fields to lessons table
 * Run this once to add the new columns to existing database
 */
async function addPodcastFieldsMigration() {
  console.log('🔄 Running migration to add podcast and Notebook LM fields...\n');

  try {
    // Check if we're using SQLite (development) or PostgreSQL (production)
    const env = process.env.NODE_ENV ?? 'development';
    const hasDatabaseUrl = !!process.env.DATABASE_URL;

    if (env !== 'development' && hasDatabaseUrl) {
      // PostgreSQL migration - use raw SQL
      console.log('📊 Detected PostgreSQL database');
      const { Pool } = await import('@neondatabase/serverless');
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      
      // Check if columns already exist
      const checkResult = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'lessons' 
        AND column_name IN ('podcast_url', 'podcast_duration', 'notebook_lm_url')
      `);

      const existingColumns = checkResult.rows.map((row: any) => row.column_name);
      
      if (!existingColumns.includes('podcast_url')) {
        await pool.query(`ALTER TABLE lessons ADD COLUMN podcast_url TEXT`);
        console.log('✅ Added podcast_url column');
      } else {
        console.log('⏭️  podcast_url column already exists');
      }

      if (!existingColumns.includes('podcast_duration')) {
        await pool.query(`ALTER TABLE lessons ADD COLUMN podcast_duration INTEGER`);
        console.log('✅ Added podcast_duration column');
      } else {
        console.log('⏭️  podcast_duration column already exists');
      }

      if (!existingColumns.includes('notebook_lm_url')) {
        await pool.query(`ALTER TABLE lessons ADD COLUMN notebook_lm_url TEXT`);
        console.log('✅ Added notebook_lm_url column');
      } else {
        console.log('⏭️  notebook_lm_url column already exists');
      }

      await pool.end();
    } else {
      // SQLite migration - access sqlite instance directly
      console.log('📊 Detected SQLite database');
      const sqlite = (db as any).sqlite;
      
      if (!sqlite) {
        throw new Error('SQLite instance not found. Make sure you are using SQLite database.');
      }
      
      try {
        sqlite.prepare('ALTER TABLE lessons ADD COLUMN podcast_url TEXT').run();
        console.log('✅ Added podcast_url column');
      } catch (error: any) {
        if (error.message?.includes('duplicate column') || error.message?.includes('no such column')) {
          console.log('⏭️  podcast_url column already exists');
        } else {
          throw error;
        }
      }

      try {
        sqlite.prepare('ALTER TABLE lessons ADD COLUMN podcast_duration INTEGER').run();
        console.log('✅ Added podcast_duration column');
      } catch (error: any) {
        if (error.message?.includes('duplicate column') || error.message?.includes('no such column')) {
          console.log('⏭️  podcast_duration column already exists');
        } else {
          throw error;
        }
      }

      try {
        sqlite.prepare('ALTER TABLE lessons ADD COLUMN notebook_lm_url TEXT').run();
        console.log('✅ Added notebook_lm_url column');
      } catch (error: any) {
        if (error.message?.includes('duplicate column') || error.message?.includes('no such column')) {
          console.log('⏭️  notebook_lm_url column already exists');
        } else {
          throw error;
        }
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('All lessons now support:');
    console.log('  - Podcast audio files (podcast_url, podcast_duration)');
    console.log('  - Notebook LM integration (notebook_lm_url)');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

addPodcastFieldsMigration()
  .catch(console.error)
  .finally(() => process.exit(0));

