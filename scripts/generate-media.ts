#!/usr/bin/env ts-node
/**
 * Generate PDFs (Gamma) and Podcasts (OpenAI TTS) for all lessons.
 * - Skips if pdfUrl/podcastUrl already present.
 * - Uses existing services: generateLessonPDF, generateLessonPodcast.
 */

import 'dotenv/config';
import { db } from '../server/db.js';
import { lessons, tracks } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
// PDF generation paused - focusing on podcasts only
import { generateLessonPodcast } from '../server/services/podcast-generator.js';

async function main() {
  console.log('🎙️ Generating podcasts for lessons (skip existing)...');

  const allLessons = await db.select().from(lessons);

  for (const lesson of allLessons) {
    const trackRows = await db.select().from(tracks).where(eq(tracks.id, lesson.trackId)).limit(1);
    const track = trackRows[0];
    const trackSlug = track?.slug ?? 'unknown-track';
    const trackTitle = track?.title ?? 'Unknown Track';

    // Podcast: generate if missing
    if (!lesson.podcastUrl) {
      try {
        console.log(`🎙️ Podcast: ${lesson.title}`);
        const audio = await generateLessonPodcast({
          lessonContent: lesson.content,
          lessonTitle: lesson.title,
          trackSlug,
          trackTitle,
          voice: 'alloy',
        });
        if (audio.filePath) {
          // Convert file path to URL path (uploads/podcasts/... -> /uploads/podcasts/...)
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
          console.log(`   ✓ Stored podcastUrl: ${podcastUrl}`);
        } else {
          console.warn(`   ⚠️ No podcast file generated for ${lesson.title}`);
        }
      } catch (err) {
        console.error(`   ❌ Podcast failed for ${lesson.title}:`, err instanceof Error ? err.message : err);
      }
    } else {
      console.log(`🎙️ Podcast exists: ${lesson.title}`);
    }
  }

  console.log('✅ Podcast generation complete.');
}

main().catch((err) => {
  console.error('❌ Media generation error:', err);
  process.exit(1);
});
