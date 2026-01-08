import { db } from '../server/db.js';
import { tracks } from '../shared/schema-sqlite.js';
import { eq } from 'drizzle-orm';

async function publishAllTracks() {
  console.log('🚀 Publishing all tracks...\n');

  try {
    // Get all unpublished tracks
    const unpublishedTracks = await db.select({
      id: tracks.id,
      title: tracks.title,
      slug: tracks.slug,
      isPublished: tracks.isPublished,
    }).from(tracks).where(eq(tracks.isPublished, false));

    if (unpublishedTracks.length === 0) {
      console.log('✅ All tracks are already published!');
      return;
    }

    console.log(`📝 Found ${unpublishedTracks.length} unpublished track(s):`);
    unpublishedTracks.forEach(track => {
      console.log(`   - ${track.title} (${track.slug})`);
    });

    // Publish all tracks
    for (const track of unpublishedTracks) {
      await db.update(tracks)
        .set({ isPublished: true })
        .where(eq(tracks.id, track.id));
      console.log(`✅ Published: ${track.title}`);
    }

    console.log(`\n🎉 Successfully published ${unpublishedTracks.length} track(s)!`);
    console.log('All tracks should now be visible in the Learning Tracks page.');

  } catch (error) {
    console.error('❌ Error publishing tracks:', error);
    throw error;
  }
}

publishAllTracks()
  .catch(console.error)
  .finally(() => process.exit(0));

