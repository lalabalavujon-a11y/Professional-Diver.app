#!/usr/bin/env ts-node
/**
 * Fix podcast URLs in database - ensure they start with /uploads/
 */

import 'dotenv/config';
import { db } from '../server/db.js';
import { lessons } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import { existsSync } from 'fs';
import path from 'path';

async function main() {
  console.log('🔧 Fixing podcast URLs in database...');

  const allLessons = await db.select().from(lessons);
  let fixed = 0;
  let missing = 0;
  let alreadyCorrect = 0;

  for (const lesson of allLessons) {
    if (!lesson.podcastUrl) {
      continue;
    }

    // Check if URL needs fixing
    let fixedUrl = lesson.podcastUrl;
    if (!fixedUrl.startsWith('/')) {
      fixedUrl = `/${fixedUrl}`;
    }

    // Check if file exists
    const filePath = path.join(process.cwd(), fixedUrl.replace(/^\/uploads\//, 'uploads/'));
    const fileExists = existsSync(filePath);

    if (fixedUrl !== lesson.podcastUrl) {
      // URL needs fixing
      if (fileExists) {
        await db.update(lessons)
          .set({ podcastUrl: fixedUrl })
          .where(eq(lessons.id, lesson.id));
        console.log(`✓ Fixed: ${lesson.title}`);
        console.log(`  ${lesson.podcastUrl} -> ${fixedUrl}`);
        fixed++;
      } else {
        console.log(`⚠️  URL needs fixing but file missing: ${lesson.title}`);
        console.log(`  Expected: ${filePath}`);
        missing++;
      }
    } else if (!fileExists) {
      console.log(`❌ File missing: ${lesson.title}`);
      console.log(`  URL: ${fixedUrl}`);
      console.log(`  Expected: ${filePath}`);
      missing++;
    } else {
      alreadyCorrect++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  ✓ Fixed: ${fixed}`);
  console.log(`  ❌ Missing files: ${missing}`);
  console.log(`  ✓ Already correct: ${alreadyCorrect}`);
  console.log(`  📝 Total lessons with podcasts: ${allLessons.filter(l => l.podcastUrl).length}`);
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
