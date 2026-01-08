import { db } from '../server/db.js';
import { tracks, lessons } from '../shared/schema-sqlite.js';
import { eq, sql } from 'drizzle-orm';

async function checkTracksStatus() {
  console.log('🔍 Checking tracks status in database...\n');

  try {
    // Get all tracks with their published status
    const allTracks = await db.select({
      id: tracks.id,
      title: tracks.title,
      slug: tracks.slug,
      isPublished: tracks.isPublished,
    }).from(tracks).orderBy(tracks.title);

    console.log(`📊 Total Tracks Found: ${allTracks.length}\n`);

    const publishedTracks = allTracks.filter(t => t.isPublished);
    const unpublishedTracks = allTracks.filter(t => !t.isPublished);

    console.log(`✅ Published Tracks: ${publishedTracks.length}`);
    console.log(`❌ Unpublished Tracks: ${unpublishedTracks.length}\n`);

    // Count lessons per track
    console.log('📚 Track Details:');
    console.log('─'.repeat(80));
    
    for (const track of allTracks) {
      const lessonCount = await db.select({ count: sql<number>`count(*)` })
        .from(lessons)
        .where(eq(lessons.trackId, track.id));
      
      const count = lessonCount[0]?.count || 0;
      const status = track.isPublished ? '✅ Published' : '❌ Unpublished';
      
      console.log(`${status} | ${track.title.padEnd(50)} | ${count.toString().padStart(3)} lessons | ${track.slug}`);
    }

    console.log('─'.repeat(80));
    
    if (unpublishedTracks.length > 0) {
      console.log('\n⚠️  Unpublished tracks that won\'t show in Learning Tracks:');
      unpublishedTracks.forEach(track => {
        console.log(`   - ${track.title} (${track.slug})`);
      });
    }

    // Expected tracks based on mock data
    const expectedTracks = [
      'ndt-inspection',
      'diver-medic',
      'commercial-supervisor',
      'saturation-diving',
      'underwater-welding',
      'hyperbaric-operations',
      'alst',
      'lst',
      'air-diver-certification'
    ];

    const existingSlugs = allTracks.map(t => t.slug);
    const missingTracks = expectedTracks.filter(slug => !existingSlugs.includes(slug));

    if (missingTracks.length > 0) {
      console.log('\n⚠️  Missing Expected Tracks:');
      missingTracks.forEach(slug => {
        console.log(`   - ${slug}`);
      });
    }

    console.log('\n✅ Status check complete!');
    
  } catch (error) {
    console.error('❌ Error checking tracks status:', error);
    throw error;
  }
}

checkTracksStatus()
  .catch(console.error)
  .finally(() => process.exit(0));

