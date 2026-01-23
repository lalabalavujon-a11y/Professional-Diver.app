import { readFileSync } from "fs";
import { join } from "path";
import { eq } from "drizzle-orm";
import { db } from "../db";

type TableSet = {
  tracks: any;
  lessons: any;
  quizzes: any;
  questions: any;
};

type BackupLesson = {
  id?: string;
  title: string;
  order?: number;
  content: string;
  estimatedMinutes?: number;
  isRequired?: boolean;
  podcastUrl?: string | null;
  pdfUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type BackupTrack = {
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
};

type BackupPayload = {
  tracks?: BackupTrack[];
};

const BACKUP_PATH = join(process.cwd(), "backups", "tracks-lessons-backup-2025-12-30.json");

const CORE_TRACK_SLUGS = [
  "ndt-inspection",
  "diver-medic",
  "commercial-supervisor",
  "saturation-diving",
  "underwater-welding",
  "hyperbaric-operations",
  "alst",
  "lst",
  "air-diver-certification",
];

const EXPECTED_LESSON_COUNTS: Record<string, number> = {
  "ndt-inspection": 12,
  "diver-medic": 12,
  "commercial-supervisor": 12,
  "saturation-diving": 12,
  "underwater-welding": 12,
  "hyperbaric-operations": 12,
  "alst": 12,
  "lst": 12,
  "air-diver-certification": 12,
  "client-representative": 6,
};

const DEFAULT_DISTRACTORS = [
  "Improve operational safety and hazard awareness",
  "Apply standard procedures and documentation practices",
  "Select appropriate equipment and verify readiness",
  "Communicate effectively with the dive team",
  "Identify risks and implement control measures",
  "Follow emergency response protocols and reporting",
];

function slugify(value: string): string {
  if (!value || typeof value !== "string") return "lesson";
  let sanitized = value.toLowerCase().trim();
  sanitized = sanitized.replace(/[\s_]+/g, "-");
  sanitized = sanitized.replace(/[^a-z0-9-]/g, "");
  sanitized = sanitized.replace(/-+/g, "-");
  sanitized = sanitized.replace(/^-+|-+$/g, "");
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100).replace(/-+$/, "");
  }
  return sanitized || "lesson";
}

function buildPodcastUrl(trackSlug: string, lessonTitle: string): string {
  return `/uploads/podcasts/${trackSlug}-${slugify(lessonTitle)}.mp3`;
}

function buildPdfUrl(lessonTitle: string): string {
  return `/uploads/diver-well-training/${slugify(lessonTitle)}.pdf`;
}

function extractObjectives(content: string): string[] {
  if (!content) return [];
  const lines = content.split("\n");
  const startIndex = lines.findIndex((line) => line.toLowerCase().includes("learning objectives"));
  if (startIndex === -1) return [];

  const objectives: string[] = [];
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.startsWith("##")) break;
    const bulletMatch = line.match(/^[-*]\s+(.*)$/);
    const orderedMatch = line.match(/^\d+\.\s+(.*)$/);
    const text = bulletMatch?.[1] ?? orderedMatch?.[1];
    if (text) {
      objectives.push(text.trim().replace(/\.$/, ""));
    }
  }
  return Array.from(new Set(objectives));
}

function buildQuizTopics(lessonTitle: string, objectives: string[]): string[] {
  const fallback = [
    `Apply the core procedures covered in ${lessonTitle}`,
    `Identify key safety considerations for ${lessonTitle}`,
    `Explain the purpose of ${lessonTitle} in operations`,
    `Select appropriate equipment or methods for ${lessonTitle}`,
    `Document and communicate outcomes from ${lessonTitle}`,
  ];
  const combined = [...objectives, ...fallback];
  const unique = Array.from(new Set(combined.map((item) => item.trim()).filter(Boolean)));
  return unique.slice(0, 5);
}

function buildQuizQuestions(lessonTitle: string, objectives: string[]) {
  const topics = buildQuizTopics(lessonTitle, objectives);
  return topics.map((topic, index) => {
    const distractors = objectives.filter((item) => item !== topic);
    const optionsPool = [...distractors, ...DEFAULT_DISTRACTORS].filter((item) => item !== topic);
    const options = [topic, ...optionsPool.slice(0, 3)];

    return {
      prompt: `Which of the following is a key objective for "${lessonTitle}"?`,
      options,
      correctAnswer: "a",
      order: index + 1,
    };
  });
}

async function loadTables(): Promise<{ tables: TableSet; usePostgres: boolean }> {
  const env = process.env.NODE_ENV ?? "development";
  const hasDatabaseUrl = !!process.env.DATABASE_URL;
  const usePostgres = env !== "development" && hasDatabaseUrl;

  if (usePostgres) {
    const schema = await import("../../shared/schema.js");
    return {
      usePostgres,
      tables: {
        tracks: schema.tracks,
        lessons: schema.lessons,
        quizzes: schema.quizzes,
        questions: schema.questions,
      },
    };
  }

  const schema = await import("../../shared/schema-sqlite.js");
  return {
    usePostgres,
    tables: {
      tracks: schema.tracks,
      lessons: schema.lessons,
      quizzes: schema.quizzes,
      questions: schema.questions,
    },
  };
}

async function upsertQuizForLesson({
  tables,
  usePostgres,
  lessonId,
  lessonTitle,
  lessonContent,
}: {
  tables: TableSet;
  usePostgres: boolean;
  lessonId: string;
  lessonTitle: string;
  lessonContent: string;
}) {
  const { quizzes, questions } = tables;
  const [existingQuiz] = await db.select().from(quizzes).where(eq(quizzes.lessonId, lessonId));

  if (existingQuiz) {
    await db.delete(questions).where(eq(questions.quizId, existingQuiz.id));
    await db.delete(quizzes).where(eq(quizzes.id, existingQuiz.id));
  }

  const [quiz] = await db.insert(quizzes).values(
    usePostgres
      ? {
          lessonId,
          title: `${lessonTitle} Quiz`,
          timeLimit: 10,
          examType: "QUIZ",
          passingScore: 70,
          maxAttempts: 3,
          showFeedback: true,
        }
      : {
          lessonId,
          title: `${lessonTitle} Quiz`,
          timeLimit: 10,
          examType: "QUIZ",
          passingScore: 70,
        },
  ).returning();

  const objectives = extractObjectives(lessonContent);
  const quizQuestions = buildQuizQuestions(lessonTitle, objectives);

  for (const question of quizQuestions) {
    await db.insert(questions).values(
      usePostgres
        ? {
            quizId: quiz.id,
            type: "MULTIPLE_CHOICE",
            prompt: question.prompt,
            options: question.options,
            correctAnswer: question.correctAnswer,
            explanation: "Refer to the lesson objectives for guidance.",
            points: 1,
            order: question.order,
          }
        : {
            quizId: quiz.id,
            prompt: question.prompt,
            options: JSON.stringify(question.options),
            correctAnswer: question.correctAnswer,
            order: question.order,
          },
    );
  }
}

async function restoreTrackLessons({
  tables,
  usePostgres,
  track,
  lessonsData,
}: {
  tables: TableSet;
  usePostgres: boolean;
  track: { id: string; slug: string; title: string };
  lessonsData: BackupLesson[];
}) {
  const { lessons } = tables;
  await db.delete(lessons).where(eq(lessons.trackId, track.id));

  for (const lesson of lessonsData) {
    const podcastUrl = lesson.podcastUrl ?? buildPodcastUrl(track.slug, lesson.title);
    const pdfUrl = lesson.pdfUrl ?? buildPdfUrl(lesson.title);
    await db.insert(lessons).values(
      usePostgres
        ? {
            id: lesson.id,
            trackId: track.id,
            title: lesson.title,
            order: lesson.order ?? 0,
            content: lesson.content,
            objectives: [],
            estimatedMinutes: lesson.estimatedMinutes ?? 60,
            isRequired: lesson.isRequired ?? true,
            podcastUrl,
            pdfUrl,
          }
        : {
            id: lesson.id,
            trackId: track.id,
            title: lesson.title,
            order: lesson.order ?? 0,
            content: lesson.content,
            objectives: "[]",
            estimatedMinutes: lesson.estimatedMinutes ?? 60,
            isRequired: lesson.isRequired ?? true,
            podcastUrl,
            pdfUrl,
            createdAt: lesson.createdAt ? new Date(lesson.createdAt) : undefined,
            updatedAt: lesson.updatedAt ? new Date(lesson.updatedAt) : undefined,
          },
    );
  }
}

async function ensureLessonMedia({
  tables,
  lesson,
  trackSlug,
}: {
  tables: TableSet;
  lesson: any;
  trackSlug: string;
}) {
  const { lessons } = tables;
  const updates: Record<string, any> = {};
  if (!lesson.podcastUrl) {
    updates.podcastUrl = buildPodcastUrl(trackSlug, lesson.title);
  }
  if (!lesson.pdfUrl) {
    updates.pdfUrl = buildPdfUrl(lesson.title);
  }
  if (Object.keys(updates).length > 0) {
    await db.update(lessons).set(updates).where(eq(lessons.id, lesson.id));
  }
}

async function buildClientRepLessons(): Promise<BackupLesson[]> {
  const { clientRepModules } = await import("../../scripts/client-rep-content-data.js");
  return clientRepModules.slice(0, 6).map((module: any, index: number) => {
    const outcomes = module.learningOutcomes ?? [];
    const lessonContent = `# ${module.title}\n\n${module.description}\n\n## Learning Outcomes\n\n${outcomes
      .map((outcome: string, i: number) => `${i + 1}. ${outcome}`)
      .join("\n")}\n\n## Course Content\n\n${module.content}`;
    return {
      title: module.title,
      order: index + 1,
      content: lessonContent,
      estimatedMinutes: 60,
      isRequired: true,
    };
  });
}

function normalizePublished(value?: boolean | number | null): boolean {
  if (value === false || value === 0) return false;
  return true;
}

export async function ensureCoreLearningContent({
  enforceCounts = true,
} = {}): Promise<{ restoredTracks: string[]; quizCount: number }> {
  const { tables, usePostgres } = await loadTables();
  const { tracks, lessons } = tables;

  const payload = JSON.parse(readFileSync(BACKUP_PATH, "utf-8")) as BackupPayload;
  const backupTracks = payload.tracks ?? [];
  const backupBySlug = new Map(backupTracks.map((track) => [track.slug, track]));

  const restoredTracks: string[] = [];
  let quizCount = 0;

  for (const slug of [...CORE_TRACK_SLUGS, "client-representative"]) {
    const backupTrack = backupBySlug.get(slug);
    const expectedLessonCount = EXPECTED_LESSON_COUNTS[slug] ?? 0;

    let trackRow = await db
      .select()
      .from(tracks)
      .where(eq(tracks.slug, slug))
      .limit(1);

    let track = trackRow[0];

    if (!track) {
      const insertValues = backupTrack
        ? {
            id: backupTrack.id,
            title: backupTrack.title,
            slug: backupTrack.slug,
            summary: backupTrack.summary ?? undefined,
            difficulty: backupTrack.difficulty ?? "beginner",
            estimatedHours: backupTrack.estimatedHours ?? 0,
            isPublished: normalizePublished(backupTrack.isPublished),
            createdAt: backupTrack.createdAt ? new Date(backupTrack.createdAt) : undefined,
          }
        : {
            title: "Client Representative",
            slug,
            summary:
              "Comprehensive brand-neutral training for Client Representatives covering offshore project assurance, regulatory compliance, and operational oversight.",
            difficulty: "intermediate",
            estimatedHours: 0,
            isPublished: true,
          };

      const [inserted] = await db.insert(tracks).values(
        usePostgres
          ? {
              title: insertValues.title,
              slug: insertValues.slug,
              summary: insertValues.summary,
              difficulty: insertValues.difficulty,
              estimatedHours: insertValues.estimatedHours,
              isPublished: insertValues.isPublished,
            }
          : insertValues,
      ).returning();
      track = inserted;
    } else {
      const isPublished = track.isPublished === true || track.isPublished === 1;
      if (!isPublished) {
        await db
          .update(tracks)
          .set({ isPublished: usePostgres ? true : 1 })
          .where(eq(tracks.id, track.id));
      }
    }

    const existingLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.trackId, track.id))
      .orderBy(lessons.order);

    const hasEmptyContent = existingLessons.some((lesson: any) => !lesson.content || lesson.content.trim().length === 0);
    const needsRestore =
      enforceCounts &&
      (existingLessons.length !== expectedLessonCount || hasEmptyContent);

    if (needsRestore) {
      if (slug === "client-representative") {
        const clientRepLessons = await buildClientRepLessons();
        await restoreTrackLessons({
          tables,
          usePostgres,
          track,
          lessonsData: clientRepLessons,
        });
      } else if (backupTrack) {
        await restoreTrackLessons({
          tables,
          usePostgres,
          track,
          lessonsData: backupTrack.lessons ?? [],
        });
      }
      restoredTracks.push(slug);
    }

    const refreshedLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.trackId, track.id))
      .orderBy(lessons.order);

    for (const lesson of refreshedLessons) {
      await ensureLessonMedia({ tables, lesson, trackSlug: slug });
      await upsertQuizForLesson({
        tables,
        usePostgres,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        lessonContent: lesson.content,
      });
      quizCount += 1;
    }
  }

  return { restoredTracks, quizCount };
}
