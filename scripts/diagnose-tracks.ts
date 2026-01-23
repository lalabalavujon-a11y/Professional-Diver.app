import { db } from '../server/db.js';
import { tracks, lessons } from '../shared/schema-sqlite.js';
import { eq, sql, count } from 'drizzle-orm';

/**
 * Diagnostic script to check all tracks in the database
 * Shows publication status, lesson counts, and content completeness
 */

async function diagnoseTracks() {
  console.log('🔍 Diagnosing Learning Tracks...\n');

  try {
    // Get all tracks (published and unpublished)
    const allTracks = await db.select({
      id: tracks.id,
      title: tracks.title,
      slug: tracks.slug,
      summary: tracks.summary,
      isPublished: tracks.isPublished,
      difficulty: tracks.difficulty,
      createdAt: tracks.createdAt,
    })
      .from(tracks)
      .orderBy(tracks.title);

    console.log(`📊 Found ${allTracks.length} total tracks in database\n`);

    // Get lesson counts and content info for each track
    const tracksWithDetails = await Promise.all(
      allTracks.map(async (track) => {
        const trackLessons = await db.select({
          id: lessons.id,
          title: lessons.title,
          podcastUrl: lessons.podcastUrl,
          pdfUrl: lessons.pdfUrl,
        })
          .from(lessons)
          .where(eq(lessons.trackId, track.id));

        const lessonsWithPodcast = trackLessons.filter(l => l.podcastUrl).length;
        const lessonsWithPdf = trackLessons.filter(l => l.pdfUrl).length;

        return {
          ...track,
          lessonCount: trackLessons.length,
          lessonsWithPodcast,
          lessonsWithPdf,
        };
      })
    );

    // Separate published and unpublished tracks
    const publishedTracks = tracksWithDetails.filter(t => t.isPublished === true || t.isPublished === 1);
    const unpublishedTracks = tracksWithDetails.filter(t => t.isPublished === false || t.isPublished === 0);

    console.log('✅ PUBLISHED TRACKS (visible on frontend):');
    console.log(`   Count: ${publishedTracks.length}\n`);
    publishedTracks.forEach((track, index) => {
      const publishedStatus = track.isPublished === true || track.isPublished === 1 ? '✅ Published' : '❌ Unpublished';
      console.log(`   ${index + 1}. ${track.title}`);
      console.log(`      ID: ${track.id}`);
      console.log(`      Slug: ${track.slug}`);
      console.log(`      Status: ${publishedStatus} (raw: ${track.isPublished})`);
      console.log(`      Lessons: ${track.lessonCount}`);
      console.log(`      Lessons with Podcast: ${track.lessonsWithPodcast}/${track.lessonCount}`);
      console.log(`      Lessons with PDF: ${track.lessonsWithPdf}/${track.lessonCount}`);
      console.log(`      Difficulty: ${track.difficulty || 'N/A'}`);
      console.log('');
    });

    if (unpublishedTracks.length > 0) {
      console.log('❌ UNPUBLISHED TRACKS (NOT visible on frontend):');
      console.log(`   Count: ${unpublishedTracks.length}\n`);
      unpublishedTracks.forEach((track, index) => {
        const publishedStatus = track.isPublished === true || track.isPublished === 1 ? '✅ Published' : '❌ Unpublished';
        console.log(`   ${index + 1}. ${track.title}`);
        console.log(`      ID: ${track.id}`);
        console.log(`      Slug: ${track.slug}`);
        console.log(`      Status: ${publishedStatus} (raw: ${track.isPublished})`);
        console.log(`      Lessons: ${track.lessonCount}`);
        console.log(`      Lessons with Podcast: ${track.lessonsWithPodcast}/${track.lessonCount}`);
        console.log(`      Lessons with PDF: ${track.lessonsWithPdf}/${track.lessonCount}`);
        console.log(`      Difficulty: ${track.difficulty || 'N/A'}`);
        console.log('');
      });
    }

    // Check for Client Representative specifically
    const clientRepTrack = tracksWithDetails.find(t => 
      t.id === 'XRwzz1cdDnWmEudBdyHWR' || 
      t.slug === 'client-representative' ||
      t.title.toLowerCase().includes('client representative')
    );

    if (clientRepTrack) {
      console.log('🎯 CLIENT REPRESENTATIVE STATUS:');
      console.log(`   Title: ${clientRepTrack.title}`);
      console.log(`   ID: ${clientRepTrack.id}`);
      console.log(`   Published: ${clientRepTrack.isPublished === true || clientRepTrack.isPublished === 1 ? 'YES ✅' : 'NO ❌'}`);
      console.log(`   Lessons: ${clientRepTrack.lessonCount}`);
      console.log(`   Expected: 6 lessons`);
      if (clientRepTrack.lessonCount !== 6) {
        console.log(`   ⚠️  WARNING: Expected 6 lessons, found ${clientRepTrack.lessonCount}`);
      }
      console.log('');
    } else {
      console.log('⚠️  CLIENT REPRESENTATIVE NOT FOUND in database!\n');
    }

    // Summary
    console.log('📈 SUMMARY:');
    console.log(`   Total Tracks: ${allTracks.length}`);
    console.log(`   Published: ${publishedTracks.length}`);
    console.log(`   Unpublished: ${unpublishedTracks.length}`);
    console.log(`   Expected Published: 10`);
    
    if (publishedTracks.length < 10) {
      console.log(`   ⚠️  ISSUE: Only ${publishedTracks.length} tracks are published, but 10 are expected!`);
      console.log(`   Missing tracks: ${10 - publishedTracks.length}`);
    } else if (publishedTracks.length > 10) {
      console.log(`   ℹ️  INFO: More than 10 tracks are published (${publishedTracks.length})`);
    } else {
      console.log(`   ✅ All expected tracks are published!`);
    }

    // Check lesson counts for original 9 tracks (should have 12+ lessons)
    const originalTracks = publishedTracks.filter(t => 
      t.id !== 'XRwzz1cdDnWmEudBdyHWR' && 
      t.slug !== 'client-representative'
    );
    
    const tracksWithInsufficientLessons = originalTracks.filter(t => t.lessonCount < 12);
    if (tracksWithInsufficientLessons.length > 0) {
      console.log(`\n   ⚠️  TRACKS WITH LESS THAN 12 LESSONS:`);
      tracksWithInsufficientLessons.forEach(t => {
        console.log(`      - ${t.title}: ${t.lessonCount} lessons`);
      });
    }

    console.log('\n✨ Diagnosis complete!');

  } catch (error: any) {
    console.error('\n❌ Error diagnosing tracks:', error);
    if (error.message) {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

// Run the diagnosis
diagnoseTracks()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
