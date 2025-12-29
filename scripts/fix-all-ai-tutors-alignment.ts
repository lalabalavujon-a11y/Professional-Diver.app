import { db } from '../server/db.js';
import { tracks, lessons } from '../shared/schema-sqlite.js';
import { eq } from 'drizzle-orm';

// Correct AI tutor mappings - matching chat component
const AI_TUTOR_MAPPINGS: { [key: string]: { name: string; fullName: string; specialty: string } } = {
  'ndt-inspection': {
    name: 'Sarah',
    fullName: 'Dr. Sarah Chen',
    specialty: 'NDT & Inspection Specialist'
  },
  'alst': {
    name: 'Alex',
    fullName: 'Alex Johnson',
    specialty: 'Life Support Systems Specialist'
  },
  'lst': {
    name: 'Rebecca',
    fullName: 'Rebecca Foster',
    specialty: 'Senior Life Support Specialist'
  },
  'diver-medic': {
    name: 'Mike',
    fullName: 'Dr. Michael Rodriguez',
    specialty: 'Emergency Medicine Specialist'
  },
  'commercial-supervisor': {
    name: 'James',
    fullName: 'Captain James Mitchell',
    specialty: 'Commercial Diving Leadership'
  },
  'air-diver-certification': {
    name: 'Lisa',
    fullName: 'Lisa Thompson',
    specialty: 'Air Diving Specialist'
  },
  'saturation-diving': {
    name: 'Robert',
    fullName: 'Commander Robert Hayes',
    specialty: 'Saturation Diving Specialist'
  },
  'hyperbaric-operations': {
    name: 'Emma',
    fullName: 'Dr. Emma Thompson',
    specialty: 'Hyperbaric Medicine Specialist'
  },
  'underwater-welding': {
    name: 'Carlos',
    fullName: 'Master Welder Carlos Mendez',
    specialty: 'Underwater Welding Specialist'
  }
};

async function fixAllAITutorsAlignment() {
  console.log('🔧 Fixing AI tutor alignment across all lessons...\n');

  try {
    const allTracks = await db.select({
      id: tracks.id,
      slug: tracks.slug,
      title: tracks.title,
    }).from(tracks).where(eq(tracks.isPublished, true));

    let totalFixed = 0;

    for (const track of allTracks) {
      console.log(`📚 Processing track: ${track.title} (${track.slug})`);
      
      const tutorInfo = AI_TUTOR_MAPPINGS[track.slug];
      if (!tutorInfo) {
        console.log(`   ⚠️  No tutor mapping found for ${track.slug}`);
        continue;
      }

      const trackLessons = await db.select().from(lessons).where(eq(lessons.trackId, track.id)).orderBy(lessons.order);
      
      for (const lesson of trackLessons) {
        let updatedContent = lesson.content;
        let wasUpdated = false;

        // Fix AI Tutor header in content
        // Pattern: "## AI Tutor: [Old Name] - [Old Specialty]"
        const tutorHeaderPattern = /## AI Tutor: [^-]+ - [^\n]+/g;
        const newTutorHeader = `## AI Tutor: ${tutorInfo.fullName} - ${tutorInfo.specialty}`;
        
        if (tutorHeaderPattern.test(updatedContent)) {
          updatedContent = updatedContent.replace(tutorHeaderPattern, newTutorHeader);
          wasUpdated = true;
        }

        // Fix AI Tutor introduction in content
        // Pattern: "I'm [Old Name], your AI tutor" or "Welcome... I'm [Old Name]"
        const tutorIntroPatterns = [
          /I'm [^,]+(?:, your AI tutor|\. I'm your AI tutor)/g,
          /Welcome[^!]+! I'm [^,]+(?:, your AI tutor|\. I'm your AI tutor)/g,
        ];

        for (const pattern of tutorIntroPatterns) {
          if (pattern.test(updatedContent)) {
            // Replace with correct tutor name
            updatedContent = updatedContent.replace(
              /I'm [^,]+(?:, your AI tutor|\. I'm your AI tutor)/g,
              `I'm ${tutorInfo.fullName}, your AI tutor`
            );
            updatedContent = updatedContent.replace(
              /Welcome[^!]+! I'm [^,]+(?:, your AI tutor|\. I'm your AI tutor)/g,
              (match) => {
                return match.replace(/I'm [^,]+(?:, your AI tutor|\. I'm your AI tutor)/, `I'm ${tutorInfo.fullName}, your AI tutor`);
              }
            );
            wasUpdated = true;
          }
        }

        // Also check for "Welcome to Lesson X of [Track]! I'm [Name]"
        const welcomePattern = new RegExp(`Welcome to Lesson \\d+ of [^!]+! I'm [^,]+(?:, your AI tutor|\. I'm your AI tutor)`, 'g');
        if (welcomePattern.test(updatedContent)) {
          updatedContent = updatedContent.replace(
            welcomePattern,
            (match) => match.replace(/I'm [^,]+(?:, your AI tutor|\. I'm your AI tutor)/, `I'm ${tutorInfo.fullName}, your AI tutor`)
          );
          wasUpdated = true;
        }

        if (wasUpdated) {
          await db.update(lessons)
            .set({ content: updatedContent })
            .where(eq(lessons.id, lesson.id));
          console.log(`   ✅ Fixed: ${lesson.title}`);
          totalFixed++;
        }
      }
      console.log('');
    }

    console.log(`\n✅ Fixed ${totalFixed} lessons with correct AI tutors!`);
  } catch (error) {
    console.error('❌ Error fixing AI tutors:', error);
    throw error;
  }
}

fixAllAITutorsAlignment()
  .then(() => {
    console.log('\n🎉 Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

