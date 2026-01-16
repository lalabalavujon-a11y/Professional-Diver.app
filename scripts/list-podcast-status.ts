#!/usr/bin/env ts-node
/**
 * List podcast generation status - shows completed and failed podcasts
 */

import 'dotenv/config';
import { db } from '../server/db.js';
import { lessons, tracks } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('📊 Podcast Generation Status Report\n');
  console.log('=' .repeat(80));
  console.log('');

  const allLessons = await db.select().from(lessons);
  
  const completed: Array<{ title: string; track: string; duration: number; url: string }> = [];
  const failed: Array<{ title: string; track: string; reason: string }> = [];

  for (const lesson of allLessons) {
    const trackRows = await db.select().from(tracks).where(eq(tracks.id, lesson.trackId)).limit(1);
    const track = trackRows[0];
    const trackTitle = track?.title ?? 'Unknown Track';

    if (!lesson.podcastUrl) {
      failed.push({
        title: lesson.title,
        track: trackTitle,
        reason: 'No podcast URL'
      });
    } else if (!lesson.podcastDuration) {
      failed.push({
        title: lesson.title,
        track: trackTitle,
        reason: 'No duration recorded'
      });
    } else if (lesson.podcastDuration < 300) {
      // Less than 5 minutes
      failed.push({
        title: lesson.title,
        track: trackTitle,
        reason: `Too short (${Math.round(lesson.podcastDuration / 60)} min)`
      });
    } else {
      completed.push({
        title: lesson.title,
        track: trackTitle,
        duration: lesson.podcastDuration,
        url: lesson.podcastUrl
      });
    }
  }

  // Sort completed by track and title
  completed.sort((a, b) => {
    if (a.track !== b.track) return a.track.localeCompare(b.track);
    return a.title.localeCompare(b.title);
  });

  // Sort failed by track and title
  failed.sort((a, b) => {
    if (a.track !== b.track) return a.track.localeCompare(b.track);
    return a.title.localeCompare(b.title);
  });

  console.log(`✅ COMPLETED PODCASTS (${completed.length}):`);
  console.log('=' .repeat(80));
  
  let currentTrack = '';
  for (const podcast of completed) {
    if (podcast.track !== currentTrack) {
      currentTrack = podcast.track;
      console.log(`\n📚 ${currentTrack}:`);
    }
    const minutes = Math.round(podcast.duration / 60);
    console.log(`   ✓ ${podcast.title} (${minutes} min)`);
  }

  console.log('');
  console.log('');
  console.log(`❌ FAILED/SHORT PODCASTS (${failed.length}):`);
  console.log('=' .repeat(80));
  
  currentTrack = '';
  for (const podcast of failed) {
    if (podcast.track !== currentTrack) {
      currentTrack = podcast.track;
      console.log(`\n📚 ${currentTrack}:`);
    }
    console.log(`   ✗ ${podcast.title} - ${podcast.reason}`);
  }

  console.log('');
  console.log('=' .repeat(80));
  console.log(`📊 Summary:`);
  console.log(`   ✅ Completed: ${completed.length}`);
  console.log(`   ❌ Failed/Short: ${failed.length}`);
  console.log(`   📝 Total Lessons: ${allLessons.length}`);
  console.log('');
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
