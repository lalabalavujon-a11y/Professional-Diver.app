import { db } from '../server/db.js';
import { tracks, lessons } from '../shared/schema-sqlite.js';
import { eq, sql } from 'drizzle-orm';

/**
 * Script to verify content completeness for all tracks
 * Checks lesson counts, podcasts, and PDFs
 */

async function verifyContentCompleteness() {
  console.log('🔍 Verifying Content Completeness...\n');

  try {
    // Get all published tracks
    const allTracks = await db.select({
      id: tracks.id,
      title: tracks.title,
      slug: tracks.slug,
      difficulty: tracks.difficulty,
    })
      .from(tracks)
      .where(eq(tracks.isPublished, true))
      .orderBy(tracks.title);

    console.log(`📊 Analyzing ${allTracks.length} published tracks\n`);

    const results: Array<{
      track: typeof allTracks[0];
      lessonCount: number;
      lessonsWithPodcast: number;
      lessonsWithPdf: number;
      status: 'complete' | 'missing_podcasts' | 'missing_pdfs' | 'incomplete';
    }> = [];

    for (const track of allTracks) {
      const trackLessons = await db.select({
        id: lessons.id,
        title: lessons.title,
        podcastUrl: lessons.podcastUrl,
        pdfUrl: lessons.pdfUrl,
      })
        .from(lessons)
        .where(eq(lessons.trackId, track.id));

      const lessonCount = trackLessons.length;
      const lessonsWithPodcast = trackLessons.filter(l => l.podcastUrl).length;
      const lessonsWithPdf = trackLessons.filter(l => l.pdfUrl).length;

      let status: 'complete' | 'missing_podcasts' | 'missing_pdfs' | 'incomplete';
      if (lessonCount === 0) {
        status = 'incomplete';
      } else if (lessonsWithPodcast === lessonCount && lessonsWithPdf === lessonCount) {
        status = 'complete';
      } else if (lessonsWithPodcast < lessonCount && lessonsWithPdf < lessonCount) {
        status = 'incomplete';
      } else if (lessonsWithPodcast < lessonCount) {
        status = 'missing_podcasts';
      } else {
        status = 'missing_pdfs';
      }

      results.push({
        track,
        lessonCount,
        lessonsWithPodcast,
        lessonsWithPdf,
        status,
      });
    }

    // Display results
    console.log('📚 TRACK CONTENT ANALYSIS:\n');
    
    results.forEach((result, index) => {
      const statusIcon = {
        'complete': '✅',
        'missing_podcasts': '⚠️',
        'missing_pdfs': '⚠️',
        'incomplete': '❌'
      }[result.status];

      console.log(`${index + 1}. ${statusIcon} ${result.track.title}`);
      console.log(`   Slug: ${result.track.slug}`);
      console.log(`   Difficulty: ${result.track.difficulty || 'N/A'}`);
      console.log(`   Lessons: ${result.lessonCount}`);
      
      if (result.lessonCount === 0) {
        console.log(`   ⚠️  No lessons found!`);
      } else {
        console.log(`   Podcasts: ${result.lessonsWithPodcast}/${result.lessonCount} (${Math.round(result.lessonsWithPodcast / result.lessonCount * 100)}%)`);
        console.log(`   PDFs: ${result.lessonsWithPdf}/${result.lessonCount} (${Math.round(result.lessonsWithPdf / result.lessonCount * 100)}%)`);
        
        if (result.status === 'missing_podcasts') {
          console.log(`   ⚠️  Missing podcasts for ${result.lessonCount - result.lessonsWithPodcast} lesson(s)`);
        }
        if (result.status === 'missing_pdfs') {
          console.log(`   ⚠️  Missing PDFs for ${result.lessonCount - result.lessonsWithPdf} lesson(s)`);
        }
        if (result.status === 'incomplete') {
          console.log(`   ⚠️  Missing both podcasts and PDFs for some lessons`);
        }
      }
      console.log('');
    });

    // Summary
    const completeTracks = results.filter(r => r.status === 'complete').length;
    const tracksWithIssues = results.filter(r => r.status !== 'complete').length;
    const totalLessons = results.reduce((sum, r) => sum + r.lessonCount, 0);
    const totalPodcasts = results.reduce((sum, r) => sum + r.lessonsWithPodcast, 0);
    const totalPdfs = results.reduce((sum, r) => sum + r.lessonsWithPdf, 0);

    console.log('📈 SUMMARY:');
    console.log(`   Total Tracks: ${results.length}`);
    console.log(`   Complete Tracks (podcasts + PDFs): ${completeTracks}`);
    console.log(`   Tracks with Issues: ${tracksWithIssues}`);
    console.log(`   Total Lessons: ${totalLessons}`);
    console.log(`   Total Podcasts: ${totalPodcasts} (${Math.round(totalPodcasts / totalLessons * 100)}% coverage)`);
    console.log(`   Total PDFs: ${totalPdfs} (${Math.round(totalPdfs / totalLessons * 100)}% coverage)`);
    console.log('');

    // Check original 9 tracks (should have 12+ lessons)
    const originalTracks = results.filter(r => 
      r.track.slug !== 'client-representative'
    );
    const tracksWithInsufficientLessons = originalTracks.filter(r => r.lessonCount < 12);
    
    if (tracksWithInsufficientLessons.length > 0) {
      console.log('⚠️  ORIGINAL TRACKS WITH LESS THAN 12 LESSONS:');
      tracksWithInsufficientLessons.forEach(r => {
        console.log(`   - ${r.track.title}: ${r.lessonCount} lessons (expected: 12+)`);
      });
      console.log('');
    } else {
      console.log('✅ All original tracks have 12+ lessons!');
      console.log('');
    }

    // Check Client Representative (should have 6 lessons)
    const clientRepTrack = results.find(r => r.track.slug === 'client-representative');
    if (clientRepTrack) {
      console.log('🎯 CLIENT REPRESENTATIVE:');
      console.log(`   Lessons: ${clientRepTrack.lessonCount} (expected: 6)`);
      if (clientRepTrack.lessonCount === 6) {
        console.log('   ✅ Correct number of lessons!');
      } else {
        console.log(`   ⚠️  Expected 6 lessons, found ${clientRepTrack.lessonCount}`);
      }
      console.log(`   Podcasts: ${clientRepTrack.lessonsWithPodcast}/6`);
      console.log(`   PDFs: ${clientRepTrack.lessonsWithPdf}/6`);
      console.log('');
    }

    console.log('✨ Content verification complete!');

  } catch (error: any) {
    console.error('\n❌ Error verifying content:', error);
    if (error.message) {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

// Run the verification
verifyContentCompleteness()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
