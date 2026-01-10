import { db } from "./db";
import { tracks, lessons, quizzes, questions, invites, clients, users, aiTutors, userProgress } from "@shared/schema-sqlite";
import { eq, sql, desc } from "drizzle-orm";

// Temporary storage class that works with current database structure
export class TempDatabaseStorage {
  async getAllTracks() {
    try {
      const result = await db.select({
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
        }
      }).from(tracks)
        .leftJoin(aiTutors, eq(tracks.aiTutorId, aiTutors.id))
        .where(eq(tracks.isPublished, true))
        .orderBy(tracks.title);
      return result;
    } catch (error) {
      console.error('Error fetching tracks:', error);
      throw error;
    }
  }

  async getTrackBySlug(slug: string) {
    try {
      const [track] = await db.select({
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
        }
      }).from(tracks)
        .leftJoin(aiTutors, eq(tracks.aiTutorId, aiTutors.id))
        .where(eq(tracks.slug, slug));
      
      if (!track) return undefined;

      const trackLessons = await db.select({
        id: lessons.id,
        trackId: lessons.trackId,
        title: lessons.title,
        order: lessons.order,
        content: lessons.content,
        createdAt: lessons.createdAt,
        updatedAt: lessons.updatedAt,
      }).from(lessons).where(eq(lessons.trackId, track.id)).orderBy(lessons.order);
      
      return {
        ...track,
        lessons: trackLessons
      };
    } catch (error) {
      console.error('Error fetching track by slug:', error);
      throw error;
    }
  }

  async getLessonById(id: string) {
    try {
      const [lesson] = await db.select({
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
      }).from(lessons)
      .leftJoin(tracks, eq(lessons.trackId, tracks.id))
      .where(eq(lessons.id, id));
      
      return lesson || undefined;
    } catch (error) {
      console.error('Error fetching lesson:', error);
      throw error;
    }
  }

  async updateLesson(id: string, data: Partial<{
    trackId: string;
    title: string;
    order: number;
    content: string;
    estimatedMinutes?: number;
    isRequired?: boolean;
    podcastUrl?: string | null;
    podcastDuration?: number | null;
    pdfUrl?: string | null;
    notebookLmUrl?: string | null;
  }>) {
    try {
      const updateFields: any = {
        updatedAt: new Date(),
      };

      if (data.trackId !== undefined) updateFields.trackId = data.trackId;
      if (data.title !== undefined) updateFields.title = data.title;
      if (data.order !== undefined) updateFields.order = data.order;
      if (data.content !== undefined) updateFields.content = data.content;
      if (data.estimatedMinutes !== undefined) updateFields.estimatedMinutes = data.estimatedMinutes;
      if (data.isRequired !== undefined) updateFields.isRequired = data.isRequired;
      if (data.podcastUrl !== undefined) updateFields.podcastUrl = data.podcastUrl;
      if (data.podcastDuration !== undefined) updateFields.podcastDuration = data.podcastDuration;
      if (data.pdfUrl !== undefined) updateFields.pdfUrl = data.pdfUrl;
      if (data.notebookLmUrl !== undefined) updateFields.notebookLmUrl = data.notebookLmUrl;

      const [updatedLesson] = await db
        .update(lessons)
        .set(updateFields)
        .where(eq(lessons.id, id))
        .returning();

      return updatedLesson || undefined;
    } catch (error: any) {
      console.error('Error updating lesson:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
        updateFields,
        lessonId: id
      });
      throw error;
    }
  }

  async getQuizByLessonId(lessonId: string) {
    try {
      const [quiz] = await db.select({
        id: quizzes.id,
        lessonId: quizzes.lessonId,
        title: quizzes.title,
        timeLimit: quizzes.timeLimit,
      }).from(quizzes).where(eq(quizzes.lessonId, lessonId));
      
      if (!quiz) return undefined;

      const quizQuestions = await db.select({
        id: questions.id,
        quizId: questions.quizId,
        prompt: questions.prompt,
        options: questions.options,
        correctAnswer: questions.correctAnswer,
        order: questions.order,
      }).from(questions).where(eq(questions.quizId, quiz.id)).orderBy(questions.order);
      
      // Transform questions to parse options JSON into a, b, c, d fields
      const transformedQuestions = quizQuestions.map((q: any) => {
        let a = '', b = '', c = '', d = '';
        
        // Parse options JSON string or object
        try {
          const optionsObj = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
          if (optionsObj && typeof optionsObj === 'object') {
            a = optionsObj.a || optionsObj[0] || '';
            b = optionsObj.b || optionsObj[1] || '';
            c = optionsObj.c || optionsObj[2] || '';
            d = optionsObj.d || optionsObj[3] || '';
          }
        } catch (e) {
          console.error('Error parsing question options:', e, q.options);
        }
        
        return {
          id: q.id,
          quizId: q.quizId,
          prompt: q.prompt,
          a,
          b,
          c,
          d,
          answer: q.correctAnswer,
          order: q.order,
        };
      });
      
      return {
        ...quiz,
        questions: transformedQuestions
      };
    } catch (error) {
      console.error('Error fetching quiz:', error);
      throw error;
    }
  }

  async getAllInvites() {
    try {
      const result = await db.select().from(invites).orderBy(invites.createdAt);
      return result;
    } catch (error) {
      console.error('Error fetching invites:', error);
      throw error;
    }
  }

  async getUserProgress(userId: string) {
    try {
      // Get lesson progress
      const lessonProgress = await db.select({
        lessonId: userProgress.lessonId,
        completedAt: userProgress.completedAt,
        score: userProgress.score,
        timeSpent: userProgress.timeSpent,
      }).from(userProgress).where(eq(userProgress.userId, userId));

      // Get quiz attempts
      const quizAttemptsResult = await db.execute(`
        SELECT 
          qa.quiz_id,
          qa.score,
          qa.completed_at,
          q.lesson_id,
          l.track_id
        FROM quiz_attempts qa
        LEFT JOIN quizzes q ON qa.quiz_id = q.id
        LEFT JOIN lessons l ON q.lesson_id = l.id
        WHERE qa.user_id = $1
        ORDER BY qa.completed_at DESC
        LIMIT 50
      `, [userId]);
      const quizAttempts = Array.isArray(quizAttemptsResult) ? quizAttemptsResult : (quizAttemptsResult.rows || []);

      // Get exam attempts
      const examAttemptsResult = await db.execute(`
        SELECT 
          exam_slug,
          score,
          total_questions,
          completed_at
        FROM exam_attempts
        WHERE user_id = $1
        ORDER BY completed_at DESC
        LIMIT 50
      `, [userId]);
      const examAttempts = Array.isArray(examAttemptsResult) ? examAttemptsResult : (examAttemptsResult.rows || []);

      // Get track progress
      const trackProgressResult = await db.execute(`
        WITH track_lesson_counts AS (
          SELECT track_id, COUNT(*) as total_lessons
          FROM lessons
          GROUP BY track_id
        ),
        completed_lessons AS (
          SELECT 
            l.track_id,
            COUNT(DISTINCT up.lesson_id) as completed_lessons
          FROM user_progress up
          LEFT JOIN lessons l ON up.lesson_id = l.id
          WHERE up.user_id = $1
          GROUP BY l.track_id
        )
        SELECT 
          t.id as track_id,
          t.title as track_title,
          t.slug as track_slug,
          COALESCE(tlc.total_lessons, 0) as total_lessons,
          COALESCE(cl.completed_lessons, 0) as completed_lessons,
          CASE 
            WHEN COALESCE(tlc.total_lessons, 0) > 0 
            THEN (COALESCE(cl.completed_lessons, 0) * 100.0 / tlc.total_lessons)
            ELSE 0
          END as completion_percentage
        FROM tracks t
        LEFT JOIN track_lesson_counts tlc ON t.id = tlc.track_id
        LEFT JOIN completed_lessons cl ON t.id = cl.track_id
        WHERE t.is_published = true
      `, [userId]);
      const trackProgress = Array.isArray(trackProgressResult) ? trackProgressResult : (trackProgressResult.rows || []);

      return {
        lessonProgress,
        quizAttempts,
        examAttempts,
        trackProgress,
      };
    } catch (error) {
      console.error('Error fetching user progress:', error);
      return {
        lessonProgress: [],
        quizAttempts: [],
        examAttempts: [],
        trackProgress: [],
      };
    }
  }

  async markLessonComplete(userId: string, lessonId: string, score?: number, timeSpent?: number): Promise<any> {
    try {
      // Check if progress already exists
      const existing = await db.select().from(userProgress)
        .where(eq(userProgress.userId, userId))
        .where(eq(userProgress.lessonId, lessonId))
        .limit(1);

      if (existing.length > 0) {
        // Update existing progress
        const [updated] = await db.update(userProgress)
          .set({
            completedAt: new Date(),
            score: score ?? existing[0].score,
            timeSpent: timeSpent ?? existing[0].timeSpent,
          })
          .where(eq(userProgress.id, existing[0].id))
          .returning();
        return updated;
      } else {
        // Create new progress
        const [newProgress] = await db.insert(userProgress)
          .values({
            userId,
            lessonId,
            completedAt: new Date(),
            score: score ?? null,
            timeSpent: timeSpent ?? null,
          })
          .returning();
        return newProgress;
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      throw error;
    }
  }

  // Client Management
  async getAllClients() {
    try {
      console.log('[getAllClients] Fetching clients from database...');
      // Use Drizzle ORM for SQLite compatibility
      const clientsData = await db.select({
        id: clients.id,
        userId: clients.userId,
        name: clients.name,
        email: clients.email,
        subscriptionType: clients.subscriptionType,
        status: clients.status,
        subscriptionDate: clients.subscriptionDate,
        monthlyRevenue: clients.monthlyRevenue,
        notes: clients.notes,
        partnerStatus: clients.partnerStatus,
        conversionDate: clients.conversionDate,
        highlevelContactId: clients.highlevelContactId,
        createdAt: clients.createdAt,
        updatedAt: clients.updatedAt,
        phone: clients.phone,
      }).from(clients).orderBy(desc(clients.createdAt));
      
      console.log(`[getAllClients] Found ${clientsData.length} clients in database`);
      
      // Convert to snake_case for API response (for backward compatibility)
      const formatDate = (date: Date | number | string | null | undefined): string => {
        if (!date) return new Date().toISOString();
        if (typeof date === 'number') return new Date(date).toISOString();
        if (typeof date === 'string') {
          // If it's already an ISO string, return it
          if (date.includes('T')) return date;
          // Otherwise parse it
          return new Date(date).toISOString();
        }
        return date.toISOString();
      };

      const formattedClients = clientsData.map(client => ({
        id: client.id,
        user_id: client.userId || null,
        name: client.name,
        email: client.email,
        phone: client.phone || null,
        subscription_type: client.subscriptionType,
        status: client.status,
        subscription_date: formatDate(client.subscriptionDate),
        monthly_revenue: client.monthlyRevenue || 0,
        notes: client.notes || null,
        partner_status: client.partnerStatus || 'NONE',
        conversion_date: client.conversionDate ? formatDate(client.conversionDate) : null,
        highlevel_contact_id: client.highlevelContactId || null,
        created_at: formatDate(client.createdAt),
        updated_at: formatDate(client.updatedAt),
      }));
      
      console.log(`[getAllClients] Returning ${formattedClients.length} formatted clients`);
      return formattedClients;
    } catch (error) {
      console.error('[getAllClients] Error fetching clients:', error);
      console.error('[getAllClients] Error details:', error instanceof Error ? error.stack : error);
      return [];
    }
  }

  async createClient(client: any) {
    try {
      const result = await db.execute(`
        INSERT INTO clients (name, email, subscription_type, status, subscription_date, monthly_revenue, notes, user_id, partner_status, highlevel_contact_id) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING *
      `, [
        client.name, 
        client.email, 
        client.subscriptionType || 'TRIAL', 
        client.status || 'ACTIVE', 
        client.subscriptionDate || new Date().toISOString(), 
        client.monthlyRevenue || 0, 
        client.notes || null,
        client.userId || null,
        client.partnerStatus || 'NONE',
        client.highlevelContactId || null
      ]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  async updateClient(id: string, updates: any) {
    try {
      const result = await db.execute(`
        UPDATE clients 
        SET 
          name = COALESCE($2, name), 
          email = COALESCE($3, email), 
          subscription_type = COALESCE($4, subscription_type), 
          status = COALESCE($5, status), 
          subscription_date = COALESCE($6, subscription_date), 
          monthly_revenue = COALESCE($7, monthly_revenue), 
          notes = COALESCE($8, notes),
          user_id = COALESCE($9, user_id),
          partner_status = COALESCE($10, partner_status),
          conversion_date = COALESCE($11, conversion_date),
          highlevel_contact_id = COALESCE($12, highlevel_contact_id),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 
        RETURNING *
      `, [
        id, 
        updates.name, 
        updates.email, 
        updates.subscriptionType, 
        updates.status, 
        updates.subscriptionDate, 
        updates.monthlyRevenue, 
        updates.notes,
        updates.userId,
        updates.partnerStatus,
        updates.conversionDate,
        updates.highlevelContactId
      ]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  }

  async deleteClient(id: string) {
    try {
      await db.execute('DELETE FROM clients WHERE id = $1', [id]);
      return { success: true };
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  }

  async getClientStats() {
    try {
      const totalResult = await db.execute('SELECT COUNT(*) as total FROM clients');
      const total = parseInt(totalResult.rows[0].total);

      const activeResult = await db.execute("SELECT COUNT(*) as active FROM clients WHERE status = 'ACTIVE'");
      const active = parseInt(activeResult.rows[0].active);

      const revenueResult = await db.execute("SELECT SUM(monthly_revenue) as mrr FROM clients WHERE status = 'ACTIVE'");
      const totalMRR = parseInt(revenueResult.rows[0].mrr || 0);

      return {
        totalClients: total,
        activeClients: active,
        monthlyRecurringRevenue: totalMRR,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching client stats:', error);
      return {
        totalClients: 0,
        activeClients: 0,
        monthlyRecurringRevenue: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  async getQuizAnalytics() {
    try {
      /**
       * NOTE (SQLite): our `quiz_attempts` table stores only `score` and `completed_at`.
       * It does NOT store `total_questions` or `created_at`.
       * For analytics we derive `total_questions` from `questions` and treat `completed_at` as the event time.
       */

      // Get quiz completion statistics (percent-based)
      const quizStats = await db.execute(`
        WITH quiz_question_counts AS (
          SELECT quiz_id, COUNT(*) AS total_questions
          FROM questions
          GROUP BY quiz_id
        )
        SELECT 
          q.id,
          q.title,
          l.title as lesson_title,
          t.title as track_title,
          COUNT(qa.id) as total_attempts,
          AVG(CASE 
            WHEN qa.score IS NOT NULL 
            THEN (qa.score * 100.0) / NULLIF(qqc.total_questions, 0) 
          END) as avg_score,
          MAX(CASE 
            WHEN qa.score IS NOT NULL 
            THEN (qa.score * 100.0) / NULLIF(qqc.total_questions, 0) 
          END) as max_score,
          MIN(CASE 
            WHEN qa.score IS NOT NULL 
            THEN (qa.score * 100.0) / NULLIF(qqc.total_questions, 0) 
          END) as min_score
        FROM quizzes q
        LEFT JOIN lessons l ON q.lesson_id = l.id
        LEFT JOIN tracks t ON l.track_id = t.id
        LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
        LEFT JOIN quiz_question_counts qqc ON q.id = qqc.quiz_id
        GROUP BY q.id, q.title, l.title, t.title
        ORDER BY total_attempts DESC
      `);

      // Get track-level analytics
      const trackStats = await db.execute(`
        WITH quiz_question_counts AS (
          SELECT quiz_id, COUNT(*) AS total_questions
          FROM questions
          GROUP BY quiz_id
        )
        SELECT 
          t.id,
          t.title,
          COUNT(DISTINCT l.id) as total_lessons,
          COUNT(DISTINCT q.id) as total_quizzes,
          COUNT(qa.id) as total_attempts,
          AVG(CASE 
            WHEN qa.score IS NOT NULL 
            THEN (qa.score * 100.0) / NULLIF(qqc.total_questions, 0) 
          END) as avg_score
        FROM tracks t
        LEFT JOIN lessons l ON t.id = l.track_id
        LEFT JOIN quizzes q ON l.id = q.lesson_id
        LEFT JOIN quiz_question_counts qqc ON q.id = qqc.quiz_id
        LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
        WHERE t.is_published = true
        GROUP BY t.id, t.title
        ORDER BY total_attempts DESC
      `);

      // Get recent quiz attempts for activity feed
      const recentAttempts = await db.execute(`
        SELECT 
          qa.id,
          qa.score,
          (
            SELECT COUNT(*) 
            FROM questions qq 
            WHERE qq.quiz_id = qa.quiz_id
          ) as total_questions,
          qa.completed_at as created_at,
          q.title as quiz_title,
          l.title as lesson_title,
          t.title as track_title
        FROM quiz_attempts qa
        LEFT JOIN quizzes q ON qa.quiz_id = q.id
        LEFT JOIN lessons l ON q.lesson_id = l.id
        LEFT JOIN tracks t ON l.track_id = t.id
        ORDER BY qa.completed_at DESC
        LIMIT 20
      `);

      // --- Exam analytics (for full exam mode) ---
      // Ensure table exists (safe no-op if already created)
      await db.execute(`
        CREATE TABLE IF NOT EXISTS exam_attempts (
          id text PRIMARY KEY NOT NULL,
          user_id text NOT NULL,
          exam_slug text NOT NULL,
          score integer NOT NULL,
          total_questions integer NOT NULL,
          time_spent integer,
          completed_at integer NOT NULL,
          answers text,
          FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE no action ON DELETE cascade
        );
      `);

      const examStats = await db.execute(`
        SELECT
          ea.exam_slug as slug,
          COUNT(ea.id) as total_attempts,
          AVG((ea.score * 100.0) / NULLIF(ea.total_questions, 0)) as avg_score,
          MAX((ea.score * 100.0) / NULLIF(ea.total_questions, 0)) as max_score,
          MIN((ea.score * 100.0) / NULLIF(ea.total_questions, 0)) as min_score
        FROM exam_attempts ea
        GROUP BY ea.exam_slug
        ORDER BY total_attempts DESC
      `);

      const recentExamAttempts = await db.execute(`
        SELECT
          ea.id,
          ea.exam_slug as slug,
          ea.score,
          ea.total_questions,
          ea.completed_at as created_at
        FROM exam_attempts ea
        ORDER BY ea.completed_at DESC
        LIMIT 20
      `);

      // Handle drizzle results - SQLite returns array directly, PostgreSQL returns .rows
      const quizStatsData = Array.isArray(quizStats) ? quizStats : (quizStats.rows || []);
      const trackStatsData = Array.isArray(trackStats) ? trackStats : (trackStats.rows || []);
      const recentAttemptsData = Array.isArray(recentAttempts) ? recentAttempts : (recentAttempts.rows || []);
      const examStatsData = Array.isArray(examStats) ? examStats : (examStats.rows || []);
      const recentExamAttemptsData = Array.isArray(recentExamAttempts) ? recentExamAttempts : (recentExamAttempts.rows || []);

      return {
        quizStats: quizStatsData,
        trackStats: trackStatsData,
        recentAttempts: recentAttemptsData,
        examStats: examStatsData,
        recentExamAttempts: recentExamAttemptsData,
      };
    } catch (error) {
      console.error('Error fetching quiz analytics:', error);
      // Return empty data structure
      return {
        quizStats: [],
        trackStats: [],
        recentAttempts: [],
        examStats: [],
        recentExamAttempts: [],
      };
    }
  }

  // User operations for trial signup
  async createTrialUser(userData: { name: string; email: string }) {
    try {
      // Check if user already exists
      const existingUserResult = await db.execute('SELECT id FROM users WHERE email = $1', [userData.email]);
      if (existingUserResult.rows.length > 0) {
        throw new Error("User already exists with this email");
      }

      // Create 24-hour trial expiration
      const trialExpiration = new Date();
      trialExpiration.setHours(trialExpiration.getHours() + 24);

      const result = await db.execute(`
        INSERT INTO users (email, name, subscription_type, trial_expires_at, subscription_status) 
        VALUES ($1, $2, 'TRIAL', $3, 'ACTIVE') 
        RETURNING *
      `, [userData.email, userData.name, trialExpiration.toISOString()]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating trial user:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string) {
    try {
      const result = await db.execute('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
  }

  async getUserById(id: string) {
    try {
      const result = await db.execute('SELECT * FROM users WHERE id = $1', [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching user by id:', error);
      return null;
    }
  }
}

export const tempStorage = new TempDatabaseStorage();