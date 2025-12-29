import { db } from '../server/db.js';
import { tracks, lessons } from '../shared/schema-sqlite.js';
import { eq } from 'drizzle-orm';

// Expected AI tutors for each track (matching chat component)
const EXPECTED_TUTORS: { [key: string]: string[] } = {
  'ndt-inspection': ['Sarah', 'Dr. Sarah Chen'],
  'alst': ['Alex', 'Alex Johnson'],
  'lst': ['Rebecca', 'Rebecca Foster'],
  'diver-medic': ['Mike', 'Dr. Michael Rodriguez'],
  'commercial-supervisor': ['James', 'Captain James Mitchell'],
  'air-diver-certification': ['Lisa', 'Lisa Thompson'],
  'saturation-diving': ['Robert', 'Commander Robert Hayes'],
  'hyperbaric-operations': ['Emma', 'Dr. Emma Thompson'],
  'underwater-welding': ['Carlos', 'Master Welder Carlos Mendez'],
};

async function verifyAITutorAlignment() {
  console.log('🔍 Verifying AI tutor alignment across all tracks...\n');

  try {
    const allTracks = await db.select({
      id: tracks.id,
      slug: tracks.slug,
      title: tracks.title,
    }).from(tracks).where(eq(tracks.isPublished, true));

    let allAligned = true;

    for (const track of allTracks) {
      console.log(`📚 Checking track: ${track.title} (${track.slug})`);
      
      const expectedNames = EXPECTED_TUTORS[track.slug];
      if (!expectedNames) {
        console.log(`   ⚠️  No expected tutor mapping found`);
        continue;
      }

      const trackLessons = await db.select().from(lessons).where(eq(lessons.trackId, track.id)).orderBy(lessons.order);
      
      let trackAligned = true;
      for (const lesson of trackLessons) {
        const content = lesson.content || '';
        const hasCorrectTutor = expectedNames.some(name => 
          content.includes(name) || content.includes(`AI Tutor: ${name}`)
        );
        
        if (!hasCorrectTutor) {
          // Check what tutor is actually mentioned
          const tutorMatch = content.match(/## AI Tutor: ([^-]+) -/);
          const actualTutor = tutorMatch ? tutorMatch[1].trim() : 'Unknown';
          console.log(`   ❌ Lesson "${lesson.title}" has tutor: ${actualTutor} (expected: ${expectedNames.join(' or ')})`);
          trackAligned = false;
          allAligned = false;
        }
      }
      
      if (trackAligned) {
        console.log(`   ✅ All ${trackLessons.length} lessons have correct AI tutor`);
      }
      console.log('');
    }

    if (allAligned) {
      console.log('✅ All tracks have correctly aligned AI tutors!');
    } else {
      console.log('❌ Some tracks have misaligned AI tutors. Please run fix-all-ai-tutors-alignment.ts');
    }
  } catch (error) {
    console.error('❌ Error verifying alignment:', error);
    throw error;
  }
}

verifyAITutorAlignment()
  .then(() => {
    console.log('\n🎉 Verification completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Verification failed:', error);
    process.exit(1);
  });

