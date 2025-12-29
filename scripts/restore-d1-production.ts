/**
 * Script to restore tracks and lessons to Cloudflare D1 production database
 * This ensures lessons persist after deployments
 * 
 * Usage:
 *   wrangler d1 execute professionaldiver-db --file=./scripts/restore-d1-production.ts --env production
 * 
 * Or run locally with D1 remote:
 *   wrangler d1 execute professionaldiver-db --remote --file=./scripts/restore-d1-production.ts --env production
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

interface ExportData {
  exportedAt: string;
  version: string;
  tracks: TrackExport[];
}

/**
 * Generate SQL statements to restore tracks and lessons to D1
 */
function generateRestoreSQL(backupFile?: string): string {
  const backupDir = path.join(__dirname, '..', 'backups');
  const filepath = backupFile 
    ? (path.isAbsolute(backupFile) ? backupFile : path.join(backupDir, backupFile))
    : path.join(backupDir, 'tracks-lessons-latest.json');

  if (!fs.existsSync(filepath)) {
    throw new Error(`Backup file not found: ${filepath}`);
  }

  console.log(`📖 Reading backup from: ${filepath}`);
  const fileContent = fs.readFileSync(filepath, 'utf-8');
  const exportData: ExportData = JSON.parse(fileContent);

  console.log(`\n📊 Backup information:`);
  console.log(`  Exported at: ${exportData.exportedAt}`);
  console.log(`  Version: ${exportData.version}`);
  console.log(`  Tracks: ${exportData.tracks.length}`);
  console.log(`  Total Lessons: ${exportData.tracks.reduce((sum, t) => sum + t.lessons.length, 0)}`);

  const sqlStatements: string[] = [];
  const now = Math.floor(Date.now() / 1000);

  // SQL to restore tracks
  for (const track of exportData.tracks) {
    const trackSQL = `INSERT OR REPLACE INTO tracks (
      id, title, slug, summary, is_published, ai_tutor_id, created_at
    ) VALUES (
      '${track.id}',
      ${escapeSQL(track.title)},
      '${track.slug}',
      ${track.summary ? escapeSQL(track.summary) : 'NULL'},
      ${track.isPublished ? 1 : 0},
      ${track.aiTutorId ? escapeSQL(track.aiTutorId) : 'NULL'},
      ${now}
    );`;
    sqlStatements.push(trackSQL);

    // SQL to restore lessons for this track
    for (const lesson of track.lessons) {
      const lessonCreatedAt = typeof lesson.createdAt === 'string' 
        ? Math.floor(new Date(lesson.createdAt).getTime() / 1000)
        : now;
      const lessonUpdatedAt = typeof lesson.updatedAt === 'string'
        ? Math.floor(new Date(lesson.updatedAt).getTime() / 1000)
        : now;

      const lessonSQL = `INSERT OR REPLACE INTO lessons (
        id, track_id, title, "order", content, estimated_minutes, is_required, created_at, updated_at
      ) VALUES (
        '${lesson.id}',
        '${lesson.trackId}',
        ${escapeSQL(lesson.title)},
        ${lesson.order},
        ${escapeSQL(lesson.content)},
        ${lesson.estimatedMinutes || 60},
        ${lesson.isRequired ? 1 : 0},
        ${lessonCreatedAt},
        ${lessonUpdatedAt}
      );`;
      sqlStatements.push(lessonSQL);
    }
  }

  return sqlStatements.join('\n\n');
}

function escapeSQL(str: string): string {
  if (!str) return "''";
  return `'${str.replace(/'/g, "''").replace(/\n/g, '\\n').replace(/\r/g, '\\r')}'`;
}

// Main execution
try {
  const sql = generateRestoreSQL();
  
  console.log('\n✅ Generated SQL statements');
  console.log(`📝 Total statements: ${sql.split(';').filter(s => s.trim()).length}`);
  console.log('\n📋 SQL to execute:\n');
  console.log(sql);
  
  console.log('\n\n🚀 To execute this SQL on D1 production:');
  console.log('   wrangler d1 execute professionaldiver-db --command="<sql>" --env production');
  console.log('\n   Or save to file and execute:');
  console.log('   wrangler d1 execute professionaldiver-db --file=restore.sql --env production');
  
  // Write SQL to file for easy execution
  const sqlFile = path.join(__dirname, '..', 'restore-d1-production.sql');
  fs.writeFileSync(sqlFile, sql, 'utf-8');
  console.log(`\n💾 SQL saved to: ${sqlFile}`);
  
} catch (error) {
  console.error('❌ Error generating restore SQL:', error);
  process.exit(1);
}

