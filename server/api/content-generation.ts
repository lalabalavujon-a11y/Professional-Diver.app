import type { Request, Response } from 'express';
import { db } from '../db';
import { lessons, tracks } from '@shared/schema';
import ContentGeneratorService from '../services/content-generator';
import { validateLesson } from '../services/content-validator';
import { generateLessonPDF } from '../services/gamma-api';
import { generateLessonPodcast } from '../services/podcast-generator';
import { eq, desc } from 'drizzle-orm';

const generator = new ContentGeneratorService();

// Helper functions for generation history logging
async function logGenerationStart(
  lessonId: string,
  trackId: string,
  contentType: 'pdf' | 'podcast',
  sourceType: 'lesson_content' | 'pdf_content' | 'gamma_template',
  userId: string | null,
  sourceUrl?: string
): Promise<string> {
  const logId = nanoid();
  await db.insert(contentGenerationLogs).values({
    id: logId,
    lessonId,
    trackId,
    contentType,
    status: 'pending',
    sourceType,
    sourceUrl: sourceUrl || null,
    startedAt: new Date(),
    userId: userId || null,
  });
  return logId;
}

async function logGenerationProgress(
  logId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  progress?: string
) {
  await db
    .update(contentGenerationLogs)
    .set({
      status,
    })
    .where(eq(contentGenerationLogs.id, logId));
}

async function logGenerationComplete(
  logId: string,
  generatedUrl: string,
  metadata?: {
    durationSeconds?: number;
    fileSizeBytes?: number;
    wordCount?: number;
    pageCount?: number;
  }
) {
  await db
    .update(contentGenerationLogs)
    .set({
      status: 'completed',
      generatedUrl,
      completedAt: new Date(),
      durationSeconds: metadata?.durationSeconds || null,
      fileSizeBytes: metadata?.fileSizeBytes || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    })
    .where(eq(contentGenerationLogs.id, logId));
}

async function logGenerationError(logId: string, errorMessage: string) {
  await db
    .update(contentGenerationLogs)
    .set({
      status: 'failed',
      errorMessage,
      completedAt: new Date(),
    })
    .where(eq(contentGenerationLogs.id, logId));
}

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
  let logId: string | null = null;
  const generationId = nanoid();
  const userId = (req as any).user?.id || null;

  try {
    ensureAdmin(req);
    const { lessonId } = req.params;
    const lesson = await getLesson(lessonId);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    const track = await getTrack(lesson.trackId);
    if (!track) return res.status(404).json({ error: 'Track not found' });

    // CRITICAL: Podcasts must be generated from PDF content (not lesson content)
    // PDF is derived from lesson content, and podcast is derived from PDF
    if (!lesson.pdfUrl) {
      return res.status(400).json({ 
        error: 'PDF is required to generate podcast. PDFs are derived from lesson content. Please generate the PDF first.',
        hint: 'Generate PDF first, then generate podcast from PDF content'
      });
    }

    // Log generation start
    logId = await logGenerationStart(
      lesson.id,
      lesson.trackId,
      'podcast',
      'pdf_content',
      userId,
      lesson.pdfUrl
    );

    // Emit WebSocket progress
    emitGenerationProgress({
      generationId,
      type: 'podcast',
      status: 'initializing',
      progress: 'Initializing podcast generation from PDF...',
      lessonId: lesson.id,
    });

    await logGenerationProgress(logId, 'processing');

    // Import PDF text extractor and podcast generator
    const { extractTextFromPdf } = await import('../services/pdf-text-extractor.js');
    const { generatePodcastFromPdf } = await import('../services/podcast-generator.js');

    emitGenerationProgress({
      generationId,
      type: 'podcast',
      status: 'extracting',
      progress: 'Extracting text from PDF...',
      lessonId: lesson.id,
    });

    console.log(`📄 Generating podcast from PDF: ${lesson.pdfUrl}`);
    
    emitGenerationProgress({
      generationId,
      type: 'podcast',
      status: 'generating',
      progress: 'Generating podcast script and audio...',
      lessonId: lesson.id,
    });

    const result = await generatePodcastFromPdf({
      pdfUrl: lesson.pdfUrl,
      lessonTitle: lesson.title,
      trackSlug: track.slug,
      trackTitle: track.title,
      voice: 'alloy',
    });

    // Get file size if possible
    let fileSizeBytes: number | undefined;
    try {
      const fs = await import('fs/promises');
      const stats = await fs.stat(result.filePath);
      fileSizeBytes = stats.size;
    } catch (err) {
      // Ignore file size errors
    }

    await db
      .update(lessons)
      .set({
        podcastUrl: result.filePath,
        podcastDuration: result.durationSeconds,
      })
      .where(eq(lessons.id, lesson.id));

    // Log completion
    if (logId) {
      await logGenerationComplete(logId, result.filePath, {
        durationSeconds: result.durationSeconds,
        fileSizeBytes,
      });
    }

    // Emit completion
    emitGenerationComplete({
      generationId,
      type: 'podcast',
      status: 'complete',
      progress: 'Podcast generated successfully',
      lessonId: lesson.id,
      metadata: {
        podcastUrl: result.filePath,
        durationSeconds: result.durationSeconds,
        fileSizeBytes,
      },
    });

    return res.json({ 
      podcastUrl: result.filePath,
      durationSeconds: result.durationSeconds,
      generationId,
      message: 'Podcast generated from PDF content successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (logId) {
      await logGenerationError(logId, errorMessage);
    }
    emitGenerationError({
      generationId,
      type: 'podcast',
      status: 'error',
      progress: errorMessage,
      lessonId: req.params.lessonId,
      error: errorMessage,
    });
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

export async function getGenerationHistory(req: Request, res: Response) {
  try {
    ensureAdmin(req);
    const { lessonId } = req.params;
    
    if (!lessonId) {
      return res.status(400).json({ error: 'Lesson ID is required' });
    }

    const history = await db
      .select()
      .from(contentGenerationLogs)
      .where(eq(contentGenerationLogs.lessonId, lessonId))
      .orderBy(desc(contentGenerationLogs.startedAt))
      .limit(20); // Last 20 generations

    return res.json({ history });
  } catch (error) {
    handleError(res, error);
  }
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

export async function batchGeneratePdfs(req: Request, res: Response) {
  try {
    ensureAdmin(req);
    const { lessonIds } = req.body;

    if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
      return res.status(400).json({ error: 'lessonIds must be a non-empty array' });
    }

    const jobId = nanoid();
    const userId = (req as any).user?.id || null;
    const results: Array<{ lessonId: string; status: 'completed' | 'failed'; pdfUrl?: string; error?: string }> = [];
    let completed = 0;
    let failed = 0;

    // Process in batches of 3 (rate limiting for Gamma API)
    const batchSize = 3;
    const batches: string[][] = [];
    for (let i = 0; i < lessonIds.length; i += batchSize) {
      batches.push(lessonIds.slice(i, i + batchSize));
    }

    // Emit initial progress
    emitGenerationProgress({
      generationId: jobId,
      type: 'pdf',
      status: 'initializing',
      progress: `Queued ${lessonIds.length} lessons for PDF generation`,
    });

    // Process batches sequentially
    for (const batch of batches) {
      const batchPromises = batch.map(async (lessonId) => {
        try {
          const lesson = await getLesson(lessonId);
          if (!lesson) {
            throw new Error('Lesson not found');
          }

          const track = await getTrack(lesson.trackId);
          if (!track) {
            throw new Error('Track not found');
          }

          // Log generation start
          const logId = await logGenerationStart(
            lesson.id,
            lesson.trackId,
            'pdf',
            'gamma_template',
            userId
          );

          emitGenerationProgress({
            generationId: jobId,
            type: 'pdf',
            status: 'generating',
            progress: `Generating PDF for lesson: ${lesson.title} (${completed + failed + 1}/${lessonIds.length})`,
            lessonId: lesson.id,
          });

          await logGenerationProgress(logId, 'processing');

          const result = await generateLessonPDF(lesson.content, lesson.title, track.title);
          
          if (!result.pdfUrl) {
            throw new Error('PDF generation did not return a URL');
          }

          // Get file size if possible
          let fileSizeBytes: number | undefined;
          try {
            if (result.pdfUrl.startsWith('http')) {
              const response = await fetch(result.pdfUrl, { method: 'HEAD' });
              const contentLength = response.headers.get('content-length');
              if (contentLength) {
                fileSizeBytes = parseInt(contentLength, 10);
              }
            }
          } catch (err) {
            // Ignore file size fetch errors
          }

          await db.update(lessons).set({ pdfUrl: result.pdfUrl }).where(eq(lessons.id, lesson.id));

          await logGenerationComplete(logId, result.pdfUrl, {
            fileSizeBytes,
          });

          results.push({
            lessonId,
            status: 'completed',
            pdfUrl: result.pdfUrl,
          });
          completed++;

          emitGenerationProgress({
            generationId: jobId,
            type: 'pdf',
            status: 'complete',
            progress: `Completed ${completed}/${lessonIds.length} PDFs`,
            lessonId: lesson.id,
            metadata: {
              pdfUrl: result.pdfUrl,
              fileSizeBytes,
            },
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results.push({
            lessonId,
            status: 'failed',
            error: errorMessage,
          });
          failed++;

          emitGenerationProgress({
            generationId: jobId,
            type: 'pdf',
            status: 'error',
            progress: `Failed ${failed}/${lessonIds.length} PDFs`,
            lessonId,
            error: errorMessage,
          });
        }
      });

      // Wait for batch to complete before processing next batch
      await Promise.all(batchPromises);
    }

    emitGenerationComplete({
      generationId: jobId,
      type: 'pdf',
      status: 'complete',
      progress: `Batch complete: ${completed} succeeded, ${failed} failed`,
    });

    return res.json({
      jobId,
      total: lessonIds.length,
      completed,
      failed,
      results,
    });
  } catch (error) {
    handleError(res, error);
  }
}

export async function regenerateTrackPdfs(req: Request, res: Response) {
  try {
    ensureAdmin(req);
    const { trackSlug } = req.params;
    const trackRows = await db.select().from(tracks).where(eq(tracks.slug, trackSlug)).limit(1);
    
    if (!trackRows.length) {
      return res.status(404).json({ error: 'Track not found' });
    }
    
    const track = trackRows[0];

    // Get all lessons for this track
    const trackLessons = await db.select().from(lessons).where(eq(lessons.trackId, track.id));
    const lessonIds = trackLessons.map(lesson => lesson.id);

    if (lessonIds.length === 0) {
      return res.status(400).json({ error: 'Track has no lessons' });
    }

    // Use batch generation endpoint logic
    const jobId = nanoid();
    const userId = (req as any).user?.id || null;
    const results: Array<{ lessonId: string; status: 'completed' | 'failed'; pdfUrl?: string; error?: string }> = [];
    let completed = 0;
    let failed = 0;

    const batchSize = 3;
    const batches: string[][] = [];
    for (let i = 0; i < lessonIds.length; i += batchSize) {
      batches.push(lessonIds.slice(i, i + batchSize));
    }

    emitGenerationProgress({
      generationId: jobId,
      type: 'pdf',
      status: 'initializing',
      progress: `Queued ${lessonIds.length} lessons for PDF regeneration`,
    });

    for (const batch of batches) {
      const batchPromises = batch.map(async (lessonId) => {
        try {
          const lesson = await getLesson(lessonId);
          if (!lesson) {
            throw new Error('Lesson not found');
          }

          const logId = await logGenerationStart(
            lesson.id,
            lesson.trackId,
            'pdf',
            'gamma_template',
            userId
          );

          emitGenerationProgress({
            generationId: jobId,
            type: 'pdf',
            status: 'generating',
            progress: `Regenerating PDF for lesson: ${lesson.title} (${completed + failed + 1}/${lessonIds.length})`,
            lessonId: lesson.id,
          });

          await logGenerationProgress(logId, 'processing');

          const result = await generateLessonPDF(lesson.content, lesson.title, track.title);
          
          if (!result.pdfUrl) {
            throw new Error('PDF generation did not return a URL');
          }

          let fileSizeBytes: number | undefined;
          try {
            if (result.pdfUrl.startsWith('http')) {
              const response = await fetch(result.pdfUrl, { method: 'HEAD' });
              const contentLength = response.headers.get('content-length');
              if (contentLength) {
                fileSizeBytes = parseInt(contentLength, 10);
              }
            }
          } catch (err) {
            // Ignore
          }

          await db.update(lessons).set({ pdfUrl: result.pdfUrl }).where(eq(lessons.id, lesson.id));

          await logGenerationComplete(logId, result.pdfUrl, {
            fileSizeBytes,
          });

          results.push({
            lessonId,
            status: 'completed',
            pdfUrl: result.pdfUrl,
          });
          completed++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results.push({
            lessonId,
            status: 'failed',
            error: errorMessage,
          });
          failed++;
        }
      });

      await Promise.all(batchPromises);
    }

    emitGenerationComplete({
      generationId: jobId,
      type: 'pdf',
      status: 'complete',
      progress: `Track regeneration complete: ${completed} succeeded, ${failed} failed`,
    });

    return res.json({
      jobId,
      trackSlug,
      lessonCount: lessonIds.length,
      queued: lessonIds.length,
      completed,
      failed,
      results,
    });
  } catch (error) {
    handleError(res, error);
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
