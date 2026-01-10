import { db } from "../db";
import { tracks, lessons } from "@shared/schema-sqlite";
import { eq, sql, like, or, and } from "drizzle-orm";
import type { Lesson, Track } from "@shared/schema-sqlite";

/**
 * Parsed filename information
 */
export interface ParsedFilename {
  trackSlug?: string;
  lessonTitle?: string;
  lessonId?: string;
  type?: 'pdf' | 'podcast';
  originalName: string;
}

/**
 * Parse filename to extract lesson information
 * Supports multiple naming patterns:
 * 1. lesson-{lessonId}_{type}.{ext}
 * 2. {track-slug}_{lesson-title-slug}_{type}.{ext}
 * 3. {lesson-title-slug}_{type}.{ext}
 */
export function parseFilenameForLesson(filename: string): ParsedFilename {
  const baseName = filename.replace(/\.[^/.]+$/, ''); // Remove extension
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  const result: ParsedFilename = {
    originalName: filename,
  };

  // Detect file type from extension
  if (ext === 'pdf') {
    result.type = 'pdf';
  } else if (ext === 'm4a' || ext === 'mp4a' || ext === 'mp3' || ext === 'wav' || ext === 'aac' || ext === 'ogg') {
    result.type = 'podcast';
  }

  // Pattern 1: lesson-{lessonId}_{type}
  const lessonIdPattern = /^lesson-([^_]+)(?:_(.+))?$/i;
  const lessonIdMatch = baseName.match(lessonIdPattern);
  if (lessonIdMatch) {
    result.lessonId = lessonIdMatch[1];
    // Type might be in the match if present, but usually detected from extension
    return result;
  }

  // Pattern 2: {track-slug}_{lesson-title-slug}_{type}
  // Pattern 3: {lesson-title-slug}_{type}
  const parts = baseName.split('_');
  
  if (parts.length >= 2) {
    // Try to identify track slug and lesson title
    // Common suffixes that indicate file type: reference, guide, podcast, audio
    const typeSuffixes = ['reference', 'guide', 'podcast', 'audio', 'pdf', 'pdfurl', 'podcasturl'];
    const lastPart = parts[parts.length - 1].toLowerCase();
    
    let lessonTitleParts: string[];
    if (typeSuffixes.includes(lastPart) && parts.length >= 3) {
      // Has type suffix, so format is likely: track_slug_lesson_title_type
      result.trackSlug = parts[0];
      lessonTitleParts = parts.slice(1, -1); // Everything between track slug and type suffix
    } else if (parts.length >= 2) {
      // No type suffix or different format, assume: track_slug_lesson_title
      result.trackSlug = parts[0];
      lessonTitleParts = parts.slice(1);
    } else {
      // Single part, assume it's just lesson title
      lessonTitleParts = parts;
    }
    
    result.lessonTitle = lessonTitleParts.join('_').replace(/-/g, ' '); // Convert underscores and dashes to spaces for matching
  } else {
    // Single part filename - assume it's lesson title
    result.lessonTitle = baseName.replace(/-/g, ' ');
  }

  return result;
}

/**
 * Get file type from filename extension
 */
export function getFileType(filename: string): 'pdf' | 'podcast' | 'unknown' {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  if (ext === 'pdf') {
    return 'pdf';
  } else if (ext === 'm4a' || ext === 'mp4a' || ext === 'mp3' || ext === 'wav' || ext === 'aac' || ext === 'ogg') {
    return 'podcast';
  }
  
  return 'unknown';
}

/**
 * Convert a string to a slug format (for matching)
 */
function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple dashes with single dash
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
}

/**
 * Normalize lesson title for matching (fuzzy)
 */
function normalizeForMatching(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Find lesson by ID
 */
export async function findLessonById(lessonId: string): Promise<Lesson | null> {
  try {
    const [lesson] = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);
    
    return lesson || null;
  } catch (error) {
    console.error('Error finding lesson by ID:', error);
    return null;
  }
}

/**
 * Find lesson by track slug and lesson title (fuzzy match)
 */
export async function findLessonBySlug(
  trackSlug: string | undefined, 
  lessonTitle: string | undefined
): Promise<Lesson | null> {
  try {
    if (!lessonTitle) {
      return null;
    }

    const normalizedLessonTitle = normalizeForMatching(lessonTitle);
    
    // First, get the track if trackSlug is provided
    let trackId: string | null = null;
    if (trackSlug) {
      const [track] = await db
        .select({ id: tracks.id })
        .from(tracks)
        .where(eq(tracks.slug, trackSlug))
        .limit(1);
      
      if (track) {
        trackId = track.id;
      } else {
        // Track not found, try to find lesson by title only
        trackId = null;
      }
    }

    // Build query
    let query = db
      .select({
        id: lessons.id,
        trackId: lessons.trackId,
        title: lessons.title,
        order: lessons.order,
        content: lessons.content,
        pdfUrl: lessons.pdfUrl,
        podcastUrl: lessons.podcastUrl,
        createdAt: lessons.createdAt,
        updatedAt: lessons.updatedAt,
      })
      .from(lessons);

    // Add conditions
    const conditions = [];
    
    if (trackId) {
      conditions.push(eq(lessons.trackId, trackId));
    }

    // Try to match lesson title (fuzzy)
    // Check if normalized title contains or is contained in lesson title
    // Use SQLite-compatible syntax
    const titlePattern = `%${normalizedLessonTitle.replace(/\s+/g, '%')}%`;
    conditions.push(
      sql`LOWER(REPLACE(${lessons.title}, '-', ' ')) LIKE LOWER(${titlePattern})`
    );

    if (conditions.length > 0) {
      query = query.where(and(...conditions)!) as any;
    }

    const results = await query.limit(10); // Get multiple potential matches
    
    if (results.length === 0) {
      return null;
    }

    // Find the best match
    // Prefer exact matches or close matches
    const bestMatch = results.find(lesson => {
      const normalizedDbTitle = normalizeForMatching(lesson.title);
      return normalizedDbTitle === normalizedLessonTitle || 
             normalizedDbTitle.includes(normalizedLessonTitle) ||
             normalizedLessonTitle.includes(normalizedDbTitle);
    });

    return bestMatch || results[0] || null;
  } catch (error) {
    console.error('Error finding lesson by slug:', error);
    return null;
  }
}

/**
 * Find lesson by parsed filename information
 */
export async function findLessonByParsedFilename(parsed: ParsedFilename): Promise<Lesson | null> {
  // First, try to find by lesson ID if available
  if (parsed.lessonId) {
    const lesson = await findLessonById(parsed.lessonId);
    if (lesson) {
      return lesson;
    }
  }

  // Then, try to find by track slug and lesson title
  if (parsed.lessonTitle) {
    const lesson = await findLessonBySlug(parsed.trackSlug, parsed.lessonTitle);
    if (lesson) {
      return lesson;
    }
  }

  return null;
}

/**
 * Get all lessons for a track (for UI dropdown)
 */
export async function getLessonsByTrackSlug(trackSlug: string): Promise<Lesson[]> {
  try {
    const [track] = await db
      .select({ id: tracks.id })
      .from(tracks)
      .where(eq(tracks.slug, trackSlug))
      .limit(1);

    if (!track) {
      return [];
    }

    const trackLessons = await db
      .select({
        id: lessons.id,
        trackId: lessons.trackId,
        title: lessons.title,
        order: lessons.order,
        content: lessons.content,
        pdfUrl: lessons.pdfUrl,
        podcastUrl: lessons.podcastUrl,
        createdAt: lessons.createdAt,
        updatedAt: lessons.updatedAt,
      })
      .from(lessons)
      .where(eq(lessons.trackId, track.id))
      .orderBy(lessons.order);

    return trackLessons;
  } catch (error) {
    console.error('Error getting lessons by track slug:', error);
    return [];
  }
}

/**
 * Get all tracks (for UI dropdown)
 */
export async function getAllTracks(): Promise<Track[]> {
  try {
    const allTracks = await db
      .select({
        id: tracks.id,
        title: tracks.title,
        slug: tracks.slug,
        summary: tracks.summary,
        isPublished: tracks.isPublished,
        createdAt: tracks.createdAt,
      })
      .from(tracks)
      .where(eq(tracks.isPublished, true))
      .orderBy(tracks.title);

    return allTracks;
  } catch (error) {
    console.error('Error getting all tracks:', error);
    return [];
  }
}

