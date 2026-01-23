import { db } from '../server/db.js';
import { tracks } from '../shared/schema-sqlite.js';
import { eq } from 'drizzle-orm';

/**
 * Script to update Client Representative track title to remove "Course"
 */

async function updateClientRepTitle() {
  console.log('📝 Updating Client Representative title...\n');

  try {
    // Find Client Representative track
    const [track] = await db.select({ id: tracks.id, title: tracks.title })
      .from(tracks)
      .where(eq(tracks.slug, 'client-representative'))
      .limit(1);

    if (!track) {
      console.log('⚠️  Client Representative track not found!');
      return;
    }

    console.log(`Current title: "${track.title}"`);

    if (track.title === 'Client Representative') {
      console.log('✅ Title is already correct!');
      return;
    }

    // Update title
    await db.update(tracks)
      .set({ title: 'Client Representative' })
      .where(eq(tracks.id, track.id));

    console.log('✅ Updated title to "Client Representative"');
    console.log('\n✨ Update complete!');

  } catch (error: any) {
    console.error('\n❌ Error updating title:', error);
    if (error.message) {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

// Run the update
updateClientRepTitle()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
