/**
 * Script to populate lessons in production database
 * Usage: DATABASE_URL=<production-url> pnpm tsx scripts/populate-production-lessons.ts
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { tracks, lessons } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

// Import lesson templates
import { create12LessonsPerTrack } from './create-12-lessons-per-track-data.js';

async function populateProductionLessons() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    console.error('Usage: DATABASE_URL=<production-url> pnpm tsx scripts/populate-production-lessons.ts');
    process.exit(1);
  }

  console.log('🌱 Populating lessons in production database...\n');
  console.log('⚠️  WARNING: This will modify the production database!');
  console.log('Database URL:', databaseUrl.replace(/:[^:@]+@/, ':****@')); // Hide password
  
  // Create database connection
  const client = postgres(databaseUrl);
  const db = drizzle(client);

  try {
    // Get all published tracks
    const allTracks = await db.select({
      id: tracks.id,
      slug: tracks.slug,
      title: tracks.title,
    }).from(tracks).where(eq(tracks.isPublished, true));

    console.log(`\nFound ${allTracks.length} published tracks\n`);

    // Use the same lesson creation logic
    await create12LessonsPerTrack(db, allTracks);

    console.log('\n✅ Successfully populated all lessons in production database!');
  } catch (error) {
    console.error('❌ Error populating lessons:', error);
    throw error;
  } finally {
    await client.end();
  }
}

populateProductionLessons()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });





