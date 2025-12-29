import { db } from '../server/db.js';
import { tracks, lessons } from '../shared/schema-sqlite.js';
import { eq } from 'drizzle-orm';

async function checkLessons() {
  console.log('🔍 Checking lessons in database...\n');

  try {
    const allTracks = await db.select().from(tracks).where(eq(tracks.isPublished, true));
    
    console.log(`Found ${allTracks.length} published tracks\n`);

    for (const track of allTracks) {
      const trackLessons = await db.select().from(lessons).where(eq(lessons.trackId, track.id)).orderBy(lessons.order);
      
      console.log(`📚 ${track.title}`);
      console.log(`   Slug: ${track.slug}`);
      console.log(`   Lessons: ${trackLessons.length}`);
      
      if (trackLessons.length > 0) {
        trackLessons.forEach((lesson, idx) => {
          console.log(`   ${idx + 1}. ${lesson.title} (order: ${lesson.order})`);
        });
      } else {
        console.log(`   ⚠️  NO LESSONS FOUND!`);
      }
      console.log('');
    }

    const totalLessons = await db.select().from(lessons);
    console.log(`\n📊 Total lessons in database: ${totalLessons.length}`);
  } catch (error) {
    console.error('❌ Error checking lessons:', error);
    throw error;
  }
}

checkLessons()
  .then(() => {
    console.log('\n✅ Check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Check failed:', error);
    process.exit(1);
  });





