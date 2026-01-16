#!/usr/bin/env ts-node
/**
 * Regenerate only podcasts that failed or are too short (< 5 minutes)
 * This avoids regenerating ones that already succeeded
 */

import 'dotenv/config';
import { db } from '../server/db.js';
import { lessons, tracks } from '../shared/schema.js';
import { eq, or, isNull, lt } from 'drizzle-orm';
import { generateLessonPodcast } from '../server/services/podcast-generator.js';

// Default to GPT mode since cost difference is minimal
const USE_GPT = process.env.USE_GPT !== 'false';

async function main() {
  console.log('🎙️ Regenerating failed/short podcasts...');
  console.log(`   Mode: ${USE_GPT ? 'GPT-enhanced' : 'GPT-free'}`);
  console.log('');

  const allLessons = await db.select().from(lessons);
  
  // Filter lessons that need regeneration:
  // 1. No podcast URL
  // 2. Podcast duration is null or less than 5 minutes (300 seconds)
  const lessonsToRegenerate = allLessons.filter(lesson => {
    if (!lesson.podcastUrl) return true;
    if (!lesson.podcastDuration) return true;
    if (lesson.podcastDuration < 300) return true; // Less than 5 minutes
    return false;
  });

  console.log(`   Found ${lessonsToRegenerate.length} lessons to regenerate (out of ${allLessons.length} total)`);
  console.log('');

  let regenerated = 0;
  let errors = 0;

  for (const lesson of lessonsToRegenerate) {
    const trackRows = await db.select().from(tracks).where(eq(tracks.id, lesson.trackId)).limit(1);
    const track = trackRows[0];
    const trackSlug = track?.slug ?? 'unknown-track';
    const trackTitle = track?.title ?? 'Unknown Track';

    try {
      const reason = !lesson.podcastUrl 
        ? 'missing' 
        : !lesson.podcastDuration 
          ? 'no duration' 
          : 'too short';
      
      console.log(`🎙️ Regenerating (${reason}): ${lesson.title}`);
      
      const audio = await generateLessonPodcast({
        lessonContent: lesson.content,
        lessonTitle: lesson.title,
        trackSlug,
        trackTitle,
        voice: 'alloy',
        useGPT: USE_GPT,
      });

      if (audio.filePath) {
        const podcastUrl = audio.filePath.startsWith('/') 
          ? audio.filePath 
          : `/${audio.filePath}`;
        
        await db
          .update(lessons)
          .set({
            podcastUrl,
            podcastDuration: audio.durationSeconds ?? null,
          })
          .where(eq(lessons.id, lesson.id));
        
        const duration = audio.durationSeconds 
          ? `${Math.round(audio.durationSeconds / 60)} min`
          : 'unknown';
        
        console.log(`   ✓ Regenerated: ${podcastUrl} (${duration})`);
        regenerated++;
      } else {
        console.warn(`   ⚠️ No podcast file generated`);
        errors++;
      }
    } catch (err) {
      console.error(`   ❌ Failed:`, err instanceof Error ? err.message : err);
      errors++;
      
      // If it's a connection/rate limit error, wait a bit
      if (err instanceof Error && (err.message.includes('Connection') || err.message.includes('rate'))) {
        console.log('   ⏸️  Waiting 5 seconds before continuing...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  console.log('');
  console.log('📊 Summary:');
  console.log(`   ✓ Regenerated: ${regenerated}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log('');
  console.log('✅ Regeneration complete.');
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
