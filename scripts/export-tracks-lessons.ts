import { db } from '../server/db.js';
import { eq } from 'drizzle-orm';
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

const { tracks, lessons, quizzes, questions } = schema;

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

async function exportTracksAndLessons() {
  console.log('📦 Exporting all tracks and lessons from database...');

  try {
    // Get all tracks
    const allTracks = await db.select().from(tracks).orderBy(tracks.title);
    console.log(`Found ${allTracks.length} tracks`);

    const exportData: ExportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      tracks: []
    };

    // For each track, get its lessons
    for (const track of allTracks) {
      console.log(`  Exporting track: ${track.title} (${track.slug})`);
      
      const trackLessons = await db
        .select()
        .from(lessons)
        .where(eq(lessons.trackId, track.id))
        .orderBy(lessons.order);

      console.log(`    Found ${trackLessons.length} lessons`);

      const trackExport: TrackExport = {
        id: track.id,
        title: track.title,
        slug: track.slug,
        summary: track.summary || null,
        isPublished: track.isPublished || false,
        aiTutorId: track.aiTutorId || null,
        createdAt: track.createdAt instanceof Date 
          ? track.createdAt.toISOString() 
          : track.createdAt,
        lessons: trackLessons.map(lesson => ({
          id: lesson.id,
          trackId: lesson.trackId,
          title: lesson.title,
          order: lesson.order,
          content: lesson.content,
          estimatedMinutes: lesson.estimatedMinutes || null,
          isRequired: lesson.isRequired || false,
          createdAt: lesson.createdAt instanceof Date 
            ? lesson.createdAt.toISOString() 
            : lesson.createdAt,
          updatedAt: lesson.updatedAt instanceof Date 
            ? lesson.updatedAt.toISOString() 
            : lesson.updatedAt,
        }))
      };

      exportData.tracks.push(trackExport);
    }

    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Save to JSON file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `tracks-lessons-backup-${timestamp}.json`;
    const filepath = path.join(backupDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2), 'utf-8');

    // Also save as latest backup
    const latestFilepath = path.join(backupDir, 'tracks-lessons-latest.json');
    fs.writeFileSync(latestFilepath, JSON.stringify(exportData, null, 2), 'utf-8');

    console.log(`\n✅ Export complete!`);
    console.log(`   Total tracks: ${exportData.tracks.length}`);
    console.log(`   Total lessons: ${exportData.tracks.reduce((sum, t) => sum + t.lessons.length, 0)}`);
    console.log(`   Saved to: ${filepath}`);
    console.log(`   Latest backup: ${latestFilepath}`);

    return exportData;
  } catch (error) {
    console.error('❌ Error exporting tracks and lessons:', error);
    throw error;
  }
}

// Run if called directly (when executed via tsx/node)
const isMainModule = process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/'));
if (isMainModule || process.argv[1]?.includes('export-tracks-lessons')) {
  exportTracksAndLessons()
    .then(() => {
      console.log('\n🎉 Export completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Export failed:', error);
      process.exit(1);
    });
}

export { exportTracksAndLessons };

