import { db } from '../server/db.js';
import { tracks } from '../shared/schema-sqlite.js';
import { eq } from 'drizzle-orm';

/**
 * Script to ensure all tracks are published
 * This is a safety measure to ensure visibility
 */

async function publishAllTracks() {
  console.log('📝 Publishing all tracks...\n');

  try {
    // Get all tracks
    const allTracks = await db.select({
      id: tracks.id,
      title: tracks.title,
      slug: tracks.slug,
      isPublished: tracks.isPublished,
    })
      .from(tracks)
      .orderBy(tracks.title);

    console.log(`📊 Found ${allTracks.length} tracks in database\n`);

    // Find unpublished tracks
    const unpublishedTracks = allTracks.filter(t => 
      t.isPublished === false || t.isPublished === 0
    );

    if (unpublishedTracks.length === 0) {
      console.log('✅ All tracks are already published!\n');
      
      // Verify all tracks are published
      allTracks.forEach((track, index) => {
        const status = track.isPublished === true || track.isPublished === 1 ? '✅' : '❌';
        console.log(`${index + 1}. ${status} ${track.title} (${track.slug})`);
      });
      
      console.log('\n✨ No changes needed. All tracks are published.');
      return;
    }

    console.log(`⚠️  Found ${unpublishedTracks.length} unpublished track(s):\n`);
    unpublishedTracks.forEach((track, index) => {
      console.log(`   ${index + 1}. ${track.title} (${track.slug})`);
    });
    console.log('');

    // Publish all unpublished tracks
    for (const track of unpublishedTracks) {
      await db.update(tracks)
        .set({ isPublished: true })
        .where(eq(tracks.id, track.id));
      
      console.log(`✅ Published: ${track.title}`);
    }

    console.log(`\n✨ Successfully published ${unpublishedTracks.length} track(s)!`);

    // Verify the update
    const updatedTracks = await db.select({
      id: tracks.id,
      title: tracks.title,
      isPublished: tracks.isPublished,
    })
      .from(tracks)
      .orderBy(tracks.title);

    const stillUnpublished = updatedTracks.filter(t => 
      t.isPublished === false || t.isPublished === 0
    );

    if (stillUnpublished.length === 0) {
      console.log('✅ Verification: All tracks are now published!');
    } else {
      console.log(`⚠️  Warning: ${stillUnpublished.length} track(s) are still unpublished:`);
      stillUnpublished.forEach(t => {
        console.log(`   - ${t.title}`);
      });
    }

  } catch (error: any) {
    console.error('\n❌ Error publishing tracks:', error);
    if (error.message) {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

// Run the script
publishAllTracks()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
