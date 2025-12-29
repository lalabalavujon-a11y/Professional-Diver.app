/**
 * Automatic backup service for tracks and lessons
 * Triggers backups automatically when content is modified
 */

import { db } from './db.js';
import { tracks, lessons } from '../shared/schema-sqlite.js';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

/**
 * Automatically export tracks and lessons to backup file
 * Runs asynchronously and doesn't block the main operation
 */
export async function autoBackupTracksAndLessons(): Promise<void> {
  // Run in background - don't await, don't throw errors
  // Use setTimeout for better compatibility across environments
  setTimeout(async () => {
    try {
      console.log('📦 Auto-backup: Starting automatic backup...');

      // Get all tracks
      const allTracks = await db.select().from(tracks).orderBy(tracks.title);

      const exportData: ExportData = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        tracks: []
      };

      // For each track, get its lessons
      for (const track of allTracks) {
        const trackLessons = await db
          .select()
          .from(lessons)
          .where(eq(lessons.trackId, track.id))
          .orderBy(lessons.order);

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

      // Save to latest backup file
      const latestFilepath = path.join(backupDir, 'tracks-lessons-latest.json');
      fs.writeFileSync(latestFilepath, JSON.stringify(exportData, null, 2), 'utf-8');

      // Also create timestamped backup (once per day)
      const today = new Date().toISOString().split('T')[0];
      const dailyFilepath = path.join(backupDir, `tracks-lessons-backup-${today}.json`);
      if (!fs.existsSync(dailyFilepath)) {
        fs.writeFileSync(dailyFilepath, JSON.stringify(exportData, null, 2), 'utf-8');
        console.log(`📦 Auto-backup: Created daily backup: ${dailyFilepath}`);
      }

      console.log(`📦 Auto-backup: Completed successfully (${exportData.tracks.length} tracks, ${exportData.tracks.reduce((sum, t) => sum + t.lessons.length, 0)} lessons)`);
    } catch (error) {
      // Log error but don't throw - backup failures shouldn't break the main operation
      console.error('📦 Auto-backup: Failed to create backup (non-critical):', error);
    }
  });
}

/**
 * Check if auto-backup is enabled (can be controlled via environment variable)
 */
export function isAutoBackupEnabled(): boolean {
  return process.env.AUTO_BACKUP_ENABLED !== 'false';
}

