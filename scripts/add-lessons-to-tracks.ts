import { db } from '../server/db.js';
import { tracks, lessons } from '../shared/schema-sqlite.js';
import { eq } from 'drizzle-orm';
import { ndtLessons } from '../content/ndt-lessons.js';
import { alstLessons } from '../content/alst-lessons.js';
import { lstLessons } from '../content/lst-lessons.js';
import { additionalLessons } from '../additional-lessons.js';

async function addLessonsToTracks() {
  console.log('🌱 Adding lessons to existing tracks...');

  try {
    // Get all existing tracks using drizzle ORM
    const allTracks = await db.select({
      id: tracks.id,
      slug: tracks.slug,
      title: tracks.title,
    }).from(tracks).where(eq(tracks.isPublished, true));
    
    console.log(`Found ${allTracks.length} tracks`);

    for (const track of allTracks) {
      console.log(`\n📚 Processing track: ${track.title} (${track.slug})`);

      // Check if track already has lessons
      const existingLessons = await db.select().from(lessons).where(eq(lessons.trackId, track.id));
      
      if (existingLessons.length > 0) {
        console.log(`  ⏭️  Track already has ${existingLessons.length} lessons, skipping...`);
        continue;
      }

      let lessonsToAdd: Array<{ title: string; content: string }> = [];

      // Match lessons based on track slug
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

      // Insert lessons using drizzle ORM
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
        
        console.log(`  ✅ Added lesson ${i + 1}: ${lesson.title}`);
      }

      console.log(`  ✨ Added ${lessonsToAdd.length} lessons to ${track.title}`);
    }

    // Final summary
    const allLessons = await db.select().from(lessons);
    
    console.log(`\n✅ Successfully added lessons to tracks!`);
    console.log(`📊 Total lessons in database: ${allLessons.length}`);
  } catch (error) {
    console.error('❌ Error adding lessons:', error);
    throw error;
  }
}

// Run the function
addLessonsToTracks()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

