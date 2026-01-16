import type { Request, Response } from 'express';
import { db } from '../db';
import { lessons, tracks } from '@shared/schema';
import ContentGeneratorService from '../services/content-generator';
import { validateLesson } from '../services/content-validator';
import { generateLessonPDF } from '../services/gamma-api';
import { generateLessonPodcast } from '../services/podcast-generator';
import { eq } from 'drizzle-orm';

const generator = new ContentGeneratorService();

function ensureAdmin(req: Request): void {
  // TODO: replace with real admin auth middleware
  const isAdmin = (req as any).user?.role === 'ADMIN' || (req as any).user?.role === 'SUPER_ADMIN';
  if (!isAdmin) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }
}

export async function generateAllContent(req: Request, res: Response) {
  try {
    ensureAdmin(req);
    // This endpoint defers to scripts for full generation; here we return instructions.
    return res.json({
      message:
        'Use scripts/generate-all-lessons.ts to generate all content. This endpoint is a placeholder for future background job orchestration.',
    });
  } catch (error) {
    handleError(res, error);
  }
}

export async function generateTrackContent(req: Request, res: Response) {
  try {
    ensureAdmin(req);
    const { trackSlug } = req.params;
    const trackRow = await db.select().from(tracks).where(eq(tracks.slug, trackSlug)).limit(1);
    if (!trackRow.length) {
      return res.status(404).json({ error: 'Track not found' });
    }

    // Real generation is run via script; respond with guidance.
    return res.json({
      message: `Track ${trackSlug} is ready for generation. Run scripts/generate-all-lessons.ts or add background job integration here.`,
    });
  } catch (error) {
    handleError(res, error);
  }
}

export async function generatePdf(req: Request, res: Response) {
  try {
    ensureAdmin(req);
    const { lessonId } = req.params;
    const lesson = await getLesson(lessonId);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    const track = await getTrack(lesson.trackId);
    if (!track) return res.status(404).json({ error: 'Track not found' });

    const result = await generateLessonPDF(lesson.content, lesson.title, track.title);
    if (!result.pdfUrl) {
      return res.status(500).json({ error: 'PDF generation did not return a URL' });
    }

    await db.update(lessons).set({ pdfUrl: result.pdfUrl }).where(eq(lessons.id, lesson.id));

    return res.json({ pdfUrl: result.pdfUrl });
  } catch (error) {
    handleError(res, error);
  }
}

export async function generatePodcast(req: Request, res: Response) {
  try {
    ensureAdmin(req);
    const { lessonId } = req.params;
    const lesson = await getLesson(lessonId);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    const track = await getTrack(lesson.trackId);
    if (!track) return res.status(404).json({ error: 'Track not found' });

    const result = await generateLessonPodcast({
      lessonContent: lesson.content,
      lessonTitle: lesson.title,
      trackSlug: track.slug,
      voice: 'alloy',
    });

    await db
      .update(lessons)
      .set({
        podcastUrl: result.filePath,
      })
      .where(eq(lessons.id, lesson.id));

    return res.json({ podcastUrl: result.filePath });
  } catch (error) {
    handleError(res, error);
  }
}

export async function validateLessonContent(req: Request, res: Response) {
  try {
    ensureAdmin(req);
    const { lessonId } = req.params;
    const lesson = await getLesson(lessonId);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    const report = validateLesson({
      content: lesson.content,
      objectives: safeParseJson<string[]>(lesson.objectives) ?? [],
      estimatedMinutes: lesson.estimatedMinutes ?? 45,
      quiz: {
        title: lesson.title,
        timeLimit: 30,
        examType: 'QUIZ',
        passingScore: 80,
        questions: [], // quiz questions not loaded here
      },
    });

    return res.json(report);
  } catch (error) {
    handleError(res, error);
  }
}

export async function getReviewQueue(_req: Request, res: Response) {
  // Placeholder: in a fuller implementation this would query a table of failed validations.
  return res.json({ items: [] });
}

async function getLesson(id: string) {
  const rows = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
  return rows[0];
}

async function getTrack(id: string) {
  const rows = await db.select().from(tracks).where(eq(tracks.id, id)).limit(1);
  return rows[0];
}

function safeParseJson<T>(value: unknown): T | null {
  if (typeof value !== 'string') return (value as T) ?? null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function handleError(res: Response, error: any) {
  const status = error?.status || 500;
  const message = error instanceof Error ? error.message : 'Unexpected error';
  if (status >= 500) {
    console.error('Content API error:', error);
  }
  res.status(status).json({ error: message });
}
