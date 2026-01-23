import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from '../server/db.js';
import { aiTutors, lessons, tracks } from '../shared/schema-sqlite.js';
import { eq } from 'drizzle-orm';

interface BackupLesson {
  id?: string;
  trackId?: string;
  title: string;
  order?: number;
  content: string;
  estimatedMinutes?: number;
  isRequired?: boolean;
  podcastUrl?: string | null;
  pdfUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface BackupTrack {
  id?: string;
  title: string;
  slug: string;
  summary?: string | null;
  aiTutorId?: string | null;
  difficulty?: string | null;
  estimatedHours?: number | null;
  isPublished?: boolean | number;
  createdAt?: string;
  lessons?: BackupLesson[];
}

interface BackupPayload {
  tracks?: BackupTrack[];
}

const BACKUP_PATH = join(process.cwd(), 'backups', 'tracks-lessons-backup-2025-12-30.json');

function normalizePublished(value: BackupTrack['isPublished']): boolean {
  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;
  return true;
}

async function restoreMissingTracks() {
  console.log('🧭 Restoring missing learning tracks from backup...');

  const payload = JSON.parse(readFileSync(BACKUP_PATH, 'utf-8')) as BackupPayload;
  const backupTracks = payload.tracks ?? [];

  if (backupTracks.length === 0) {
    console.log('⚠️  No tracks found in backup payload.');
    return;
  }

  const existingTracks = await db.select({
    id: tracks.id,
    slug: tracks.slug,
    isPublished: tracks.isPublished,
  }).from(tracks);

  const existingBySlug = new Map(existingTracks.map(track => [track.slug, track]));

  const tutorRows = await db.select({ id: aiTutors.id }).from(aiTutors);
  const tutorIds = new Set(tutorRows.map(row => row.id));

  let insertedTracks = 0;
  let insertedLessons = 0;
  let publishedTracks = 0;

  for (const backupTrack of backupTracks) {
    const existing = existingBySlug.get(backupTrack.slug);
    if (existing) {
      const isPublished = existing.isPublished === true || existing.isPublished === 1;
      if (!isPublished) {
        await db.update(tracks)
          .set({ isPublished: true })
          .where(eq(tracks.id, existing.id));
        publishedTracks += 1;
        console.log(`✅ Published existing track: ${backupTrack.title}`);
      } else {
        console.log(`ℹ️  Track already exists: ${backupTrack.title}`);
      }
      continue;
    }

    const [insertedTrack] = await db.insert(tracks).values({
      id: backupTrack.id,
      title: backupTrack.title,
      slug: backupTrack.slug,
      summary: backupTrack.summary ?? undefined,
      aiTutorId: backupTrack.aiTutorId && tutorIds.has(backupTrack.aiTutorId) ? backupTrack.aiTutorId : undefined,
      difficulty: backupTrack.difficulty ?? 'beginner',
      estimatedHours: backupTrack.estimatedHours ?? 0,
      isPublished: normalizePublished(backupTrack.isPublished),
      createdAt: backupTrack.createdAt ? new Date(backupTrack.createdAt) : undefined,
    }).returning();

    insertedTracks += 1;

    const trackId = insertedTrack.id;
    const trackLessons = backupTrack.lessons ?? [];

    for (const lesson of trackLessons) {
      await db.insert(lessons).values({
        id: lesson.id,
        trackId,
        title: lesson.title,
        order: lesson.order ?? 0,
        content: lesson.content,
        estimatedMinutes: lesson.estimatedMinutes ?? 60,
        isRequired: lesson.isRequired ?? true,
        podcastUrl: lesson.podcastUrl ?? undefined,
        pdfUrl: lesson.pdfUrl ?? undefined,
        createdAt: lesson.createdAt ? new Date(lesson.createdAt) : undefined,
        updatedAt: lesson.updatedAt ? new Date(lesson.updatedAt) : undefined,
      });
      insertedLessons += 1;
    }

    console.log(`✅ Restored track: ${backupTrack.title} (${trackLessons.length} lessons)`);
  }

  console.log('\n📊 Restore Summary:');
  console.log(`   Tracks added: ${insertedTracks}`);
  console.log(`   Lessons added: ${insertedLessons}`);
  console.log(`   Tracks published: ${publishedTracks}`);
  console.log('✨ Restore complete!');
}

restoreMissingTracks()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Restore failed:', error);
    process.exit(1);
  });
