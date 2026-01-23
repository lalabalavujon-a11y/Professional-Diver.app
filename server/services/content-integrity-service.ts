import { existsSync } from "fs";
import { join } from "path";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import { LangChainConfig } from "../langchain-config";
import { CORE_TRACK_SLUGS, EXPECTED_LESSON_COUNTS } from "./core-learning-content";
import { generateLessonPodcast } from "./podcast-generator";
import { generateLessonPDF } from "./gamma-api";

type TableSet = {
  tracks: any;
  lessons: any;
  quizzes: any;
  questions: any;
};

type IntegrityIssue = {
  severity: "critical" | "warning";
  type: string;
  message: string;
  trackSlug?: string;
  lessonId?: string;
  details?: Record<string, any>;
};

export type IntegritySummary = {
  ok: boolean;
  blockingIssues: number;
  warningIssues: number;
  issues: IntegrityIssue[];
  stats: {
    tracksChecked: number;
    lessonsChecked: number;
    quizzesChecked: number;
    questionsChecked: number;
    missingLessons: number;
    missingQuizzes: number;
    missingPodcastUrls: number;
    missingPdfUrls: number;
    missingPodcastFiles: number;
    missingPdfFiles: number;
  };
};

type IntegrityOptions = {
  autoRepair?: boolean;
  regenerateMedia?: boolean;
  sendAlerts?: boolean;
  trigger?: "startup" | "scheduled" | "manual";
};

let schemaPromise: Promise<TableSet> | null = null;

async function loadTables(): Promise<TableSet> {
  if (!schemaPromise) {
    const env = process.env.NODE_ENV ?? "development";
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    const usePostgres = env !== "development" && hasDatabaseUrl;
    schemaPromise = (usePostgres
      ? import("@shared/schema")
      : import("@shared/schema-sqlite")) as Promise<any>;
  }
  return schemaPromise;
}

function normalizeUploadPath(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const parsed = new URL(url);
      return parsed.pathname;
    } catch {
      return null;
    }
  }
  return url.startsWith("/") ? url : `/${url}`;
}

function resolveUploadFilePath(url?: string | null): string | null {
  const normalized = normalizeUploadPath(url);
  if (!normalized || !normalized.startsWith("/uploads/")) {
    return null;
  }
  return join(process.cwd(), normalized.replace(/^\/uploads\//, "uploads/"));
}

async function checkRemoteFile(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, { method: "HEAD", signal: controller.signal });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

async function sendIntegrityAlert(summary: IntegritySummary, trigger?: string): Promise<void> {
  const webhookUrl = process.env.CONTENT_ALERT_WEBHOOK_URL;
  if (!webhookUrl) return;

  const payload = {
    timestamp: new Date().toISOString(),
    trigger,
    ok: summary.ok,
    blockingIssues: summary.blockingIssues,
    warningIssues: summary.warningIssues,
    stats: summary.stats,
    issues: summary.issues.slice(0, 20),
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Content integrity alert failed:", error);
  }
}

async function trackIntegrityInLangSmith(summary: IntegritySummary, trigger?: string): Promise<void> {
  const client = LangChainConfig.getInstance().getLangsmithClient();
  if (!client) return;

  const projectName = process.env.LANGSMITH_PROJECT_CONTENT || "content-integrity";
  const issueCounts = summary.issues.reduce<Record<string, number>>((acc, issue) => {
    acc[issue.type] = (acc[issue.type] || 0) + 1;
    return acc;
  }, {});

  try {
    await client.createRun({
      name: "content_integrity_audit",
      runType: "chain",
      projectName,
      inputs: {
        trigger,
        tracksChecked: summary.stats.tracksChecked,
        lessonsChecked: summary.stats.lessonsChecked,
      },
      outputs: {
        ok: summary.ok,
        blockingIssues: summary.blockingIssues,
        warningIssues: summary.warningIssues,
        issueCounts,
      },
      metadata: {
        trigger,
        timestamp: new Date().toISOString(),
        stats: summary.stats,
      },
    });
  } catch (error) {
    console.error("Error tracking content integrity in LangSmith:", error);
  }
}

async function maybeRegeneratePodcast({
  lesson,
  track,
  lessonsTable,
}: {
  lesson: any;
  track: any;
  lessonsTable: any;
}): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const useGPT = process.env.AUTO_PODCAST_USE_GPT !== "false";
  const podcast = await generateLessonPodcast({
    lessonContent: lesson.content,
    lessonTitle: lesson.title,
    trackSlug: track.slug,
    trackTitle: track.title,
    useGPT,
  });

  if (podcast.filePath) {
    const podcastUrl = podcast.filePath.startsWith("/") ? podcast.filePath : `/${podcast.filePath}`;
    await db
      .update(lessonsTable)
      .set({ podcastUrl, podcastDuration: podcast.durationSeconds ?? null })
      .where(eq(lessonsTable.id, lesson.id));
    return podcastUrl;
  }

  return null;
}

async function maybeRegeneratePdf({
  lesson,
  track,
  lessonsTable,
}: {
  lesson: any;
  track: any;
  lessonsTable: any;
}): Promise<string | null> {
  if (!process.env.GAMMA_API_KEY) return null;

  const result = await generateLessonPDF(lesson.content, lesson.title, track.title);
  if (result.pdfUrl) {
    await db
      .update(lessonsTable)
      .set({ pdfUrl: result.pdfUrl })
      .where(eq(lessonsTable.id, lesson.id));
    return result.pdfUrl;
  }
  return null;
}

export async function runContentIntegrityAudit(options: IntegrityOptions = {}): Promise<IntegritySummary> {
  const { autoRepair = false, regenerateMedia = false, sendAlerts = false, trigger } = options;

  if (autoRepair) {
    const { ensureCoreLearningContent } = await import("./core-learning-content");
    await ensureCoreLearningContent({ enforceCounts: true });
  }

  const { tracks, lessons, quizzes, questions } = await loadTables();

  const issues: IntegrityIssue[] = [];
  const expectedSlugs = [...CORE_TRACK_SLUGS, "client-representative"];

  const trackRows = await db
    .select({
      id: tracks.id,
      slug: tracks.slug,
      title: tracks.title,
    })
    .from(tracks)
    .where(inArray(tracks.slug, expectedSlugs));

  const trackBySlug = new Map(trackRows.map((track) => [track.slug, track]));
  let lessonsChecked = 0;
  let quizzesChecked = 0;
  let questionsChecked = 0;
  let missingLessons = 0;
  let missingQuizzes = 0;
  let missingPodcastUrls = 0;
  let missingPdfUrls = 0;
  let missingPodcastFiles = 0;
  let missingPdfFiles = 0;

  const quizzesByLesson = await db
    .select({ id: quizzes.id, lessonId: quizzes.lessonId })
    .from(quizzes);
  const quizQuestionsCounts = await db
    .select({
      quizId: questions.quizId,
      count: sql<number>`count(*)`,
    })
    .from(questions)
    .groupBy(questions.quizId);
  const questionCountByQuiz = new Map(
    quizQuestionsCounts.map((row) => [row.quizId, row.count]),
  );
  const quizByLesson = new Map(quizzesByLesson.map((quiz) => [quiz.lessonId, quiz]));

  for (const slug of expectedSlugs) {
    const track = trackBySlug.get(slug);
    if (!track) {
      issues.push({
        severity: "critical",
        type: "missing_track",
        message: `Track missing: ${slug}`,
        trackSlug: slug,
      });
      continue;
    }

    const trackLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.trackId, track.id))
      .orderBy(lessons.order);

    lessonsChecked += trackLessons.length;
    const expectedLessonCount = EXPECTED_LESSON_COUNTS[slug] ?? 0;
    if (trackLessons.length !== expectedLessonCount) {
      missingLessons += Math.abs(trackLessons.length - expectedLessonCount);
      issues.push({
        severity: "critical",
        type: "lesson_count_mismatch",
        message: `Track ${slug} has ${trackLessons.length} lessons (expected ${expectedLessonCount}).`,
        trackSlug: slug,
      });
    }

    for (const lesson of trackLessons) {
      if (!lesson.content || lesson.content.trim().length === 0) {
        issues.push({
          severity: "critical",
          type: "missing_lesson_content",
          message: `Lesson ${lesson.title} has no content.`,
          trackSlug: slug,
          lessonId: lesson.id,
        });
      }

      const quiz = quizByLesson.get(lesson.id);
      if (!quiz) {
        missingQuizzes += 1;
        issues.push({
          severity: "critical",
          type: "missing_quiz",
          message: `Lesson ${lesson.title} has no quiz.`,
          trackSlug: slug,
          lessonId: lesson.id,
        });
      } else {
        quizzesChecked += 1;
        const questionCount = questionCountByQuiz.get(quiz.id) || 0;
        questionsChecked += questionCount;
        if (questionCount < 5) {
          issues.push({
            severity: "warning",
            type: "quiz_question_shortage",
            message: `Lesson ${lesson.title} quiz has ${questionCount} questions (expected 5).`,
            trackSlug: slug,
            lessonId: lesson.id,
          });
        }
      }

      if (!lesson.podcastUrl) {
        missingPodcastUrls += 1;
        issues.push({
          severity: "warning",
          type: "missing_podcast_url",
          message: `Lesson ${lesson.title} missing podcast URL.`,
          trackSlug: slug,
          lessonId: lesson.id,
        });
      }

      if (!lesson.pdfUrl) {
        missingPdfUrls += 1;
        issues.push({
          severity: "warning",
          type: "missing_pdf_url",
          message: `Lesson ${lesson.title} missing PDF URL.`,
          trackSlug: slug,
          lessonId: lesson.id,
        });
      }

      const podcastUrl = lesson.podcastUrl;
      const podcastPath = resolveUploadFilePath(podcastUrl);
      if (podcastPath) {
        const exists = existsSync(podcastPath);
        if (!exists) {
          missingPodcastFiles += 1;
          if (regenerateMedia) {
            const regenerated = await maybeRegeneratePodcast({ lesson, track, lessonsTable: lessons });
            if (!regenerated) {
              issues.push({
                severity: "warning",
                type: "missing_podcast_file",
                message: `Podcast file missing for lesson ${lesson.title}.`,
                trackSlug: slug,
                lessonId: lesson.id,
              });
            }
          } else {
            issues.push({
              severity: "warning",
              type: "missing_podcast_file",
              message: `Podcast file missing for lesson ${lesson.title}.`,
              trackSlug: slug,
              lessonId: lesson.id,
            });
          }
        }
      } else if (podcastUrl && podcastUrl.startsWith("http")) {
        const exists = await checkRemoteFile(podcastUrl);
        if (!exists) {
          missingPodcastFiles += 1;
          issues.push({
            severity: "warning",
            type: "missing_podcast_file",
            message: `Remote podcast missing for lesson ${lesson.title}.`,
            trackSlug: slug,
            lessonId: lesson.id,
          });
        }
      }

      const pdfUrl = lesson.pdfUrl;
      const pdfPath = resolveUploadFilePath(pdfUrl);
      if (pdfPath) {
        const exists = existsSync(pdfPath);
        if (!exists) {
          missingPdfFiles += 1;
          if (regenerateMedia) {
            const regenerated = await maybeRegeneratePdf({ lesson, track, lessonsTable: lessons });
            if (!regenerated) {
              issues.push({
                severity: "warning",
                type: "missing_pdf_file",
                message: `PDF file missing for lesson ${lesson.title}.`,
                trackSlug: slug,
                lessonId: lesson.id,
              });
            }
          } else {
            issues.push({
              severity: "warning",
              type: "missing_pdf_file",
              message: `PDF file missing for lesson ${lesson.title}.`,
              trackSlug: slug,
              lessonId: lesson.id,
            });
          }
        }
      } else if (pdfUrl && pdfUrl.startsWith("http")) {
        const exists = await checkRemoteFile(pdfUrl);
        if (!exists) {
          missingPdfFiles += 1;
          issues.push({
            severity: "warning",
            type: "missing_pdf_file",
            message: `Remote PDF missing for lesson ${lesson.title}.`,
            trackSlug: slug,
            lessonId: lesson.id,
          });
        }
      }
    }
  }

  const blockingIssues = issues.filter((issue) => issue.severity === "critical").length;
  const warningIssues = issues.filter((issue) => issue.severity === "warning").length;
  const summary: IntegritySummary = {
    ok: blockingIssues === 0,
    blockingIssues,
    warningIssues,
    issues,
    stats: {
      tracksChecked: trackRows.length,
      lessonsChecked,
      quizzesChecked,
      questionsChecked,
      missingLessons,
      missingQuizzes,
      missingPodcastUrls,
      missingPdfUrls,
      missingPodcastFiles,
      missingPdfFiles,
    },
  };

  if (sendAlerts && (blockingIssues > 0 || warningIssues > 0)) {
    await sendIntegrityAlert(summary, trigger);
  }
  await trackIntegrityInLangSmith(summary, trigger);

  return summary;
}

export function startContentIntegrityScheduler(): void {
  const env = process.env.NODE_ENV ?? "development";
  if (env === "test") return;

  const intervalHours = Number(process.env.CONTENT_INTEGRITY_INTERVAL_HOURS || 24);
  const intervalMs = Math.max(1, intervalHours) * 60 * 60 * 1000;

  console.log(`🛡️ Content integrity scheduler started (${intervalHours}h interval)`);
  void runContentIntegrityAudit({
    autoRepair: true,
    regenerateMedia: true,
    sendAlerts: true,
    trigger: "scheduled",
  }).catch((error) => {
    console.error("Content integrity initial audit failed:", error);
  });

  setInterval(async () => {
    try {
      await runContentIntegrityAudit({
        autoRepair: true,
        regenerateMedia: true,
        sendAlerts: true,
        trigger: "scheduled",
      });
    } catch (error) {
      console.error("Content integrity scheduled audit failed:", error);
    }
  }, intervalMs);
}
