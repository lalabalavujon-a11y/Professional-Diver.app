import { Router } from "express";
import { db } from "../db";
import { tracks, lessons, quizzes, users } from "../../shared/schema-sqlite";
import { eq, sql, desc, count } from "drizzle-orm";

// Helper to execute raw SQL on SQLite
function executeRawSql(query: string, params?: any[]): any[] {
  try {
    const sqlite = (db as any).sqlite;
    if (sqlite) {
      // SQLite mode - use prepare().all()
      const stmt = sqlite.prepare(query);
      return params ? stmt.all(...params) : stmt.all();
    }
    return [];
  } catch (error) {
    console.error("Raw SQL execution error:", error);
    return [];
  }
}

const router = Router();

/**
 * Student Analytics API Routes
 * Provides comprehensive real-time analytics for student progress monitoring
 */

interface PlatformOverview {
  totalUsers: number;
  activeUsers: number;
  totalTracks: number;
  totalLessons: number;
  totalQuizzes: number;
  totalExams: number;
  averageQuizScore: number;
  averageExamScore: number;
  lessonsCompletedToday: number;
  quizzesCompletedToday: number;
  examsCompletedToday: number;
  lastUpdated: string;
}

interface TrackProgress {
  trackId: string;
  trackTitle: string;
  trackSlug: string;
  totalLessons: number;
  totalCompletions: number;
  averageCompletion: number;
  studentsEnrolled: number;
  quizAttempts: number;
  averageQuizScore: number;
}

interface StudentProgress {
  userId: string;
  userName: string;
  email: string;
  role: string;
  subscriptionType: string;
  lessonsCompleted: number;
  quizzesCompleted: number;
  examsPassed: number;
  averageScore: number;
  lastActivity: string | null;
  tracksEnrolled: number;
  overallProgress: number;
}

interface RecentActivity {
  id: string;
  type: "lesson" | "quiz" | "exam" | "srs";
  userId: string;
  userName: string;
  description: string;
  score?: number;
  timestamp: string;
  trackTitle?: string;
  lessonTitle?: string;
}

/**
 * GET /api/admin/student-analytics
 * Returns comprehensive student analytics for Super Admin Dashboard
 */
router.get("/", async (req, res) => {
  try {
    // Get platform overview
    const overview = await getPlatformOverview();
    
    // Get track progress analytics
    const trackProgress = await getTrackProgressAnalytics();
    
    // Get top performing students
    const topStudents = await getTopStudents();
    
    // Get struggling students (for intervention)
    const strugglingStudents = await getStrugglingStudents();
    
    // Get recent activity feed
    const recentActivity = await getRecentActivity();
    
    // Get SRS analytics summary
    const srsOverview = await getSrsOverview();
    
    // Get exam analytics
    const examAnalytics = await getExamAnalytics();

    res.json({
      success: true,
      data: {
        overview,
        trackProgress,
        topStudents,
        strugglingStudents,
        recentActivity,
        srsOverview,
        examAnalytics,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Error fetching student analytics:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch student analytics",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/admin/student-analytics/overview
 * Quick platform overview stats
 */
router.get("/overview", async (req, res) => {
  try {
    const overview = await getPlatformOverview();
    res.json({ success: true, data: overview });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch overview" });
  }
});

/**
 * GET /api/admin/student-analytics/tracks
 * Track-level analytics
 */
router.get("/tracks", async (req, res) => {
  try {
    const trackProgress = await getTrackProgressAnalytics();
    res.json({ success: true, data: trackProgress });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch track analytics" });
  }
});

/**
 * GET /api/admin/student-analytics/students
 * All student progress data
 */
router.get("/students", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const sortBy = (req.query.sortBy as string) || "lastActivity";
    
    const students = await getAllStudentProgress(limit, offset, sortBy);
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch student data" });
  }
});

/**
 * GET /api/admin/student-analytics/student/:userId
 * Detailed analytics for a specific student
 */
router.get("/student/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const studentDetails = await getStudentDetails(userId);
    res.json({ success: true, data: studentDetails });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch student details" });
  }
});

/**
 * GET /api/admin/student-analytics/activity
 * Recent platform activity feed
 */
router.get("/activity", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const activity = await getRecentActivity(limit);
    res.json({ success: true, data: activity });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch activity" });
  }
});

// Helper Functions

async function getPlatformOverview(): Promise<PlatformOverview> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  try {
    // Get total counts using Drizzle
    const [userCount] = await db.select({ count: count() }).from(users);
    const [trackCount] = await db.select({ count: count() }).from(tracks).where(eq(tracks.isPublished, true));
    const [lessonCount] = await db.select({ count: count() }).from(lessons);
    const [quizCount] = await db.select({ count: count() }).from(quizzes);
    
    // Get active users using raw SQL
    const activeUsersRows = executeRawSql(`
      SELECT COUNT(DISTINCT user_id) as active_count 
      FROM (
        SELECT user_id FROM lesson_progress WHERE completed_at > ?
        UNION
        SELECT user_id FROM quiz_attempts WHERE completed_at > ?
      )
    `, [thirtyDaysAgo, thirtyDaysAgo]);
    
    // Get average quiz scores
    const quizScoresRows = executeRawSql(`
      SELECT AVG((score * 100.0) / NULLIF((SELECT COUNT(*) FROM questions WHERE quiz_id = qa.quiz_id), 0)) as avg_score
      FROM quiz_attempts qa
    `);
    
    // Get exam counts and scores
    const examRows = executeRawSql(`
      SELECT 
        COUNT(*) as total_exams,
        AVG((score * 100.0) / NULLIF(total_questions, 0)) as avg_score
      FROM exam_attempts
    `);
    
    // Get today's completions
    const todayLessonsRows = executeRawSql(`
      SELECT COUNT(*) as count FROM lesson_progress WHERE completed_at >= ?
    `, [todayMs]);
    
    const todayQuizzesRows = executeRawSql(`
      SELECT COUNT(*) as count FROM quiz_attempts WHERE completed_at >= ?
    `, [todayMs]);
    
    const todayExamsRows = executeRawSql(`
      SELECT COUNT(*) as count FROM exam_attempts WHERE completed_at >= ?
    `, [todayMs]);

    return {
      totalUsers: userCount?.count || 0,
      activeUsers: activeUsersRows[0]?.active_count || 0,
      totalTracks: trackCount?.count || 0,
      totalLessons: lessonCount?.count || 0,
      totalQuizzes: quizCount?.count || 0,
      totalExams: examRows[0]?.total_exams || 0,
      averageQuizScore: Math.round((quizScoresRows[0]?.avg_score || 0) * 10) / 10,
      averageExamScore: Math.round((examRows[0]?.avg_score || 0) * 10) / 10,
      lessonsCompletedToday: todayLessonsRows[0]?.count || 0,
      quizzesCompletedToday: todayQuizzesRows[0]?.count || 0,
      examsCompletedToday: todayExamsRows[0]?.count || 0,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error getting platform overview:", error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalTracks: 0,
      totalLessons: 0,
      totalQuizzes: 0,
      totalExams: 0,
      averageQuizScore: 0,
      averageExamScore: 0,
      lessonsCompletedToday: 0,
      quizzesCompletedToday: 0,
      examsCompletedToday: 0,
      lastUpdated: new Date().toISOString()
    };
  }
}

async function getTrackProgressAnalytics(): Promise<TrackProgress[]> {
  try {
    const rows = executeRawSql(`
      SELECT 
        t.id as track_id,
        t.title as track_title,
        t.slug as track_slug,
        COUNT(DISTINCT l.id) as total_lessons,
        COUNT(DISTINCT lp.id) as total_completions,
        COUNT(DISTINCT lp.user_id) as students_enrolled,
        COUNT(DISTINCT qa.id) as quiz_attempts,
        AVG(CASE 
          WHEN qa.score IS NOT NULL 
          THEN (qa.score * 100.0) / NULLIF((SELECT COUNT(*) FROM questions WHERE quiz_id = qa.quiz_id), 0) 
        END) as avg_quiz_score
      FROM tracks t
      LEFT JOIN lessons l ON t.id = l.track_id
      LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id
      LEFT JOIN quizzes q ON l.id = q.lesson_id
      LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
      WHERE t.is_published = 1
      GROUP BY t.id, t.title, t.slug
      ORDER BY students_enrolled DESC, total_completions DESC
    `);
    
    return rows.map((row: any) => ({
      trackId: row.track_id,
      trackTitle: row.track_title,
      trackSlug: row.track_slug,
      totalLessons: row.total_lessons || 0,
      totalCompletions: row.total_completions || 0,
      averageCompletion: row.total_lessons > 0 && row.students_enrolled > 0
        ? Math.round((row.total_completions / (row.total_lessons * row.students_enrolled)) * 100)
        : 0,
      studentsEnrolled: row.students_enrolled || 0,
      quizAttempts: row.quiz_attempts || 0,
      averageQuizScore: Math.round((row.avg_quiz_score || 0) * 10) / 10
    }));
  } catch (error) {
    console.error("Error getting track analytics:", error);
    return [];
  }
}

async function getTopStudents(limit: number = 10): Promise<StudentProgress[]> {
  try {
    const rows = executeRawSql(`
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email,
        u.role,
        u.subscription_type,
        COUNT(DISTINCT lp.lesson_id) as lessons_completed,
        COUNT(DISTINCT qa.id) as quizzes_completed,
        COUNT(DISTINCT CASE WHEN ea.score >= (ea.total_questions * 0.7) THEN ea.id END) as exams_passed,
        AVG(CASE 
          WHEN qa.score IS NOT NULL 
          THEN (qa.score * 100.0) / NULLIF((SELECT COUNT(*) FROM questions WHERE quiz_id = qa.quiz_id), 0) 
        END) as avg_score,
        MAX(COALESCE(lp.completed_at, qa.completed_at, ea.completed_at)) as last_activity,
        COUNT(DISTINCT l.track_id) as tracks_enrolled
      FROM users u
      LEFT JOIN lesson_progress lp ON u.id = lp.user_id
      LEFT JOIN lessons l ON lp.lesson_id = l.id
      LEFT JOIN quiz_attempts qa ON u.id = qa.user_id
      LEFT JOIN exam_attempts ea ON u.id = ea.user_id
      WHERE u.role != 'SUPER_ADMIN'
      GROUP BY u.id, u.name, u.email, u.role, u.subscription_type
      HAVING lessons_completed > 0 OR quizzes_completed > 0
      ORDER BY avg_score DESC, lessons_completed DESC
      LIMIT ?
    `, [limit]);
    
    return rows.map((row: any) => ({
      userId: row.user_id,
      userName: row.user_name || 'Unknown',
      email: row.email,
      role: row.role || 'USER',
      subscriptionType: row.subscription_type || 'TRIAL',
      lessonsCompleted: row.lessons_completed || 0,
      quizzesCompleted: row.quizzes_completed || 0,
      examsPassed: row.exams_passed || 0,
      averageScore: Math.round((row.avg_score || 0) * 10) / 10,
      lastActivity: row.last_activity ? new Date(row.last_activity).toISOString() : null,
      tracksEnrolled: row.tracks_enrolled || 0,
      overallProgress: calculateOverallProgress(row)
    }));
  } catch (error) {
    console.error("Error getting top students:", error);
    return [];
  }
}

async function getStrugglingStudents(limit: number = 10): Promise<StudentProgress[]> {
  try {
    const rows = executeRawSql(`
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email,
        u.role,
        u.subscription_type,
        COUNT(DISTINCT lp.lesson_id) as lessons_completed,
        COUNT(DISTINCT qa.id) as quizzes_completed,
        COUNT(DISTINCT CASE WHEN ea.score < (ea.total_questions * 0.7) THEN ea.id END) as exams_failed,
        AVG(CASE 
          WHEN qa.score IS NOT NULL 
          THEN (qa.score * 100.0) / NULLIF((SELECT COUNT(*) FROM questions WHERE quiz_id = qa.quiz_id), 0) 
        END) as avg_score,
        MAX(COALESCE(lp.completed_at, qa.completed_at, ea.completed_at)) as last_activity,
        COUNT(DISTINCT l.track_id) as tracks_enrolled
      FROM users u
      LEFT JOIN lesson_progress lp ON u.id = lp.user_id
      LEFT JOIN lessons l ON lp.lesson_id = l.id
      LEFT JOIN quiz_attempts qa ON u.id = qa.user_id
      LEFT JOIN exam_attempts ea ON u.id = ea.user_id
      WHERE u.role != 'SUPER_ADMIN'
      GROUP BY u.id, u.name, u.email, u.role, u.subscription_type
      HAVING avg_score < 60 AND quizzes_completed > 0
      ORDER BY avg_score ASC
      LIMIT ?
    `, [limit]);
    
    return rows.map((row: any) => ({
      userId: row.user_id,
      userName: row.user_name || 'Unknown',
      email: row.email,
      role: row.role || 'USER',
      subscriptionType: row.subscription_type || 'TRIAL',
      lessonsCompleted: row.lessons_completed || 0,
      quizzesCompleted: row.quizzes_completed || 0,
      examsPassed: 0,
      averageScore: Math.round((row.avg_score || 0) * 10) / 10,
      lastActivity: row.last_activity ? new Date(row.last_activity).toISOString() : null,
      tracksEnrolled: row.tracks_enrolled || 0,
      overallProgress: calculateOverallProgress(row)
    }));
  } catch (error) {
    console.error("Error getting struggling students:", error);
    return [];
  }
}

async function getAllStudentProgress(limit: number, offset: number, sortBy: string): Promise<StudentProgress[]> {
  try {
    const orderClause = sortBy === 'score' ? 'avg_score DESC' :
                        sortBy === 'lessons' ? 'lessons_completed DESC' :
                        'last_activity DESC';
    
    const rows = executeRawSql(`
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email,
        u.role,
        u.subscription_type,
        COUNT(DISTINCT lp.lesson_id) as lessons_completed,
        COUNT(DISTINCT qa.id) as quizzes_completed,
        COUNT(DISTINCT CASE WHEN ea.score >= (ea.total_questions * 0.7) THEN ea.id END) as exams_passed,
        AVG(CASE 
          WHEN qa.score IS NOT NULL 
          THEN (qa.score * 100.0) / NULLIF((SELECT COUNT(*) FROM questions WHERE quiz_id = qa.quiz_id), 0) 
        END) as avg_score,
        MAX(COALESCE(lp.completed_at, qa.completed_at, ea.completed_at)) as last_activity,
        COUNT(DISTINCT l.track_id) as tracks_enrolled
      FROM users u
      LEFT JOIN lesson_progress lp ON u.id = lp.user_id
      LEFT JOIN lessons l ON lp.lesson_id = l.id
      LEFT JOIN quiz_attempts qa ON u.id = qa.user_id
      LEFT JOIN exam_attempts ea ON u.id = ea.user_id
      GROUP BY u.id, u.name, u.email, u.role, u.subscription_type
      ORDER BY ${orderClause}
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    
    return rows.map((row: any) => ({
      userId: row.user_id,
      userName: row.user_name || 'Unknown',
      email: row.email,
      role: row.role || 'USER',
      subscriptionType: row.subscription_type || 'TRIAL',
      lessonsCompleted: row.lessons_completed || 0,
      quizzesCompleted: row.quizzes_completed || 0,
      examsPassed: row.exams_passed || 0,
      averageScore: Math.round((row.avg_score || 0) * 10) / 10,
      lastActivity: row.last_activity ? new Date(row.last_activity).toISOString() : null,
      tracksEnrolled: row.tracks_enrolled || 0,
      overallProgress: calculateOverallProgress(row)
    }));
  } catch (error) {
    console.error("Error getting all student progress:", error);
    return [];
  }
}

async function getStudentDetails(userId: string) {
  try {
    // Get basic user info
    const userRows = executeRawSql(`SELECT * FROM users WHERE id = ?`, [userId]);
    const user = userRows[0];
    
    if (!user) {
      return null;
    }

    // Get lesson progress with track info
    const lessonProgress = executeRawSql(`
      SELECT 
        lp.*,
        l.title as lesson_title,
        t.title as track_title,
        t.slug as track_slug
      FROM lesson_progress lp
      JOIN lessons l ON lp.lesson_id = l.id
      JOIN tracks t ON l.track_id = t.id
      WHERE lp.user_id = ?
      ORDER BY lp.completed_at DESC
    `, [userId]);

    // Get quiz attempts
    const quizAttempts = executeRawSql(`
      SELECT 
        qa.*,
        q.title as quiz_title,
        l.title as lesson_title,
        t.title as track_title,
        (SELECT COUNT(*) FROM questions WHERE quiz_id = qa.quiz_id) as total_questions
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.id
      JOIN lessons l ON q.lesson_id = l.id
      JOIN tracks t ON l.track_id = t.id
      WHERE qa.user_id = ?
      ORDER BY qa.completed_at DESC
    `, [userId]);

    // Get exam attempts
    const examAttempts = executeRawSql(`
      SELECT * FROM exam_attempts WHERE user_id = ? ORDER BY completed_at DESC
    `, [userId]);

    // Get SRS stats
    const srsStats = executeRawSql(`
      SELECT 
        COUNT(DISTINCT deck_id) as decks_used,
        COUNT(*) as total_reviews,
        SUM(CASE WHEN grade >= 2 THEN 1 ELSE 0 END) as passed_reviews
      FROM srs_review_events
      WHERE user_id = ?
    `, [userId]);

    return {
      user,
      lessonProgress,
      quizAttempts,
      examAttempts,
      srsStats: srsStats[0] || { decks_used: 0, total_reviews: 0, passed_reviews: 0 }
    };
  } catch (error) {
    console.error("Error getting student details:", error);
    return null;
  }
}

async function getRecentActivity(limit: number = 50): Promise<RecentActivity[]> {
  try {
    // Combine lesson completions, quiz attempts, exam attempts into unified activity feed
    const rows = executeRawSql(`
      SELECT * FROM (
        SELECT 
          lp.id,
          'lesson' as type,
          lp.user_id,
          u.name as user_name,
          'Completed lesson: ' || l.title as description,
          NULL as score,
          lp.completed_at as timestamp,
          t.title as track_title,
          l.title as lesson_title
        FROM lesson_progress lp
        JOIN lessons l ON lp.lesson_id = l.id
        JOIN tracks t ON l.track_id = t.id
        LEFT JOIN users u ON lp.user_id = u.id
        
        UNION ALL
        
        SELECT 
          qa.id,
          'quiz' as type,
          qa.user_id,
          u.name as user_name,
          'Completed quiz: ' || q.title as description,
          (qa.score * 100.0) / NULLIF((SELECT COUNT(*) FROM questions WHERE quiz_id = qa.quiz_id), 0) as score,
          qa.completed_at as timestamp,
          t.title as track_title,
          l.title as lesson_title
        FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.id
        JOIN lessons l ON q.lesson_id = l.id
        JOIN tracks t ON l.track_id = t.id
        LEFT JOIN users u ON qa.user_id = u.id
        
        UNION ALL
        
        SELECT 
          ea.id,
          'exam' as type,
          ea.user_id,
          u.name as user_name,
          'Completed exam: ' || ea.exam_slug as description,
          (ea.score * 100.0) / NULLIF(ea.total_questions, 0) as score,
          ea.completed_at as timestamp,
          ea.exam_slug as track_title,
          NULL as lesson_title
        FROM exam_attempts ea
        LEFT JOIN users u ON ea.user_id = u.id
      ) combined
      ORDER BY timestamp DESC
      LIMIT ?
    `, [limit]);
    
    return rows.map((row: any) => ({
      id: row.id,
      type: row.type as "lesson" | "quiz" | "exam" | "srs",
      userId: row.user_id,
      userName: row.user_name || 'Unknown User',
      description: row.description,
      score: row.score ? Math.round(row.score * 10) / 10 : undefined,
      timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString(),
      trackTitle: row.track_title,
      lessonTitle: row.lesson_title
    }));
  } catch (error) {
    console.error("Error getting recent activity:", error);
    return [];
  }
}

async function getSrsOverview() {
  try {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const rows = executeRawSql(`
      SELECT 
        COUNT(DISTINCT user_id) as active_users,
        COUNT(DISTINCT deck_id) as total_decks,
        COUNT(*) as total_reviews,
        SUM(CASE WHEN grade >= 2 THEN 1 ELSE 0 END) as passed_reviews,
        AVG(CASE WHEN grade >= 2 THEN 1.0 ELSE 0.0 END) * 100 as pass_rate
      FROM srs_review_events
      WHERE reviewed_at > ?
    `, [sevenDaysAgo]);

    const data = rows[0] || {};

    return {
      activeUsers: data.active_users || 0,
      totalDecks: data.total_decks || 0,
      totalReviews: data.total_reviews || 0,
      passedReviews: data.passed_reviews || 0,
      passRate: Math.round((data.pass_rate || 0) * 10) / 10,
      period: "7 days"
    };
  } catch (error) {
    console.error("Error getting SRS overview:", error);
    return {
      activeUsers: 0,
      totalDecks: 0,
      totalReviews: 0,
      passedReviews: 0,
      passRate: 0,
      period: "7 days"
    };
  }
}

async function getExamAnalytics() {
  try {
    const rows = executeRawSql(`
      SELECT 
        exam_slug,
        COUNT(*) as total_attempts,
        SUM(CASE WHEN score >= (total_questions * 0.7) THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN score < (total_questions * 0.7) THEN 1 ELSE 0 END) as failed,
        AVG((score * 100.0) / NULLIF(total_questions, 0)) as avg_score,
        MAX((score * 100.0) / NULLIF(total_questions, 0)) as max_score,
        MIN((score * 100.0) / NULLIF(total_questions, 0)) as min_score
      FROM exam_attempts
      GROUP BY exam_slug
      ORDER BY total_attempts DESC
    `);
    
    return rows.map((row: any) => ({
      examSlug: row.exam_slug,
      totalAttempts: row.total_attempts || 0,
      passed: row.passed || 0,
      failed: row.failed || 0,
      passRate: row.total_attempts > 0 ? Math.round((row.passed / row.total_attempts) * 100) : 0,
      averageScore: Math.round((row.avg_score || 0) * 10) / 10,
      maxScore: Math.round((row.max_score || 0) * 10) / 10,
      minScore: Math.round((row.min_score || 0) * 10) / 10
    }));
  } catch (error) {
    console.error("Error getting exam analytics:", error);
    return [];
  }
}

function calculateOverallProgress(row: any): number {
  const lessons = row.lessons_completed || 0;
  const quizzes = row.quizzes_completed || 0;
  const score = row.avg_score || 0;
  
  // Simple weighted calculation
  const progressScore = (lessons * 5) + (quizzes * 10) + (score * 0.5);
  return Math.min(100, Math.round(progressScore));
}

export default router;
