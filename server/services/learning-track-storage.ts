import { db } from "../db";
import { eq, sql } from "drizzle-orm";

type TableSet = {
  tracks: any;
  lessons: any;
  quizzes: any;
  questions: any;
  aiTutors: any;
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

export async function getTracks(includeAll: boolean) {
  const { tracks, aiTutors, lessons } = await loadTables();

  const baseQuery = db
    .select({
      id: tracks.id,
      title: tracks.title,
      slug: tracks.slug,
      summary: tracks.summary,
      isPublished: tracks.isPublished,
      difficulty: tracks.difficulty,
      estimatedHours: tracks.estimatedHours,
      createdAt: tracks.createdAt,
      aiTutor: {
        id: aiTutors.id,
        name: aiTutors.name,
        specialty: aiTutors.specialty,
        description: aiTutors.description,
      },
    })
    .from(tracks)
    .leftJoin(aiTutors, eq(tracks.aiTutorId, aiTutors.id))
    .orderBy(tracks.title);

  const rows = includeAll ? await baseQuery : await baseQuery.where(eq(tracks.isPublished, true));

  const tracksWithLessonCounts = await Promise.all(
    rows.map(async (track) => {
      const lessonCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(lessons)
        .where(eq(lessons.trackId, track.id));
      return {
        ...track,
        lessonCount: lessonCount[0]?.count || 0,
        isPublished: track.isPublished === true || track.isPublished === 1,
      };
    }),
  );

  return tracksWithLessonCounts;
}

export async function getTrackBySlug(slug: string) {
  const { tracks, lessons, aiTutors } = await loadTables();

  const [track] = await db
    .select({
      id: tracks.id,
      title: tracks.title,
      slug: tracks.slug,
      summary: tracks.summary,
      isPublished: tracks.isPublished,
      createdAt: tracks.createdAt,
      aiTutor: {
        id: aiTutors.id,
        name: aiTutors.name,
        specialty: aiTutors.specialty,
        description: aiTutors.description,
      },
    })
    .from(tracks)
    .leftJoin(aiTutors, eq(tracks.aiTutorId, aiTutors.id))
    .where(eq(tracks.slug, slug));

  if (!track) return undefined;

  const trackLessons = await db
    .select({
      id: lessons.id,
      trackId: lessons.trackId,
      title: lessons.title,
      order: lessons.order,
      content: lessons.content,
      createdAt: lessons.createdAt,
      updatedAt: lessons.updatedAt,
    })
    .from(lessons)
    .where(eq(lessons.trackId, track.id))
    .orderBy(lessons.order);

  return {
    ...track,
    lessons: trackLessons,
  };
}

export async function getLessonById(id: string) {
  const { lessons, tracks } = await loadTables();

  const [lesson] = await db
    .select({
      id: lessons.id,
      trackId: lessons.trackId,
      title: lessons.title,
      order: lessons.order,
      content: lessons.content,
      podcastUrl: lessons.podcastUrl,
      pdfUrl: lessons.pdfUrl,
      podcastDuration: lessons.podcastDuration,
      estimatedMinutes: lessons.estimatedMinutes,
      isRequired: lessons.isRequired,
      objectives: lessons.objectives,
      createdAt: lessons.createdAt,
      updatedAt: lessons.updatedAt,
      trackSlug: tracks.slug,
    })
    .from(lessons)
    .leftJoin(tracks, eq(lessons.trackId, tracks.id))
    .where(eq(lessons.id, id));

  return lesson || undefined;
}

export async function getQuizByLessonId(lessonId: string) {
  const { quizzes, questions } = await loadTables();

  const [quiz] = await db
    .select({
      id: quizzes.id,
      lessonId: quizzes.lessonId,
      title: quizzes.title,
      timeLimit: quizzes.timeLimit,
    })
    .from(quizzes)
    .where(eq(quizzes.lessonId, lessonId));

  if (!quiz) return undefined;

  const quizQuestions = await db
    .select({
      id: questions.id,
      quizId: questions.quizId,
      prompt: questions.prompt,
      options: questions.options,
      correctAnswer: questions.correctAnswer,
      order: questions.order,
    })
    .from(questions)
    .where(eq(questions.quizId, quiz.id))
    .orderBy(questions.order);

  const transformedQuestions = quizQuestions.map((question: any) => {
    let a = "";
    let b = "";
    let c = "";
    let d = "";

    try {
      const optionsObj =
        typeof question.options === "string"
          ? JSON.parse(question.options)
          : question.options;
      if (optionsObj && typeof optionsObj === "object") {
        a = optionsObj.a || optionsObj[0] || "";
        b = optionsObj.b || optionsObj[1] || "";
        c = optionsObj.c || optionsObj[2] || "";
        d = optionsObj.d || optionsObj[3] || "";
      }
    } catch (error) {
      console.error("Error parsing question options:", error);
    }

    return {
      id: question.id,
      quizId: question.quizId,
      prompt: question.prompt,
      a,
      b,
      c,
      d,
      answer: question.correctAnswer,
      order: question.order,
    };
  });

  return {
    ...quiz,
    questions: transformedQuestions,
  };
}
