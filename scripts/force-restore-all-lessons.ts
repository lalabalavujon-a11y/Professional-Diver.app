import { db } from '../server/db.js';
import { tracks, lessons } from '../shared/schema-sqlite.js';
import { eq, and } from 'drizzle-orm';
import { ndtLessons } from '../content/ndt-lessons.js';
import { alstLessons } from '../content/alst-lessons.js';
import { lstLessons } from '../content/lst-lessons.js';
import { additionalLessons } from '../additional-lessons.js';

async function forceRestoreAllLessons() {
  console.log('🔄 Force restoring all lessons to tracks...\n');

  try {
    // Get all existing tracks
    const allTracks = await db.select({
      id: tracks.id,
      slug: tracks.slug,
      title: tracks.title,
    }).from(tracks).where(eq(tracks.isPublished, true));
    
    console.log(`Found ${allTracks.length} published tracks\n`);

    let totalLessonsAdded = 0;
    let totalLessonsRemoved = 0;

    for (const track of allTracks) {
      console.log(`📚 Processing track: ${track.title} (${track.slug})`);

      // Get existing lessons count
      const existingLessons = await db.select().from(lessons).where(eq(lessons.trackId, track.id));
      console.log(`   Current lessons: ${existingLessons.length}`);

      // Determine which lessons to add based on track slug
      let lessonsToAdd: Array<{ title: string; content: string }> = [];

      switch (track.slug) {
        case 'inspection-ndt':
        case 'ndt-inspection':
          lessonsToAdd = ndtLessons;
          break;
        
        case 'assistant-life-support-technician':
        case 'alst':
          lessonsToAdd = alstLessons;
          break;
        
        case 'life-support-technician':
        case 'lst':
          lessonsToAdd = lstLessons;
          break;
        
        case 'diver-medic-technician':
        case 'diver-medic':
          lessonsToAdd = additionalLessons.filter(l => l.trackSlug === 'diver-medic-technician');
          break;
        
        case 'commercial-dive-supervisor':
        case 'commercial-supervisor':
          lessonsToAdd = additionalLessons.filter(l => l.trackSlug === 'commercial-dive-supervisor');
          break;
        
        case 'air-diver-certification':
        case 'air-diver':
          lessonsToAdd = additionalLessons.filter(l => l.trackSlug === 'air-diver-certification');
          break;
        
        case 'saturation-diver-training':
        case 'saturation-diving':
          lessonsToAdd = additionalLessons.filter(l => l.trackSlug === 'saturation-diver-training');
          break;
        
        default:
          // Add at least one placeholder lesson for tracks without specific content
          lessonsToAdd = [{
            title: `${track.title} - Introduction`,
            content: `# ${track.title} - Introduction\n\nWelcome to ${track.title}. This track is currently under development. Content will be added soon.`
          }];
      }

      // Remove existing lessons for this track
      if (existingLessons.length > 0) {
        await db.delete(lessons).where(eq(lessons.trackId, track.id));
        totalLessonsRemoved += existingLessons.length;
        console.log(`   🗑️  Removed ${existingLessons.length} existing lessons`);
      }

      // Add all lessons fresh
      for (let i = 0; i < lessonsToAdd.length; i++) {
        const lesson = lessonsToAdd[i];

        await db.insert(lessons).values({
          trackId: track.id,
          title: lesson.title,
          order: i + 1,
          content: lesson.content,
          estimatedMinutes: 60,
          isRequired: true,
        });
        
        console.log(`   ✅ Added lesson ${i + 1}: ${lesson.title}`);
        totalLessonsAdded++;
      }

      console.log(`   ✨ Restored ${lessonsToAdd.length} lessons to ${track.title}\n`);
    }

    // Final summary
    const allLessons = await db.select().from(lessons);
    
    console.log(`\n📊 Summary:`);
    console.log(`   Removed: ${totalLessonsRemoved} lessons`);
    console.log(`   Added: ${totalLessonsAdded} lessons`);
    console.log(`   Total lessons in database: ${allLessons.length}`);
    
    // Verify lessons are properly linked
    console.log(`\n🔍 Verification:`);
    for (const track of allTracks) {
      const trackLessons = await db.select().from(lessons).where(eq(lessons.trackId, track.id));
      console.log(`   ${track.title}: ${trackLessons.length} lessons`);
    }
  } catch (error) {
    console.error('❌ Error restoring lessons:', error);
    throw error;
  }
}

// Run the function
forceRestoreAllLessons()
  .then(() => {
    console.log('\n✅ All lessons restored successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed to restore lessons:', error);
    process.exit(1);
  });





