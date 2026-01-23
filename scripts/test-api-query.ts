import { db } from '../server/db.js';
import { tracks, aiTutors } from '../shared/schema-sqlite.js';
import { eq } from 'drizzle-orm';

/**
 * Test script to verify what the API query actually returns
 * This mimics the exact query used in temp-storage.ts getAllTracks()
 */

async function testApiQuery() {
  console.log('🧪 Testing API Query (mimicking getAllTracks)...\n');

  try {
    // This is the exact query from temp-storage.ts getAllTracks()
    const result = await db.select({
      id: tracks.id,
      title: tracks.title,
      slug: tracks.slug,
      summary: tracks.summary,
      isPublished: tracks.isPublished,
      createdAt: tracks.createdAt,
      aiTutor: {
        id: aiTutors.id,
        name: aiTutors.name,
        specialty: aiTutors.specialty,
        description: aiTutors.description,
      }
    }).from(tracks)
      .leftJoin(aiTutors, eq(tracks.aiTutorId, aiTutors.id))
      .where(eq(tracks.isPublished, true))
      .orderBy(tracks.title);

    console.log(`📊 API Query Results: ${result.length} tracks\n`);

    result.forEach((track, index) => {
      console.log(`${index + 1}. ${track.title}`);
      console.log(`   ID: ${track.id}`);
      console.log(`   Slug: ${track.slug}`);
      console.log(`   isPublished (raw): ${track.isPublished} (type: ${typeof track.isPublished})`);
      console.log(`   isPublished === true: ${track.isPublished === true}`);
      console.log(`   isPublished === 1: ${track.isPublished === 1}`);
      console.log(`   Boolean(track.isPublished): ${Boolean(track.isPublished)}`);
      console.log('');
    });

    console.log(`\n✅ Total tracks returned: ${result.length}`);
    console.log(`   Expected: 10`);
    
    if (result.length === 10) {
      console.log(`   ✅ All tracks are returned correctly!`);
    } else {
      console.log(`   ⚠️  Only ${result.length} tracks returned, expected 10`);
    }

  } catch (error: any) {
    console.error('\n❌ Error testing API query:', error);
    if (error.message) {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

// Run the test
testApiQuery()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
