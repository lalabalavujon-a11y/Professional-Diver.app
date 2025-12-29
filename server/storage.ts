import { 
  users, 
  tracks, 
  lessons, 
  quizzes, 
  questions, 
  attempts, 
  invites,
  userProgress,
  type User, 
  type InsertUser,
  type Track,
  type InsertTrack,
  type Lesson,
  type InsertLesson,
  type Quiz,
  type InsertQuiz,
  type Question,
  type InsertQuestion,
  type Attempt,
  type InsertAttempt,
  type Invite,
  type InsertInvite,
  type UserProgress
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import { randomBytes } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Track methods
  getAllTracks(): Promise<Track[]>;
  getTrackBySlug(slug: string): Promise<(Track & { lessons: Lesson[] }) | undefined>;
  createTrack(track: InsertTrack): Promise<Track>;
  
  // Lesson methods
  getLessonById(id: string): Promise<Lesson | undefined>;
  updateLesson(id: string, data: Partial<InsertLesson>): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  
  // Quiz methods
  getQuizByLessonId(lessonId: string): Promise<(Quiz & { questions: Question[] }) | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  
  // Question methods
  createQuestion(question: InsertQuestion): Promise<Question>;
  
  // Attempt methods
  createAttempt(attempt: InsertAttempt): Promise<Attempt>;
  getUserAttempts(userId: string): Promise<Attempt[]>;
  
  // Invite methods
  getAllInvites(): Promise<Invite[]>;
  getInviteByToken(token: string): Promise<Invite | undefined>;
  createInvite(invite: InsertInvite): Promise<Invite>;
  deleteInvite(id: string): Promise<void>;
  markInviteUsed(token: string): Promise<void>;
  
  // User progress methods
  getUserProgress(userId: string): Promise<UserProgress[]>;
  markLessonComplete(userId: string, lessonId: string): Promise<UserProgress>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllTracks(): Promise<Track[]> {
    return await db.select().from(tracks).orderBy(tracks.title);
  }

  async getTrackBySlug(slug: string): Promise<(Track & { lessons: Lesson[] }) | undefined> {
    const [track] = await db.select().from(tracks).where(eq(tracks.slug, slug));
    if (!track) return undefined;

    const trackLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.trackId, track.id))
      .orderBy(lessons.order);

    return { ...track, lessons: trackLessons };
  }

  async createTrack(insertTrack: InsertTrack): Promise<Track> {
    const [track] = await db
      .insert(tracks)
      .values(insertTrack)
      .returning();
    return track;
  }

  async getLessonById(id: string): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson || undefined;
  }

  async updateLesson(id: string, data: Partial<InsertLesson>): Promise<Lesson | undefined> {
    try {
      // Prepare update data - ensure JSON fields are properly formatted
      const updateData: any = {
        ...data,
        updatedAt: new Date()
      };
      
      // For JSON columns, drizzle expects the actual objects/arrays, not strings
      // Normalize JSON fields to ensure they're arrays/objects
      const jsonFields = ['videos', 'documents', 'embeds', 'links', 'images', 'audio', 'objectives'];
      for (const field of jsonFields) {
        if (updateData[field] !== undefined) {
          // If it's a string, try to parse it
          if (typeof updateData[field] === 'string') {
            try {
              const parsed = JSON.parse(updateData[field]);
              updateData[field] = parsed === null ? [] : parsed;
            } catch (e) {
              console.warn(`Failed to parse ${field} as JSON, defaulting to empty array:`, e);
              updateData[field] = [];
            }
          }
          // If it's null after parsing, default to empty array
          else if (updateData[field] === null) {
            updateData[field] = [];
          }
          // If it's already an array/object, drizzle will handle it correctly
        }
      }
      
      const [lesson] = await db
        .update(lessons)
        .set(updateData)
        .where(eq(lessons.id, id))
        .returning();
      return lesson || undefined;
    } catch (error) {
      console.error('Error updating lesson:', error);
      throw error;
    }
  }

  async createLesson(insertLesson: InsertLesson): Promise<Lesson> {
    const [lesson] = await db
      .insert(lessons)
      .values(insertLesson)
      .returning();
    return lesson;
  }

  async getQuizByLessonId(lessonId: string): Promise<(Quiz & { questions: Question[] }) | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.lessonId, lessonId));
    if (!quiz) return undefined;

    const quizQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.quizId, quiz.id))
      .orderBy(questions.order);

    return { ...quiz, questions: quizQuestions };
  }

  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const [quiz] = await db
      .insert(quizzes)
      .values(insertQuiz)
      .returning();
    return quiz;
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const [question] = await db
      .insert(questions)
      .values(insertQuestion)
      .returning();
    return question;
  }

  async createAttempt(insertAttempt: InsertAttempt): Promise<Attempt> {
    const [attempt] = await db
      .insert(attempts)
      .values(insertAttempt)
      .returning();
    return attempt;
  }

  async getUserAttempts(userId: string): Promise<Attempt[]> {
    return await db
      .select()
      .from(attempts)
      .where(eq(attempts.userId, userId))
      .orderBy(desc(attempts.completedAt));
  }

  async getAllInvites(): Promise<Invite[]> {
    return await db
      .select()
      .from(invites)
      .orderBy(desc(invites.createdAt));
  }

  async getInviteByToken(token: string): Promise<Invite | undefined> {
    const [invite] = await db.select().from(invites).where(eq(invites.token, token));
    return invite || undefined;
  }

  async createInvite(insertInvite: InsertInvite): Promise<Invite> {
    const token = randomBytes(32).toString('hex');
    const [invite] = await db
      .insert(invites)
      .values({
        ...insertInvite,
        token,
      })
      .returning();
    return invite;
  }

  async deleteInvite(id: string): Promise<void> {
    await db.delete(invites).where(eq(invites.id, id));
  }

  async markInviteUsed(token: string): Promise<void> {
    await db
      .update(invites)
      .set({ usedAt: new Date() })
      .where(eq(invites.token, token));
  }

  async getUserProgress(userId: string): Promise<UserProgress[]> {
    return await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId))
      .orderBy(desc(userProgress.completedAt));
  }

  async markLessonComplete(userId: string, lessonId: string): Promise<UserProgress> {
    const [progress] = await db
      .insert(userProgress)
      .values({
        userId,
        lessonId,
      })
      .returning();
    return progress;
  }
}

export const storage = new DatabaseStorage();
