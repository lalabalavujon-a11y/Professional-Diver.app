import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { tempStorage } from "./temp-storage";
import { emailMarketing } from "./email-marketing";
import { affiliateService } from "./affiliate-service";
import { registerImportRoutes } from "./routes/import-content";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
// import { AILearningPathService } from "./ai-learning-path";
import { z } from "zod";
// LangChain AI Tutor routes are now handled by ai-tutor.ts router
import { insertLessonSchema, insertInviteSchema, insertAttemptSchema, insertWidgetLocationSchema, insertNavigationWaypointSchema, insertNavigationRouteSchema, widgetLocations, navigationWaypoints, navigationRoutes, users } from "@shared/schema";
import { insertLessonSchema as insertLessonSchemaSQLite, widgetLocations as widgetLocationsSQLite, navigationWaypoints as navigationWaypointsSQLite, navigationRoutes as navigationRoutesSQLite, users as usersSQLite } from "@shared/schema-sqlite";
import { eq, and, desc } from "drizzle-orm";
import { randomBytes, createHash } from "crypto";
import { db } from "./db";
import { registerSrsRoutes } from "./srs-routes";
import { registerEquipmentRoutes } from "./routes/equipment-routes";
import { getWeatherData, timezoneToCoordinates as weatherTimezoneToCoordinates } from "./weather-service";
import { getTideData, timezoneToCoordinates as tidesTimezoneToCoordinates } from "./tides-service";
import { getPorts, getPortsNearLocation } from "./ports-service";
import { getNoticesToMariners } from "./notices-to-mariners-service";
import { 
  getMedicalFacilities, 
  getUserMedicalFacilities, 
  addUserMedicalFacility, 
  removeUserMedicalFacility,
  MedicalFacilityType 
} from "./medical-facilities-service";

// In-memory store for user profile data (for demo purposes)
const userProfileStore = new Map<string, any>();

// Helper function to generate Gravatar URL
function getGravatarUrl(email: string, size: number = 200): string {
  const normalizedEmail = email.trim().toLowerCase();
  const hash = createHash('md5').update(normalizedEmail).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=mp`;
}

// Helper function to get profile picture URL (handles Gravatar)
function getProfilePictureUrl(profilePictureUrl: string | null | undefined, email: string): string | null {
  if (!profilePictureUrl) return null;
  if (profilePictureUrl === 'gravatar') {
    return getGravatarUrl(email);
  }
  return profilePictureUrl;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // SRS (Phase 2–4) routes
  registerSrsRoutes(app);
  
  // Equipment Maintenance routes
  registerEquipmentRoutes(app);

  // Object storage routes
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Local development upload endpoint
  app.post("/api/objects/upload-local/:objectId", async (req, res) => {
    try {
      const { objectId } = req.params;
      const fs = await import('fs');
      const path = await import('path');
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // For now, just return success - the actual file handling would be done by the frontend
      res.json({ 
        success: true, 
        objectId,
        message: "Local upload endpoint - file handling not implemented yet" 
      });
    } catch (error) {
      console.error("Error in local upload:", error);
      res.status(500).json({ error: "Failed to handle local upload" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Auth routes
  app.get("/api/auth/session", async (req, res) => {
    try {
      // This would be handled by Auth.js in a real implementation
      // For now, return mock session or null
      res.json({ user: null });
    } catch (error) {
      res.status(500).json({ error: "Failed to get session" });
    }
  });

  // Enhanced authentication route for credentials
  app.post("/api/auth/credentials", async (req, res) => {
    try {
      const { email, password, rememberMe } = req.body as { email: string; password: string; rememberMe?: boolean };

      // Demo authentication - check against known accounts
      if (email === 'admin@diverwell.app' && password === 'admin123') {
        res.json({ 
          success: true, 
          user: {
            id: 'admin-1',
            name: 'Admin User',
            email: 'admin@diverwell.app',
            role: 'ADMIN',
            subscriptionType: 'LIFETIME'
          },
          rememberMe 
        });
        return;
      }

      // Check for admin users with their specific passwords
      const adminCredentials: Record<string, string> = {
        'lalabalavu.jon@gmail.com': 'admin123',
      };

      if (adminCredentials[email] && password === adminCredentials[email]) {
        res.json({ 
          success: true, 
          user: {
            id: email === 'sephdee@hotmail.com' ? 'super-admin-2' : 'super-admin-1',
            name: 'Admin User',
            email: email,
            role: 'SUPER_ADMIN',
            subscriptionType: 'LIFETIME'
          },
          rememberMe 
        });
        return;
      }

      // Check for lifetime users with their specific passwords
      const lifetimeUserCredentials: Record<string, string> = {
        'eroni2519@gmail.com': 'lifetime123',
        'jone.cirikidaveta@gmail.com': 'lifetime123',
        'jone7898@gmail.com': 'lifetime123',
        'samueltabuya35@gmail.com': 'lifetime123',
        'jone.viti@gmail.com': 'lifetime123',
      };
      
      if (lifetimeUserCredentials[email] && password === lifetimeUserCredentials[email]) {
        res.json({ 
          success: true, 
          user: {
            id: 'lifetime-user',
            name: 'Lifetime Member',
            email: email,
            role: 'USER',
            subscriptionType: 'LIFETIME'
          },
          rememberMe 
        });
        return;
      }

      // Demo trial user
      if (password === 'trial123') {
        res.json({ 
          success: true, 
          user: {
            id: 'trial-user',
            name: 'Trial User',
            email: email,
            role: 'USER',
            subscriptionType: 'TRIAL',
            trialExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          },
          rememberMe 
        });
        return;
      }

      res.status(401).json({ error: "Invalid credentials" });
    } catch (error) {
      console.error("Authentication error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // AI Learning Path Routes
  app.post("/api/learning-path/suggestions", async (req, res) => {
    try {
      const { userId, skillLevel, goals, timeAvailable, preferredLearningStyle, certificationGoals } = req.body;

      const userProgress = {
        userId: userId || 'demo-user',
        completedLessons: [],
        skillLevel: skillLevel || 'intermediate',
        goals: goals || ['certification'],
        weakAreas: ['gas management'],
        strengths: ['safety protocols'],
        timeAvailable: timeAvailable || 10,
        preferredLearningStyle: preferredLearningStyle || 'mixed',
        certificationGoals: certificationGoals || ['NDT Inspector']
      };

      // const suggestion = await aiLearningPathService.generateLearningPath(userProgress);
      res.json({ message: "AI learning path service temporarily disabled" });
    } catch (error) {
      console.error('Error generating learning path suggestions:', error);
      res.status(500).json({ error: "Failed to generate learning path suggestions" });
    }
  });

  app.post("/api/learning-path/analysis", async (req, res) => {
    try {
      const { completedLessons, quizScores } = req.body;
      
      // const analysis = await aiLearningPathService.analyzeLearningStyle(
      //   completedLessons || [],
      //   quizScores || [85, 92, 78, 95]
      // );
      
      res.json({ message: "AI learning style analysis temporarily disabled" });
    } catch (error) {
      console.error('Error analyzing learning style:', error);
      res.status(500).json({ error: "Failed to analyze learning style" });
    }
  });

  app.post("/api/learning-path/career-advice", async (req, res) => {
    try {
      const { userId, skillLevel, goals, certificationGoals } = req.body;

      const userProgress = {
        userId: userId || 'demo-user',
        completedLessons: [],
        skillLevel: skillLevel || 'intermediate',
        goals: goals || ['certification'],
        weakAreas: [],
        strengths: [],
        timeAvailable: 10,
        preferredLearningStyle: 'mixed',
        certificationGoals: certificationGoals || ['NDT Inspector']
      };

      // const advice = await aiLearningPathService.generateCareerAdvice(userProgress);
      res.json({ message: "AI career advice service temporarily disabled" });
    } catch (error) {
      console.error('Error generating career advice:', error);
      res.status(500).json({ error: "Failed to generate career advice" });
    }
  });

  // Tracks routes
  app.get("/api/tracks", async (req, res) => {
    try {
      const tracks = await tempStorage.getAllTracks();
      res.json(tracks);
    } catch (error) {
      console.error('Tracks API error:', error);
      res.status(500).json({ error: "Failed to fetch tracks" });
    }
  });

  app.get("/api/tracks/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const track = await tempStorage.getTrackBySlug(slug);
      
      if (!track) {
        return res.status(404).json({ error: "Track not found" });
      }
      
      res.json(track);
    } catch (error) {
      console.error('Track by slug API error:', error);
      res.status(500).json({ error: "Failed to fetch track" });
    }
  });

  app.get("/api/tracks/:slug/lessons", async (req, res) => {
    try {
      const { slug } = req.params;
      const { db } = await import('./db.js');
      const { tracks, lessons } = await import('@shared/schema-sqlite');
      
      // First get the track
      const track = await db.select().from(tracks).where(eq(tracks.slug, slug)).limit(1);
      if (!track || track.length === 0) {
        return res.status(404).json({ error: "Track not found" });
      }
      
      // Then get all lessons for this track
      const trackLessons = await db.select().from(lessons).where(eq(lessons.trackId, track[0].id)).orderBy(lessons.order);
      
      res.json({
        ...track[0],
        lessons: trackLessons
      });
    } catch (error) {
      console.error('Track lessons API error:', error);
      res.status(500).json({ error: "Failed to fetch track lessons" });
    }
  });

  // Trial signup endpoint
  app.post('/api/trial-signup', async (req, res) => {
    try {
      const { name, email } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }

      if (!email.includes('@')) {
        return res.status(400).json({ error: 'Please enter a valid email address' });
      }

      const user = await tempStorage.createTrialUser({ name, email });
      
      // Send welcome email
      await emailMarketing.sendWelcomeTrialEmail({ name, email });
      
      res.json({ 
        success: true, 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          subscriptionType: user.subscription_type,
          trialExpiresAt: user.trial_expires_at
        }
      });
    } catch (error: any) {
      console.error('Trial signup error:', error);
      if (error.message.includes('already exists')) {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }
      res.status(500).json({ error: 'Failed to create trial account' });
    }
  });

  // Support ticket endpoints
  app.post('/api/support/ticket', async (req, res) => {
    try {
      const { name, email, subject, message, priority = 'medium' } = req.body;
      
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const ticket = {
        userId: 'unknown', // Would be from session in real implementation
        email,
        name,
        subject,
        message,
        priority,
        createdAt: new Date()
      };

      const success = await emailMarketing.sendTicketConfirmation(ticket);
      
      if (success) {
        res.json({ 
          success: true, 
          message: 'Support ticket submitted successfully. You will receive a confirmation email shortly.',
          ticketId: `PDT-${Date.now()}`
        });
      } else {
        res.status(500).json({ error: 'Failed to submit support ticket' });
      }
    } catch (error) {
      console.error('Support ticket error:', error);
      res.status(500).json({ error: 'Failed to submit support ticket' });
    }
  });

  // Request Google review endpoint
  app.post('/api/support/request-review', async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      await emailMarketing.checkAndRequestReview(userId);
      
      res.json({ 
        success: true, 
        message: 'Review request processed successfully'
      });
    } catch (error) {
      console.error('Review request error:', error);
      res.status(500).json({ error: 'Failed to process review request' });
    }
  });

  // Affiliate Program Endpoints
  app.get('/api/affiliate/dashboard', async (req, res) => {
    try {
      // Get user email from query params (same pattern as /api/users/current)
      const email = req.query.email as string;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Get user info to get userId and name (same logic as /api/users/current)
      let userId: string;
      let userName: string;
      
      // Admin account
      if (email === 'lalabalavu.jon@gmail.com') {
        userId = 'admin-1';
        userName = 'Admin User';
      } else {
        // For other users, use email as userId (consistent with current user endpoint)
        userId = email;
        // Extract name from email or use email
        userName = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      }

      // Find or create affiliate for this user
      let affiliate = await affiliateService.getAffiliateByUserId(userId);
      
      if (!affiliate) {
        // Create new affiliate account
        affiliate = await affiliateService.createAffiliate({
          userId: userId,
          name: userName,
          email: email
        });
      }

      // Get dashboard data
      const dashboardData = await affiliateService.getAffiliateDashboard(affiliate.id);
      res.json(dashboardData);
    } catch (error) {
      console.error('Affiliate dashboard error:', error);
      res.status(500).json({ error: 'Failed to load dashboard' });
    }
  });

  app.get('/api/affiliate/leaderboard', async (req, res) => {
    try {
      const leaderboard = await affiliateService.getLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      console.error('Leaderboard error:', error);
      res.status(500).json({ error: 'Failed to load leaderboard' });
    }
  });

  app.post('/api/affiliate/track-click', async (req, res) => {
    try {
      const { affiliateCode, clickData } = req.body;
      
      if (!affiliateCode) {
        return res.status(400).json({ error: 'Affiliate code is required' });
      }

      const click = await affiliateService.trackClick(affiliateCode, clickData);
      res.json({ success: true, clickId: click.id });
    } catch (error) {
      console.error('Click tracking error:', error);
      res.status(500).json({ error: 'Failed to track click' });
    }
  });

  app.post('/api/affiliate/convert', async (req, res) => {
    try {
      const { affiliateCode, referredUserId, subscriptionType, monthlyValue } = req.body;
      
      if (!affiliateCode || !referredUserId || !subscriptionType || !monthlyValue) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const referral = await affiliateService.processReferral({
        affiliateCode,
        referredUserId,
        subscriptionType,
        monthlyValue
      });

      res.json({ success: true, referral });
    } catch (error) {
      console.error('Conversion tracking error:', error);
      res.status(500).json({ error: 'Failed to process conversion' });
    }
  });

  app.post('/api/affiliate/create', async (req, res) => {
    try {
      const { userId, name, email } = req.body;
      
      if (!userId || !name || !email) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const affiliate = await affiliateService.createAffiliate({ userId, name, email });
      res.json({ success: true, affiliate });
    } catch (error) {
      console.error('Affiliate creation error:', error);
      res.status(500).json({ error: 'Failed to create affiliate account' });
    }
  });

  // Learning Path AI Routes
  app.post('/api/learning-path/generate', async (req, res) => {
    try {
      const { profile, additionalInfo } = req.body;
      
      if (!profile || !profile.experience || !profile.goals || profile.goals.length === 0) {
        return res.status(400).json({ error: 'Profile with experience and goals is required' });
      }

      // const aiLearningPathService = new AILearningPathService();
      // const suggestions = await aiLearningPathService.generateLearningPath(profile, additionalInfo);
      
      res.json({ suggestions: [], message: "AI learning path service temporarily disabled" });
    } catch (error) {
      console.error('Learning path generation error:', error);
      res.status(500).json({ error: 'Failed to generate learning path suggestions' });
    }
  });

  app.get('/api/learning-path/suggestions', async (req, res) => {
    try {
      // For the demo, return mock suggestions based on query parameters
      const { experience, goals } = req.query;
      
      if (!experience || !goals) {
        return res.json([]);
      }

      // Return sample suggestions for now
      const mockSuggestions = [
        {
          id: "foundation-path",
          title: "Commercial Diving Foundation",
          description: "Essential certifications for starting your commercial diving career",
          difficulty: "Beginner",
          estimatedWeeks: 16,
          tracks: [
            {
              id: "1",
              title: "Assistant Life Support Technician",
              slug: "air-diving-life-support-technician",
              order: 1,
              reason: "Foundation certification required for all commercial diving operations"
            },
            {
              id: "2", 
              title: "Life Support Technician (LST)",
              slug: "life-support-technician",
              order: 2,
              reason: "Advanced life support systems management and safety protocols"
            }
          ],
          confidence: 92,
          reasoning: "Based on your beginner experience level and commercial diving goals, this path provides the essential foundation certifications required by industry standards."
        }
      ];
      
      res.json(mockSuggestions);
    } catch (error) {
      console.error('Learning path suggestions error:', error);
      res.status(500).json({ error: 'Failed to fetch learning path suggestions' });
    }
  });

  // Get current user (mock endpoint for trial)
  app.get('/api/current-user', async (req, res) => {
    try {
      // For now, return a mock trial user
      const mockTrialUser = {
        id: 'trial-user-1',
        name: 'Trial User',
        email: 'trial@example.com',
        subscriptionType: 'TRIAL',
        trialExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        subscriptionStatus: 'ACTIVE'
      };
      res.json(mockTrialUser);
    } catch (error) {
      console.error('Error fetching current user:', error);
      res.status(500).json({ error: 'Failed to fetch user data' });
    }
  });

  // Lessons routes
  app.get("/api/lessons/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const lesson = await tempStorage.getLessonById(id);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error) {
      console.error('Lesson API error:', error);
      res.status(500).json({ error: "Failed to fetch lesson" });
    }
  });

  app.patch("/api/lessons/:id", async (req, res) => {
    try {
      const { id } = req.params;
      // Validate with SQLite schema since tempStorage uses SQLite
      const updateData = insertLessonSchemaSQLite.partial().parse(req.body);
      // Use tempStorage to match the GET endpoint and work with current database
      const lesson = await tempStorage.updateLesson(id, updateData);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error) {
      console.error('Lesson update error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update lesson" });
    }
  });

  // Quiz routes
  app.get("/api/quizzes/lesson/:lessonId", async (req, res) => {
    try {
      const { lessonId } = req.params;
      const quiz = await tempStorage.getQuizByLessonId(lessonId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error) {
      console.error('Quiz API error:', error);
      res.status(500).json({ error: "Failed to fetch quiz" });
    }
  });

  app.post("/api/quiz-attempts", async (req, res) => {
    try {
      const env = process.env.NODE_ENV ?? "development";
      const isSQLiteDev = env === "development";

      // SQLite dev writes to `quiz_attempts` (used by the analytics dashboard).
      if (isSQLiteDev) {
        const quizAttemptInput = z.object({
          userId: z.string().min(1),
          quizId: z.string().min(1),
          score: z.number().int().min(0),
          timeSpent: z.number().int().min(0).optional(),
          answers: z.string().optional(),
        });

        const parsed = quizAttemptInput.parse(req.body);
        const id = randomBytes(16).toString("hex");
        const completedAt = Date.now();

        await db.execute(
          `
          INSERT INTO quiz_attempts (id, user_id, quiz_id, score, time_spent, completed_at, answers)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          `,
          [
            id,
            parsed.userId,
            parsed.quizId,
            parsed.score,
            parsed.timeSpent ?? null,
            completedAt,
            parsed.answers ?? null,
          ],
        );

        res.status(201).json({ id, ...parsed, completedAt });
        return;
      }

      // Production (PostgreSQL) — keep existing behavior.
      const attemptData = insertAttemptSchema.parse(req.body);
      const attempt = await storage.createAttempt(attemptData);
      res.status(201).json(attempt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create attempt" });
    }
  });

  // Full exam attempts (used by the "Exam Interface" page)
  app.post("/api/exam-attempts", async (req, res) => {
    try {
      const env = process.env.NODE_ENV ?? "development";
      const isSQLiteDev = env === "development";

      if (!isSQLiteDev) {
        res.status(501).json({ error: "Exam attempts not implemented for production yet" });
        return;
      }

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

      const examAttemptInput = z.object({
        userId: z.string().min(1),
        examSlug: z.string().min(1),
        score: z.number().int().min(0),
        totalQuestions: z.number().int().min(0),
        timeSpent: z.number().int().min(0).optional(),
        answers: z.string().optional(),
      });

      const parsed = examAttemptInput.parse(req.body);
      const id = randomBytes(16).toString("hex");
      const completedAt = Date.now();

      await db.execute(
        `
        INSERT INTO exam_attempts (id, user_id, exam_slug, score, total_questions, time_spent, completed_at, answers)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          id,
          parsed.userId,
          parsed.examSlug,
          parsed.score,
          parsed.totalQuestions,
          parsed.timeSpent ?? null,
          completedAt,
          parsed.answers ?? null,
        ],
      );

      res.status(201).json({ id, ...parsed, completedAt });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Exam attempt create error:", error);
      res.status(500).json({ error: "Failed to create exam attempt" });
    }
  });

  // Client Management routes
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await tempStorage.getAllClients();
      res.json(clients);
    } catch (error) {
      console.error('Get clients API error:', error);
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const client = await tempStorage.createClient(req.body);
      res.json(client);
    } catch (error) {
      console.error('Create client API error:', error);
      res.status(500).json({ error: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const client = await tempStorage.updateClient(req.params.id, req.body);
      res.json(client);
    } catch (error) {
      console.error('Update client API error:', error);
      res.status(500).json({ error: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const result = await tempStorage.deleteClient(req.params.id);
      res.json(result);
    } catch (error) {
      console.error('Delete client API error:', error);
      res.status(500).json({ error: "Failed to delete client" });
    }
  });

  app.get("/api/clients/stats", async (req, res) => {
    try {
      const stats = await tempStorage.getClientStats();
      res.json(stats);
    } catch (error) {
      console.error('Client stats API error:', error);
      res.status(500).json({ error: "Failed to fetch client stats" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/quiz", async (req, res) => {
    try {
      const analytics = await tempStorage.getQuizAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error('Quiz analytics API error:', error);
      res.status(500).json({ error: "Failed to fetch quiz analytics" });
    }
  });

  // User progress routes
  app.get("/api/users/current/progress", async (req, res) => {
    try {
      // For now, return empty progress since we don't have user auth
      const progress = await tempStorage.getUserProgress("temp-user");
      res.json(progress);
    } catch (error) {
      console.error('User progress API error:', error);
      res.status(500).json({ error: "Failed to fetch user progress" });
    }
  });

  // Admin routes
  app.get("/api/admin/invites", async (req, res) => {
    try {
      const invites = await tempStorage.getAllInvites();
      res.json(invites);
    } catch (error) {
      console.error('Admin invites API error:', error);
      res.status(500).json({ error: "Failed to fetch invites" });
    }
  });

  app.post("/api/admin/invites", async (req, res) => {
    try {
      const inviteData = insertInviteSchema.parse(req.body);
      const invite = await storage.createInvite(inviteData);
      res.status(201).json(invite);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create invite" });
    }
  });

  app.delete("/api/admin/invites/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteInvite(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete invite" });
    }
  });

  // Object storage routes
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof Error && error.name === 'ObjectNotFoundError') {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Profile update routes
  app.put("/api/users/profile", async (req, res) => {
    try {
      const { name, email, phone, bio, company, jobTitle, location, currentEmail } = req.body;
      const userEmail = req.headers['x-user-email'] || currentEmail || email;
      
      if (!userEmail) {
        return res.status(400).json({ error: "User email is required" });
      }

      // Get existing profile or create new one
      const existingProfile = userProfileStore.get(userEmail) || {};
      
      // Update profile data
      const updatedProfile = {
        ...existingProfile,
        name: name || existingProfile.name || '',
        email: email || userEmail,
        phone: phone !== undefined ? phone : existingProfile.phone || '',
        bio: bio !== undefined ? bio : existingProfile.bio || '',
        company: company !== undefined ? company : existingProfile.company || '',
        jobTitle: jobTitle !== undefined ? jobTitle : existingProfile.jobTitle || '',
        location: location !== undefined ? location : existingProfile.location || '',
        updatedAt: new Date().toISOString(),
      };

      // Store updated profile
      userProfileStore.set(userEmail, updatedProfile);

      // Determine role and subscription type
      const role = userEmail === 'lalabalavu.jon@gmail.com' ? 'ADMIN' : 'USER';
      const subscriptionType = userEmail === 'lalabalavu.jon@gmail.com' ? 'LIFETIME' : 'TRIAL';

      const updatedUser = {
        id: userEmail === 'lalabalavu.jon@gmail.com' ? 'admin-1' : 'user-1',
        ...updatedProfile,
        role,
        subscriptionType,
      };

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.put("/api/users/profile-picture", async (req, res) => {
    try {
      const { profilePictureURL } = req.body;
      const userEmail = req.headers['x-user-email'] as string;
      
      if (!profilePictureURL) {
        return res.status(400).json({ error: "Profile picture URL is required" });
      }

      if (!userEmail) {
        return res.status(400).json({ error: "User email is required" });
      }

      // Handle profile picture URL (gravatar, data URLs, or object storage URLs)
      let normalizedPath = profilePictureURL;
      
      // If it's not "gravatar" and not a data URL, normalize object storage URLs
      if (profilePictureURL !== 'gravatar' && !profilePictureURL.startsWith('data:')) {
        const objectStorageService = new ObjectStorageService();
        normalizedPath = objectStorageService.normalizeObjectEntityPath(profilePictureURL);
      }

      // Get existing profile or create new one
      const existingProfile = userProfileStore.get(userEmail) || {};
      
      // Update profile picture
      const updatedProfile = {
        ...existingProfile,
        profilePictureUrl: normalizedPath,
        updatedAt: new Date().toISOString(),
      };

      // Store updated profile
      userProfileStore.set(userEmail, updatedProfile);

      // Determine role and subscription type
      const role = userEmail === 'lalabalavu.jon@gmail.com' ? 'ADMIN' : 'USER';
      const subscriptionType = userEmail === 'lalabalavu.jon@gmail.com' ? 'LIFETIME' : 'TRIAL';

      const updatedUser = {
        id: userEmail === 'lalabalavu.jon@gmail.com' ? 'admin-1' : 'user-1',
        ...updatedProfile,
        name: existingProfile.name || (userEmail === 'lalabalavu.jon@gmail.com' ? 'Admin User' : 'User'),
        email: userEmail,
        role,
        subscriptionType,
        profilePictureUrl: getProfilePictureUrl(normalizedPath, userEmail), // Convert "gravatar" to actual URL
      };

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile picture:", error);
      res.status(500).json({ error: "Failed to update profile picture" });
    }
  });

  // Current user route
  app.get("/api/users/current", async (req, res) => {
    try {
      const email = req.query.email as string;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Get stored profile data
      const storedProfile = userProfileStore.get(email) || {};
      
      // Base user data
      let baseUser: any;
      
      // Admin account
      if (email === 'lalabalavu.jon@gmail.com') {
        baseUser = {
          id: 'admin-1',
          name: storedProfile.name || 'Admin User',
          email: 'lalabalavu.jon@gmail.com',
          role: 'ADMIN',
          subscriptionType: 'LIFETIME',
          subscriptionDate: new Date('2024-01-01').toISOString(),
          trialExpiresAt: null,
          createdAt: storedProfile.createdAt || new Date('2024-01-01').toISOString(),
        };
      }
      // Lifetime access users
      else if (['eroni2519@gmail.com', 'jone.cirikidaveta@gmail.com', 'jone7898@gmail.com', 'samueltabuya35@gmail.com', 'jone.viti@gmail.com'].includes(email)) {
        baseUser = {
          id: 'lifetime-user',
          name: storedProfile.name || 'Lifetime Member',
          email: email,
          role: 'LIFETIME',
          subscriptionType: 'LIFETIME',
          subscriptionDate: new Date('2024-01-01').toISOString(),
          trialExpiresAt: null,
          createdAt: storedProfile.createdAt || new Date('2024-01-01').toISOString(),
        };
      }
      // Default trial user
      else {
        baseUser = {
          id: 'trial-user',
          name: storedProfile.name || 'Trial User',
          email: email,
          role: 'USER',
          subscriptionType: 'TRIAL',
          subscriptionDate: null,
          trialExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          createdAt: storedProfile.createdAt || new Date().toISOString(),
        };
      }

      // Merge with stored profile data
      const user = {
        ...baseUser,
        phone: storedProfile.phone || '',
        bio: storedProfile.bio || '',
        company: storedProfile.company || '',
        jobTitle: storedProfile.jobTitle || '',
        location: storedProfile.location || '',
        profilePictureUrl: getProfilePictureUrl(storedProfile.profilePictureUrl, email),
        updatedAt: storedProfile.updatedAt || baseUser.createdAt,
      };

      res.json(user);
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ error: "Failed to fetch current user" });
    }
  });

  // User progress routes
  app.get("/api/users/:userId/progress", async (req, res) => {
    try {
      const { userId } = req.params;
      const progress = await storage.getUserProgress(userId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user progress" });
    }
  });

  app.post("/api/users/:userId/progress", async (req, res) => {
    try {
      const { userId } = req.params;
      const { lessonId } = req.body;
      const progress = await storage.markLessonComplete(userId, lessonId);
      res.status(201).json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark lesson complete" });
    }
  });

  // Invite validation route
  app.get("/api/invites/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const invite = await storage.getInviteByToken(token);
      if (!invite || invite.usedAt || new Date() > invite.expiresAt) {
        return res.status(404).json({ error: "Invalid or expired invite" });
      }
      res.json(invite);
    } catch (error) {
      res.status(500).json({ error: "Failed to validate invite" });
    }
  });

  // Laura Oracle routes
  app.post("/api/laura-oracle/chat", async (req, res) => {
    try {
      const { chatWithLauraOracle } = await import('./api/laura-oracle');
      await chatWithLauraOracle(req, res);
    } catch (error) {
      console.error('Laura Oracle chat error:', error);
      res.status(500).json({ error: 'Laura Oracle service unavailable' });
    }
  });

  app.get("/api/laura-oracle/analytics", async (req, res) => {
    try {
      const { getPlatformAnalytics } = await import('./api/laura-oracle');
      await getPlatformAnalytics(req, res);
    } catch (error) {
      console.error('Laura Oracle analytics error:', error);
      res.status(500).json({ error: 'Laura Oracle analytics unavailable' });
    }
  });

  app.post("/api/laura-oracle/admin-task", async (req, res) => {
    try {
      const { executeAdminTask } = await import('./api/laura-oracle');
      await executeAdminTask(req, res);
    } catch (error) {
      console.error('Laura Oracle admin task error:', error);
      res.status(500).json({ error: 'Laura Oracle admin service unavailable' });
    }
  });

  app.post("/api/laura-oracle/learn-objectives", async (req, res) => {
    try {
      const { learnFromObjectives } = await import('./api/laura-oracle');
      await learnFromObjectives(req, res);
    } catch (error) {
      console.error('Laura Oracle learning error:', error);
      res.status(500).json({ error: 'Laura Oracle learning service unavailable' });
    }
  });

  app.get("/api/laura-oracle/info", async (req, res) => {
    try {
      const { getLauraOracleInfo } = await import('./api/laura-oracle');
      await getLauraOracleInfo(req, res);
    } catch (error) {
      console.error('Laura Oracle info error:', error);
      res.status(500).json({ error: 'Laura Oracle info unavailable' });
    }
  });

  app.post("/api/laura-oracle/voice", async (req, res) => {
    try {
      const { generateVoiceResponse } = await import('./api/laura-oracle');
      await generateVoiceResponse(req, res);
    } catch (error) {
      console.error('Laura Oracle voice error:', error);
      res.status(500).json({ error: 'Laura Oracle voice service unavailable' });
    }
  });

  // Diver Well routes
  app.post("/api/diver-well/chat", async (req, res) => {
    try {
      const { chatWithDiverWell } = await import('./api/diver-well');
      await chatWithDiverWell(req, res);
    } catch (error) {
      console.error('Diver Well chat error:', error);
      res.status(500).json({ error: 'Diver Well service unavailable' });
    }
  });

  app.get("/api/diver-well/info", async (req, res) => {
    try {
      const { getDiverWellInfo } = await import('./api/diver-well');
      await getDiverWellInfo(req, res);
    } catch (error) {
      console.error('Diver Well info error:', error);
      res.status(500).json({ error: 'Diver Well info unavailable' });
    }
  });

  app.post("/api/diver-well/voice", async (req, res) => {
    try {
      const { generateVoiceResponse } = await import('./api/diver-well');
      await generateVoiceResponse(req, res);
    } catch (error) {
      console.error('Diver Well voice error:', error);
      res.status(500).json({ error: 'Diver Well voice service unavailable' });
    }
  });

  // Register import routes for GitHub repository content
  registerImportRoutes(app);

  // User progress routes
  app.get("/api/users/:userId/progress", async (req, res) => {
    try {
      const { userId } = req.params;
      const progress = await storage.getUserProgress(userId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user progress" });
    }
  });

  app.post("/api/users/:userId/progress", async (req, res) => {
    try {
      const { userId } = req.params;
      const { lessonId } = req.body;
      const progress = await storage.markLessonComplete(userId, lessonId);
      res.status(201).json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark lesson complete" });
    }
  });

  // Invite validation route
  app.get("/api/invites/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const invite = await storage.getInviteByToken(token);
      if (!invite || invite.usedAt || new Date() > invite.expiresAt) {
        return res.status(404).json({ error: "Invalid or expired invite" });
      }
      res.json(invite);
    } catch (error) {
      res.status(500).json({ error: "Failed to validate invite" });
    }
  });

  // Laura Oracle routes
  app.post("/api/laura-oracle/chat", async (req, res) => {
    try {
      const { chatWithLauraOracle } = await import('./api/laura-oracle');
      await chatWithLauraOracle(req, res);
    } catch (error) {
      console.error('Laura Oracle chat error:', error);
      res.status(500).json({ error: 'Laura Oracle service unavailable' });
    }
  });

  app.get("/api/laura-oracle/analytics", async (req, res) => {
    try {
      const { getPlatformAnalytics } = await import('./api/laura-oracle');
      await getPlatformAnalytics(req, res);
    } catch (error) {
      console.error('Laura Oracle analytics error:', error);
      res.status(500).json({ error: 'Laura Oracle analytics unavailable' });
    }
  });

  app.post("/api/laura-oracle/admin-task", async (req, res) => {
    try {
      const { executeAdminTask } = await import('./api/laura-oracle');
      await executeAdminTask(req, res);
    } catch (error) {
      console.error('Laura Oracle admin task error:', error);
      res.status(500).json({ error: 'Laura Oracle admin service unavailable' });
    }
  });

  app.post("/api/laura-oracle/learn-objectives", async (req, res) => {
    try {
      const { learnFromObjectives } = await import('./api/laura-oracle');
      await learnFromObjectives(req, res);
    } catch (error) {
      console.error('Laura Oracle learning error:', error);
      res.status(500).json({ error: 'Laura Oracle learning service unavailable' });
    }
  });

  app.get("/api/laura-oracle/info", async (req, res) => {
    try {
      const { getLauraOracleInfo } = await import('./api/laura-oracle');
      await getLauraOracleInfo(req, res);
    } catch (error) {
      console.error('Laura Oracle info error:', error);
      res.status(500).json({ error: 'Laura Oracle info unavailable' });
    }
  });

  app.post("/api/laura-oracle/voice", async (req, res) => {
    try {
      const { generateVoiceResponse } = await import('./api/laura-oracle');
      await generateVoiceResponse(req, res);
    } catch (error) {
      console.error('Laura Oracle voice error:', error);
      res.status(500).json({ error: 'Laura Oracle voice service unavailable' });
    }
  });

  // Diver Well routes
  app.post("/api/diver-well/chat", async (req, res) => {
    try {
      const { chatWithDiverWell } = await import('./api/diver-well');
      await chatWithDiverWell(req, res);
    } catch (error) {
      console.error('Diver Well chat error:', error);
      res.status(500).json({ error: 'Diver Well service unavailable' });
    }
  });

  app.get("/api/diver-well/info", async (req, res) => {
    try {
      const { getDiverWellInfo } = await import('./api/diver-well');
      await getDiverWellInfo(req, res);
    } catch (error) {
      console.error('Diver Well info error:', error);
      res.status(500).json({ error: 'Diver Well info unavailable' });
    }
  });

  app.post("/api/diver-well/voice", async (req, res) => {
    try {
      const { generateVoiceResponse } = await import('./api/diver-well');
      await generateVoiceResponse(req, res);
    } catch (error) {
      console.error('Diver Well voice error:', error);
      res.status(500).json({ error: 'Diver Well voice service unavailable' });
    }
  });

  // Register import routes for GitHub repository content
  registerImportRoutes(app);

  // Helper function to get user ID from email
  async function getUserIdFromEmail(email: string): Promise<string | null> {
    try {
      const env = process.env.NODE_ENV ?? 'development';
      const hasDatabaseUrl = !!process.env.DATABASE_URL;
      const usersTable = (env === 'development' && !hasDatabaseUrl) ? usersSQLite : users;
      
      const user = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
      if (user.length > 0) {
        return user[0].id;
      }
      // If user doesn't exist, return a fallback based on email
      if (email === 'lalabalavu.jon@gmail.com') {
        return 'admin-1';
      }
      // For other users, try to create a user or use email as fallback
      return email; // Fallback to email as ID
    } catch (error) {
      console.error('Error getting user ID from email:', error);
      return email; // Fallback to email
    }
  }

  // Helper function to get widget locations table based on environment
  function getWidgetLocationsTable() {
    const env = process.env.NODE_ENV ?? 'development';
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    return (env === 'development' && !hasDatabaseUrl) ? widgetLocationsSQLite : widgetLocations;
  }

  function getNavigationWaypointsTable() {
    const env = process.env.NODE_ENV ?? 'development';
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    return (env === 'development' && !hasDatabaseUrl) ? navigationWaypointsSQLite : navigationWaypoints;
  }

  function getNavigationRoutesTable() {
    const env = process.env.NODE_ENV ?? 'development';
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    return (env === 'development' && !hasDatabaseUrl) ? navigationRoutesSQLite : navigationRoutes;
  }

  // Widget location API endpoints
  app.get("/api/widgets/location", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const userId = await getUserIdFromEmail(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const widgetLocationsTable = getWidgetLocationsTable();
      const locations = await db
        .select()
        .from(widgetLocationsTable)
        .where(eq(widgetLocationsTable.userId, userId))
        .orderBy(desc(widgetLocationsTable.updatedAt))
        .limit(1);

      if (locations.length === 0) {
        return res.status(404).json({ error: "No widget location found" });
      }

      res.json(locations[0]);
    } catch (error) {
      console.error("Error fetching widget location:", error);
      res.status(500).json({ error: "Failed to fetch widget location" });
    }
  });

  app.post("/api/widgets/location", async (req, res) => {
    try {
      const email = (req.body.email as string) || (req.headers['x-user-email'] as string);
      const { latitude, longitude, locationName, isCurrentLocation } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ error: "Valid latitude and longitude are required" });
      }

      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({ error: "Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180" });
      }

      const userId = await getUserIdFromEmail(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const widgetLocationsTable = getWidgetLocationsTable();
      
      console.log('Saving widget location:', {
        email,
        userId,
        latitude,
        longitude,
        locationName,
        isCurrentLocation,
        table: widgetLocationsTable === widgetLocationsSQLite ? 'SQLite' : 'PostgreSQL'
      });
      
      // Check if location already exists for this user
      const existing = await db
        .select()
        .from(widgetLocationsTable)
        .where(eq(widgetLocationsTable.userId, userId))
        .limit(1);

      console.log('Existing locations:', existing.length);

      let location;
      if (existing.length > 0) {
        // Update existing location
        console.log('Updating existing location:', existing[0].id);
        const updateResult = await db
          .update(widgetLocationsTable)
          .set({
            latitude,
            longitude,
            locationName: locationName || null,
            isCurrentLocation: isCurrentLocation || false,
            updatedAt: new Date(),
          })
          .where(eq(widgetLocationsTable.id, existing[0].id))
          .returning();
        
        if (updateResult && updateResult.length > 0) {
          location = updateResult[0];
        } else {
          // If returning doesn't work, fetch the updated record
          const [updated] = await db
            .select()
            .from(widgetLocationsTable)
            .where(eq(widgetLocationsTable.id, existing[0].id))
            .limit(1);
          location = updated;
        }
        console.log('Updated location:', location);
      } else {
        // Create new location
        console.log('Creating new location');
        const insertData = {
          userId,
          latitude,
          longitude,
          locationName: locationName || null,
          isCurrentLocation: isCurrentLocation || false,
        };
        const insertResult = await db
          .insert(widgetLocationsTable)
          .values(insertData)
          .returning();
        
        if (insertResult && insertResult.length > 0) {
          location = insertResult[0];
        } else {
          // If returning doesn't work, fetch the created record
          const created = await db
            .select()
            .from(widgetLocationsTable)
            .where(eq(widgetLocationsTable.userId, userId))
            .orderBy(desc(widgetLocationsTable.createdAt))
            .limit(1);
          location = created[0];
        }
        console.log('Created location:', location);
      }

      res.json(location);
    } catch (error: any) {
      console.error("Error saving widget location:", error);
      const errorMessage = error?.message || error?.toString() || "Unknown error";
      console.error("Error details:", {
        message: errorMessage,
        stack: error?.stack,
        body: req.body
      });
      res.status(500).json({ 
        error: "Failed to save widget location",
        details: errorMessage 
      });
    }
  });

  app.post("/api/widgets/location/gps", async (req, res) => {
    try {
      const email = (req.body.email as string) || (req.headers['x-user-email'] as string);
      const { latitude, longitude, locationName } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ error: "Valid latitude and longitude are required" });
      }

      const userId = await getUserIdFromEmail(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const widgetLocationsTable = getWidgetLocationsTable();
      
      // Check if location already exists for this user
      const existing = await db
        .select()
        .from(widgetLocationsTable)
        .where(eq(widgetLocationsTable.userId, userId))
        .limit(1);

      let location;
      if (existing.length > 0) {
        // Update existing location
        const [updated] = await db
          .update(widgetLocationsTable)
          .set({
            latitude,
            longitude,
            locationName: locationName || "Current Location",
            isCurrentLocation: true,
            updatedAt: new Date(),
          })
          .where(eq(widgetLocationsTable.id, existing[0].id))
          .returning();
        location = updated;
      } else {
        // Create new location
        const insertData = {
          userId,
          latitude,
          longitude,
          locationName: locationName || "Current Location",
          isCurrentLocation: true,
        };
        const [created] = await db
          .insert(widgetLocationsTable)
          .values(insertData)
          .returning();
        location = created;
      }

      res.json(location);
    } catch (error) {
      console.error("Error saving GPS location:", error);
      res.status(500).json({ error: "Failed to save GPS location" });
    }
  });

  // Navigation waypoints API endpoints
  app.get("/api/navigation/waypoints", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const userId = await getUserIdFromEmail(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const waypointsTable = getNavigationWaypointsTable();
      const waypoints = await db
        .select()
        .from(waypointsTable)
        .where(eq(waypointsTable.userId, userId))
        .orderBy(waypointsTable.createdAt);

      res.json(waypoints);
    } catch (error) {
      console.error("Error fetching waypoints:", error);
      res.status(500).json({ error: "Failed to fetch waypoints" });
    }
  });

  app.post("/api/navigation/waypoints", async (req, res) => {
    try {
      const email = (req.body.email as string) || (req.headers['x-user-email'] as string);
      const { name, latitude, longitude, description } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      if (!name || typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ error: "Name, latitude, and longitude are required" });
      }

      const userId = await getUserIdFromEmail(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const waypointsTable = getNavigationWaypointsTable();
      const insertData = {
        userId,
        name,
        latitude,
        longitude,
        description: description || null,
      };

      const [waypoint] = await db
        .insert(waypointsTable)
        .values(insertData)
        .returning();

      res.status(201).json(waypoint);
    } catch (error) {
      console.error("Error creating waypoint:", error);
      res.status(500).json({ error: "Failed to create waypoint" });
    }
  });

  app.delete("/api/navigation/waypoints/:id", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const { id } = req.params;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const userId = await getUserIdFromEmail(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const waypointsTable = getNavigationWaypointsTable();
      const deleted = await db
        .delete(waypointsTable)
        .where(and(eq(waypointsTable.id, id), eq(waypointsTable.userId, userId)))
        .returning();

      if (deleted.length === 0) {
        return res.status(404).json({ error: "Waypoint not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting waypoint:", error);
      res.status(500).json({ error: "Failed to delete waypoint" });
    }
  });

  // Navigation routes API endpoints
  app.get("/api/navigation/routes", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const userId = await getUserIdFromEmail(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const routesTable = getNavigationRoutesTable();
      const routes = await db
        .select()
        .from(routesTable)
        .where(eq(routesTable.userId, userId))
        .orderBy(routesTable.createdAt);

      res.json(routes);
    } catch (error) {
      console.error("Error fetching routes:", error);
      res.status(500).json({ error: "Failed to fetch routes" });
    }
  });

  app.post("/api/navigation/routes", async (req, res) => {
    try {
      const email = (req.body.email as string) || (req.headers['x-user-email'] as string);
      const { name, waypointIds, description } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      if (!name || !Array.isArray(waypointIds) || waypointIds.length === 0) {
        return res.status(400).json({ error: "Name and waypointIds array are required" });
      }

      const userId = await getUserIdFromEmail(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const routesTable = getNavigationRoutesTable();
      const insertData = {
        userId,
        name,
        waypointIds: Array.isArray(waypointIds) ? waypointIds : JSON.parse(waypointIds),
        description: description || null,
      };

      const [route] = await db
        .insert(routesTable)
        .values(insertData)
        .returning();

      res.status(201).json(route);
    } catch (error) {
      console.error("Error creating route:", error);
      res.status(500).json({ error: "Failed to create route" });
    }
  });

  app.delete("/api/navigation/routes/:id", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const { id } = req.params;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const userId = await getUserIdFromEmail(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const routesTable = getNavigationRoutesTable();
      const deleted = await db
        .delete(routesTable)
        .where(and(eq(routesTable.id, id), eq(routesTable.userId, userId)))
        .returning();

      if (deleted.length === 0) {
        return res.status(404).json({ error: "Route not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting route:", error);
      res.status(500).json({ error: "Failed to delete route" });
    }
  });

  // Weather API endpoint
  app.get("/api/weather", async (req, res) => {
    try {
      let lat = parseFloat(req.query.lat as string);
      let lon = parseFloat(req.query.lon as string);
      const timezone = (req.query.timezone as string) || 'UTC';
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);

      // If coordinates not provided, try to get from saved location
      if ((isNaN(lat) || isNaN(lon)) && email) {
        try {
          const userId = await getUserIdFromEmail(email);
          if (userId) {
            const widgetLocationsTable = getWidgetLocationsTable();
            const locations = await db
              .select()
              .from(widgetLocationsTable)
              .where(eq(widgetLocationsTable.userId, userId))
              .orderBy(desc(widgetLocationsTable.updatedAt))
              .limit(1);
            
            if (locations.length > 0) {
              lat = locations[0].latitude;
              lon = locations[0].longitude;
            }
          }
        } catch (error) {
          console.error("Error fetching saved location:", error);
          // Continue with fallback to timezone
        }
      }

      // Validate coordinates or convert from timezone
      let finalLat = lat;
      let finalLon = lon;

      if (isNaN(lat) || isNaN(lon)) {
        // Try to get coordinates from timezone
        const coords = weatherTimezoneToCoordinates(timezone);
        if (coords) {
          finalLat = coords.lat;
          finalLon = coords.lon;
        } else {
          return res.status(400).json({ 
            error: "Latitude and longitude are required, or provide a valid timezone, or set a widget location" 
          });
        }
      }

      const weatherData = await getWeatherData(finalLat, finalLon, timezone);

      if (!weatherData) {
        return res.status(503).json({ 
          error: "Weather data unavailable. Please check API configuration." 
        });
      }

      res.json(weatherData);
    } catch (error) {
      console.error("Error in weather endpoint:", error);
      res.status(500).json({ error: "Failed to fetch weather data" });
    }
  });

  // Tides API endpoint
  app.get("/api/tides", async (req, res) => {
    try {
      let lat = parseFloat(req.query.lat as string);
      let lon = parseFloat(req.query.lon as string);
      const timezone = (req.query.timezone as string) || 'UTC';
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);

      // If coordinates not provided, try to get from saved location
      if ((isNaN(lat) || isNaN(lon)) && email) {
        try {
          const userId = await getUserIdFromEmail(email);
          if (userId) {
            const widgetLocationsTable = getWidgetLocationsTable();
            const locations = await db
              .select()
              .from(widgetLocationsTable)
              .where(eq(widgetLocationsTable.userId, userId))
              .orderBy(desc(widgetLocationsTable.updatedAt))
              .limit(1);
            
            if (locations.length > 0) {
              lat = locations[0].latitude;
              lon = locations[0].longitude;
            }
          }
        } catch (error) {
          console.error("Error fetching saved location:", error);
          // Continue with fallback to timezone
        }
      }

      // Validate coordinates or convert from timezone
      let finalLat = lat;
      let finalLon = lon;

      if (isNaN(lat) || isNaN(lon)) {
        // Try to get coordinates from timezone
        const coords = tidesTimezoneToCoordinates(timezone);
        if (coords) {
          finalLat = coords.lat;
          finalLon = coords.lon;
        } else {
          return res.status(400).json({ 
            error: "Latitude and longitude are required, or provide a valid timezone, or set a widget location" 
          });
        }
      }

      const tideData = await getTideData(finalLat, finalLon, timezone);

      if (!tideData) {
        return res.status(503).json({ 
          error: "Tide data unavailable. Please check API configuration." 
        });
      }

      res.json(tideData);
    } catch (error) {
      console.error("Error in tides endpoint:", error);
      res.status(500).json({ error: "Failed to fetch tide data" });
    }
  });

  // AIS Vessels API endpoint
  app.get("/api/ais/vessels", async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      const radius = parseFloat(req.query.radius as string) || 10; // Default 10 nautical miles

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
      }

      // For now, return mock/demo data
      // In production, this would connect to a real AIS API service
      // Options include: MarineTraffic API, VesselFinder API, or other AIS providers
      
      const vessels = generateMockAISVessels(lat, lon, radius);

      res.json({ vessels });
    } catch (error) {
      console.error("Error in AIS vessels endpoint:", error);
      res.status(500).json({ error: "Failed to fetch AIS data" });
    }
  });

  // Helper function to generate mock AIS vessels for demonstration
  function generateMockAISVessels(lat: number, lon: number, radius: number): any[] {
    const vessels: any[] = [];
    const shipNames = ['Ocean Explorer', 'Sea Breeze', 'Maritime Star', 'Coastal Voyager', 'Harbor Master', 'Blue Horizon'];
    const shipTypes = ['Cargo', 'Tanker', 'Container', 'Fishing', 'Passenger', 'Tug'];

    const count = Math.floor(Math.random() * 5) + 3; // 3-7 vessels

    for (let i = 0; i < count; i++) {
      const distance = Math.random() * radius;
      const bearing = Math.random() * 360;
      const offsetLat = (distance / 60) * Math.cos(bearing * Math.PI / 180);
      const offsetLon = (distance / (60 * Math.cos(lat * Math.PI / 180))) * Math.sin(bearing * Math.PI / 180);

      vessels.push({
        mmsi: String(230000000 + i),
        name: shipNames[i % shipNames.length],
        latitude: lat + offsetLat,
        longitude: lon + offsetLon,
        speed: Math.random() * 15 + 5,
        course: Math.random() * 360,
        shipType: shipTypes[i % shipTypes.length],
        heading: Math.random() * 360,
        destination: 'Port',
      });
    }

    return vessels;
  }

  // Ports API endpoint
  app.get("/api/ports", async (req, res) => {
    try {
      const region = req.query.region as string;
      const type = req.query.type as 'Primary' | 'Secondary' | undefined;
      const search = req.query.search as string;
      const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
      const lon = req.query.lon ? parseFloat(req.query.lon as string) : undefined;
      const radiusKm = req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : 100;

      let ports;

      if (lat !== undefined && lon !== undefined && !isNaN(lat) && !isNaN(lon)) {
        // Get ports near location
        ports = await getPortsNearLocation(lat, lon, radiusKm);
      } else {
        // Get all ports with filters
        ports = await getPorts({
          region: region || undefined,
          type: type || undefined,
          search: search || undefined,
        });
      }

      res.json({ ports });
    } catch (error) {
      console.error("Error in ports endpoint:", error);
      res.status(500).json({ error: "Failed to fetch ports data" });
    }
  });

  // Notices to Mariners API endpoint
  app.get("/api/notices-to-mariners", async (req, res) => {
    try {
      let lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
      let lon = req.query.lon ? parseFloat(req.query.lon as string) : undefined;
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const radiusKm = req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : 200;

      // If coordinates not provided, try to get from saved location
      if ((lat === undefined || lon === undefined || isNaN(lat) || isNaN(lon)) && email) {
        try {
          const userId = await getUserIdFromEmail(email);
          if (userId) {
            const widgetLocationsTable = getWidgetLocationsTable();
            const locations = await db
              .select()
              .from(widgetLocationsTable)
              .where(eq(widgetLocationsTable.userId, userId))
              .orderBy(desc(widgetLocationsTable.updatedAt))
              .limit(1);
            
            if (locations.length > 0) {
              lat = locations[0].latitude;
              lon = locations[0].longitude;
            }
          }
        } catch (error) {
          console.error("Error fetching saved location:", error);
          // Continue without location
        }
      }

      const notices = await getNoticesToMariners(lat, lon, radiusKm);

      res.json({ notices });
    } catch (error) {
      console.error("Error in notices to mariners endpoint:", error);
      res.status(500).json({ error: "Failed to fetch notices to mariners" });
    }
  });

  // Medical Facilities API endpoints
  app.get("/api/medical-facilities", async (req, res) => {
    try {
      let lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
      let lon = req.query.lon ? parseFloat(req.query.lon as string) : undefined;
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const radiusKm = req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : 200;
      const types = req.query.types ? (req.query.types as string).split(',') as MedicalFacilityType[] : undefined;
      const country = req.query.country as string | undefined;
      const region = req.query.region as string | undefined;
      const available24h = req.query.available24h === 'true' ? true : req.query.available24h === 'false' ? false : undefined;

      // If coordinates not provided, try to get from saved location
      if ((lat === undefined || lon === undefined || isNaN(lat) || isNaN(lon)) && email) {
        try {
          const userId = await getUserIdFromEmail(email);
          if (userId) {
            const widgetLocationsTable = getWidgetLocationsTable();
            const locations = await db
              .select()
              .from(widgetLocationsTable)
              .where(eq(widgetLocationsTable.userId, userId))
              .orderBy(desc(widgetLocationsTable.updatedAt))
              .limit(1);
            
            if (locations.length > 0) {
              lat = locations[0].latitude;
              lon = locations[0].longitude;
            }
          }
        } catch (error) {
          console.error("Error fetching saved location:", error);
          // Continue without location
        }
      }

      const facilities = await getMedicalFacilities({
        latitude: lat,
        longitude: lon,
        radiusKm: radiusKm,
        types: types,
        country: country,
        region: region,
        available24h: available24h,
      });

      res.json({ facilities });
    } catch (error) {
      console.error("Error in medical facilities endpoint:", error);
      res.status(500).json({ error: "Failed to fetch medical facilities" });
    }
  });

  // Get user's selected medical facilities
  app.get("/api/medical-facilities/user-selections", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }

      const userId = await getUserIdFromEmail(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const facilities = await getUserMedicalFacilities(userId);
      res.json({ facilities });
    } catch (error) {
      console.error("Error fetching user medical facilities:", error);
      res.status(500).json({ error: "Failed to fetch user medical facilities" });
    }
  });

  // Add medical facility to user's selections
  app.post("/api/medical-facilities/user-selections", async (req, res) => {
    try {
      const email = (req.body.email as string) || (req.headers['x-user-email'] as string);
      const { facilityId, isPrimary } = req.body;

      if (!email || !facilityId) {
        return res.status(400).json({ error: "Email and facilityId required" });
      }

      const userId = await getUserIdFromEmail(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      await addUserMedicalFacility(userId, facilityId, isPrimary || false);
      res.json({ success: true });
    } catch (error) {
      console.error("Error adding user medical facility:", error);
      res.status(500).json({ error: "Failed to add user medical facility" });
    }
  });

  // Remove medical facility from user's selections
  app.delete("/api/medical-facilities/user-selections/:facilityId", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const { facilityId } = req.params;

      if (!email || !facilityId) {
        return res.status(400).json({ error: "Email and facilityId required" });
      }

      const userId = await getUserIdFromEmail(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      await removeUserMedicalFacility(userId, facilityId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing user medical facility:", error);
      res.status(500).json({ error: "Failed to remove user medical facility" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
