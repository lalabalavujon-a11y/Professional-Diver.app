#!/usr/bin/env ts-node
/**
 * Generate PDFs for lessons that don't have them.
 * Uses Gamma API to generate PDFs for all lessons missing pdfUrl.
 */

import 'dotenv/config';
import { db } from '../server/db.js';
import { lessons, tracks } from '../shared/schema-sqlite.js';
import { eq } from 'drizzle-orm';
import { generateLessonPDF } from '../server/services/gamma-api.js';

async function main() {
  console.log('📄 Generating PDFs for lessons missing pdfUrl...\n');

  // Get all lessons without PDFs
  const allLessons = await db.select().from(lessons);
  const lessonsWithoutPdf = allLessons.filter(lesson => !lesson.pdfUrl);

  console.log(`Found ${lessonsWithoutPdf.length} lessons without PDFs out of ${allLessons.length} total lessons.\n`);

  if (lessonsWithoutPdf.length === 0) {
    console.log('✅ All lessons already have PDFs!');
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const lesson of lessonsWithoutPdf) {
    try {
      // Get track info
      const trackRows = await db.select().from(tracks).where(eq(tracks.id, lesson.trackId)).limit(1);
      const track = trackRows[0];
      const trackTitle = track?.title ?? 'Unknown Track';

      console.log(`📄 Generating PDF for: "${lesson.title}" (Lesson ${lesson.order})...`);

      // Generate PDF using Gamma API
      const result = await generateLessonPDF(
        lesson.content,
        lesson.title,
        trackTitle
      );

      if (result.pdfUrl) {
        // Update lesson with PDF URL
        await db
          .update(lessons)
          .set({ pdfUrl: result.pdfUrl })
          .where(eq(lessons.id, lesson.id));

        console.log(`   ✅ PDF generated: ${result.pdfUrl}`);
        successCount++;
      } else {
        console.warn(`   ⚠️ No PDF URL returned for "${lesson.title}"`);
        failCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (err) {
      console.error(`   ❌ Failed to generate PDF for "${lesson.title}":`, err instanceof Error ? err.message : err);
      failCount++;
    }
  }

  console.log(`\n✅ PDF generation complete!`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Failed: ${failCount}`);
}

main().catch((err) => {
  console.error('❌ PDF generation error:', err);
  process.exit(1);
});
