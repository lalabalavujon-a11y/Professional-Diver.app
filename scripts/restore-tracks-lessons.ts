import { db } from '../server/db.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import schemas based on environment
const isProduction = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
const schema = isProduction 
  ? await import('../shared/schema.js')
  : await import('../shared/schema-sqlite.js');

const { tracks, lessons } = schema;

interface TrackExport {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  isPublished: boolean;
  aiTutorId: string | null;
  createdAt: Date | string;
  lessons: LessonExport[];
}

interface LessonExport {
  id: string;
  trackId: string;
  title: string;
  order: number;
  content: string;
  estimatedMinutes: number | null;
  isRequired: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface ExportData {
  exportedAt: string;
  version: string;
  tracks: TrackExport[];
}

async function restoreTracksAndLessons(backupFile?: string) {
  console.log('🔄 Restoring tracks and lessons from backup...');

  try {
    // Determine which backup file to use
    const backupDir = path.join(__dirname, '..', 'backups');
    let filepath: string;

    if (backupFile) {
      filepath = path.isAbsolute(backupFile) 
        ? backupFile 
        : path.join(backupDir, backupFile);
    } else {
      // Use latest backup by default
      filepath = path.join(backupDir, 'tracks-lessons-latest.json');
    }

    if (!fs.existsSync(filepath)) {
      throw new Error(`Backup file not found: ${filepath}`);
    }

    console.log(`Reading backup from: ${filepath}`);
    const fileContent = fs.readFileSync(filepath, 'utf-8');
    const exportData: ExportData = JSON.parse(fileContent);

    console.log(`\nBackup information:`);
    console.log(`  Exported at: ${exportData.exportedAt}`);
    console.log(`  Version: ${exportData.version}`);
    console.log(`  Tracks: ${exportData.tracks.length}`);

    // Confirm before proceeding
    console.log('\n⚠️  WARNING: This will DELETE all existing tracks and lessons!');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Clear existing data
    console.log('\n🗑️  Clearing existing data...');
    await db.delete(lessons);
    await db.delete(tracks);
    console.log('   Existing data cleared');

    // Restore tracks and lessons
    console.log('\n📥 Restoring tracks and lessons...');
    let totalLessons = 0;

    for (const trackData of exportData.tracks) {
      console.log(`  Restoring track: ${trackData.title} (${trackData.slug})`);

      // Insert track
      const [restoredTrack] = await db.insert(tracks).values({
        id: trackData.id,
        title: trackData.title,
        slug: trackData.slug,
        summary: trackData.summary,
        isPublished: trackData.isPublished,
        aiTutorId: trackData.aiTutorId,
        createdAt: trackData.createdAt instanceof String 
          ? new Date(trackData.createdAt) 
          : trackData.createdAt,
      }).returning();

      // Insert lessons for this track
      for (const lessonData of trackData.lessons) {
        await db.insert(lessons).values({
          id: lessonData.id,
          trackId: restoredTrack.id, // Use the restored track ID
          title: lessonData.title,
          order: lessonData.order,
          content: lessonData.content,
          estimatedMinutes: lessonData.estimatedMinutes,
          isRequired: lessonData.isRequired,
          createdAt: lessonData.createdAt instanceof String 
            ? new Date(lessonData.createdAt) 
            : lessonData.createdAt,
          updatedAt: lessonData.updatedAt instanceof String 
            ? new Date(lessonData.updatedAt) 
            : lessonData.updatedAt,
        });
        totalLessons++;
      }

      console.log(`    Restored ${trackData.lessons.length} lessons`);
    }

    console.log(`\n✅ Restore complete!`);
    console.log(`   Restored ${exportData.tracks.length} tracks`);
    console.log(`   Restored ${totalLessons} lessons`);

    return { tracks: exportData.tracks.length, lessons: totalLessons };
  } catch (error) {
    console.error('❌ Error restoring tracks and lessons:', error);
    throw error;
  }
}

// Run if called directly (when executed via tsx/node)
const isMainModule = process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/'));
if (isMainModule || process.argv[1]?.includes('restore-tracks-lessons')) {
  const backupFile = process.argv[2]; // Optional backup file argument
  
  restoreTracksAndLessons(backupFile)
    .then((result) => {
      console.log('\n🎉 Restore completed successfully!');
      console.log(`   ${result.tracks} tracks and ${result.lessons} lessons restored`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Restore failed:', error);
      process.exit(1);
    });
}

export { restoreTracksAndLessons };

