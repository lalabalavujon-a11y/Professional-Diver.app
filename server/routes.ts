 import type { Express, Response } from "express";
import express from "express";
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
import { insertLessonSchema, insertInviteSchema, insertAttemptSchema, behaviorInsights, emailCampaigns, testimonials } from "@shared/schema";
import { users as usersPG } from "@shared/schema";
import { users as usersSQLite } from "@shared/schema-sqlite";

// Use the correct users table based on environment
// db instance uses the correct schema, but we need matching table definition for type safety
const env = process.env.NODE_ENV ?? 'development';
const isProduction = env === 'production' && process.env.DATABASE_URL;
const users = isProduction ? usersPG : usersSQLite;
import { eq, sql, and, or, desc } from "drizzle-orm";
import { db } from "./db";
import { getGHLService } from "./ghl-integration";
import { getGHLOAuthService, initializeGHLOAuth } from "./ghl-oauth";
import { getAffiliateIntegrationsService, initializeAffiliateIntegrations } from "./affiliate-integrations";
import { userManagement } from "./user-management";
import { accessControlService } from "./access-control-service";
import * as ghlAIBridge from "./api/ghl-ai-bridge";
import { behaviorMonitoringService } from "./behavior-monitoring-service";
import { verifyPassword } from "./utils/auth";
import { verifyRevolutWebhook, verifyStripeWebhook, verifyPayPalWebhook } from "./utils/webhook-verification";
import { autoBackupTracksAndLessons, isAutoBackupEnabled } from "./backup-service";
import { nanoid } from "nanoid";

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
  // Profile update endpoint moved below to handle all users including partner admins

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

  // GHL OAuth Routes
  app.get("/api/ghl/auth", async (req, res) => {
    try {
      if (!process.env.GHL_CLIENT_ID || !process.env.GHL_CLIENT_SECRET) {
        return res.status(500).json({ 
          success: false, 
          message: 'GHL OAuth credentials not configured' 
        });
      }

      const ghlOAuth = initializeGHLOAuth({
        clientId: process.env.GHL_CLIENT_ID,
        clientSecret: process.env.GHL_CLIENT_SECRET,
        redirectUri: process.env.GHL_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/ghl/callback`,
        scopes: ['contacts.write', 'contacts.read', 'opportunities.write', 'opportunities.read', 'locations.read']
      });

      const authUrl = ghlOAuth.getAuthorizationUrl('professional-diver-training');
      res.json({ 
        success: true, 
        authUrl,
        message: 'Visit the authUrl to complete OAuth flow'
      });
    } catch (error) {
      console.error('GHL OAuth init error:', error);
      res.status(500).json({ success: false, message: 'OAuth initialization failed' });
    }
  });

  app.get("/api/ghl/callback", async (req, res) => {
    try {
      const { code, state, error } = req.query;
      
      if (error) {
        return res.status(400).json({ 
          success: false, 
          message: `OAuth error: ${error}` 
        });
      }

      if (!code) {
        return res.status(400).json({ 
          success: false, 
          message: 'Authorization code not provided' 
        });
      }

      const ghlOAuth = getGHLOAuthService();
      if (!ghlOAuth) {
        return res.status(500).json({ 
          success: false, 
          message: 'OAuth service not initialized' 
        });
      }

      const tokens = await ghlOAuth.exchangeCodeForTokens(code as string);
      
      // Redirect to success page or return success response
      res.json({ 
        success: true, 
        message: 'GHL OAuth completed successfully!',
        locationId: tokens.locationId,
        expiresIn: tokens.expires_in
      });
    } catch (error) {
      console.error('GHL OAuth callback error:', error);
      res.status(500).json({ success: false, message: 'OAuth callback failed' });
    }
  });

  app.get("/api/ghl/status", async (req, res) => {
    try {
      const ghlOAuth = getGHLOAuthService();
      if (!ghlOAuth) {
        return res.json({ 
          success: false, 
          message: 'OAuth service not initialized',
          hasTokens: false
        });
      }

      const hasValidTokens = ghlOAuth.hasValidTokens();
      const tokens = ghlOAuth.getCurrentTokens();
      
      res.json({ 
        success: true,
        hasTokens: hasValidTokens,
        locationId: tokens?.locationId,
        expiresAt: tokens?.expires_at ? new Date(tokens.expires_at).toISOString() : null,
        scopes: tokens?.scope
      });
    } catch (error) {
      console.error('GHL OAuth status error:', error);
      res.status(500).json({ success: false, message: 'Status check failed' });
    }
  });

  // GHL Integration Routes (Legacy - keeping for compatibility)
  app.post("/api/ghl/webhook", async (req, res) => {
    try {
      const ghlService = getGHLService();
      if (ghlService) {
        await ghlService.handleWebhook(req.body);
        res.json({ success: true, message: 'Webhook processed successfully' });
      } else {
        res.status(503).json({ success: false, message: 'GHL service not available' });
      }
    } catch (error) {
      console.error('GHL webhook error:', error);
      res.status(500).json({ success: false, message: 'Webhook processing failed' });
    }
  });

  app.get("/api/ghl/test", async (req, res) => {
    try {
      const ghlService = getGHLService();
      if (ghlService) {
        const isConnected = await ghlService.testConnection();
        res.json({ 
          success: isConnected, 
          message: isConnected ? 'GHL connection successful' : 'GHL connection failed',
          subAccountId: 'RanYKgzAFnSUqSIKrjOb'
        });
      } else {
        res.json({ success: false, message: 'GHL service not initialized' });
      }
    } catch (error) {
      console.error('GHL test error:', error);
      res.status(500).json({ success: false, message: 'GHL test failed' });
    }
  });

  app.get("/api/stripe/test", async (req, res) => {
    try {
      const integrationsService = getAffiliateIntegrationsService();
      if (!integrationsService) {
        return res.status(503).json({ success: false, message: 'Stripe integration service not initialized' });
      }
      
      const testResult = await integrationsService.testStripeConnection();
      res.json(testResult);
    } catch (error) {
      console.error('Stripe test error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Stripe test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/ghl/sync-user", async (req, res) => {
    try {
      const ghlService = getGHLService();
      if (ghlService) {
        const { name, email, phone, subscriptionType, source } = req.body;
        await ghlService.syncUserRegistration({ name, email, phone, subscriptionType, source });
        res.json({ success: true, message: 'User synced with GHL successfully' });
      } else {
        res.status(503).json({ success: false, message: 'GHL service not available' });
      }
    } catch (error) {
      console.error('GHL sync error:', error);
      res.status(500).json({ success: false, message: 'User sync failed' });
    }
  });

  // ============================================================================
  // 🤖 GHL AI BRIDGE ROUTES - LangChain Integration
  // ============================================================================

  // Lead qualification with AI
  app.post("/api/ghl-ai/qualify-lead", ghlAIBridge.qualifyLead);
  app.post("/api/ghl-ai/batch-qualify", ghlAIBridge.batchQualifyLeads);
  
  // Course recommendations
  app.post("/api/ghl-ai/recommend-courses", ghlAIBridge.recommendCourses);
  
  // Bi-directional conversations
  app.post("/api/ghl-ai/conversation", ghlAIBridge.handleConversation);
  
  // Laura Oracle specific endpoints
  app.post("/api/ghl-ai/laura/qualify", ghlAIBridge.lauraQualifyLead);
  app.post("/api/ghl-ai/laura/recommend", ghlAIBridge.lauraRecommendCourses);
  app.post("/api/ghl-ai/laura/chat", ghlAIBridge.lauraHandleConversation);
  
  // Monitoring and optimization
  app.post("/api/ghl-ai/monitor-engagement", ghlAIBridge.monitorEngagement);
  app.get("/api/ghl-ai/optimize-workflows", ghlAIBridge.optimizeWorkflows);
  
  // Connection testing
  app.get("/api/ghl-ai/test", ghlAIBridge.testConnection);

  // Enhanced authentication route for credentials - Database-backed authentication
  app.post("/api/auth/credentials", async (req, res) => {
    try {
      const { email, password, rememberMe } = req.body as { email: string; password: string; rememberMe?: boolean };

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Normalize email for comparison
      const normalizedEmail = email.toLowerCase().trim();
      
      // Handle preview user with hardcoded password "Preview123"
      if (normalizedEmail === 'preview@professionaldiver.app') {
        // Trim password to handle any whitespace issues
        const trimmedPassword = password.trim();
        if (trimmedPassword !== 'Preview123') {
          console.log('[AUTH] Preview user login failed: Invalid password. Expected "Preview123", got:', trimmedPassword);
          return res.status(401).json({ error: "Invalid credentials" });
        }
        
        // Get preview user from userManagement service
        const specialUser = userManagement.getSpecialUser(normalizedEmail);
        if (!specialUser) {
          console.error('[AUTH] Preview user not found in userManagement service');
          return res.status(401).json({ error: "Invalid credentials" });
        }
        
        // Build user response for preview user
        const userResponse = {
          id: specialUser.id,
          name: specialUser.name,
          email: specialUser.email,
          role: specialUser.role,
          subscriptionType: specialUser.subscriptionType,
          subscriptionStatus: specialUser.subscriptionStatus,
        };

        console.log('[AUTH] Preview user login successful:', userResponse.email);
        res.json({ 
          success: true, 
          user: userResponse,
          rememberMe 
        });
        return;
      }

      // Look up user in database
      const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);

      if (!user) {
        // Return generic error to prevent email enumeration
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.password || null);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Build user response object (excluding password)
      const userResponse: any = {
        id: user.id,
        name: user.name || undefined,
        email: user.email,
        role: user.role,
        subscriptionType: user.subscriptionType,
        subscriptionStatus: user.subscriptionStatus,
        trialExpiresAt: user.trialExpiresAt ? new Date(user.trialExpiresAt).toISOString() : undefined,
      };

      // Add restricted access for partner admins
      if (user.role === 'PARTNER_ADMIN') {
        userResponse.restrictedAccess = ['affiliate', 'finance', 'revenue', 'billing', 'payments'];
      }
      
      // Sync with GHL if enabled
        const ghlService = getGHLService();
        if (ghlService) {
          try {
            await ghlService.syncUserRegistration({
            name: user.name || user.email,
              email: user.email,
              subscriptionType: user.subscriptionType,
            source: 'Login'
            });
          } catch (error) {
          console.error('Failed to sync login with GHL:', error);
          // Don't fail authentication if GHL sync fails
          }
        }
        
        res.json({ 
          success: true, 
        user: userResponse,
          rememberMe 
        });
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

  // Helper function to populate lessons for a single track
  async function populateLessonsForTrack(track: any) {
    try {
      // Check if track already has lessons
      const trackWithLessons = await tempStorage.getTrackBySlug(track.slug);
      if (trackWithLessons && trackWithLessons.lessons && trackWithLessons.lessons.length > 0) {
        return; // Lessons already exist
      }

      // Import lesson templates
      const { getLessonsForTrack } = await import('./lesson-templates.js');
      
      // Get 12 lessons for this track
      const lessonsToAdd = getLessonsForTrack(track.slug);

      // Insert all 12 lessons
      for (let i = 0; i < lessonsToAdd.length; i++) {
        const lesson = lessonsToAdd[i];
        await tempStorage.createLesson({
          trackId: track.id,
          title: lesson.title,
          order: i + 1,
          content: lesson.content,
          estimatedMinutes: 60,
          isRequired: true,
        });
      }

      console.log(`✅ Auto-populated ${lessonsToAdd.length} lessons for track: ${track.title}`);
    } catch (error) {
      console.error(`Error populating lessons for track ${track.slug}:`, error);
      // Don't throw - allow the request to continue even if population fails
    }
  }

  app.get("/api/tracks/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      let track = await tempStorage.getTrackBySlug(slug);
      
      if (!track) {
        return res.status(404).json({ error: "Track not found" });
      }

      // Auto-populate lessons if they don't exist
      if (!track.lessons || track.lessons.length === 0) {
        await populateLessonsForTrack(track);
        // Fetch the track again to get the newly populated lessons
        track = await tempStorage.getTrackBySlug(slug);
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

  // Safe sync quizzes endpoint - only adds missing quizzes, never deletes
  app.post("/api/admin/sync-quizzes", async (req, res) => {
    try {
      // Use the same logic as the safe-deploy-quizzes script but inline
      const { tracks, lessons, quizzes, questions } = await import('@shared/schema-sqlite');
      const { db } = await import('./db.js');
      const { eq } = await import('drizzle-orm');
      
      console.log('🔒 Starting safe quiz sync...');
      
      // Get all tracks with their lessons
      const allTracks = await db.select({
        trackId: tracks.id,
        trackTitle: tracks.title,
        trackSlug: tracks.slug,
        lessonId: lessons.id,
        lessonTitle: lessons.title,
        lessonOrder: lessons.order
      }).from(tracks)
      .leftJoin(lessons, eq(tracks.id, lessons.trackId))
      .orderBy(tracks.title, lessons.order);

      // Group by track
      const trackMap = new Map();
      for (const row of allTracks) {
        if (!trackMap.has(row.trackId)) {
          trackMap.set(row.trackId, {
            trackId: row.trackId,
            trackTitle: row.trackTitle,
            trackSlug: row.trackSlug,
            lessons: []
          });
        }
        if (row.lessonId) {
          trackMap.get(row.trackId).lessons.push({
            id: row.lessonId,
            title: row.lessonTitle,
            order: row.lessonOrder
          });
        }
      }

      let totalAdded = 0;
      let totalSkipped = 0;

      // Process each track
      for (const track of trackMap.values()) {
        for (const lesson of track.lessons) {
          // Check if lesson already has a quiz
          const existingQuiz = await db.select().from(quizzes).where(eq(quizzes.lessonId, lesson.id));
          
          if (existingQuiz.length === 0) {
            // Add quiz with default questions
            const insertedQuiz = await db.insert(quizzes).values({
              lessonId: lesson.id,
              title: `${lesson.title} - Assessment`,
              timeLimit: 30,
              passingScore: 80
            }).returning();
            
            // Add default questions
            const defaultQuestions = [
              {
                prompt: `What is the primary objective of ${lesson.title}?`,
                a: "To minimize costs",
                b: "To ensure safety and quality",
                c: "To increase productivity",
                d: "To reduce time",
                answer: "b",
                order: 1
              },
              {
                prompt: `What is the most critical factor in ${lesson.title}?`,
                a: "Speed",
                b: "Safety",
                c: "Cost",
                d: "Equipment",
                answer: "b",
                order: 2
              },
              {
                prompt: `What is the primary responsibility in ${lesson.title}?`,
                a: "To follow procedures",
                b: "To maintain quality",
                c: "To ensure safety",
                d: "All of the above",
                answer: "d",
                order: 3
              }
            ];
            
            for (const question of defaultQuestions) {
              await db.insert(questions).values({
                quizId: insertedQuiz[0].id,
                prompt: question.prompt,
                options: JSON.stringify([question.a, question.b, question.c, question.d]),
                correctAnswer: question.answer,
                order: question.order
              });
            }
            
            totalAdded++;
          } else {
            totalSkipped++;
          }
        }
      }
      
      res.json({
        success: true,
        message: 'Quizzes synced successfully. Only missing quizzes were added - no data was deleted or modified.',
        summary: {
          added: totalAdded,
          skipped: totalSkipped,
          total: totalAdded + totalSkipped
        },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Quiz sync error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to sync quizzes',
        message: error?.message || 'Unknown error occurred'
      });
    }
  });

  // Populate lessons for all tracks endpoint
  app.post("/api/admin/populate-lessons", async (req, res) => {
    try {
      // @ts-ignore - JS modules without type definitions
      const { ndtLessons } = await import('../content/ndt-lessons.js');
      // @ts-ignore - JS modules without type definitions
      const { alstLessons } = await import('../content/alst-lessons.js');
      // @ts-ignore - JS modules without type definitions
      const { lstLessons } = await import('../content/lst-lessons.js');
      // @ts-ignore - JS modules without type definitions
      const { additionalLessons } = await import('../additional-lessons.js');

      const allTracks = await tempStorage.getAllTracks();
      let totalLessonsAdded = 0;

      for (const track of allTracks) {
        // Check if track already has lessons
        const trackWithLessons = await tempStorage.getTrackBySlug(track.slug);
        if (trackWithLessons && trackWithLessons.lessons && trackWithLessons.lessons.length > 0) {
          console.log(`Track ${track.title} already has ${trackWithLessons.lessons.length} lessons, skipping...`);
          continue;
        }

        let lessonsToAdd: Array<{ title: string; content: string }> = [];

        // Match lessons based on track slug
        switch (track.slug) {
          case 'inspection-ndt':
          case 'ndt-inspection':
            lessonsToAdd = ndtLessons;
            break;
          
          case 'assistant-life-support-technician':
          case 'alst':
            lessonsToAdd = alstLessons;
            break;
          
          case 'life-support-technician':
          case 'lst':
            lessonsToAdd = lstLessons;
            break;
          
          case 'diver-medic-technician':
          case 'diver-medic':
            lessonsToAdd = additionalLessons.filter((l: any) => l.trackSlug === 'diver-medic-technician');
            break;
          
          case 'commercial-dive-supervisor':
          case 'commercial-supervisor':
            lessonsToAdd = additionalLessons.filter((l: any) => l.trackSlug === 'commercial-dive-supervisor');
            break;
          
          case 'air-diver-certification':
          case 'air-diver':
            lessonsToAdd = additionalLessons.filter((l: any) => l.trackSlug === 'air-diver-certification');
            break;
          
          case 'saturation-diver-training':
          case 'saturation-diving':
            lessonsToAdd = additionalLessons.filter((l: any) => l.trackSlug === 'saturation-diver-training');
            break;
          
          default:
            // Add at least one placeholder lesson for tracks without specific content
            lessonsToAdd = [{
              title: `${track.title} - Introduction`,
              content: `# ${track.title} - Introduction\n\nWelcome to ${track.title}. This track is currently under development. Content will be added soon.`
            }];
        }

        // Insert lessons
        for (let i = 0; i < lessonsToAdd.length; i++) {
          const lesson = lessonsToAdd[i];
          await tempStorage.createLesson({
            trackId: track.id,
            title: lesson.title,
            order: i + 1,
            content: lesson.content,
            estimatedMinutes: 60,
            isRequired: true,
          });
          totalLessonsAdded++;
        }
      }

      // Trigger automatic backup after populating lessons
      if (isAutoBackupEnabled() && totalLessonsAdded > 0) {
        autoBackupTracksAndLessons();
      }

      res.json({
        success: true,
        message: `Successfully populated lessons for tracks`,
        lessonsAdded: totalLessonsAdded,
      });
    } catch (error) {
      console.error('Error populating lessons:', error);
      res.status(500).json({ error: "Failed to populate lessons" });
    }
  });

  // Trial signup endpoint
  app.post('/api/trial-signup', async (req, res) => {
    try {
      const { name, email, referralCode } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }

      if (!email.includes('@')) {
        return res.status(400).json({ error: 'Please enter a valid email address' });
      }

      // Create user with referral code if provided
      const user = await tempStorage.createTrialUser({ name, email, referralCode });
      
      // If referral code was provided, verify the affiliate exists and track the conversion
      if (referralCode) {
        try {
          // Verify affiliate exists
          const affiliate = await affiliateService.getAffiliateByCode(referralCode);
          if (affiliate) {
            // Track the conversion (trial signup counts as a conversion)
            // Note: This is a trial signup, so we'll track it but commission will be calculated when they subscribe
            console.log(`Referral conversion tracked: ${referralCode} -> ${user.id}`);
            
            // You can optionally create a referral record here for trial signups
            // For now, we'll just log it. Full conversion tracking happens on subscription.
          } else {
            console.warn(`Invalid referral code provided: ${referralCode}`);
          }
        } catch (affiliateError) {
          // Don't fail the signup if affiliate tracking fails
          console.error('Error tracking referral:', affiliateError);
        }
      }
      
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
      // Get user email from query or header
      const userEmail = req.query.email as string || req.headers['x-user-email'] as string;
      
      if (!userEmail) {
        // Fallback to demo affiliate for backward compatibility
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
          return;
        }
      }

      // Try to get affiliate by email
      let affiliate = await affiliateService.getAffiliateByEmail(userEmail);
      
      // If affiliate doesn't exist, create one for this user automatically
      if (!affiliate) {
        // Get user name from user management or use email prefix
        let userName = userEmail.split('@')[0]; // Default to email prefix
        let userId = `user-${userEmail.replace('@', '-').replace(/\./g, '-')}`;
        
        // Try to get user info from user management service
        try {
          const specialUser = userManagement.getSpecialUser(userEmail);
          if (specialUser?.name) {
            userName = specialUser.name;
          }
          if (specialUser?.id) {
            userId = specialUser.id;
          }
        } catch (error) {
          // If we can't get user info, use email prefix
          console.log('Could not fetch user info, using email prefix as name');
        }
        
        // Get user info to create affiliate
        const userInfo = {
          userId: userId,
          name: userName,
          email: userEmail
        };
        
        affiliate = await affiliateService.createAffiliate(userInfo);
        console.log(`✅ Auto-created affiliate account for ${userName} (${userEmail}) - Code: ${affiliate.affiliateCode}`);
      }

      // Ensure affiliate has referralLink (fallback if missing)
      if (!affiliate.referralLink && affiliate.affiliateCode) {
        affiliate.referralLink = `https://professionaldiver.app/?ref=${affiliate.affiliateCode}`;
      }

      // Ensure affiliate object is complete
      const completeAffiliate = {
        ...affiliate,
        referralLink: affiliate.referralLink || `https://professionaldiver.app/?ref=${affiliate.affiliateCode}`,
        affiliateCode: affiliate.affiliateCode || '',
        name: affiliate.name || userEmail.split('@')[0],
        email: affiliate.email || userEmail
      };

      // Get dashboard data for this affiliate
      let dashboardData;
      try {
        dashboardData = await affiliateService.getAffiliateDashboard(affiliate.id);
        // Ensure affiliate object has referralLink and all required fields
        if (dashboardData.affiliate) {
          dashboardData.affiliate = {
            ...completeAffiliate,
            ...dashboardData.affiliate,
            referralLink: dashboardData.affiliate.referralLink || completeAffiliate.referralLink,
            affiliateCode: dashboardData.affiliate.affiliateCode || completeAffiliate.affiliateCode
          };
        } else {
          dashboardData.affiliate = completeAffiliate;
        }
      } catch (error) {
        // If getAffiliateDashboard fails, create a minimal dashboard response with the affiliate
        console.warn('getAffiliateDashboard failed, creating minimal response:', error);
        dashboardData = {
          affiliate: completeAffiliate,
          stats: {
            totalReferrals: 0,
            totalEarnings: 0,
            monthlyEarnings: 0,
            monthlyReferrals: 0,
            totalClicks: 0,
            totalConversions: 0,
            conversionRate: 0,
            averageOrderValue: 0
          },
          recentReferrals: [],
          recentClicks: []
        };
      }
      
      // Final safety check - ensure affiliate object exists and has required fields
      if (!dashboardData.affiliate || !dashboardData.affiliate.affiliateCode) {
        dashboardData.affiliate = completeAffiliate;
      }
      
      // Ensure affiliate is always in the response
      if (!dashboardData.affiliate || !dashboardData.affiliate.affiliateCode) {
        dashboardData.affiliate = completeAffiliate;
      }
      
      // Log for debugging
      console.log('📊 Returning affiliate dashboard:', {
        hasAffiliate: !!dashboardData.affiliate,
        affiliateCode: dashboardData.affiliate?.affiliateCode,
        referralLink: dashboardData.affiliate?.referralLink,
        email: userEmail,
        fullAffiliate: dashboardData.affiliate
      });
      
      // ALL affiliates can now manage their own sub-affiliates
      // This allows any user who becomes a partner to build their own affiliate network
      const subAffiliates = await affiliateService.getManagedAffiliates(userEmail);
      (dashboardData as any).subAffiliates = subAffiliates;
      (dashboardData as any).canManageAffiliates = true; // All affiliates can manage sub-affiliates
      
      // Final check - ensure affiliate object has all required fields
      dashboardData.affiliate = {
        ...completeAffiliate,
        ...dashboardData.affiliate,
        referralLink: dashboardData.affiliate.referralLink || completeAffiliate.referralLink,
        affiliateCode: dashboardData.affiliate.affiliateCode || completeAffiliate.affiliateCode
      };
      
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

  // Auto-create affiliate accounts for all users who have purchased
  // This endpoint can be called to ensure all paying users have affiliate accounts
  app.post('/api/affiliate/auto-create-for-purchasers', async (req, res) => {
    try {
      // Check if requester is Super Admin
      const requesterEmail = req.query.email as string || req.headers['x-user-email'] as string;
      if (!requesterEmail) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const requester = userManagement.getSpecialUser(requesterEmail);
      if (!requester || requester.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Super Admin access required' });
      }

      // Get all users who have purchased (LIFETIME, MONTHLY, or ANNUAL subscriptions)
      const allUsers = userManagement.getAllUsers();
      const purchasers = allUsers.filter(user => 
        user.subscriptionType === 'LIFETIME' || 
        user.subscriptionType === 'MONTHLY' || 
        user.subscriptionType === 'ANNUAL'
      );

      const results = [];
      
      for (const user of purchasers) {
        try {
          // Check if affiliate already exists
          const existingAffiliate = await affiliateService.getAffiliateByEmail(user.email);
          
          if (existingAffiliate) {
            results.push({
              email: user.email,
              name: user.name,
              status: 'exists',
              affiliateCode: existingAffiliate.affiliateCode
            });
            continue;
          }

          // Create affiliate account
          const affiliate = await affiliateService.createAffiliate({
            userId: user.id,
            name: user.name || user.email.split('@')[0],
            email: user.email
          });

          results.push({
            email: user.email,
            name: user.name,
            status: 'created',
            affiliateCode: affiliate.affiliateCode,
            referralLink: affiliate.referralLink
          });
        } catch (error) {
          results.push({
            email: user.email,
            name: user.name,
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      const created = results.filter(r => r.status === 'created').length;
      const existing = results.filter(r => r.status === 'exists').length;
      const errors = results.filter(r => r.status === 'error').length;

      res.json({
        success: true,
        message: `Processed ${purchasers.length} purchasers`,
        summary: {
          total: purchasers.length,
          created,
          existing,
          errors
        },
        results
      });
    } catch (error) {
      console.error('Auto-create affiliate accounts error:', error);
      res.status(500).json({ error: 'Failed to create affiliate accounts' });
    }
  });

  // Auto-backup service (imported at top)
  // Note: autoBackupTracksAndLessons is called automatically after lesson/track updates

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

      // Integrate with external platforms
      const integrationsService = getAffiliateIntegrationsService();
      if (integrationsService) {
        const affiliate = await affiliateService.getAffiliateByCode(affiliateCode);
        if (affiliate) {
          // Track conversion in GHL and analytics
          try {
            await integrationsService.trackReferralConversionInGHL({
              affiliateCode,
              affiliateName: affiliate.name,
              affiliateEmail: affiliate.email,
              referredUserEmail: req.body.referredUserEmail || 'unknown@example.com',
              referredUserName: req.body.referredUserName || 'Unknown User',
              subscriptionType,
              monthlyValue,
              commissionEarned: referral.commissionEarned
            });

            await integrationsService.trackAffiliateAnalytics({
              affiliateCode,
              eventType: 'conversion',
              value: monthlyValue,
              metadata: { subscriptionType, referredUserId }
            });
          } catch (integrationError) {
            console.error('Integration error:', integrationError);
            // Don't fail the main conversion if integrations fail
          }
        }
      }

      res.json({ success: true, referral });
    } catch (error) {
      console.error('Conversion tracking error:', error);
      res.status(500).json({ error: 'Failed to process conversion' });
    }
  });

  // Enhanced Affiliate Integration Endpoints
  app.post('/api/affiliate/sync-to-ghl', async (req, res) => {
    try {
      const { affiliateId } = req.body;
      const integrationsService = getAffiliateIntegrationsService();
      
      if (!integrationsService) {
        return res.status(503).json({ error: 'Affiliate integrations not configured' });
      }

      // Get affiliate data (mock for now - replace with actual service call)
      const affiliateData = {
        id: affiliateId,
        name: 'Demo Partner',
        email: 'partner@example.com',
        affiliateCode: 'PD12345678',
        commissionRate: 50,
        totalEarnings: 25000,
        totalReferrals: 10
      };

      await integrationsService.syncAffiliateToGHL(affiliateData);
      res.json({ success: true, message: 'Affiliate synced to GHL successfully' });
    } catch (error) {
      console.error('GHL sync error:', error);
      res.status(500).json({ error: 'Failed to sync affiliate to GHL' });
    }
  });

  app.post('/api/affiliate/payout/stripe', async (req, res) => {
    try {
      const { affiliateId, amount, description, affiliateEmail } = req.body;
      const integrationsService = getAffiliateIntegrationsService();
      
      if (!integrationsService) {
        return res.status(503).json({ error: 'Stripe integration not configured' });
      }

      if (!affiliateId || !amount || !affiliateEmail) {
        return res.status(400).json({ 
          error: 'Missing required fields: affiliateId, amount, affiliateEmail' 
        });
      }

      const payout = await integrationsService.processStripeCommissionPayout({
        affiliateId,
        affiliateEmail,
        amount: typeof amount === 'number' ? amount : parseInt(amount, 10),
        currency: req.body.currency || 'USD',
        description: description || 'Commission payout'
      });

      res.json({ 
        success: true, 
        payoutId: payout.id, 
        amount: payout.amount,
        status: payout.status,
        destination: payout.destination
      });
    } catch (error: any) {
      console.error('Stripe payout error:', error);
      res.status(500).json({ 
        error: 'Failed to process Stripe payout',
        message: error.message || 'Unknown error',
        details: error.type === 'StripeInvalidRequestError' ? error.message : undefined
      });
    }
  });

  app.post('/api/affiliate/payout/paypal', async (req, res) => {
    try {
      const { affiliateId, amount, description } = req.body;
      const integrationsService = getAffiliateIntegrationsService();
      
      if (!integrationsService) {
        return res.status(503).json({ error: 'PayPal integration not configured' });
      }

      const payout = await integrationsService.processPayPalCommissionPayout({
        affiliateId,
        affiliateEmail: req.body.affiliateEmail,
        amount,
        currency: 'USD',
        description: description || 'Commission payout'
      });

      res.json({ success: true, payoutId: payout.batch_header.payout_batch_id, amount });
    } catch (error) {
      console.error('PayPal payout error:', error);
      res.status(500).json({ error: 'Failed to process PayPal payout' });
    }
  });

  app.post('/api/affiliate/payout/bank-transfer', async (req, res) => {
    try {
      const { affiliateId, amount, description, bankDetails, useRevolut } = req.body;
      const integrationsService = getAffiliateIntegrationsService();
      
      if (!integrationsService) {
        return res.status(503).json({ error: 'Bank transfer integration not configured' });
      }

      if (!bankDetails) {
        return res.status(400).json({ error: 'Bank details are required' });
      }

      const payout = await integrationsService.processBankTransferPayout({
        affiliateId,
        affiliateEmail: req.body.affiliateEmail,
        amount,
        currency: 'USD',
        description: description || 'Commission payout',
        bankDetails,
        useRevolut: useRevolut || false
      });

      res.json({ 
        success: true, 
        payoutId: payout.payoutId || payout.id || payout.instructions?.reference,
        amount,
        method: payout.type || 'bank_transfer',
        status: payout.status || 'pending'
      });
    } catch (error) {
      console.error('Bank transfer payout error:', error);
      res.status(500).json({ error: 'Failed to process bank transfer payout' });
    }
  });

  app.post('/api/affiliate/schedule-payouts', async (req, res) => {
    try {
      const integrationsService = getAffiliateIntegrationsService();
      
      if (!integrationsService) {
        return res.status(503).json({ error: 'Affiliate integrations not configured' });
      }

      await integrationsService.scheduleCommissionPayouts();
      res.json({ success: true, message: 'Commission payouts processed successfully' });
    } catch (error) {
      console.error('Payout scheduling error:', error);
      res.status(500).json({ error: 'Failed to schedule payouts' });
    }
  });

  // Revolut Subscription API - Create Checkout URL
  app.post('/api/revolut/create-subscription-checkout', async (req, res) => {
    try {
      const { subscriptionType, customerEmail, customerName, successUrl, cancelUrl } = req.body;

      if (!subscriptionType || !customerEmail) {
        return res.status(400).json({ error: 'subscriptionType and customerEmail are required' });
      }

      if (subscriptionType !== 'MONTHLY' && subscriptionType !== 'ANNUAL') {
        return res.status(400).json({ error: 'subscriptionType must be MONTHLY or ANNUAL' });
      }

      const { getRevolutSubscriptionService } = await import('./revolut-subscriptions');
      const revolutService = getRevolutSubscriptionService();

      if (!revolutService) {
        return res.status(503).json({ error: 'Revolut subscription service not configured. Please set REVOLUT_API_KEY.' });
      }

      // Get or create subscription plans
      const { monthlyPlanId, annualPlanId } = await revolutService.getOrCreateSubscriptionPlans();
      const planId = subscriptionType === 'MONTHLY' ? monthlyPlanId : annualPlanId;

      // Create subscription order and checkout URL
      const checkout = await revolutService.createSubscriptionOrder({
        planId,
        customerEmail,
        customerName,
        successUrl: successUrl || `${req.protocol}://${req.get('host')}/thank-you?email=${encodeURIComponent(customerEmail)}`,
        cancelUrl: cancelUrl || `${req.protocol}://${req.get('host')}/cancel`,
        metadata: {
          subscription_type: subscriptionType,
          user_email: customerEmail
        }
      });

      res.json({
        success: true,
        checkoutUrl: checkout.checkoutUrl,
        orderId: checkout.orderId,
        publicId: checkout.publicId,
        subscriptionType
      });
    } catch (error: any) {
      console.error('❌ Error creating Revolut subscription checkout:', error);
      res.status(500).json({ 
        error: 'Failed to create subscription checkout',
        message: error.response?.data?.message || error.message 
      });
    }
  });

  // Email Campaign Management for Non-Purchasers
  app.post('/api/email-campaigns/send-follow-up', async (req, res) => {
    try {
      // This endpoint should be called periodically (e.g., via cron job)
      // to send follow-up emails to users who haven't purchased after trial expires
      
      const now = new Date();
      const expiredTrialUsers = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.subscriptionType, 'TRIAL'),
            sql`${users.trialExpiresAt} < ${now.toISOString()}`
          )
        );

      const results = [];
      
      for (const user of expiredTrialUsers) {
        // Check if user has already purchased (shouldn't send follow-ups)
        if (user.subscriptionType !== 'TRIAL') continue;
        
        // Calculate days since trial expired
        if (!user.trialExpiresAt) continue;
        
        const trialExpiryDate = new Date(user.trialExpiresAt);
        const daysSinceExpiry = Math.floor((now.getTime() - trialExpiryDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Send follow-up emails on specific days after expiry
        // Email 1: Day 1, Email 2: Day 3, Email 3: Day 7, Email 4: Day 14, Email 5: Day 21, Email 6: Day 30, Email 7: Day 60
        const emailSchedule = [1, 3, 7, 14, 21, 30, 60];
        
        // Check which emails have already been sent to this user
        const sentEmails = await db
          .select()
          .from(emailCampaigns)
          .where(
            and(
              eq(emailCampaigns.userId, user.id),
              eq(emailCampaigns.campaignType, 'follow_up')
            )
          )
          .orderBy(desc(emailCampaigns.sentAt));
        
        const sentEmailNumbers = sentEmails.map(e => e.emailNumber).filter(Boolean) as number[];
        
        // Find which email should be sent based on days since expiry
        let emailNumber = 0;
        for (let i = 0; i < emailSchedule.length; i++) {
          const scheduledDay = emailSchedule[i];
          if (daysSinceExpiry >= scheduledDay && (i === emailSchedule.length - 1 || daysSinceExpiry < emailSchedule[i + 1])) {
            emailNumber = i + 1;
            // Only send if we're exactly on the scheduled day and haven't sent this email yet
            if (daysSinceExpiry === scheduledDay && !sentEmailNumbers.includes(emailNumber)) {
              break;
            } else {
              emailNumber = 0; // Reset if already sent or wrong day
            }
          }
        }
        
        if (emailNumber > 0 && daysSinceExpiry === emailSchedule[emailNumber - 1] && !sentEmailNumbers.includes(emailNumber)) {
          try {
            // Calculate engagement level for customization (basic implementation)
            // This could be enhanced by checking user progress, quiz attempts, etc.
            const engagementLevel = 'standard'; // Could be 'high', 'medium', 'low' based on user activity
            
            await emailMarketing.sendFollowUpEmail({
              name: user.name || 'Professional Diver',
              email: user.email,
              emailNumber: emailNumber,
              trialExpiresAt: user.trialExpiresAt
            });
            
            // Track the email in database
            await db.insert(emailCampaigns).values({
              userId: user.id,
              email: user.email,
              campaignType: 'follow_up',
              emailNumber: emailNumber,
              status: 'sent',
              metadata: {
                daysSinceExpiry,
                engagementLevel,
                subscriptionType: user.subscriptionType
              }
            });
            
            results.push({
              email: user.email,
              emailNumber,
              sent: true
            });
            
            console.log(`✅ Sent follow-up email #${emailNumber} to ${user.email}`);
          } catch (emailError) {
            console.error(`❌ Error sending follow-up email to ${user.email}:`, emailError);
            
            // Track failed email
            try {
              await db.insert(emailCampaigns).values({
                userId: user.id,
                email: user.email,
                campaignType: 'follow_up',
                emailNumber: emailNumber,
                status: 'failed',
                metadata: {
                  error: emailError instanceof Error ? emailError.message : 'Unknown error'
                }
              });
            } catch (trackError) {
              console.error('Error tracking failed email:', trackError);
            }
            
            results.push({
              email: user.email,
              emailNumber,
              sent: false,
              error: emailError instanceof Error ? emailError.message : 'Unknown error'
            });
          }
        }
      }

      res.json({
        success: true,
        processed: expiredTrialUsers.length,
        sent: results.filter(r => r.sent).length,
        results
      });
    } catch (error) {
      console.error('❌ Error processing follow-up email campaign:', error);
      res.status(500).json({ error: 'Failed to process follow-up email campaign' });
    }
  });

  // Manual trigger for follow-up email to specific user
  app.post('/api/email-campaigns/send-follow-up/:email', async (req, res) => {
    try {
      const { email } = req.params;
      const { emailNumber } = req.body; // Optional: specify which email number (1-7)
      
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const emailToSend = emailNumber || 1; // Default to first email
      
      if (emailToSend < 1 || emailToSend > 7) {
        return res.status(400).json({ error: 'Email number must be between 1 and 7' });
      }

      // Check if this email has already been sent
      const existingEmail = await db
        .select()
        .from(emailCampaigns)
        .where(
          and(
            eq(emailCampaigns.userId, user.id),
            eq(emailCampaigns.campaignType, 'follow_up'),
            eq(emailCampaigns.emailNumber, emailToSend)
          )
        )
        .limit(1);

      if (existingEmail.length > 0) {
        return res.status(400).json({ error: `Follow-up email #${emailToSend} has already been sent to this user` });
      }

      await emailMarketing.sendFollowUpEmail({
        name: user.name || 'Professional Diver',
        email: user.email,
        emailNumber: emailToSend,
        trialExpiresAt: user.trialExpiresAt || undefined
      });

      // Track the email
      await db.insert(emailCampaigns).values({
        userId: user.id,
        email: user.email,
        campaignType: 'follow_up',
        emailNumber: emailToSend,
        status: 'sent'
      });

      res.json({
        success: true,
        message: `Follow-up email #${emailToSend} sent to ${email}`
      });
    } catch (error) {
      console.error('❌ Error sending follow-up email:', error);
      res.status(500).json({ error: 'Failed to send follow-up email' });
    }
  });

  // Send testimonial promo email to purchasers
  app.post('/api/email-campaigns/send-testimonial-promo', async (req, res) => {
    try {
      // This endpoint sends testimonial promo emails to users who have purchased subscriptions
      // Should be called for users who have been subscribed for a while (e.g., 7-14 days)
      
      const { userId, email } = req.body;
      
      if (!userId && !email) {
        return res.status(400).json({ error: 'Either userId or email is required' });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(
          userId ? eq(users.id, userId) : eq(users.email, email)
        )
        .limit(1);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Only send to paid subscribers (MONTHLY or ANNUAL)
      if (user.subscriptionType !== 'MONTHLY' && user.subscriptionType !== 'ANNUAL') {
        return res.status(400).json({ error: 'Testimonial promo is only available for paid subscribers' });
      }

      // Check if testimonial promo has already been sent
      const existingEmail = await db
        .select()
        .from(emailCampaigns)
        .where(
          and(
            eq(emailCampaigns.userId, user.id),
            eq(emailCampaigns.campaignType, 'testimonial_promo')
          )
        )
        .limit(1);

      if (existingEmail.length > 0) {
        return res.status(400).json({ error: 'Testimonial promo email has already been sent to this user' });
      }

      // Check if user has already submitted a testimonial
      const existingTestimonial = await db
        .select()
        .from(testimonials)
        .where(eq(testimonials.userId, user.id))
        .limit(1);

      if (existingTestimonial.length > 0) {
        return res.status(400).json({ error: 'User has already submitted a testimonial' });
      }

      await emailMarketing.sendTestimonialPromoEmail({
        name: user.name || 'Professional Diver',
        email: user.email,
        subscriptionType: user.subscriptionType as 'MONTHLY' | 'ANNUAL',
        subscriptionStartDate: user.createdAt
      });

      // Track the email
      await db.insert(emailCampaigns).values({
        userId: user.id,
        email: user.email,
        campaignType: 'testimonial_promo',
        status: 'sent',
        metadata: {
          subscriptionType: user.subscriptionType
        }
      });

      res.json({
        success: true,
        message: `Testimonial promo email sent to ${user.email}`
      });
    } catch (error) {
      console.error('❌ Error sending testimonial promo email:', error);
      res.status(500).json({ error: 'Failed to send testimonial promo email' });
    }
  });

  // Send testimonial promo to all eligible users (batch)
  app.post('/api/email-campaigns/send-testimonial-promo-batch', async (req, res) => {
    try {
      // Send to users who have been subscribed for 7-30 days and haven't received the email
      const daysSinceSubscription = req.body.daysSinceSubscription || 14; // Default 14 days
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysSinceSubscription);

      const eligibleUsers = await db
        .select()
        .from(users)
        .where(
          and(
            or(eq(users.subscriptionType, 'MONTHLY'), eq(users.subscriptionType, 'ANNUAL')),
            sql`${users.createdAt} <= ${cutoffDate.toISOString()}`
          )
        );

      const results = [];
      
      for (const user of eligibleUsers) {
        // Check if already sent
        const existingEmail = await db
          .select()
          .from(emailCampaigns)
          .where(
            and(
              eq(emailCampaigns.userId, user.id),
              eq(emailCampaigns.campaignType, 'testimonial_promo')
            )
          )
          .limit(1);

        if (existingEmail.length > 0) continue;

        // Check if testimonial already submitted
        const existingTestimonial = await db
          .select()
          .from(testimonials)
          .where(eq(testimonials.userId, user.id))
          .limit(1);

        if (existingTestimonial.length > 0) continue;

        try {
          await emailMarketing.sendTestimonialPromoEmail({
            name: user.name || 'Professional Diver',
            email: user.email,
            subscriptionType: user.subscriptionType as 'MONTHLY' | 'ANNUAL',
            subscriptionStartDate: user.createdAt
          });

          await db.insert(emailCampaigns).values({
            userId: user.id,
            email: user.email,
            campaignType: 'testimonial_promo',
            status: 'sent',
            metadata: {
              subscriptionType: user.subscriptionType
            }
          });

          results.push({ email: user.email, sent: true });
        } catch (error) {
          results.push({ 
            email: user.email, 
            sent: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      res.json({
        success: true,
        processed: eligibleUsers.length,
        sent: results.filter(r => r.sent).length,
        results
      });
    } catch (error) {
      console.error('❌ Error sending batch testimonial promo emails:', error);
      res.status(500).json({ error: 'Failed to send batch testimonial promo emails' });
    }
  });

  // Testimonials API
  app.post('/api/testimonials/submit', async (req, res) => {
    try {
      // For now, accept JSON with video URL
      // Video file upload can be handled separately via object storage upload endpoint
      const { name, email, writtenTestimonial, videoUrl, videoStoragePath } = req.body;

      if (!name || !email || !writtenTestimonial) {
        return res.status(400).json({ error: 'Name, email, and written testimonial are required' });
      }

      if (!videoUrl && !videoStoragePath) {
        return res.status(400).json({ error: 'Either video URL or video storage path is required' });
      }

      // Find user by email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        return res.status(404).json({ error: 'User not found. Please ensure you are logged in with the correct email.' });
      }

      // Check if user has already submitted a testimonial
      const existingTestimonial = await db
        .select()
        .from(testimonials)
        .where(eq(testimonials.userId, user.id))
        .limit(1);

      if (existingTestimonial.length > 0) {
        return res.status(400).json({ error: 'You have already submitted a testimonial.' });
      }

      // Create testimonial record
      const [testimonial] = await db
        .insert(testimonials)
        .values({
          userId: user.id,
          email: email,
          name: name,
          writtenTestimonial: writtenTestimonial,
          videoUrl: videoUrl || null,
          videoStoragePath: videoStoragePath || null,
          status: 'pending',
          freeMonthAwarded: false,
        })
        .returning();

      res.json({
        success: true,
        message: 'Testimonial submitted successfully. We will review it and add your free month once approved.',
        testimonial: {
          id: testimonial.id,
          status: testimonial.status,
        },
      });
    } catch (error) {
      console.error('❌ Error submitting testimonial:', error);
      res.status(500).json({ error: 'Failed to submit testimonial' });
    }
  });

  // Get user's testimonial status
  app.get('/api/testimonials/my-status', async (req, res) => {
    try {
      const email = req.query.email as string;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const [testimonial] = await db
        .select()
        .from(testimonials)
        .where(eq(testimonials.userId, user.id))
        .limit(1);

      if (!testimonial) {
        return res.json({ hasTestimonial: false });
      }

      res.json({
        hasTestimonial: true,
        status: testimonial.status,
        freeMonthAwarded: testimonial.freeMonthAwarded,
        submittedAt: testimonial.createdAt,
      });
    } catch (error) {
      console.error('❌ Error fetching testimonial status:', error);
      res.status(500).json({ error: 'Failed to fetch testimonial status' });
    }
  });

  // Revolut Payment Webhook Handler
  app.post('/api/revolut/payment-webhook', async (req, res) => {
    try {
      const webhookData = req.body;
      const rawBody = JSON.stringify(webhookData);
      
      // Log webhook for debugging
      console.log('📥 Received Revolut webhook:', rawBody.substring(0, 500));

      // Verify webhook signature
      const webhookSecret = process.env.REVOLUT_WEBHOOK_SECRET;
      const signature = req.headers['revolut-signature'] as string | undefined;
      
      if (!verifyRevolutWebhook(webhookData, signature, webhookSecret)) {
        console.error('❌ Invalid Revolut webhook signature');
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }

      // Handle different webhook event types
      const eventType = webhookData.event || webhookData.type;
      
      if (eventType === 'ORDER_COMPLETED' || eventType === 'PAYMENT_CAPTURED') {
        // Extract payment details
        const orderId = webhookData.data?.order?.id || webhookData.data?.id;
        const amount = webhookData.data?.amount || webhookData.data?.order?.amount;
        const currency = webhookData.data?.currency || webhookData.data?.order?.currency;
        const customerEmail = webhookData.data?.customer?.email || webhookData.data?.customer_email;
        const metadata = webhookData.data?.metadata || webhookData.data?.order?.metadata || {};

        if (!customerEmail) {
          console.warn('⚠️ Webhook missing customer email');
          return res.status(400).json({ error: 'Missing customer email' });
        }

        // Determine subscription type from amount
        // $25 = 2500 cents (monthly), $250 = 25000 cents (annual)
        let subscriptionType: 'MONTHLY' | 'ANNUAL' | null = null;
        if (amount === 2500 || amount === 2500.00) {
          subscriptionType = 'MONTHLY';
        } else if (amount === 25000 || amount === 25000.00) {
          subscriptionType = 'ANNUAL';
        } else {
          console.warn(`⚠️ Unknown payment amount: ${amount}`);
          // Still process the payment, but log warning
        }

        if (subscriptionType) {
          // Find user by email
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, customerEmail))
            .limit(1);

          if (user) {
            // Calculate expiration date
            const now = new Date();
            const expirationDate = new Date(now);
            
            if (subscriptionType === 'MONTHLY') {
              expirationDate.setDate(expirationDate.getDate() + 30);
            } else if (subscriptionType === 'ANNUAL') {
              expirationDate.setDate(expirationDate.getDate() + 365);
            }

            // Check if user already has an active subscription
            const hasActiveSubscription = user.subscriptionType === 'MONTHLY' || user.subscriptionType === 'ANNUAL';
            
            if (hasActiveSubscription && user.trialExpiresAt) {
              // Extend existing subscription (renewal)
              const currentExpiration = new Date(user.trialExpiresAt);
              const newExpiration = new Date(currentExpiration);
              
              if (subscriptionType === 'MONTHLY') {
                newExpiration.setDate(newExpiration.getDate() + 30);
              } else {
                newExpiration.setDate(newExpiration.getDate() + 365);
              }

              await db
                .update(users)
                .set({
                  subscriptionType: subscriptionType,
                  trialExpiresAt: newExpiration,
                  subscriptionStatus: 'ACTIVE',
                  updatedAt: now
                })
                .where(eq(users.id, user.id));

              console.log(`✅ Renewed ${subscriptionType} subscription for ${customerEmail}, expires ${newExpiration.toISOString()}`);
            } else {
              // New subscription
              await db
                .update(users)
                .set({
                  subscriptionType: subscriptionType,
                  trialExpiresAt: expirationDate,
                  subscriptionStatus: 'ACTIVE',
                  updatedAt: now
                })
                .where(eq(users.id, user.id));

              console.log(`✅ Activated ${subscriptionType} subscription for ${customerEmail}, expires ${expirationDate.toISOString()}`);

              // Send thank you email with login credentials
              try {
                await emailMarketing.sendPurchaseThankYouEmail({
                  name: user.name || 'Professional Diver',
                  email: customerEmail,
                  subscriptionType: subscriptionType,
                  expirationDate: expirationDate,
                  loginEmail: customerEmail,
                  loginPassword: undefined, // Password is not stored, user should use their existing password or reset
                  amount: amount,
                  transactionId: orderId || `REV-${Date.now()}`,
                  invoiceNumber: `INV-${orderId ? orderId.substring(0, 12).toUpperCase() : Date.now()}`,
                  paymentDate: new Date()
                });
                
                // Track the thank you email
                await db.insert(emailCampaigns).values({
                  userId: user.id,
                  email: customerEmail,
                  campaignType: 'thank_you',
                  status: 'sent',
                  metadata: {
                    subscriptionType: subscriptionType,
                    expirationDate: expirationDate.toISOString()
                  }
                });
                
                console.log(`✅ Sent purchase thank you email to ${customerEmail}`);
              } catch (emailError) {
                console.error('Error sending purchase thank you email:', emailError);
              }
            }

            // Track affiliate conversion if applicable
            if (user.referredBy) {
              try {
                await affiliateService.processReferral({
                  affiliateCode: user.referredBy,
                  referredUserId: user.id,
                  subscriptionType: subscriptionType,
                  monthlyValue: subscriptionType === 'MONTHLY' ? 2500 : 25000
                });
                console.log(`✅ Tracked affiliate conversion for ${user.referredBy}`);
              } catch (affiliateError) {
                console.error('Error processing affiliate conversion:', affiliateError);
              }
            }
          } else {
            console.warn(`⚠️ User not found for email: ${customerEmail}`);
            // Could create user account here if needed
          }
        }
      }

      // Always return 200 to acknowledge receipt
      res.json({ received: true });
    } catch (error) {
      console.error('❌ Error processing Revolut webhook:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Stripe Payment Webhook Handler
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      const signature = req.headers['stripe-signature'] as string | undefined;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!webhookSecret) {
        console.warn('⚠️ STRIPE_WEBHOOK_SECRET not configured - skipping signature verification');
      } else if (!verifyStripeWebhook(req.body, signature, webhookSecret)) {
        console.error('❌ Invalid Stripe webhook signature');
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }

      const event = JSON.parse(req.body.toString());
      console.log('📥 Received Stripe webhook:', event.type);

      // Handle different event types
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const customerEmail = session.customer_details?.email || session.customer_email;
        const amount = session.amount_total; // in cents
        const subscriptionType = amount === 2500 ? 'MONTHLY' : amount === 25000 ? 'ANNUAL' : null;
        const metadata = session.metadata || {};
        const affiliateCode = metadata.affiliateCode;

        if (!customerEmail) {
          console.warn('⚠️ Stripe webhook missing customer email');
          return res.status(400).json({ error: 'Missing customer email' });
        }

        // Find or create user
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, customerEmail))
          .limit(1);

        if (user && subscriptionType) {
          const now = new Date();
          const expirationDate = subscriptionType === 'MONTHLY' 
            ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

          await db
            .update(users)
            .set({
              subscriptionType: subscriptionType,
              trialExpiresAt: expirationDate,
              subscriptionStatus: 'ACTIVE',
              stripeCustomerId: session.customer,
              updatedAt: now
            })
            .where(eq(users.id, user.id));

          console.log(`✅ Activated ${subscriptionType} subscription for ${customerEmail} via Stripe`);

          // Track affiliate conversion if applicable
          if (affiliateCode) {
            try {
              await affiliateService.processReferral({
                affiliateCode: affiliateCode,
                referredUserId: user.id,
                subscriptionType: subscriptionType,
                monthlyValue: subscriptionType === 'MONTHLY' ? 2500 : 25000
              });
              console.log(`✅ Tracked affiliate conversion for ${affiliateCode}`);
            } catch (affiliateError) {
              console.error('Error processing affiliate conversion:', affiliateError);
            }
          }

          // Send thank you email with receipt/invoice
          try {
            await emailMarketing.sendPurchaseThankYouEmail({
              name: user.name || 'Professional Diver',
              email: customerEmail,
              subscriptionType: subscriptionType,
              expirationDate: expirationDate,
              loginEmail: customerEmail,
              amount: amount,
              transactionId: session.id,
              invoiceNumber: session.invoice || `INV-${session.id.substring(0, 12).toUpperCase()}`,
              paymentDate: new Date()
            });
            console.log(`✅ Sent purchase thank you email with receipt to ${customerEmail}`);
          } catch (emailError) {
            console.error('Error sending purchase thank you email:', emailError);
          }
        }
      } else if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        console.log('✅ Payment succeeded:', paymentIntent.id);
      } else if (event.type === 'transfer.created') {
        const transfer = event.data.object;
        console.log('✅ Transfer created:', transfer.id, 'Amount:', transfer.amount);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('❌ Error processing Stripe webhook:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Test Purchase Endpoint - Simulates a purchase and sends email with receipt
  app.post('/api/test/purchase', async (req, res) => {
    try {
      const { email, name, subscriptionType = 'MONTHLY' } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Calculate expiration date
      const now = new Date();
      const expirationDate = subscriptionType === 'MONTHLY' 
        ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

      // Calculate amount
      const amount = subscriptionType === 'MONTHLY' ? 2500 : 25000; // in cents

      // Generate test transaction ID and invoice number
      const transactionId = `TEST-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      // Find or create user
      let user;
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser) {
        user = existingUser;
        // Update subscription
        await db
          .update(users)
          .set({
            subscriptionType: subscriptionType,
            trialExpiresAt: expirationDate,
            subscriptionStatus: 'ACTIVE',
            updatedAt: now
          })
          .where(eq(users.id, user.id));
      } else {
        // Create test user
        const userId = nanoid();
        await db.insert(users).values({
          id: userId,
          email: email,
          name: name || 'Test User',
          subscriptionType: subscriptionType,
          trialExpiresAt: expirationDate,
          subscriptionStatus: 'ACTIVE',
          createdAt: now,
          updatedAt: now
        });
        user = { id: userId, email, name: name || 'Test User' };
      }

      // Send purchase thank you email with receipt
      try {
        await emailMarketing.sendPurchaseThankYouEmail({
          name: user.name || name || 'Test User',
          email: email,
          subscriptionType: subscriptionType as 'MONTHLY' | 'ANNUAL',
          expirationDate: expirationDate,
          loginEmail: email,
          amount: amount,
          transactionId: transactionId,
          invoiceNumber: invoiceNumber,
          paymentDate: now
        });

        console.log(`✅ Test purchase email sent to ${email}`);

        res.json({
          success: true,
          message: 'Test purchase completed and email sent',
          purchase: {
            email: email,
            name: user.name || name,
            subscriptionType: subscriptionType,
            amount: `$${(amount / 100).toFixed(2)}`,
            transactionId: transactionId,
            invoiceNumber: invoiceNumber,
            expirationDate: expirationDate.toISOString(),
            emailSent: true
          }
        });
      } catch (emailError) {
        console.error('Error sending test purchase email:', emailError);
        res.status(500).json({
          error: 'Purchase processed but email failed',
          message: emailError instanceof Error ? emailError.message : 'Unknown error',
          purchase: {
            email: email,
            name: user.name || name,
            subscriptionType: subscriptionType,
            amount: `$${(amount / 100).toFixed(2)}`,
            transactionId: transactionId,
            invoiceNumber: invoiceNumber,
            expirationDate: expirationDate.toISOString(),
            emailSent: false
          }
        });
      }
    } catch (error) {
      console.error('❌ Error processing test purchase:', error);
      res.status(500).json({
        error: 'Failed to process test purchase',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Stripe Checkout Session Creation
  app.post('/api/stripe/create-checkout', async (req, res) => {
    try {
      const { subscriptionType, affiliateCode, customerEmail, customerName } = req.body;
      const integrationsService = getAffiliateIntegrationsService();
      
      if (!integrationsService || !integrationsService.config.stripe.enabled) {
        return res.status(503).json({ error: 'Stripe integration not configured' });
      }

      if (!subscriptionType || !['MONTHLY', 'ANNUAL'].includes(subscriptionType)) {
        return res.status(400).json({ error: 'Invalid subscription type. Must be MONTHLY or ANNUAL' });
      }

      const stripe = new (await import('stripe')).default(
        process.env.STRIPE_SECRET_KEY!,
        { apiVersion: '2024-12-18.acacia' }
      );

      const amount = subscriptionType === 'MONTHLY' ? 2500 : 25000; // $25 or $250 in cents
      const priceId = subscriptionType === 'MONTHLY' 
        ? process.env.STRIPE_PRICE_ID_MONTHLY 
        : process.env.STRIPE_PRICE_ID_ANNUAL;

      // Create checkout session
      const sessionParams: any = {
        payment_method_types: ['card'],
        line_items: priceId ? [
          {
            price: priceId,
            quantity: 1,
          }
        ] : [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Professional Diver Training - ${subscriptionType === 'MONTHLY' ? 'Monthly' : 'Annual'} Subscription`,
                description: 'Full access to professional diving exam preparation platform',
              },
              unit_amount: amount,
              recurring: subscriptionType === 'MONTHLY' ? {
                interval: 'month',
              } : {
                interval: 'year',
              },
            },
            quantity: 1,
          }
        ],
        mode: 'subscription',
        success_url: `${req.headers.origin || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin || 'http://localhost:3000'}/cancel`,
        metadata: {
          subscriptionType: subscriptionType,
          ...(affiliateCode && { affiliateCode: affiliateCode }),
        },
      };

      if (customerEmail) {
        sessionParams.customer_email = customerEmail;
      }

      if (customerName) {
        sessionParams.customer_creation = 'always';
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      res.json({ 
        success: true, 
        checkoutUrl: session.url,
        sessionId: session.id 
      });
    } catch (error: any) {
      console.error('Stripe checkout creation error:', error);
      res.status(500).json({ 
        error: 'Failed to create checkout session',
        message: error.message || 'Unknown error'
      });
    }
  });

  app.get('/api/affiliate/analytics/:affiliateCode', async (req, res) => {
    try {
      const { affiliateCode } = req.params;
      
      // Mock analytics data - replace with actual analytics service
      const analytics = {
        affiliateCode,
        totalClicks: 150,
        conversions: 12,
        conversionRate: 8.0,
        totalCommissions: 25000,
        avgOrderValue: 2083,
        topReferralSources: [
          { source: 'Facebook', clicks: 60, conversions: 5 },
          { source: 'Google', clicks: 45, conversions: 4 },
          { source: 'Direct', clicks: 30, conversions: 2 },
          { source: 'Email', clicks: 15, conversions: 1 }
        ],
        monthlyPerformance: [
          { month: 'Jan', commissions: 5000, conversions: 2 },
          { month: 'Feb', commissions: 7500, conversions: 3 },
          { month: 'Mar', commissions: 12500, conversions: 7 }
        ]
      };

      res.json(analytics);
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  app.post('/api/affiliate/create', async (req, res) => {
    try {
      const { userId, name, email, parentAffiliateId, parentAffiliateCode } = req.body;
      
      if (!userId || !name || !email) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // If parent affiliate code is provided, get the parent affiliate ID
      let finalParentId = parentAffiliateId;
      if (parentAffiliateCode && !parentAffiliateId) {
        const parent = await affiliateService.getAffiliateByCode(parentAffiliateCode);
        if (parent) {
          finalParentId = parent.id;
        }
      }

      const affiliate = await affiliateService.createAffiliate({ 
        userId, 
        name, 
        email,
        parentAffiliateId: finalParentId,
        parentAffiliateCode: parentAffiliateCode || (finalParentId ? (await affiliateService.getAffiliateByUserId(finalParentId))?.affiliateCode : null)
      });
      res.json({ success: true, affiliate });
    } catch (error) {
      console.error('Affiliate creation error:', error);
      res.status(500).json({ error: 'Failed to create affiliate account' });
    }
  });

  // Get sub-affiliates managed by a partner admin
  app.get('/api/affiliate/sub-affiliates', async (req, res) => {
    try {
      const managerEmail = req.query.email as string;
      
      if (!managerEmail) {
        return res.status(400).json({ error: 'Manager email is required' });
      }

      const subAffiliates = await affiliateService.getManagedAffiliates(managerEmail);
      res.json({ success: true, subAffiliates, count: subAffiliates.length });
    } catch (error) {
      console.error('Get sub-affiliates error:', error);
      res.status(500).json({ error: 'Failed to get sub-affiliates' });
    }
  });

  // Learning Path AI Routes
  app.post('/api/learning-path/generate', async (req, res) => {
    try {
      // Support both old format (profile) and new format (preferences)
      const { profile, preferences, additionalInfo } = req.body;
      
      // Normalize the data structure
      let userProfile;
      if (preferences) {
        // New format from frontend
        userProfile = {
          experience: preferences.experienceLevel || '',
          goals: preferences.interests || [],
          timeCommitment: preferences.timeAvailable || '',
          certifications: [],
          interests: preferences.interests || []
        };
      } else if (profile) {
        // Old format
        userProfile = profile;
      } else {
        return res.status(400).json({ error: 'Profile or preferences with experience and goals is required' });
      }
      
      if (!userProfile.experience || !userProfile.goals || userProfile.goals.length === 0) {
        return res.status(400).json({ error: 'Experience level and at least one goal are required' });
      }

      // Import and use the AI Learning Path Service
      try {
        const { AILearningPathService } = await import('./ai-learning-path');
        const aiLearningPathService = new AILearningPathService();
        const suggestions = await aiLearningPathService.generateLearningPath(userProfile, additionalInfo);
        
        res.json({ 
          success: true,
          suggestions: suggestions || [],
          message: "Learning path generated successfully"
        });
      } catch (aiError) {
        console.error('AI Learning Path Service Error:', aiError);
        // Fallback: Generate intelligent suggestions without AI
        const fallbackSuggestions = generateFallbackLearningPath(userProfile);
        res.json({ 
          success: true,
          suggestions: fallbackSuggestions,
          message: "Learning path generated using intelligent matching"
        });
      }
    } catch (error) {
      console.error('Learning path generation error:', error);
      res.status(500).json({ error: 'Failed to generate learning path suggestions', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Fallback function for learning path generation
  function generateFallbackLearningPath(userProfile: any): any[] {
    const isBeginner = userProfile.experience?.toLowerCase().includes('beginner') || 
                      userProfile.experience?.toLowerCase().includes('new') ||
                      userProfile.experience?.toLowerCase().includes('recreational');
    
    const goals = userProfile.goals || [];
    const hasCommercialGoal = goals.some((g: string) => g.toLowerCase().includes('commercial'));
    const hasInspectionGoal = goals.some((g: string) => g.toLowerCase().includes('inspection'));
    const hasMedicalGoal = goals.some((g: string) => g.toLowerCase().includes('medic') || g.toLowerCase().includes('medicine'));
    const hasSupervisorGoal = goals.some((g: string) => g.toLowerCase().includes('supervisor') || g.toLowerCase().includes('management'));
    const hasWeldingGoal = goals.some((g: string) => g.toLowerCase().includes('welding'));
    const hasSaturationGoal = goals.some((g: string) => g.toLowerCase().includes('saturation'));

    const suggestions: any[] = [];

    // Path 1: Foundation Path (for beginners or commercial diving career)
    if (isBeginner || hasCommercialGoal) {
      suggestions.push({
        id: "foundation-path",
        title: "Commercial Diving Foundation Path",
        description: "Essential certifications to start your commercial diving career with a strong safety foundation",
        difficulty: "Beginner",
        estimatedWeeks: 16,
        tracks: [
          {
            id: "alst",
            title: "Assistant Life Support Technician",
            slug: "alst",
            order: 1,
            reason: "Foundation certification required for all commercial diving operations. Covers essential life support systems and safety protocols."
          },
          {
            id: "lst",
            title: "Life Support Technician (LST)",
            slug: "lst",
            order: 2,
            reason: "Advanced life support systems management. Builds on ALST foundation with deeper technical knowledge."
          }
        ],
        confidence: 90,
        reasoning: "This foundation path provides the essential safety certifications required by industry standards (IMCA, ADCI) for all commercial diving operations. Starting with ALST ensures you understand critical life support systems before advancing to specialized roles."
      });
    }

    // Path 2: Specialized Career Path based on goals
    if (hasInspectionGoal || hasWeldingGoal || hasSupervisorGoal) {
      const specializedTracks: any[] = [];
      
      if (hasInspectionGoal) {
        specializedTracks.push({
          id: "ndt-inspection",
          title: "NDT Inspection & Testing",
          slug: "ndt-inspection",
          order: specializedTracks.length + 1,
          reason: "Professional underwater inspection techniques for structural integrity assessment and quality assurance."
        });
      }
      
      if (hasWeldingGoal) {
        specializedTracks.push({
          id: "underwater-welding",
          title: "Advanced Underwater Welding",
          slug: "underwater-welding",
          order: specializedTracks.length + 1,
          reason: "Professional underwater welding techniques, electrode selection, and quality control for marine construction."
        });
      }
      
      if (hasSupervisorGoal) {
        specializedTracks.push({
          id: "commercial-supervisor",
          title: "Commercial Dive Supervisor",
          slug: "commercial-supervisor",
          order: specializedTracks.length + 1,
          reason: "Leadership and dive operations management. Essential for advancing to supervisory roles."
        });
      }

      if (specializedTracks.length > 0) {
        suggestions.push({
          id: "specialized-path",
          title: "Specialized Career Development Path",
          description: "Advanced certifications aligned with your specific career goals and interests",
          difficulty: "Advanced",
          estimatedWeeks: 24,
          tracks: specializedTracks,
          confidence: 85,
          reasoning: `Based on your goals (${goals.join(', ')}), this path focuses on specialized certifications that directly advance your career objectives. These certifications are in high demand and offer excellent career progression opportunities.`
        });
      }
    }

    // Path 3: Medical/Safety Path
    if (hasMedicalGoal) {
      suggestions.push({
        id: "medical-path",
        title: "Diving Medicine & Safety Specialist Path",
        description: "Comprehensive medical response and safety management for diving operations",
        difficulty: "Expert",
        estimatedWeeks: 20,
        tracks: [
          {
            id: "diver-medic",
            title: "Diver Medic Technician",
            slug: "diver-medic",
            order: 1,
            reason: "Emergency medical response and diving injury treatment. Critical for safety leadership roles."
          },
          {
            id: "hyperbaric-operations",
            title: "Hyperbaric Chamber Operations",
            slug: "hyperbaric-operations",
            order: 2,
            reason: "Hyperbaric treatment protocols and patient monitoring. Complements medical training."
          }
        ],
        confidence: 88,
        reasoning: "This path combines medical emergency response with hyperbaric medicine, creating a comprehensive safety specialist profile highly valued in commercial diving operations."
      });
    }

    // Path 4: Deep Diving Path
    if (hasSaturationGoal) {
      suggestions.push({
        id: "deep-diving-path",
        title: "Deep Sea & Saturation Diving Path",
        description: "Advanced deep-sea operations and saturation diving systems",
        difficulty: "Expert",
        estimatedWeeks: 28,
        tracks: [
          {
            id: "saturation-diving",
            title: "Saturation Diving Systems",
            slug: "saturation-diving",
            order: 1,
            reason: "Saturation diving operations, life support systems, and decompression management for deep-sea work."
          },
          {
            id: "alst",
            title: "Assistant Life Support Technician",
            slug: "alst",
            order: 2,
            reason: "Essential prerequisite for saturation diving operations."
          }
        ],
        confidence: 92,
        reasoning: "Saturation diving requires advanced life support knowledge. This path ensures you have the foundational skills before advancing to deep-sea operations."
      });
    }

    // If no specific paths match, provide a general advancement path
    if (suggestions.length === 0) {
      suggestions.push({
        id: "general-advancement",
        title: "Professional Diving Advancement Path",
        description: "Comprehensive training to advance your diving career across multiple specializations",
        difficulty: "Intermediate",
        estimatedWeeks: 20,
        tracks: [
          {
            id: "alst",
            title: "Assistant Life Support Technician",
            slug: "alst",
            order: 1,
            reason: "Foundation for all commercial diving operations"
          },
          {
            id: "diver-medic",
            title: "Diver Medic Technician",
            slug: "diver-medic",
            order: 2,
            reason: "Medical emergency response capabilities"
          },
          {
            id: "ndt-inspection",
            title: "NDT Inspection & Testing",
            slug: "ndt-inspection",
            order: 3,
            reason: "Professional inspection skills for career diversification"
          }
        ],
        confidence: 80,
        reasoning: "This balanced path provides a strong foundation in safety, medical response, and technical skills, opening multiple career opportunities in commercial diving."
      });
    }

    return suggestions;
  }

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
      // Check admin access - only admins can edit lessons
      const email = req.query.email as string || req.headers['x-user-email'] as string || 
                    (req.body as any)?.email as string;
      
      if (email) {
        // Check userManagement first (for special accounts)
        const user = userManagement.getUser(email);
        if (user) {
          const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'PARTNER_ADMIN';
          if (!isAdmin) {
            return res.status(403).json({ error: 'Admin access required to edit lessons' });
          }
        } else {
          // Check database for regular users
          const [dbUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
          if (dbUser) {
            const isAdmin = dbUser.role === 'SUPER_ADMIN' || dbUser.role === 'ADMIN' || dbUser.role === 'PARTNER_ADMIN';
            if (!isAdmin) {
              return res.status(403).json({ error: 'Admin access required to edit lessons' });
            }
          } else {
            return res.status(403).json({ error: 'Admin access required to edit lessons' });
          }
        }
      } else {
        return res.status(403).json({ error: 'Authentication required to edit lessons' });
      }

      const { id } = req.params;
      
      // Log the incoming request for debugging
      console.log('Lesson update request:', {
        id,
        bodyKeys: Object.keys(req.body),
        hasVideos: !!req.body.videos,
        hasDocuments: !!req.body.documents,
        hasContent: !!req.body.content,
        contentLength: req.body.content ? String(req.body.content).length : 0,
        videosType: typeof req.body.videos,
        documentsType: typeof req.body.documents,
        contentType: typeof req.body.content,
        documentsValue: Array.isArray(req.body.documents) ? req.body.documents.length : req.body.documents
      });
      
      // Parse and validate update data
      let updateData;
      try {
        updateData = insertLessonSchema.partial().parse(req.body);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          console.error('Validation error:', validationError.errors);
          return res.status(400).json({ 
            error: "Invalid data", 
            details: validationError.errors,
            message: "Schema validation failed. Check the details for specific field errors."
          });
        }
        throw validationError;
      }
      
      // Log what we're about to update
      console.log('Updating lesson with data:', {
        id,
        updateKeys: Object.keys(updateData),
        hasVideos: !!updateData.videos,
        hasDocuments: !!updateData.documents,
        hasContent: !!updateData.content,
        contentLength: updateData.content ? String(updateData.content).length : 0
      });
      
      const lesson = await storage.updateLesson(id, updateData);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }

      // Trigger automatic backup after successful lesson update
      if (isAutoBackupEnabled()) {
        autoBackupTracksAndLessons();
      }

      res.json(lesson);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Zod validation error:', error.errors);
        return res.status(400).json({ 
          error: "Invalid data", 
          details: error.errors,
          message: "Schema validation failed. Check the details for specific field errors."
        });
      }
      console.error('Lesson update error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ 
        error: "Failed to update lesson",
        message: error instanceof Error ? error.message : String(error),
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      });
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

  // CSV Export Routes - Admin only
  // Helper function to escape CSV values
  const csvEscape = (value: any): string => {
    if (value === null || value === undefined) return '';
    const s = String(value);
    if (/[",\n]/.test(s)) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };

  // Export quiz attempts to CSV
  app.get("/api/admin/exports/attempts", async (req, res) => {
    try {
      // Check admin access (basic check - enhance with proper auth)
      const email = req.query.email as string || req.headers['x-user-email'] as string;
      if (email) {
        const user = userManagement.getUser(email);
        if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' && user.role !== 'PARTNER_ADMIN')) {
          return res.status(403).json({ error: 'Admin access required' });
        }
      }

      const { from, to } = req.query;
      
      // Get attempts from database
      const { quizAttempts, users, quizzes, lessons, tracks } = await import('@shared/schema-sqlite');
      
      let query = db
        .select({
          attemptId: quizAttempts.id,
          userEmail: users.email,
          userName: users.name,
          trackTitle: tracks.title,
          lessonTitle: lessons.title,
          quizTitle: quizzes.title,
          score: quizAttempts.score,
          timeSpent: quizAttempts.timeSpent,
          completedAt: quizAttempts.completedAt,
        })
        .from(quizAttempts)
        .leftJoin(users, eq(quizAttempts.userId, users.id))
        .leftJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
        .leftJoin(lessons, eq(quizzes.lessonId, lessons.id))
        .leftJoin(tracks, eq(lessons.trackId, tracks.id))
        .limit(10000); // Limit to prevent memory issues

      // Apply date filters if provided
      if (from || to) {
        const conditions = [];
        if (from) {
          conditions.push(sql`datetime(${quizAttempts.completedAt}) >= datetime(${from})`);
        }
        if (to) {
          conditions.push(sql`datetime(${quizAttempts.completedAt}) <= datetime(${to})`);
        }
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }
      }

      const attempts = await query.orderBy(sql`${quizAttempts.completedAt} DESC`);

      // Generate CSV
      const header = ['Email', 'Name', 'Track', 'Lesson', 'Quiz', 'Score', 'Time Spent (minutes)', 'Completed At'];
      const rows = attempts.map(attempt => [
        csvEscape(attempt.userEmail || ''),
        csvEscape(attempt.userName || ''),
        csvEscape(attempt.trackTitle || ''),
        csvEscape(attempt.lessonTitle || ''),
        csvEscape(attempt.quizTitle || ''),
        csvEscape(attempt.score || 0),
        csvEscape(attempt.timeSpent || 0),
        csvEscape(attempt.completedAt ? new Date(attempt.completedAt).toISOString() : ''),
      ]);

      const csv = [header, ...rows].map(row => row.join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="attempts-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } catch (error) {
      console.error('CSV export error:', error);
      res.status(500).json({ error: 'Failed to export attempts CSV' });
    }
  });

  // Export users to CSV
  app.get("/api/admin/exports/users", async (req, res) => {
    try {
      // Check admin access
      const email = req.query.email as string || req.headers['x-user-email'] as string;
      if (email) {
        const user = userManagement.getUser(email);
        if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' && user.role !== 'PARTNER_ADMIN')) {
          return res.status(403).json({ error: 'Admin access required' });
        }
      }

      const { users: usersTable } = await import('@shared/schema-sqlite');
      const allUsers = await db.select().from(usersTable);

      // Generate CSV
      const header = ['Email', 'Name', 'Role', 'Subscription Type', 'Subscription Status', 'Affiliate Code', 'Total Earnings', 'Created At', 'Updated At'];
      const rows = allUsers.map(user => [
        csvEscape(user.email || ''),
        csvEscape(user.name || ''),
        csvEscape(user.role || ''),
        csvEscape(user.subscriptionType || ''),
        csvEscape(user.subscriptionStatus || ''),
        csvEscape(user.affiliateCode || ''),
        csvEscape(user.totalEarnings ? (user.totalEarnings / 100).toFixed(2) : '0.00'),
        csvEscape(user.createdAt ? new Date(user.createdAt).toISOString() : ''),
        csvEscape(user.updatedAt ? new Date(user.updatedAt).toISOString() : ''),
      ]);

      const csv = [header, ...rows].map(row => row.join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="users-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } catch (error) {
      console.error('CSV export error:', error);
      res.status(500).json({ error: 'Failed to export users CSV' });
    }
  });

  // Export affiliates to CSV
  app.get("/api/admin/exports/affiliates", async (req, res) => {
    try {
      // Check admin access
      const email = req.query.email as string || req.headers['x-user-email'] as string;
      if (email) {
        const user = userManagement.getUser(email);
        if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' && user.role !== 'PARTNER_ADMIN')) {
          return res.status(403).json({ error: 'Admin access required' });
        }
      }

      // Get all affiliates from affiliate service
      const allAffiliates = await affiliateService.getAllAffiliates();
      const allReferrals = await affiliateService.getAllReferrals();

      // Generate CSV with affiliate and referral data
      const header = ['Affiliate Code', 'Name', 'Email', 'Commission Rate (%)', 'Total Referrals', 'Total Earnings ($)', 'Monthly Earnings ($)', 'Referral Link', 'Is Active', 'Created At'];
      const rows = allAffiliates.map(affiliate => [
        csvEscape(affiliate.affiliateCode || ''),
        csvEscape(affiliate.name || ''),
        csvEscape(affiliate.email || ''),
        csvEscape(affiliate.commissionRate || 0),
        csvEscape(affiliate.totalReferrals || 0),
        csvEscape(affiliate.totalEarnings ? (affiliate.totalEarnings / 100).toFixed(2) : '0.00'),
        csvEscape(affiliate.monthlyEarnings ? (affiliate.monthlyEarnings / 100).toFixed(2) : '0.00'),
        csvEscape(affiliate.referralLink || ''),
        csvEscape(affiliate.isActive ? 'Yes' : 'No'),
        csvEscape(affiliate.createdAt ? new Date(affiliate.createdAt).toISOString() : ''),
      ]);

      const csv = [header, ...rows].map(row => row.join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="affiliates-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } catch (error) {
      console.error('CSV export error:', error);
      res.status(500).json({ error: 'Failed to export affiliates CSV' });
    }
  });

  // Access Control Routes - Super Admin only
  // Test route to verify routing works
  app.get("/api/admin/access-control-test", async (req, res) => {
    res.json({ message: "Access control route is working", timestamp: new Date().toISOString() });
  });

  app.get("/api/admin/access-control", async (req, res) => {
    try {
      // Check if requester is Super Admin
      const email = req.query.email as string || req.headers['x-user-email'] as string;
      console.log('Access control API - request received:', { email, queryEmail: req.query.email, headerEmail: req.headers['x-user-email'] });
      
      if (!email) {
        console.error('Access control API - email missing');
        return res.status(400).json({ error: 'Email is required' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = userManagement.getUser(normalizedEmail);
      console.log('Access control API - user lookup:', { 
        email: normalizedEmail, 
        found: !!user, 
        role: user?.role,
        isSuperAdmin: user?.role === 'SUPER_ADMIN'
      });

      if (!user) {
        console.error('Access control API - user not found:', normalizedEmail);
        return res.status(403).json({ error: 'User not found' });
      }

      if (user.role !== 'SUPER_ADMIN') {
        console.error('Access control API - insufficient permissions:', { email: normalizedEmail, role: user.role });
        return res.status(403).json({ error: `Super Admin access required. Current role: ${user.role}` });
      }

      const permissions = accessControlService.getAllAccessPermissions();
      console.log('Access control API - returning permissions:', {
        count: permissions.length,
        users: permissions.map(p => `${p.name} (${p.email})`)
      });
      res.json(permissions);
    } catch (error) {
      console.error('Access control API error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: `Failed to fetch access control permissions: ${errorMessage}` });
    }
  });

  app.put("/api/admin/access-control/:email", async (req, res) => {
    try {
      // Check if requester is Super Admin
      // Get requester email from query parameter (passed by frontend) or header
      const requesterEmail = (req.query.email as string) || (req.headers['x-user-email'] as string);
      if (!requesterEmail) {
        return res.status(400).json({ error: 'Requester email is required' });
      }

      const requester = userManagement.getUser(requesterEmail);
      if (!requester || requester.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Super Admin access required' });
      }

      // Get target user email from URL params
      const { email } = req.params;
      const { operationsCenter, adminDashboard, crm, analytics, contentEditor } = req.body;

      const updates: any = {};
      if (typeof operationsCenter === 'boolean') updates.operationsCenter = operationsCenter;
      if (typeof adminDashboard === 'boolean') updates.adminDashboard = adminDashboard;
      if (typeof crm === 'boolean') updates.crm = crm;
      if (typeof analytics === 'boolean') updates.analytics = analytics;
      if (typeof contentEditor === 'boolean') updates.contentEditor = contentEditor;

      const success = accessControlService.updateAccessPermissions(
        email,
        updates,
        requesterEmail
      );

      if (!success) {
        return res.status(404).json({ error: 'User not found in access control system' });
      }

      const updatedPermissions = accessControlService.getAccessPermissions(email);
      res.json({ success: true, permissions: updatedPermissions });
    } catch (error) {
      console.error('Access control update API error:', error);
      res.status(500).json({ error: "Failed to update access control permissions" });
    }
  });

  // Get current user's access permissions
  app.get("/api/users/access-permissions", async (req, res) => {
    try {
      const email = req.query.email as string || req.headers['x-user-email'] as string;
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const permissions = accessControlService.getAccessPermissions(email);
      res.json(permissions || {
        operationsCenter: false,
        adminDashboard: false,
        crm: false,
        analytics: false,
        contentEditor: false
      });
    } catch (error) {
      console.error('User access permissions API error:', error);
      res.status(500).json({ error: "Failed to fetch user access permissions" });
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
      const { name, email, phone, bio, company, jobTitle, location, currentEmail, status, timezone, useGravatar } = req.body;
      const userEmail = req.headers['x-user-email'] || currentEmail || email;
      
      if (!userEmail) {
        return res.status(400).json({ error: 'User email is required' });
      }

      // Get user from user management
      const user = userManagement.getUser(userEmail);
      
      // If user doesn't exist in special users, create a basic user record
      let updatedUser;
      if (!user) {
        // Create a new user record for regular users
        updatedUser = {
          id: `user-${userEmail.replace('@', '-').replace(/\./g, '-')}`,
          email: userEmail,
          name: name || 'User',
          phone: phone || '',
          timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          bio: bio || '',
          company: company || '',
          jobTitle: jobTitle || '',
          location: location || '',
          useGravatar: useGravatar ?? false,
          role: 'USER',
          subscriptionType: 'TRIAL',
          subscriptionStatus: status || 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        // Store in user management
        userManagement.updateUser(userEmail, updatedUser);
      } else {
        // Update existing user profile - allow users to edit their own profile
        updatedUser = {
          ...user,
          name: name !== undefined ? name : user.name,
          email: email !== undefined ? email : user.email,
          phone: phone !== undefined ? phone : (user.phone || ''),
          bio: bio !== undefined ? bio : (user.bio || ''),
          company: company !== undefined ? company : (user.company || ''),
          jobTitle: jobTitle !== undefined ? jobTitle : (user.jobTitle || ''),
          location: location !== undefined ? location : (user.location || ''),
          timezone: timezone !== undefined ? timezone : (user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone),
          useGravatar: useGravatar !== undefined ? useGravatar : (user.useGravatar ?? false),
          subscriptionStatus: status !== undefined ? status : (user.subscriptionStatus || user.status || 'ACTIVE'), // Allow status editing
          updatedAt: new Date(),
        };

        // Update in user management
        userManagement.updateUser(userEmail, updatedUser);
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.put("/api/users/profile-picture", async (req, res) => {
    try {
      const { profilePictureURL } = req.body;
      const userEmail = req.headers['x-user-email'] as string || req.body.currentEmail;
      
      if (!profilePictureURL) {
        return res.status(400).json({ error: "Profile picture URL is required" });
      }

      if (!userEmail) {
        return res.status(400).json({ error: "User email is required" });
      }

      // Get user from user management
      const user = userManagement.getUser(userEmail);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Normalize the profile picture URL (for data URLs, keep as is)
      let normalizedPath = profilePictureURL;
      if (!profilePictureURL.startsWith('data:')) {
        const { ObjectStorageService } = await import("./objectStorage");
        const objectStorageService = new ObjectStorageService();
        normalizedPath = objectStorageService.normalizeObjectEntityPath(profilePictureURL);
      }

      // Update user profile picture using user management
      const updatedUser = userManagement.updateUser(userEmail, {
        ...user,
        profilePictureUrl: normalizedPath,
        updatedAt: new Date(),
      });

      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update profile picture" });
      }

      res.json({
        success: true,
        profilePictureUrl: updatedUser.profilePictureUrl,
        updatedAt: updatedUser.updatedAt,
      });
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
        return res.status(400).json({ error: 'Email is required' });
      }

      // Normalize email to lowercase for consistent lookup
      const normalizedEmail = email.toLowerCase().trim();
      
      console.log('Current user lookup:', { 
        requestedEmail: email, 
        normalizedEmail,
        localStorageEmail: req.headers['x-user-email']
      });
      
      // Get user from user management (includes partner admins, super admins, lifetime users, etc.)
      const user = userManagement.getUser(normalizedEmail);
      
      console.log('User lookup result:', { 
        found: !!user, 
        userId: user?.id, 
        userName: user?.name, 
        userEmail: user?.email,
        userRole: user?.role
      });
      
      if (user) {
        // For admin users (SUPER_ADMIN, PARTNER_ADMIN) or LIFETIME users, ensure no trial expiration
        const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'PARTNER_ADMIN' || user.role === 'ADMIN';
        const isLifetime = user.subscriptionType === 'LIFETIME';
        
        // Return user with all profile data
        res.json({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          subscriptionType: user.subscriptionType,
          subscriptionStatus: user.subscriptionStatus || user.status || 'ACTIVE',
          subscriptionDate: user.subscriptionDate,
          // Admin and lifetime users should never have trial expiration
          trialExpiresAt: (isAdmin || isLifetime) ? null : (user.trialExpiresAt || null),
          phone: user.phone || '',
          bio: user.bio || '',
          company: user.company || '',
          jobTitle: user.jobTitle || '',
          location: user.location || '',
          timezone: user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          profilePictureUrl: user.profilePictureUrl,
          useGravatar: user.useGravatar ?? false,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
        return;
      }
      
      // Fallback for users not in special users list
      // Lifetime access users (legacy check)
      const lifetimeUsers = [
        'eroni2519@gmail.com'
      ];
      
      if (lifetimeUsers.includes(email)) {
        res.json({
          id: 'lifetime-user',
          name: 'Lifetime Member',
          email: email,
          role: 'LIFETIME',
          subscriptionType: 'LIFETIME',
          subscriptionDate: new Date('2024-01-01').toISOString(),
          trialExpiresAt: null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
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
        trialExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
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
  // User support endpoint (available to all users)
  app.post("/api/laura-oracle/support", async (req, res) => {
    try {
      const { chatForUserSupport } = await import('./api/laura-oracle');
      await chatForUserSupport(req, res);
    } catch (error) {
      console.error('Laura Oracle user support error:', error);
      res.status(500).json({ error: 'Laura Oracle user support service unavailable' });
    }
  });

  // Admin-only Laura Oracle routes
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

  // Diver Well Consultant routes
  app.post("/api/diver-well/chat", async (req, res) => {
    try {
      const { chatWithDiverWell } = await import('./api/diver-well');
      await chatWithDiverWell(req, res);
    } catch (error) {
      console.error('Diver Well chat error:', error);
      res.status(500).json({ error: 'Diver Well service unavailable' });
    }
  });

  app.post("/api/diver-well/learn-objectives", async (req, res) => {
    try {
      const { learnFromObjectives } = await import('./api/diver-well');
      await learnFromObjectives(req, res);
    } catch (error) {
      console.error('Diver Well learning error:', error);
      res.status(500).json({ error: 'Diver Well learning service unavailable' });
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

  // Support Chat routes (available to all users)
  app.post("/api/chat-support/chat", async (req, res) => {
    try {
      const { chatWithSupport } = await import('./api/chat-support');
      await chatWithSupport(req, res);
    } catch (error) {
      console.error('Support chat error:', error);
      res.status(500).json({ error: 'Support chat service unavailable' });
    }
  });

  app.post("/api/chat-support/voice", async (req, res) => {
    try {
      const { generateSupportVoiceResponse } = await import('./api/chat-support');
      await generateSupportVoiceResponse(req, res);
    } catch (error) {
      console.error('Support voice error:', error);
      res.status(500).json({ error: 'Support voice service unavailable' });
    }
  });

  // ============================================================================
  // OPERATIONS CENTER ROUTES - Professional Operational Management
  // ============================================================================

  // Store active SSE connections for real-time updates (must be defined before routes)
  const sseClients = new Set<{ res: Response; type: string; operationId?: string }>();
  
  // Helper function to broadcast updates to all connected clients
  const broadcastUpdate = (event: string, data: any, filter?: { type?: string; operationId?: string }) => {
    const message = `data: ${JSON.stringify({ event, data, timestamp: new Date().toISOString() })}\n\n`;
    sseClients.forEach((client) => {
      try {
        if (!filter || 
            (filter.type && client.type === filter.type) || 
            (filter.operationId && client.operationId === filter.operationId) ||
            (filter.type === 'all')) {
          // Use write method for SSE (Express Response supports this)
          (client.res as any).write(message);
        }
      } catch (error) {
        // Client disconnected, remove from set
        sseClients.delete(client);
      }
    });
  };

  // In-memory storage for operations data (can be migrated to database later)
  const operationsData = {
    diveOperations: [
      {
        id: "DO-001",
        title: "Platform Installation - North Sea",
        date: "2025-08-25",
        depth: "45m",
        supervisor: "John Smith",
        divers: 4,
        status: "In Progress",
        type: "Commercial",
        location: "North Sea Platform A",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "DO-002",
        title: "Hull Inspection - Port Terminal",
        date: "2025-08-26",
        depth: "12m",
        supervisor: "Sarah Johnson",
        divers: 2,
        status: "Scheduled",
        type: "Inspection",
        location: "Port Terminal B",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    lstOperations: [
      {
        id: "LST-001",
        diveId: "DO-001",
        systems: ["Primary Air", "Emergency Gas", "Communications"],
        technician: "Dave Brown",
        status: "Monitoring",
        lastCheck: "2025-08-25 14:30",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "LST-002",
        diveId: "DO-002",
        systems: ["Hot Water", "Umbilical", "Decompression"],
        technician: "Anna Taylor",
        status: "Standby",
        lastCheck: "2025-08-25 12:00",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    inspectionReports: [
      {
        id: "NDT-001",
        structure: "Pipeline Section A-12",
        inspector: "Mike Wilson",
        date: "2025-08-24",
        findings: "Minor corrosion detected",
        severity: "Low",
        status: "Completed",
        method: "Visual Inspection",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "NDT-002",
        structure: "Weld Joint B-08",
        inspector: "Lisa Chen",
        date: "2025-08-25",
        findings: "Crack initiation observed",
        severity: "High",
        status: "Requires Action",
        method: "Magnetic Particle Inspection",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  };

  // Dive Supervisor Operations Routes
  app.get("/api/operations/dive-operations", async (req, res) => {
    try {
      res.json(operationsData.diveOperations);
    } catch (error) {
      console.error('Dive operations fetch error:', error);
      res.status(500).json({ error: "Failed to fetch dive operations" });
    }
  });

  app.post("/api/operations/dive-operations", async (req, res) => {
    try {
      const { title, date, depth, supervisor, divers, status, type, location } = req.body;
      
      if (!title || !date || !supervisor) {
        return res.status(400).json({ error: "Title, date, and supervisor are required" });
      }

      const newOperation = {
        id: `DO-${String(operationsData.diveOperations.length + 1).padStart(3, '0')}`,
        title,
        date,
        depth: depth || "N/A",
        supervisor,
        divers: divers || 0,
        status: status || "Scheduled",
        type: type || "Commercial",
        location: location || "TBD",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      operationsData.diveOperations.push(newOperation);
      res.status(201).json(newOperation);
    } catch (error) {
      console.error('Dive operation creation error:', error);
      res.status(500).json({ error: "Failed to create dive operation" });
    }
  });

  app.put("/api/operations/dive-operations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const operationIndex = operationsData.diveOperations.findIndex(op => op.id === id);
      
      if (operationIndex === -1) {
        return res.status(404).json({ error: "Dive operation not found" });
      }

      const updatedOperation = {
        ...operationsData.diveOperations[operationIndex],
        ...req.body,
        updatedAt: new Date().toISOString()
      };

      operationsData.diveOperations[operationIndex] = updatedOperation;
      
      // Broadcast update to all connected clients
      broadcastUpdate('dive-operation-updated', updatedOperation, { type: 'dive-operations', operationId: id });
      
      res.json(updatedOperation);
    } catch (error) {
      console.error('Dive operation update error:', error);
      res.status(500).json({ error: "Failed to update dive operation" });
    }
  });

  app.delete("/api/operations/dive-operations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const operationIndex = operationsData.diveOperations.findIndex(op => op.id === id);
      
      if (operationIndex === -1) {
        return res.status(404).json({ error: "Dive operation not found" });
      }

      operationsData.diveOperations.splice(operationIndex, 1);
      res.status(204).send();
    } catch (error) {
      console.error('Dive operation deletion error:', error);
      res.status(500).json({ error: "Failed to delete dive operation" });
    }
  });

  // LST Operations Routes
  app.get("/api/operations/lst-operations", async (req, res) => {
    try {
      res.json(operationsData.lstOperations);
    } catch (error) {
      console.error('LST operations fetch error:', error);
      res.status(500).json({ error: "Failed to fetch LST operations" });
    }
  });

  app.post("/api/operations/lst-operations", async (req, res) => {
    try {
      const { diveId, systems, technician, status, lastCheck } = req.body;
      
      if (!diveId || !technician) {
        return res.status(400).json({ error: "Dive ID and technician are required" });
      }

      const newLSTOperation = {
        id: `LST-${String(operationsData.lstOperations.length + 1).padStart(3, '0')}`,
        diveId,
        systems: systems || [],
        technician,
        status: status || "Standby",
        lastCheck: lastCheck || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      operationsData.lstOperations.push(newLSTOperation);
      res.status(201).json(newLSTOperation);
    } catch (error) {
      console.error('LST operation creation error:', error);
      res.status(500).json({ error: "Failed to create LST operation" });
    }
  });

  app.put("/api/operations/lst-operations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const operationIndex = operationsData.lstOperations.findIndex(op => op.id === id);
      
      if (operationIndex === -1) {
        return res.status(404).json({ error: "LST operation not found" });
      }

      const updatedOperation = {
        ...operationsData.lstOperations[operationIndex],
        ...req.body,
        updatedAt: new Date().toISOString()
      };

      operationsData.lstOperations[operationIndex] = updatedOperation;
      
      // Broadcast update to all connected clients
      broadcastUpdate('lst-operation-updated', updatedOperation, { type: 'lst-operations', operationId: id });
      
      res.json(updatedOperation);
    } catch (error) {
      console.error('LST operation update error:', error);
      res.status(500).json({ error: "Failed to update LST operation" });
    }
  });

  app.delete("/api/operations/lst-operations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const operationIndex = operationsData.lstOperations.findIndex(op => op.id === id);
      
      if (operationIndex === -1) {
        return res.status(404).json({ error: "LST operation not found" });
      }

      operationsData.lstOperations.splice(operationIndex, 1);
      res.status(204).send();
    } catch (error) {
      console.error('LST operation deletion error:', error);
      res.status(500).json({ error: "Failed to delete LST operation" });
    }
  });

  // NDT Inspection Reports Routes
  app.get("/api/operations/ndt-inspections", async (req, res) => {
    try {
      res.json(operationsData.inspectionReports);
    } catch (error) {
      console.error('NDT inspections fetch error:', error);
      res.status(500).json({ error: "Failed to fetch NDT inspections" });
    }
  });

  app.post("/api/operations/ndt-inspections", async (req, res) => {
    try {
      const { structure, inspector, date, findings, severity, status, method } = req.body;
      
      if (!structure || !inspector || !date) {
        return res.status(400).json({ error: "Structure, inspector, and date are required" });
      }

      const newInspection = {
        id: `NDT-${String(operationsData.inspectionReports.length + 1).padStart(3, '0')}`,
        structure,
        inspector,
        date,
        findings: findings || "No findings reported",
        severity: severity || "Low",
        status: status || "Pending",
        method: method || "Visual Inspection",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      operationsData.inspectionReports.push(newInspection);
      res.status(201).json(newInspection);
    } catch (error) {
      console.error('NDT inspection creation error:', error);
      res.status(500).json({ error: "Failed to create NDT inspection" });
    }
  });

  app.put("/api/operations/ndt-inspections/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const inspectionIndex = operationsData.inspectionReports.findIndex(rep => rep.id === id);
      
      if (inspectionIndex === -1) {
        return res.status(404).json({ error: "NDT inspection not found" });
      }

      const updatedInspection = {
        ...operationsData.inspectionReports[inspectionIndex],
        ...req.body,
        updatedAt: new Date().toISOString()
      };

      operationsData.inspectionReports[inspectionIndex] = updatedInspection;
      
      // Broadcast update to all connected clients
      broadcastUpdate('ndt-inspection-updated', updatedInspection, { type: 'ndt-inspections', operationId: id });
      
      res.json(updatedInspection);
    } catch (error) {
      console.error('NDT inspection update error:', error);
      res.status(500).json({ error: "Failed to update NDT inspection" });
    }
  });

  app.delete("/api/operations/ndt-inspections/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const inspectionIndex = operationsData.inspectionReports.findIndex(rep => rep.id === id);
      
      if (inspectionIndex === -1) {
        return res.status(404).json({ error: "NDT inspection not found" });
      }

      operationsData.inspectionReports.splice(inspectionIndex, 1);
      res.status(204).send();
    } catch (error) {
      console.error('NDT inspection deletion error:', error);
      res.status(500).json({ error: "Failed to delete NDT inspection" });
    }
  });

  // Operations Statistics Route
  app.get("/api/operations/stats", async (req, res) => {
    try {
      const stats = {
        diveOperations: {
          total: operationsData.diveOperations.length,
          inProgress: operationsData.diveOperations.filter(op => op.status === "In Progress").length,
          scheduled: operationsData.diveOperations.filter(op => op.status === "Scheduled").length,
          completed: operationsData.diveOperations.filter(op => op.status === "Completed").length
        },
        lstOperations: {
          total: operationsData.lstOperations.length,
          monitoring: operationsData.lstOperations.filter(op => op.status === "Monitoring").length,
          standby: operationsData.lstOperations.filter(op => op.status === "Standby").length
        },
        inspections: {
          total: operationsData.inspectionReports.length,
          completed: operationsData.inspectionReports.filter(rep => rep.status === "Completed").length,
          requiresAction: operationsData.inspectionReports.filter(rep => rep.status === "Requires Action").length,
          highSeverity: operationsData.inspectionReports.filter(rep => rep.severity === "High").length
        }
      };
      res.json(stats);
    } catch (error) {
      console.error('Operations stats error:', error);
      res.status(500).json({ error: "Failed to fetch operations statistics" });
    }
  });

  // ============================================================================
  // REAL-TIME OPERATIONS MONITORING - Live Updates for Supervisors & Admins
  // ============================================================================

  // Server-Sent Events endpoint for real-time updates
  app.get("/api/operations/live-updates", (req, res) => {
    const operationType = req.query.type as string || 'all';
    const operationId = req.query.operationId as string;

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    const client = { res, type: operationType, operationId };
    sseClients.add(client);

    // Send initial connection confirmation
    res.write(`data: ${JSON.stringify({ event: 'connected', message: 'Real-time updates enabled' })}\n\n`);

    // Send current state
    if (operationType === 'all' || operationType === 'dive-operations') {
      res.write(`data: ${JSON.stringify({ event: 'dive-operations', data: operationsData.diveOperations })}\n\n`);
    }
    if (operationType === 'all' || operationType === 'lst-operations') {
      res.write(`data: ${JSON.stringify({ event: 'lst-operations', data: operationsData.lstOperations })}\n\n`);
    }
    if (operationType === 'all' || operationType === 'ndt-inspections') {
      res.write(`data: ${JSON.stringify({ event: 'ndt-inspections', data: operationsData.inspectionReports })}\n\n`);
    }

    // Handle client disconnect
    req.on('close', () => {
      sseClients.delete(client);
      res.end();
    });
  });

  // Real-time dive operation status update endpoint
  app.post("/api/operations/dive-operations/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, depth, elapsedTime, diverStatus, notes } = req.body;
      
      const operationIndex = operationsData.diveOperations.findIndex(op => op.id === id);
      if (operationIndex === -1) {
        return res.status(404).json({ error: "Dive operation not found" });
      }

      const operation = operationsData.diveOperations[operationIndex];
      const updatedOperation = {
        ...operation,
        status: status || operation.status,
        depth: depth || operation.depth,
        elapsedTime: elapsedTime || (operation as any).elapsedTime,
        diverStatus: diverStatus || (operation as any).diverStatus,
        notes: notes || (operation as any).notes || [],
        lastUpdate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      operationsData.diveOperations[operationIndex] = updatedOperation;

      // Broadcast update to all connected clients
      broadcastUpdate('dive-operation-updated', updatedOperation, { type: 'dive-operations', operationId: id });

      res.json(updatedOperation);
    } catch (error) {
      console.error('Dive operation status update error:', error);
      res.status(500).json({ error: "Failed to update dive operation status" });
    }
  });

  // Real-time LST system monitoring endpoint
  app.post("/api/operations/lst-operations/:id/monitor", async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        pressure, 
        flowRate, 
        gasLevel, 
        temperature, 
        systemStatus, 
        alerts,
        lastCheck 
      } = req.body;
      
      const operationIndex = operationsData.lstOperations.findIndex(op => op.id === id);
      if (operationIndex === -1) {
        return res.status(404).json({ error: "LST operation not found" });
      }

      const operation = operationsData.lstOperations[operationIndex];
      const updatedOperation = {
        ...operation,
        pressure: pressure || (operation as any).pressure,
        flowRate: flowRate || (operation as any).flowRate,
        gasLevel: gasLevel || (operation as any).gasLevel,
        temperature: temperature || (operation as any).temperature,
        systemStatus: systemStatus || (operation as any).systemStatus,
        alerts: alerts || (operation as any).alerts || [],
        lastCheck: lastCheck || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      operationsData.lstOperations[operationIndex] = updatedOperation;

      // Broadcast update to all connected clients
      broadcastUpdate('lst-operation-updated', updatedOperation, { type: 'lst-operations', operationId: id });

      // If critical alerts, broadcast emergency notification
      if (alerts && alerts.some((alert: any) => alert.severity === 'critical')) {
        broadcastUpdate('emergency-alert', {
          type: 'lst-critical',
          operationId: id,
          message: 'Critical LST system alert detected',
          alerts: alerts.filter((a: any) => a.severity === 'critical')
        });
      }

      res.json(updatedOperation);
    } catch (error) {
      console.error('LST monitoring update error:', error);
      res.status(500).json({ error: "Failed to update LST monitoring data" });
    }
  });

  // Real-time NDT inspection data capture endpoint
  app.post("/api/operations/ndt-inspections/:id/capture", async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        findings, 
        severity, 
        images, 
        measurements, 
        status,
        inspectorNotes 
      } = req.body;
      
      const inspectionIndex = operationsData.inspectionReports.findIndex(rep => rep.id === id);
      if (inspectionIndex === -1) {
        return res.status(404).json({ error: "NDT inspection not found" });
      }

      const inspection = operationsData.inspectionReports[inspectionIndex];
      const updatedInspection = {
        ...inspection,
        findings: findings || inspection.findings,
        severity: severity || inspection.severity,
        images: images || (inspection as any).images || [],
        measurements: measurements || (inspection as any).measurements || {},
        status: status || inspection.status,
        inspectorNotes: inspectorNotes || (inspection as any).inspectorNotes,
        lastUpdate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      operationsData.inspectionReports[inspectionIndex] = updatedInspection;

      // Broadcast update to all connected clients
      broadcastUpdate('ndt-inspection-updated', updatedInspection, { type: 'ndt-inspections', operationId: id });

      // If high severity, broadcast alert
      if (severity === 'High') {
        broadcastUpdate('inspection-alert', {
          type: 'ndt-high-severity',
          inspectionId: id,
          message: 'High severity finding detected',
          inspection: updatedInspection
        });
      }

      res.json(updatedInspection);
    } catch (error) {
      console.error('NDT inspection capture error:', error);
      res.status(500).json({ error: "Failed to capture NDT inspection data" });
    }
  });

  // Emergency alert endpoint (for critical situations)
  app.post("/api/operations/emergency-alert", async (req, res) => {
    try {
      const { 
        type, 
        operationId, 
        severity, 
        message, 
        location, 
        actionRequired 
      } = req.body;

      if (!type || !severity || !message) {
        return res.status(400).json({ error: "Type, severity, and message are required" });
      }

      const alert = {
        id: `ALERT-${Date.now()}`,
        type,
        operationId,
        severity, // 'critical', 'high', 'medium', 'low'
        message,
        location,
        actionRequired,
        timestamp: new Date().toISOString(),
        acknowledged: false
      };

      // Broadcast emergency alert to all connected clients
      broadcastUpdate('emergency-alert', alert);

      // Log critical alerts
      if (severity === 'critical') {
        console.error('🚨 CRITICAL ALERT:', alert);
      }

      res.status(201).json(alert);
    } catch (error) {
      console.error('Emergency alert error:', error);
      res.status(500).json({ error: "Failed to send emergency alert" });
    }
  });

  // Acknowledge alert endpoint
  app.post("/api/operations/alerts/:alertId/acknowledge", async (req, res) => {
    try {
      const { alertId } = req.params;
      const { acknowledgedBy, notes } = req.body;

      // In a real system, you'd store alerts in a database
      // For now, we'll just broadcast the acknowledgment
      const acknowledgment = {
        alertId,
        acknowledgedBy: acknowledgedBy || 'Unknown',
        notes,
        acknowledgedAt: new Date().toISOString()
      };

      broadcastUpdate('alert-acknowledged', acknowledgment);

      res.json({ success: true, acknowledgment });
    } catch (error) {
      console.error('Alert acknowledgment error:', error);
      res.status(500).json({ error: "Failed to acknowledge alert" });
    }
  });

  // Live dive operation monitoring endpoint (for real-time depth, time, etc.)
  app.get("/api/operations/dive-operations/:id/live", async (req, res) => {
    try {
      const { id } = req.params;
      const operation = operationsData.diveOperations.find(op => op.id === id);
      
      if (!operation) {
        return res.status(404).json({ error: "Dive operation not found" });
      }

      // Return live monitoring data
      const liveData = {
        operationId: id,
        status: operation.status,
        depth: operation.depth,
        elapsedTime: (operation as any).elapsedTime || '0:00',
        diverStatus: (operation as any).diverStatus || 'Active',
        lastUpdate: (operation as any).lastUpdate || operation.updatedAt,
        notes: (operation as any).notes || [],
        // Simulated real-time data (in production, this would come from sensors)
        currentDepth: operation.depth,
        bottomTime: (operation as any).elapsedTime || '0:00',
        decompressionStatus: 'No decompression required',
        gasRemaining: '85%',
        temperature: '12°C',
        visibility: 'Good'
      };

      res.json(liveData);
    } catch (error) {
      console.error('Live dive monitoring error:', error);
      res.status(500).json({ error: "Failed to fetch live dive monitoring data" });
    }
  });

  // Live LST system status endpoint
  app.get("/api/operations/lst-operations/:id/live", async (req, res) => {
    try {
      const { id } = req.params;
      const operation = operationsData.lstOperations.find(op => op.id === id);
      
      if (!operation) {
        return res.status(404).json({ error: "LST operation not found" });
      }

      const liveData = {
        operationId: id,
        status: operation.status,
        systems: operation.systems,
        pressure: (operation as any).pressure || 'Normal',
        flowRate: (operation as any).flowRate || 'Normal',
        gasLevel: (operation as any).gasLevel || '85%',
        temperature: (operation as any).temperature || '12°C',
        systemStatus: (operation as any).systemStatus || 'Operational',
        alerts: (operation as any).alerts || [],
        lastCheck: operation.lastCheck,
        lastUpdate: operation.updatedAt
      };

      res.json(liveData);
    } catch (error) {
      console.error('Live LST monitoring error:', error);
      res.status(500).json({ error: "Failed to fetch live LST monitoring data" });
    }
  });


  // Register import routes for GitHub repository content
  registerImportRoutes(app);

  // Behavior Analytics Routes - Super Admin and Partner Admin (with toggle)
  app.get("/api/admin/behavior-analytics/insights", async (req, res) => {
    try {
      const email = req.query.email as string;
      if (!email) {
        return res.status(400).json({ error: "Email parameter required" });
      }

      // Check if user is Super Admin or Partner Admin with analytics access
      const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!user || user.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const currentUser = user[0];
      const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
      const isPartnerAdmin = currentUser.role === 'PARTNER_ADMIN';

      if (!isSuperAdmin && !isPartnerAdmin) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Check Partner Admin access permissions
      if (isPartnerAdmin) {
        const permissions = accessControlService.getAccessPermissions(email);
        if (!permissions?.analytics) {
          return res.status(403).json({ error: "Analytics access not granted" });
        }
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const insights = await behaviorMonitoringService.getInsights(limit);

      res.json({ insights });
    } catch (error) {
      console.error("Error fetching behavior insights:", error);
      res.status(500).json({ error: "Failed to fetch behavior insights" });
    }
  });

  app.get("/api/admin/behavior-analytics/daily", async (req, res) => {
    try {
      const email = req.query.email as string;
      if (!email) {
        return res.status(400).json({ error: "Email parameter required" });
      }

      // Check if user is Super Admin or Partner Admin with analytics access
      const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!user || user.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const currentUser = user[0];
      const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
      const isPartnerAdmin = currentUser.role === 'PARTNER_ADMIN';

      if (!isSuperAdmin && !isPartnerAdmin) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Check Partner Admin access permissions
      if (isPartnerAdmin) {
        const permissions = accessControlService.getAccessPermissions(email);
        if (!permissions?.analytics) {
          return res.status(403).json({ error: "Analytics access not granted" });
        }
      }

      const days = parseInt(req.query.days as string) || 7;
      const analytics = await behaviorMonitoringService.getDailyAnalytics(days);

      res.json({ analytics });
    } catch (error) {
      console.error("Error fetching daily analytics:", error);
      res.status(500).json({ error: "Failed to fetch daily analytics" });
    }
  });

  app.post("/api/admin/behavior-analytics/track", async (req, res) => {
    try {
      const {
        eventType,
        eventCategory,
        eventName,
        pagePath,
        metadata,
        userId,
        sessionId,
        userAgent,
        ipAddress,
        duration,
        performance,
      } = req.body;

      await behaviorMonitoringService.trackEvent({
        eventType,
        eventCategory,
        eventName,
        pagePath,
        metadata,
        userId,
        sessionId,
        userAgent,
        ipAddress: req.ip || ipAddress,
        duration,
        performance,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking behavior event:", error);
      res.status(500).json({ error: "Failed to track behavior event" });
    }
  });

  app.put("/api/admin/behavior-analytics/insights/:id/resolve", async (req, res) => {
    try {
      const { id } = req.params;
      const email = req.query.email as string;
      
      if (!email) {
        return res.status(400).json({ error: "Email parameter required" });
      }

      // Check if user is Super Admin
      const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!user || user.length === 0 || user[0].role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Only Super Admin can resolve insights" });
      }

      await db
        .update(behaviorInsights)
        .set({
          status: 'resolved',
          resolvedAt: new Date(),
          resolvedBy: user[0].id,
          updatedAt: new Date(),
        })
        .where(eq(behaviorInsights.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error("Error resolving insight:", error);
      res.status(500).json({ error: "Failed to resolve insight" });
    }
  });

  // Start behavior monitoring on server startup
  behaviorMonitoringService.startMonitoring();

  // Send welcome email endpoint
  app.post("/api/admin/send-welcome-email", async (req, res) => {
    try {
      const { email, name, password, role } = req.body;

      if (!email || !name || !password || !role) {
        return res.status(400).json({ error: "Missing required fields: email, name, password, role" });
      }

      const isSuperAdmin = role === 'SUPER_ADMIN';
      const isPartnerAdmin = role === 'PARTNER_ADMIN';

      const success = await emailMarketing.sendWelcomeAdminEmail({
        email,
        name,
        password,
        role,
        isSuperAdmin,
        isPartnerAdmin,
      });

      if (success) {
        res.json({ 
          success: true, 
          message: `Welcome email sent successfully to ${email}` 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Failed to send email. Check if SENDGRID_API_KEY is configured." 
        });
      }
    } catch (error) {
      console.error("Error sending welcome email:", error);
      res.status(500).json({ error: "Failed to send welcome email" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
