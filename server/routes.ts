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
import { insertLessonSchema, insertInviteSchema, insertAttemptSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db } from "./db";

export async function registerRoutes(app: Express): Promise<Server> {
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

  // User profile routes
  app.put("/api/users/profile", async (req, res) => {
    try {
      const { name, email, phone, bio, company, jobTitle, location, currentEmail } = req.body;
      const userEmail = req.headers['x-user-email'] || currentEmail || email;
      
      // Update the current user's profile (for demo, we'll just return success)
      res.json({
        id: 'demo-user',
        name: name || 'Demo User',
        email: email || userEmail,
        phone,
        bio,
        company,
        jobTitle,
        location,
        updatedAt: new Date().toISOString()
      });
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

      // Normalize the object storage URL
      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(profilePictureURL);

      res.json({
        success: true,
        profilePictureUrl: normalizedPath,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating profile picture:", error);
      res.status(500).json({ error: "Failed to update profile picture" });
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
      // Create a demo affiliate if it doesn't exist
      let demoAffiliate;
      try {
        const dashboardData = await affiliateService.getAffiliateDashboard('demo-affiliate-1');
        res.json(dashboardData);
        return;
      } catch (error) {
        // If affiliate doesn't exist, create it
        demoAffiliate = await affiliateService.createAffiliate({
          userId: 'demo-user-1',
          name: 'Demo Partner',
          email: 'demo@partner.com'
        });
        const dashboardData = await affiliateService.getAffiliateDashboard(demoAffiliate.id);
        res.json(dashboardData);
      }
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
      const updateData = insertLessonSchema.partial().parse(req.body);
      const lesson = await storage.updateLesson(id, updateData);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error) {
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
      
      // For demo purposes, we'll mock the update
      const updatedUser = {
        id: 'user-1',
        name: name || 'User',
        email: email || userEmail,
        phone: phone || '',
        bio: bio || '',
        company: company || '',
        jobTitle: jobTitle || '',
        location: location || '',
        role: userEmail === 'lalabalavu.jon@gmail.com' ? 'ADMIN' : 'USER',
        subscriptionType: userEmail === 'lalabalavu.jon@gmail.com' ? 'LIFETIME' : 'TRIAL',
        updatedAt: new Date().toISOString(),
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

      // For demo purposes, we'll mock the profile picture update
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(profilePictureURL);

      const updatedUser = {
        id: 'user-1',
        name: 'User',
        email: userEmail,
        profilePictureUrl: normalizedPath,
        role: userEmail === 'lalabalavu.jon@gmail.com' ? 'ADMIN' : 'USER',
        subscriptionType: userEmail === 'lalabalavu.jon@gmail.com' ? 'LIFETIME' : 'TRIAL',
        updatedAt: new Date().toISOString(),
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
      // For demo purposes, return different users based on query param
      const email = req.query.email as string;
      
      // Admin account
      if (email === 'lalabalavu.jon@gmail.com') {
        res.json({
          id: 'admin-1',
          name: 'Admin User',
          email: 'lalabalavu.jon@gmail.com',
          role: 'ADMIN',
          subscriptionType: 'LIFETIME',
          subscriptionDate: new Date('2024-01-01').toISOString(),
          trialExpiresAt: null
        });
        return;
      }
      
      // Lifetime access users
      const lifetimeUsers = [
        'eroni2519@gmail.com',
        'jone.cirikidaveta@gmail.com', 
        'jone7898@gmail.com',
        'samueltabuya35@gmail.com',
        'jone.viti@gmail.com'
      ];
      
      if (lifetimeUsers.includes(email)) {
        res.json({
          id: 'lifetime-user',
          name: 'Lifetime Member',
          email: email,
          role: 'LIFETIME',
          subscriptionType: 'LIFETIME',
          subscriptionDate: new Date('2024-01-01').toISOString(),
          trialExpiresAt: null
        });
        return;
      }
      
      // Default trial user
      res.json({
        id: 'trial-user',
        name: 'Trial User',
        email: email || 'trial@example.com',
        role: 'USER',
        subscriptionType: 'TRIAL',
        subscriptionDate: null,
        trialExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
    } catch (error) {
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

  // Register import routes for GitHub repository content
  registerImportRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
