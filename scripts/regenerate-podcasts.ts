#!/usr/bin/env ts-node
/**
 * Regenerate all podcasts with enhanced 15-25 minute content
 * 
 * Usage:
 *   - Default: Uses GPT mode (better quality, recommended)
 *   - Set USE_GPT=false to use GPT-free mode (cost-effective alternative)
 * 
 * Cost comparison (for 125 podcasts):
 *   - GPT-free: ~$62.50 total (~$0.50 per podcast)
 *   - With GPT: ~$68.75 total (~$0.55 per podcast)
 *   - Difference: Only $6.25 for significantly better quality
 */

import 'dotenv/config';
import { db } from '../server/db.js';
import { lessons, tracks } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import { generateLessonPodcast } from '../server/services/podcast-generator.js';

// Default to GPT mode since cost difference is minimal ($6.25 for 125 podcasts)
const USE_GPT = process.env.USE_GPT !== 'false';

async function main() {
  console.log('🎙️ Regenerating podcasts with enhanced 15-25 minute content...');
  console.log(`   Mode: ${USE_GPT ? 'GPT-enhanced (recommended, ~$68.75 total)' : 'GPT-free (cost-effective, ~$62.50 total)'}`);
  console.log(`   Total podcasts: 125`);
  console.log(`   Estimated cost: ${USE_GPT ? '$68.75' : '$62.50'}`);
  console.log('');

  const allLessons = await db.select().from(lessons);
  let regenerated = 0;
  let skipped = 0;
  let errors = 0;

  for (const lesson of allLessons) {
    const trackRows = await db.select().from(tracks).where(eq(tracks.id, lesson.trackId)).limit(1);
    const track = trackRows[0];
    const trackSlug = track?.slug ?? 'unknown-track';
    const trackTitle = track?.title ?? 'Unknown Track';

    try {
      console.log(`🎙️ Regenerating: ${lesson.title}`);
      const audio = await generateLessonPodcast({
        lessonContent: lesson.content,
        lessonTitle: lesson.title,
        trackSlug,
        trackTitle,
        voice: 'alloy',
        useGPT: USE_GPT, // Use GPT only if explicitly enabled
      });

      if (audio.filePath) {
        // Convert file path to URL path
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
        console.warn(`   ⚠️ No podcast file generated for ${lesson.title}`);
        errors++;
      }
    } catch (err) {
      console.error(`   ❌ Failed: ${lesson.title}`, err instanceof Error ? err.message : err);
      errors++;
    }
  }

  console.log('');
  console.log('📊 Summary:');
  console.log(`   ✓ Regenerated: ${regenerated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log('');
  console.log('✅ Podcast regeneration complete.');
}

main().catch((err) => {
  console.error('❌ Podcast regeneration error:', err);
  process.exit(1);
});
