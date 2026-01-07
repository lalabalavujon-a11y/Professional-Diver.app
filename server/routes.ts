import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { tempStorage } from "./temp-storage";
import { emailMarketing } from "./email-marketing";
import { affiliateService } from "./affiliate-service";
import { crmService } from "./crm-service";
import { crmAdapter } from "./crm-adapter";
import { userLifecycleService } from "./user-lifecycle-service";
import { partnerService } from "./partner-service";
import { userManagement } from "./user-management";
import * as featureService from "./feature-service";
import { getAllFeatures, FEATURE_REGISTRY } from "./feature-registry";
import { resolveUserPermissions } from "./feature-service";
import { handleHighLevelContactWebhook, handleHighLevelTagWebhook } from "./highlevel-webhooks";
import { registerImportRoutes } from "./routes/import-content";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
// import { AILearningPathService } from "./ai-learning-path";
import { z } from "zod";
// LangChain AI Tutor routes are now handled by ai-tutor.ts router
import { insertLessonSchema, insertInviteSchema, insertAttemptSchema, insertWidgetLocationSchema, insertNavigationWaypointSchema, insertNavigationRouteSchema, insertWidgetPreferencesSchema, widgetLocations, navigationWaypoints, navigationRoutes, users, sessions, widgetPreferences, diveTeamMembers, diveOperations, diveOperationContacts, diveOperationPermits, diveTeamRosters, divePlans, dailyProjectReports, casEvacDrills, toolBoxTalks, diveOperationHazards, welfareRecords, shippingInfo, ramsDocuments } from "@shared/schema";
import { insertLessonSchema as insertLessonSchemaSQLite, widgetLocations as widgetLocationsSQLite, navigationWaypoints as navigationWaypointsSQLite, navigationRoutes as navigationRoutesSQLite, users as usersSQLite, sessions as sessionsSQLite, widgetPreferences as widgetPreferencesSQLite, supportTickets, type InsertSupportTicket } from "@shared/schema-sqlite";
import { eq, and, desc } from "drizzle-orm";
import { randomBytes, createHash } from "crypto";
import { db } from "./db";
import { registerSrsRoutes } from "./srs-routes";
import { registerEquipmentRoutes } from "./routes/equipment-routes";
import { registerOperationsCalendarRoutes } from "./routes/operations-calendar-routes";
import { registerCallingRoutes } from "./routes/calling-routes";
import { getWeatherData, timezoneToCoordinates as weatherTimezoneToCoordinates } from "./weather-service";
import { getTideData, timezoneToCoordinates as tidesTimezoneToCoordinates, clearTidesCache } from "./tides-service";
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
  
  // Operations Calendar routes
  console.log("📅 About to register Operations Calendar routes...");
  registerOperationsCalendarRoutes(app);
  console.log("📅 Operations Calendar routes registration completed");

  // Calling routes
  registerCallingRoutes(app);

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

  // ============================================================================
  // AUTHENTICATION - SUPER ADMIN CREDENTIALS
  // ============================================================================
  // IMPORTANT: DO NOT CHANGE THESE CREDENTIALS - THEY ARE PERMANENT
  // 
  // Super Admin Account:
  //   Email: lalabalavu.jon@gmail.com
  //   Password: Admin123
  //   Role: SUPER_ADMIN
  //   Name: Jon Lalabalavu
  //
  // Secondary Super Admin Account:
  //   Email: sephdee@hotmail.com
  //   Password: Admin123
  //   Role: SUPER_ADMIN
  //   Name: Jon Lalabalavu
  //
  // These credentials are hardcoded and will NOT change with code updates.
  // ============================================================================
  
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

      // SUPER ADMIN CREDENTIALS - DO NOT CHANGE
      // Jon Lalabalavu - Super Admin
      // Email: lalabalavu.jon@gmail.com
      // Password: Admin123
      // Role: SUPER_ADMIN
      const superAdminCredentials: Record<string, string> = {
        'lalabalavu.jon@gmail.com': 'Admin123',
        'sephdee@hotmail.com': 'Admin123', // Secondary super admin account
      };

      if (superAdminCredentials[email] && password === superAdminCredentials[email]) {
        res.json({ 
          success: true, 
          user: {
            id: email === 'sephdee@hotmail.com' ? 'super-admin-2' : 'super-admin-1',
            name: email === 'lalabalavu.jon@gmail.com' ? 'Jon Lalabalavu' : 'Jon Lalabalavu',
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

  // Trial signup endpoint - now uses CRM service for user + client sync
  app.post('/api/trial-signup', async (req, res) => {
    try {
      const { name, email } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }

      if (!email.includes('@')) {
        return res.status(400).json({ error: 'Please enter a valid email address' });
      }

      // Use CRM service to create user and sync to client (with optional HighLevel sync)
      const { user, client } = await crmService.handleTrialSignup({ name, email });
      
      // Sync to HighLevel if available (via adapter)
      if (client) {
        try {
          await crmAdapter.updateClient(client.id, {
            name: client.name,
            email: client.email,
            subscriptionType: client.subscription_type,
            status: client.status,
          });
        } catch (error) {
          console.error('Error syncing trial signup to HighLevel (non-fatal):', error);
          // Continue even if HighLevel sync fails
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
        },
        client: client ? {
          id: client.id,
          partnerStatus: client.partner_status
        } : null
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

      // Try to find user by email
      let userId: string | undefined;
      try {
        const user = await db.select().from(usersSQLite).where(eq(usersSQLite.email, email)).limit(1);
        if (user.length > 0) {
          userId = user[0].id;
        }
      } catch (e) {
        // User not found, continue without userId
        console.log('User not found for email:', email);
      }

      // Use crypto.randomUUID() for ticket ID to avoid import side-effects, and ensure InsertSupportTicket type is correct.
      const ticketId = `PDT-${crypto.randomUUID()}`;
      const ticketData: InsertSupportTicket = {
        ticketId,
        userId: userId || null,
        email,
        name,
        subject,
        message,
        priority: priority as 'low' | 'medium' | 'high' | 'urgent',
        status: 'pending',
        assignedToLaura: true, // Default to Laura handling all tickets
      };

      // Save ticket to database
      const [savedTicket] = await db.insert(supportTickets).values(ticketData).returning();

      // Send confirmation email
      const ticket = {
        userId: userId || 'unknown',
        email,
        name,
        subject,
        message,
        priority: priority as 'low' | 'medium' | 'high' | 'urgent',
        createdAt: new Date()
      };

      const success = await emailMarketing.sendTicketConfirmation(ticket);
      
      if (success && savedTicket) {
        res.json({ 
          success: true, 
          message: 'Support ticket submitted successfully. You will receive a confirmation email shortly.',
          ticketId: savedTicket.ticketId,
          id: savedTicket.id
        });
      } else {
        res.status(500).json({ error: 'Failed to submit support ticket' });
      }
    } catch (error) {
      console.error('Support ticket error:', error);
      res.status(500).json({ error: 'Failed to submit support ticket' });
    }
  });

  // Get all support tickets (admin only)
  app.get('/api/support/tickets', async (req, res) => {
    try {
      const { status, priority, assignedToLaura } = req.query;
      
      let query = db.select().from(supportTickets);
      const conditions = [];

      if (status) {
        conditions.push(eq(supportTickets.status, status as string));
      }
      if (priority) {
        conditions.push(eq(supportTickets.priority, priority as string));
      }
      if (assignedToLaura !== undefined) {
        conditions.push(eq(supportTickets.assignedToLaura, assignedToLaura === 'true'));
      }

      if (conditions.length > 0) {
        query = db.select().from(supportTickets).where(and(...conditions));
      }

      const tickets = await query.orderBy(desc(supportTickets.createdAt));

      res.json({ 
        success: true, 
        tickets,
        count: tickets.length
      });
    } catch (error) {
      console.error('Get support tickets error:', error);
      res.status(500).json({ error: 'Failed to fetch support tickets' });
    }
  });

  // Get single support ticket
  app.get('/api/support/ticket/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const [ticket] = await db.select()
        .from(supportTickets)
        .where(eq(supportTickets.id, id))
        .limit(1);

      if (!ticket) {
        return res.status(404).json({ error: 'Support ticket not found' });
      }

      res.json({ 
        success: true, 
        ticket
      });
    } catch (error) {
      console.error('Get support ticket error:', error);
      res.status(500).json({ error: 'Failed to fetch support ticket' });
    }
  });

  // Update support ticket status
  app.patch('/api/support/ticket/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { status, response, assignedTo, assignedToLaura } = req.body;
      
      const updateData: any = {
        updatedAt: new Date()
      };

      if (status) {
        updateData.status = status;
        if (status === 'completed' || status === 'closed') {
          updateData.resolvedAt = new Date();
        }
      }
      if (response !== undefined) {
        updateData.response = response;
      }
      if (assignedTo !== undefined) {
        updateData.assignedTo = assignedTo;
      }
      if (assignedToLaura !== undefined) {
        updateData.assignedToLaura = assignedToLaura;
      }

      const [updatedTicket] = await db.update(supportTickets)
        .set(updateData)
        .where(eq(supportTickets.id, id))
        .returning();

      if (!updatedTicket) {
        return res.status(404).json({ error: 'Support ticket not found' });
      }

      res.json({ 
        success: true, 
        ticket: updatedTicket
      });
    } catch (error) {
      console.error('Update support ticket error:', error);
      res.status(500).json({ error: 'Failed to update support ticket' });
    }
  });

  // Get support ticket statistics
  app.get('/api/support/tickets/stats', async (req, res) => {
    try {
      const allTickets = await db.select().from(supportTickets);
      
      const stats = {
        total: allTickets.length,
        pending: allTickets.filter(t => t.status === 'pending').length,
        inProgress: allTickets.filter(t => t.status === 'in_progress').length,
        completed: allTickets.filter(t => t.status === 'completed').length,
        closed: allTickets.filter(t => t.status === 'closed').length,
        assignedToLaura: allTickets.filter(t => t.assignedToLaura).length,
        byPriority: {
          low: allTickets.filter(t => t.priority === 'low').length,
          medium: allTickets.filter(t => t.priority === 'medium').length,
          high: allTickets.filter(t => t.priority === 'high').length,
          urgent: allTickets.filter(t => t.priority === 'urgent').length,
        }
      };

      res.json({ 
        success: true, 
        stats
      });
    } catch (error) {
      console.error('Get support ticket stats error:', error);
      res.status(500).json({ error: 'Failed to fetch support ticket statistics' });
    }
  });

  // Laura auto-handle support ticket
  app.post('/api/support/ticket/:id/laura-handle', async (req, res) => {
    try {
      const { id } = req.params;
      const { userContext } = req.body;
      const LauraOracleService = (await import('./laura-oracle-service')).default;
      const lauraOracle = LauraOracleService.getInstance();

      const result = await lauraOracle.autoHandleTicket(id, userContext);

      if (result.success) {
        res.json({
          success: true,
          ticket: result.ticket,
          response: result.response,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message
        });
      }
    } catch (error) {
      console.error('Laura auto-handle ticket error:', error);
      res.status(500).json({ error: 'Failed to auto-handle support ticket' });
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
      
      // SUPER ADMIN ACCOUNT - DO NOT CHANGE
      if (email === 'lalabalavu.jon@gmail.com') {
        userId = 'super-admin-1';
        userName = 'Jon Lalabalavu';
      } else if (email === 'sephdee@hotmail.com') {
        userId = 'super-admin-2';
        userName = 'Jon Lalabalavu';
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

  // Partner routes
  app.post('/api/partners/convert', async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const result = await partnerService.convertToPartner(userId);
      
      if (result.success) {
        res.json({
          success: true,
          user: result.user,
          client: result.client,
          affiliate: result.affiliate,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Partner conversion error:', error);
      res.status(500).json({ error: 'Failed to convert to partner' });
    }
  });

  app.get('/api/partners/eligibility/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      const eligibility = await partnerService.checkEligibility(userId);
      res.json(eligibility);
    } catch (error) {
      console.error('Partner eligibility check error:', error);
      res.status(500).json({ error: 'Failed to check eligibility' });
    }
  });

  app.post('/api/partners/apply', async (req, res) => {
    try {
      const { userId, reason, experience } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const result = await partnerService.applyToBecomePartner(userId, {
        reason,
        experience,
      });
      
      res.json(result);
    } catch (error) {
      console.error('Partner application error:', error);
      res.status(500).json({ error: 'Failed to process partner application' });
    }
  });

  app.get('/api/partners/stats/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      const stats = await partnerService.getPartnerStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Partner stats error:', error);
      res.status(500).json({ error: 'Failed to get partner stats' });
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
      // Use CRM adapter for unified local + HighLevel sync
      const client = await crmAdapter.createClient(req.body);
      res.json(client);
    } catch (error) {
      console.error('Create client API error:', error);
      res.status(500).json({ error: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      // Use CRM adapter for unified local + HighLevel sync
      const client = await crmAdapter.updateClient(req.params.id, req.body);
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

  // Helper function to ensure CRM tables exist (SQLite only)
  async function ensureCrmTables(): Promise<void> {
    // Only create tables for SQLite (dev environment)
    if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'development') {
      return; // PostgreSQL will use migrations
    }

    try {
      // Create client_tags table
      await db.execute(`
        CREATE TABLE IF NOT EXISTS client_tags (
          id text PRIMARY KEY NOT NULL,
          client_id text NOT NULL,
          tag_name text NOT NULL,
          color text DEFAULT '#3b82f6',
          created_at integer NOT NULL,
          created_by text,
          FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        );
      `);

      // Create communications table
      await db.execute(`
        CREATE TABLE IF NOT EXISTS communications (
          id text PRIMARY KEY NOT NULL,
          client_id text NOT NULL,
          type text NOT NULL CHECK(type IN ('email', 'phone', 'sms', 'whatsapp', 'note')),
          direction text NOT NULL CHECK(direction IN ('inbound', 'outbound')),
          subject text,
          content text NOT NULL,
          status text NOT NULL DEFAULT 'sent' CHECK(status IN ('sent', 'delivered', 'read', 'failed', 'answered', 'missed')),
          duration integer,
          metadata text,
          created_by text,
          created_at integer NOT NULL,
          FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        );
      `);

      // Add phone column to clients table if it doesn't exist
      try {
        await db.execute(`ALTER TABLE clients ADD COLUMN phone text;`);
      } catch (e: any) {
        // Column might already exist, ignore error
        if (!e.message?.includes('duplicate column')) {
          console.warn('Error adding phone column to clients:', e.message);
        }
      }

      // Create indexes for better performance
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_client_tags_client_id ON client_tags(client_id);`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_communications_client_id ON communications(client_id);`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_communications_created_at ON communications(created_at DESC);`);
    } catch (error) {
      console.error('Error ensuring CRM tables:', error);
      // Don't throw - allow server to continue
    }
  }

  // Client Tags Routes
  app.get("/api/clients/:id/tags", async (req, res) => {
    try {
      await ensureCrmTables();
      const { taggingService } = await import("./services/tagging-service");
      const tags = await taggingService.getClientTags(req.params.id);
      res.json({ success: true, tags });
    } catch (error) {
      console.error('Get client tags error:', error);
      res.status(500).json({ error: "Failed to fetch client tags" });
    }
  });

  app.post("/api/clients/:id/tags", async (req, res) => {
    try {
      await ensureCrmTables();
      const { taggingService } = await import("./services/tagging-service");
      const { tagName, color } = req.body;
      
      if (!tagName || !tagName.trim()) {
        return res.status(400).json({ error: "Tag name is required" });
      }

      // Try to get user email from localStorage via header or from userEmail in body
      const userEmail = (req.headers['x-user-email'] as string) || req.body.userEmail || undefined;
      let createdBy = undefined;
      if (userEmail) {
        try {
          const user = await db.select().from(usersSQLite).where(eq(usersSQLite.email, userEmail)).limit(1);
          if (user.length > 0) {
            createdBy = user[0].id;
          }
        } catch (e) {
          // User not found, continue without createdBy
          console.log('User not found for email:', userEmail);
        }
      }
      const tag = await taggingService.addTag(req.params.id, tagName.trim(), color, createdBy);
      res.json({ success: true, tag });
    } catch (error) {
      console.error('Add client tag error:', error);
      res.status(500).json({ error: "Failed to add tag" });
    }
  });

  app.delete("/api/clients/:id/tags/:tagId", async (req, res) => {
    try {
      await ensureCrmTables();
      const { taggingService } = await import("./services/tagging-service");
      const success = await taggingService.removeTag(req.params.id, req.params.tagId);
      res.json({ success });
    } catch (error) {
      console.error('Remove client tag error:', error);
      res.status(500).json({ error: "Failed to remove tag" });
    }
  });

  app.get("/api/tags/all", async (req, res) => {
    try {
      await ensureCrmTables();
      const { taggingService } = await import("./services/tagging-service");
      const tags = await taggingService.getAllTags();
      res.json({ success: true, tags });
    } catch (error) {
      console.error('Get all tags error:', error);
      res.status(500).json({ error: "Failed to fetch tags" });
    }
  });

  // Communication Routes
  app.get("/api/clients/:id/communications", async (req, res) => {
    try {
      await ensureCrmTables();
      const { communicationService } = await import("./services/communication-service");
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const communications = await communicationService.getClientCommunications(req.params.id, limit);
      res.json({ success: true, communications });
    } catch (error) {
      console.error('Get client communications error:', error);
      res.status(500).json({ error: "Failed to fetch communications" });
    }
  });

  app.post("/api/clients/:id/communications", async (req, res) => {
    try {
      await ensureCrmTables();
      const { communicationService } = await import("./services/communication-service");
      const { type, direction, subject, content, status, duration, metadata } = req.body;
      
      if (!content || !content.trim()) {
        return res.status(400).json({ error: "Content is required" });
      }

      // Try to get user email from localStorage via header or from userEmail in body
      const userEmail = (req.headers['x-user-email'] as string) || req.body.userEmail || undefined;
      let createdBy = undefined;
      if (userEmail) {
        try {
          const user = await db.select().from(usersSQLite).where(eq(usersSQLite.email, userEmail)).limit(1);
          if (user.length > 0) {
            createdBy = user[0].id;
          }
        } catch (e) {
          // User not found, continue without createdBy
          console.log('User not found for email:', userEmail);
        }
      }

      let communication;
      if (type === "email" && direction === "outbound") {
        // Send email
        communication = await communicationService.sendEmail({
          clientId: req.params.id,
          to: req.body.to,
          subject,
          content,
          htmlContent: req.body.htmlContent,
          createdBy,
        });
      } else if (type === "phone") {
        communication = await communicationService.logPhoneCall({
          clientId: req.params.id,
          direction,
          duration,
          status: status || "answered",
          notes: content,
          phoneNumber: req.body.phoneNumber,
          createdBy,
        });
      } else if (type === "sms") {
        communication = await communicationService.logSMS({
          clientId: req.params.id,
          direction,
          content,
          phoneNumber: req.body.phoneNumber,
          status,
          createdBy,
        });
      } else if (type === "whatsapp") {
        communication = await communicationService.logWhatsApp({
          clientId: req.params.id,
          direction,
          content,
          phoneNumber: req.body.phoneNumber,
          status,
          createdBy,
        });
      } else if (type === "note") {
        communication = await communicationService.addNote({
          clientId: req.params.id,
          content,
          createdBy,
        });
      } else {
        // Generic communication log
        communication = await communicationService.logCommunication({
          clientId: req.params.id,
          type,
          direction,
          subject,
          content,
          status,
          duration,
          metadata,
          createdBy,
        });
      }

      res.json({ success: true, communication });
    } catch (error) {
      console.error('Create communication error:', error);
      res.status(500).json({ error: "Failed to create communication" });
    }
  });

  app.get("/api/clients/:id/communications/stats", async (req, res) => {
    try {
      await ensureCrmTables();
      const { communicationService } = await import("./services/communication-service");
      const stats = await communicationService.getCommunicationStats(req.params.id);
      res.json({ success: true, stats });
    } catch (error) {
      console.error('Get communication stats error:', error);
      res.status(500).json({ error: "Failed to fetch communication stats" });
    }
  });

  app.patch("/api/communications/:id/status", async (req, res) => {
    try {
      await ensureCrmTables();
      const { communicationService } = await import("./services/communication-service");
      const { status } = req.body;
      const success = await communicationService.updateStatus(req.params.id, status);
      res.json({ success });
    } catch (error) {
      console.error('Update communication status error:', error);
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  // Partner routes
  app.get("/api/partners/eligibility/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const eligibility = await partnerService.checkEligibility(userId);
      res.json(eligibility);
    } catch (error) {
      console.error('Partner eligibility error:', error);
      res.status(500).json({ error: "Failed to check partner eligibility" });
    }
  });

  app.post("/api/partners/convert", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      const result = await partnerService.convertToPartner(userId);
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Partner conversion error:', error);
      res.status(500).json({ error: "Failed to convert to partner" });
    }
  });

  app.post("/api/partners/apply", async (req, res) => {
    try {
      const { userId, reason, experience } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      const result = await partnerService.applyToBecomePartner(userId, {
        reason,
        experience,
      });
      res.json(result);
    } catch (error) {
      console.error('Partner application error:', error);
      res.status(500).json({ error: "Failed to process partner application" });
    }
  });

  app.get("/api/partners/stats/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const stats = await partnerService.getPartnerStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Partner stats error:', error);
      res.status(500).json({ error: "Failed to get partner stats" });
    }
  });

  // HighLevel webhook routes
  app.post("/api/webhooks/highlevel/contact", async (req, res) => {
    try {
      await handleHighLevelContactWebhook(req, res);
    } catch (error) {
      console.error('HighLevel contact webhook error:', error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  app.post("/api/webhooks/highlevel/tags", async (req, res) => {
    try {
      await handleHighLevelTagWebhook(req, res);
    } catch (error) {
      console.error('HighLevel tag webhook error:', error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  // Payment webhook handlers - integrate with Stripe/PayPal when payment processing is implemented
  app.post("/api/webhooks/stripe", async (req, res) => {
    try {
      const event = req.body;
      
      // Handle different Stripe event types
      switch (event.type) {
        case 'checkout.session.completed':
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          // Handle subscription creation/update
          const customerId = event.data.object.customer;
          const subscriptionType = event.data.object.items?.data[0]?.price?.recurring?.interval === 'month' 
            ? 'MONTHLY' 
            : event.data.object.items?.data[0]?.price?.recurring?.interval === 'year'
            ? 'ANNUAL'
            : 'MONTHLY';
          
          // Find user by Stripe customer ID
          const userResult = await db.execute(
            'SELECT * FROM users WHERE stripe_customer_id = $1',
            [customerId]
          );
          
          if (userResult.rows.length > 0) {
            const userId = userResult.rows[0].id;
            // Update user subscription and sync to CRM
            await userLifecycleService.handlePurchaseEvent({
              userId,
              subscriptionType: subscriptionType as "MONTHLY" | "ANNUAL" | "LIFETIME",
              stripeCustomerId: customerId,
            });
          }
          break;
          
        case 'customer.subscription.deleted':
          // Handle subscription cancellation
          const cancelledCustomerId = event.data.object.customer;
          const cancelledUserResult = await db.execute(
            'SELECT * FROM users WHERE stripe_customer_id = $1',
            [cancelledCustomerId]
          );
          
          if (cancelledUserResult.rows.length > 0) {
            const cancelledUserId = cancelledUserResult.rows[0].id;
            await userLifecycleService.updateSubscriptionStatus(cancelledUserId, 'CANCELLED');
          }
          break;
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error('Stripe webhook error:', error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  app.post("/api/webhooks/paypal", async (req, res) => {
    try {
      const event = req.body;
      
      // TODO: Implement PayPal webhook handling
      // Similar structure to Stripe webhook but using PayPal event types
      // Handle subscription.created, subscription.updated, subscription.cancelled
      
      console.log('PayPal webhook received:', event.event_type);
      res.json({ received: true });
    } catch (error) {
      console.error('PayPal webhook error:', error);
      res.status(500).json({ error: "Failed to process webhook" });
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

  // ============================================================================
  // Feature Management API Endpoints
  // ============================================================================
  
  // Get all available features (from registry)
  app.get("/api/admin/features", async (req, res) => {
    try {
      const userEmail = req.query.email as string;
      if (!userEmail) {
        return res.status(401).json({ error: "User email is required" });
      }

      const user = userManagement.getSpecialUser(userEmail);
      if (!user || user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Access denied. SUPER_ADMIN role required." });
      }

      const features = getAllFeatures();
      res.json({ features });
    } catch (error) {
      console.error("Features API error:", error);
      res.status(500).json({ error: "Failed to fetch features" });
    }
  });

  // Get role default permissions
  app.get("/api/admin/role-defaults", async (req, res) => {
    try {
      const userEmail = req.query.email as string;
      if (!userEmail) {
        return res.status(401).json({ error: "User email is required" });
      }

      const user = userManagement.getSpecialUser(userEmail);
      if (!user || user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Access denied. SUPER_ADMIN role required." });
      }

      const role = req.query.role as string;
      if (!role) {
        return res.status(400).json({ error: "Role parameter is required" });
      }

      const defaults = await featureService.getRoleDefaults(role);
      const allFeatures = getAllFeatures();
      
      // Build response with all features and their default state
      const roleDefaults = allFeatures.map((feature) => {
        const defaultPerm = defaults.find((d: any) => d.featureId === feature.id);
        return {
          featureId: feature.id,
          enabled: defaultPerm?.enabled ?? false,
        };
      });

      res.json({ role, defaults: roleDefaults });
    } catch (error) {
      console.error("Role defaults API error:", error);
      res.status(500).json({ error: "Failed to fetch role defaults" });
    }
  });

  // Update role default permissions
  app.put("/api/admin/role-defaults", async (req, res) => {
    try {
      const userEmail = req.query.email as string;
      if (!userEmail) {
        return res.status(401).json({ error: "User email is required" });
      }

      const user = userManagement.getSpecialUser(userEmail);
      if (!user || user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Access denied. SUPER_ADMIN role required." });
      }

      const { role, defaults } = req.body;
      if (!role || !Array.isArray(defaults)) {
        return res.status(400).json({ error: "Invalid request data" });
      }

      // Update each feature default
      for (const defaultPerm of defaults) {
        await featureService.updateRoleDefault(
          role,
          defaultPerm.featureId,
          defaultPerm.enabled
        );
      }

      res.json({ success: true, role, defaults });
    } catch (error) {
      console.error("Role defaults update error:", error);
      res.status(500).json({ error: "Failed to update role defaults" });
    }
  });

  // Get user permissions - returns Partner Admins, Enterprise Users with merged permissions
  // Only accessible to SUPER_ADMIN
  app.get("/api/admin/user-permissions", async (req, res) => {
    try {
      // Check if user is SUPER_ADMIN
      const userEmail = req.query.email as string;
      if (!userEmail) {
        return res.status(401).json({ error: "User email is required" });
      }

      const user = userManagement.getSpecialUser(userEmail);
      if (!user || user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Access denied. SUPER_ADMIN role required." });
      }

      // Get managed users (Partner Admins, Enterprise Users)
      const allSpecialUsers = userManagement.getAllSpecialUsers();
      const managedUsers = allSpecialUsers.filter((user: any) => 
        user.role === "AFFILIATE" || 
        user.role === "ENTERPRISE" || 
        (user.role === "LIFETIME" && user.email !== 'lalabalavu.jon@gmail.com' && user.email !== 'sephdee@hotmail.com')
      );

      // Resolve permissions for each user
      const usersWithPermissions = await Promise.all(
        managedUsers.map(async (user: any) => {
          // Get user ID - need to find actual user ID from database or use email
          const userId = user.id || user.email;
          const permissions = await featureService.resolveUserPermissions(userId, user.role);
          
          return {
            id: userId,
            name: user.name,
            email: user.email,
            role: user.role === "AFFILIATE" 
              ? "Partner Admin" 
              : user.role === "ENTERPRISE" 
              ? "Enterprise User" 
              : "Partner Admin",
            permissions,
          };
        })
      );

      res.json({ users: usersWithPermissions });
    } catch (error) {
      console.error("User permissions API error:", error);
      res.status(500).json({ error: "Failed to fetch user permissions" });
    }
  });

  // Update individual user feature overrides
  app.put("/api/admin/user-permissions/:userId", async (req, res) => {
    try {
      const userEmail = req.query.email as string;
      if (!userEmail) {
        return res.status(401).json({ error: "User email is required" });
      }

      const user = userManagement.getSpecialUser(userEmail);
      if (!user || user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Access denied. SUPER_ADMIN role required." });
      }

      const { userId } = req.params;
      const { permissions } = req.body;

      if (!permissions || typeof permissions !== "object") {
        return res.status(400).json({ error: "Invalid permissions data" });
      }

      // Update each feature override
      const allFeatures = getAllFeatures();
      for (const feature of allFeatures) {
        const enabled = permissions[feature.id];
        if (enabled !== undefined) {
          // If value matches role default, set to null (use default)
          // Otherwise, set the override
          const userData = userManagement.getAllSpecialUsers().find((u: any) => u.id === userId || u.email === userId);
          if (userData) {
            const roleDefaults = await featureService.getRoleDefaults(userData.role);
            const defaultPerm = roleDefaults.find((d) => d.featureId === feature.id);
            const defaultEnabled = defaultPerm?.enabled ?? false;
            
            if (enabled === defaultEnabled) {
              // Reset to role default
              await featureService.updateUserOverride(userId, feature.id, null);
            } else {
              // Set override
              await featureService.updateUserOverride(userId, feature.id, enabled);
            }
          }
        }
      }

      res.json({ success: true, userId });
    } catch (error) {
      console.error("User permissions update error:", error);
      res.status(500).json({ error: "Failed to update user permissions" });
    }
  });

  // Reset user to role defaults
  app.post("/api/admin/user-permissions/:userId/reset", async (req, res) => {
    try {
      const userEmail = req.query.email as string;
      if (!userEmail) {
        return res.status(401).json({ error: "User email is required" });
      }

      const user = userManagement.getSpecialUser(userEmail);
      if (!user || user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Access denied. SUPER_ADMIN role required." });
      }

      const { userId } = req.params;
      await featureService.resetUserToRoleDefaults(userId);

      res.json({ success: true, userId });
    } catch (error) {
      console.error("Reset user permissions error:", error);
      res.status(500).json({ error: "Failed to reset user permissions" });
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

      // Determine role and subscription type - SUPER ADMIN ACCOUNT (DO NOT CHANGE)
      const role = (userEmail === 'lalabalavu.jon@gmail.com' || userEmail === 'sephdee@hotmail.com') ? 'SUPER_ADMIN' : 'USER';
      const subscriptionType = (userEmail === 'lalabalavu.jon@gmail.com' || userEmail === 'sephdee@hotmail.com') ? 'LIFETIME' : 'TRIAL';

      const updatedUser = {
        id: userEmail === 'lalabalavu.jon@gmail.com' ? 'super-admin-1' : userEmail === 'sephdee@hotmail.com' ? 'super-admin-2' : 'user-1',
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

      // Determine role and subscription type - SUPER ADMIN ACCOUNT (DO NOT CHANGE)
      const role = (userEmail === 'lalabalavu.jon@gmail.com' || userEmail === 'sephdee@hotmail.com') ? 'SUPER_ADMIN' : 'USER';
      const subscriptionType = (userEmail === 'lalabalavu.jon@gmail.com' || userEmail === 'sephdee@hotmail.com') ? 'LIFETIME' : 'TRIAL';

      const updatedUser = {
        id: userEmail === 'lalabalavu.jon@gmail.com' ? 'super-admin-1' : userEmail === 'sephdee@hotmail.com' ? 'super-admin-2' : 'user-1',
        ...updatedProfile,
        name: existingProfile.name || (userEmail === 'lalabalavu.jon@gmail.com' ? 'Jon Lalabalavu' : userEmail === 'sephdee@hotmail.com' ? 'Jon Lalabalavu' : 'User'),
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
      
      // SUPER ADMIN ACCOUNT - DO NOT CHANGE
      // Jon Lalabalavu - lalabalavu.jon@gmail.com
      if (email === 'lalabalavu.jon@gmail.com') {
        baseUser = {
          id: 'super-admin-1',
          name: storedProfile.name || 'Jon Lalabalavu',
          email: 'lalabalavu.jon@gmail.com',
          role: 'SUPER_ADMIN', // Fixed: Changed from 'ADMIN' to 'SUPER_ADMIN'
          subscriptionType: 'LIFETIME',
          subscriptionDate: new Date('2024-01-01').toISOString(),
          trialExpiresAt: null,
          createdAt: storedProfile.createdAt || new Date('2024-01-01').toISOString(),
        };
      }
      // Secondary Super Admin account
      else if (email === 'sephdee@hotmail.com') {
        baseUser = {
          id: 'super-admin-2',
          name: storedProfile.name || 'Jon Lalabalavu',
          email: 'sephdee@hotmail.com',
          role: 'SUPER_ADMIN',
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

  // Get user feature permissions
  app.get("/api/users/current/permissions", async (req, res) => {
    try {
      const email = req.query.email as string;
      const previewRole = req.query.previewRole as string | undefined;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Get user from user management service
      const user = userManagement.getSpecialUser(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Use preview role if provided, otherwise use user's actual role
      const roleToUse = previewRole || user.role;
      const userId = user.id || email;

      // Resolve permissions for the role
      const permissions = await resolveUserPermissions(userId, roleToUse);

      res.json(permissions);
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      res.status(500).json({ error: "Failed to fetch user permissions" });
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
      
      // If user doesn't exist, try to create a minimal user record
      console.log('User not found, attempting to create user for email:', email);
      try {
        const newUser = await db
          .insert(usersTable)
          .values({
            id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            email: email,
            name: email.split('@')[0], // Use email prefix as name
            role: 'USER',
            subscriptionType: 'TRIAL',
            subscriptionStatus: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any)
          .returning();
        
        if (newUser && newUser.length > 0) {
          console.log('Created new user:', newUser[0].id);
          return newUser[0].id;
        }
      } catch (createError: any) {
        console.error('Error creating user:', createError);
        // If creation fails (e.g., duplicate), try to fetch again
        const retryUser = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
        if (retryUser.length > 0) {
          return retryUser[0].id;
        }
      }
      
      // Final fallback - return null to indicate user not found
      console.error('Could not find or create user for email:', email);
      return null;
    } catch (error) {
      console.error('Error getting user ID from email:', error);
      return null;
    }
  }

  // Helper function to get user ID from session token or email (for Tide Times App and XC Weather App)
  async function getUserIdFromSessionOrEmail(req: any): Promise<string | null> {
    try {
      // First, try to get from session token (cookie or Authorization header)
      const sessionToken = req.cookies?.sessionToken || 
                          req.headers?.authorization?.replace('Bearer ', '') ||
                          req.headers?.['x-session-token'];
      
      if (sessionToken) {
        const env = process.env.NODE_ENV ?? 'development';
        const hasDatabaseUrl = !!process.env.DATABASE_URL;
        const sessionsTable = (env === 'development' && !hasDatabaseUrl) ? sessionsSQLite : sessions;
        
        const session = await db
          .select()
          .from(sessionsTable)
          .where(eq(sessionsTable.sessionToken, sessionToken))
          .limit(1);
        
        if (session.length > 0) {
          const sessionData = session[0];
          // Check if session is expired
          const expires = sessionData.expires instanceof Date ? sessionData.expires : new Date(sessionData.expires);
          if (expires > new Date()) {
            return sessionData.userId;
          }
        }
      }
      
      // Fallback to email-based lookup (backward compatible)
      const email = (req.query?.email as string) || 
                    (req.body?.email as string) || 
                    (req.headers?.['x-user-email'] as string);
      
      if (email) {
        return await getUserIdFromEmail(email);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user ID from session or email:', error);
      // Fallback to email if session lookup fails
      const email = (req.query?.email as string) || 
                    (req.body?.email as string) || 
                    (req.headers?.['x-user-email'] as string);
      if (email) {
        return await getUserIdFromEmail(email);
      }
      return null;
    }
  }

  // Helper function to get widget locations table based on environment
  function getWidgetLocationsTable() {
    const env = process.env.NODE_ENV ?? 'development';
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    return (env === 'development' && !hasDatabaseUrl) ? widgetLocationsSQLite : widgetLocations;
  }

  // Helper function to get widget preferences table based on environment
  function getWidgetPreferencesTable() {
    const env = process.env.NODE_ENV ?? 'development';
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    return (env === 'development' && !hasDatabaseUrl) ? widgetPreferencesSQLite : widgetPreferences;
  }

  // Helper function to ensure widget preferences table exists
  async function ensureWidgetPreferencesTable() {
    try {
      const widgetPreferencesTable = getWidgetPreferencesTable();
      // Try a simple query to check if table exists
      await db.select().from(widgetPreferencesTable).limit(1);
    } catch (error: any) {
      if (error?.message?.includes('no such table') || error?.message?.includes('does not exist')) {
        console.warn('Widget preferences table does not exist. Please run database migrations.');
      } else {
        throw error;
      }
    }
  }

  // Ensure widget_locations table exists (for SQLite)
  async function ensureWidgetLocationsTable() {
    const env = process.env.NODE_ENV ?? 'development';
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    
    // Only need to ensure table for SQLite (PostgreSQL uses migrations)
    if (env === 'development' && !hasDatabaseUrl) {
      try {
        // Access the SQLite database instance stored in db.sqlite
        const sqliteDb = (db as any).sqlite;
        
        if (sqliteDb && typeof sqliteDb.exec === 'function') {
          // Use exec for better-sqlite3 (synchronous method)
          sqliteDb.exec(`
            CREATE TABLE IF NOT EXISTS widget_locations (
              id text PRIMARY KEY NOT NULL,
              user_id text NOT NULL,
              latitude real NOT NULL,
              longitude real NOT NULL,
              location_name text,
              is_current_location integer NOT NULL DEFAULT 0,
              created_at integer NOT NULL,
              updated_at integer NOT NULL,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
          `);
          console.log('✅ widget_locations table ensured');
        } else if (typeof (db as any).execute === 'function') {
          // Try db.execute if available (for async)
          await (db as any).execute(`
            CREATE TABLE IF NOT EXISTS widget_locations (
              id text PRIMARY KEY NOT NULL,
              user_id text NOT NULL,
              latitude real NOT NULL,
              longitude real NOT NULL,
              location_name text,
              is_current_location integer NOT NULL DEFAULT 0,
              created_at integer NOT NULL,
              updated_at integer NOT NULL,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
          `);
          console.log('✅ widget_locations table ensured (via execute)');
        } else {
          console.warn('⚠️ Could not ensure widget_locations table - SQLite database not accessible');
        }
      } catch (error: any) {
        console.error('Error ensuring widget_locations table:', error?.message || error);
        console.error('Error stack:', error?.stack);
        // Don't throw - table might already exist or be created via migrations
      }
    }
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

  // Ensure navigation tables exist (for SQLite)
  async function ensureNavigationTables() {
    const env = process.env.NODE_ENV ?? 'development';
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    
    if (env === 'development' && !hasDatabaseUrl) {
      try {
        const sqliteDb = (db as any).sqlite;
        if (sqliteDb && typeof sqliteDb.exec === 'function') {
          // Create navigation_waypoints table
          sqliteDb.exec(`
            CREATE TABLE IF NOT EXISTS navigation_waypoints (
              id text PRIMARY KEY NOT NULL,
              user_id text NOT NULL,
              name text NOT NULL,
              latitude real NOT NULL,
              longitude real NOT NULL,
              description text,
              created_at integer NOT NULL,
              updated_at integer NOT NULL,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
          `);
          
          // Create navigation_routes table
          // Note: Drizzle uses snake_case for SQLite column names
          sqliteDb.exec(`
            CREATE TABLE IF NOT EXISTS navigation_routes (
              id text PRIMARY KEY NOT NULL,
              user_id text NOT NULL,
              name text NOT NULL,
              waypoint_ids text NOT NULL,
              description text,
              created_at integer NOT NULL,
              updated_at integer NOT NULL,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
          `);
          
          console.log('✅ Navigation tables ensured');
        }
      } catch (error: any) {
        console.error('Error ensuring navigation tables:', error?.message || error);
      }
    }
  }

  // Widget location API endpoints
  app.get("/api/widgets/location", async (req, res) => {
    try {
      // Ensure table exists before operations
      await ensureWidgetLocationsTable();
      
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
        // Return 404 but don't treat it as an error - it's expected if no location is set
        return res.status(404).json({ error: "No widget location found" });
      }

      res.json(locations[0]);
    } catch (error: any) {
      console.error("Error fetching widget location:", error);
      const errorMessage = error?.message || error?.toString() || "Unknown error";
      console.error("Error details:", {
        message: errorMessage,
        stack: error?.stack,
        query: req.query
      });
      res.status(500).json({ 
        error: "Failed to fetch widget location",
        details: errorMessage
      });
    }
  });

  app.post("/api/widgets/location", async (req, res) => {
    try {
      // Ensure table exists before operations
      await ensureWidgetLocationsTable();
      
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
        console.log('Insert data:', insertData);
        const insertResult = await db
          .insert(widgetLocationsTable)
          .values(insertData)
          .returning();
        console.log('Insert result:', insertResult);
        
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

      if (!location) {
        throw new Error('Location was not created or updated');
      }

      res.json(location);
    } catch (error: any) {
      console.error("Error saving widget location:", error);
      const errorMessage = error?.message || error?.toString() || "Unknown error";
      const errorCode = error?.code || 'UNKNOWN';
      console.error("Error details:", {
        message: errorMessage,
        code: errorCode,
        stack: error?.stack,
        body: req.body,
        error: error
      });
      
      // Provide more specific error messages
      let statusCode = 500;
      let userMessage = "Failed to save widget location";
      
      if (errorMessage.includes('no such table') || errorMessage.includes('relation') || errorMessage.includes('does not exist')) {
        statusCode = 500;
        userMessage = "Database table not found. Please run database migrations.";
      } else if (errorMessage.includes('FOREIGN KEY') || errorMessage.includes('foreign key')) {
        statusCode = 400;
        userMessage = "Invalid user. Please ensure you are logged in.";
      } else if (errorMessage.includes('UNIQUE constraint') || errorMessage.includes('unique constraint')) {
        statusCode = 409;
        userMessage = "Location already exists for this user.";
      }
      
      res.status(statusCode).json({ 
        error: userMessage,
        details: errorMessage,
        code: errorCode
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
      // Ensure tables exist before operations
      await ensureNavigationTables();
      
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const userId = await getUserIdFromEmail(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const waypointsTable = getNavigationWaypointsTable();
      
      try {
        const waypoints = await db
          .select()
          .from(waypointsTable)
          .where(eq(waypointsTable.userId, userId))
          .orderBy(waypointsTable.createdAt);

        res.json(waypoints);
      } catch (dbError: any) {
        console.error("Database error fetching waypoints:", dbError);
        // If table doesn't exist, return empty array instead of error
        if (dbError?.message?.includes('no such table') || dbError?.message?.includes('does not exist')) {
          console.log('Navigation waypoints table does not exist, returning empty array');
          return res.json([]);
        }
        throw dbError;
      }
    } catch (error: any) {
      console.error("Error fetching waypoints:", error);
      console.error("Error stack:", error?.stack);
      res.status(500).json({ 
        error: "Failed to fetch waypoints",
        details: error?.message || "Unknown error"
      });
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
      // Ensure tables exist before operations
      await ensureNavigationTables();
      
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const userId = await getUserIdFromEmail(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const routesTable = getNavigationRoutesTable();
      
      try {
        const routes = await db
          .select()
          .from(routesTable)
          .where(eq(routesTable.userId, userId))
          .orderBy(routesTable.createdAt);

        res.json(routes);
      } catch (dbError: any) {
        console.error("Database error fetching routes:", dbError);
        // If table doesn't exist, return empty array instead of error
        if (dbError?.message?.includes('no such table') || dbError?.message?.includes('does not exist')) {
          console.log('Navigation routes table does not exist, returning empty array');
          return res.json([]);
        }
        throw dbError;
      }
    } catch (error: any) {
      console.error("Error fetching routes:", error);
      console.error("Error stack:", error?.stack);
      res.status(500).json({ 
        error: "Failed to fetch routes",
        details: error?.message || "Unknown error"
      });
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

  // Weather API endpoint (XC Weather App)
  app.get("/api/weather", async (req, res) => {
    try {
      let lat = parseFloat(req.query.lat as string);
      let lon = parseFloat(req.query.lon as string);
      const timezone = (req.query.timezone as string) || 'UTC';

      // Try to get user ID from session or email (enhanced authentication)
      const userId = await getUserIdFromSessionOrEmail(req);

      // If coordinates not provided, try to get from saved location
      if ((isNaN(lat) || isNaN(lon)) && userId) {
        try {
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
            error: "Latitude and longitude are required, or provide a valid timezone, or set a widget location",
            errorCode: "MISSING_COORDINATES"
          });
        }
      }

      const weatherData = await getWeatherData(finalLat, finalLon, timezone);

      if (!weatherData) {
        return res.status(503).json({ 
          error: "Weather data unavailable. Please check API configuration.",
          errorCode: "WEATHER_API_UNAVAILABLE",
          details: "OpenWeatherMap API key may be missing or invalid"
        });
      }

      res.json(weatherData);
    } catch (error: any) {
      console.error("Error in XC Weather App endpoint:", error);
      const errorCode = error?.code || "WEATHER_FETCH_ERROR";
      const statusCode = error?.statusCode || 500;
      res.status(statusCode).json({ 
        error: "Failed to fetch weather data",
        errorCode,
        details: error?.message || "Unknown error occurred"
      });
    }
  });

  // Tides API endpoint (Tide Times App)
  app.get("/api/tides", async (req, res) => {
    try {
      let lat = parseFloat(req.query.lat as string);
      let lon = parseFloat(req.query.lon as string);
      const timezone = (req.query.timezone as string) || 'UTC';
      const forceRefresh = req.query.refresh === 'true' || req.query._refresh !== undefined;

      // Try to get user ID from session or email (enhanced authentication)
      const userId = await getUserIdFromSessionOrEmail(req);

      // If coordinates not provided, try to get from saved location
      if ((isNaN(lat) || isNaN(lon)) && userId) {
        try {
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
            error: "Latitude and longitude are required, or provide a valid timezone, or set a widget location",
            errorCode: "MISSING_COORDINATES"
          });
        }
      }

      // Clear cache if force refresh is requested
      if (forceRefresh) {
        clearTidesCache(finalLat, finalLon);
        console.log(`🔄 Force refresh requested for tides at ${finalLat}, ${finalLon} (timezone: ${timezone})`);
      }

      // Log coordinates for Southampton debugging (using correct coordinates: 50.863714, -1.425028)
      if (Math.abs(finalLat - 50.863714) < 0.1 && Math.abs(finalLon - (-1.425028)) < 0.1) {
        console.log('🌊 Southampton Tide Request:', {
          finalLat,
          finalLon,
          timezone,
          providedLat: lat,
          providedLon: lon,
          userId,
          forceRefresh,
        });
      }

      const tideData = await getTideData(finalLat, finalLon, timezone, forceRefresh);

      if (!tideData) {
        return res.status(503).json({ 
          error: "Tide data unavailable. Please check API configuration.",
          errorCode: "TIDE_API_UNAVAILABLE",
          details: "Stormglass.io API key may be missing or invalid"
        });
      }

      res.json(tideData);
    } catch (error: any) {
      console.error("Error in Tide Times App endpoint:", error);
      const errorCode = error?.code || "TIDE_FETCH_ERROR";
      const statusCode = error?.statusCode || 500;
      res.status(statusCode).json({ 
        error: "Failed to fetch tide data",
        errorCode,
        details: error?.message || "Unknown error occurred"
      });
    }
  });

  // Widget Preferences API endpoints
  app.get("/api/widgets/preferences", async (req, res) => {
    try {
      await ensureWidgetPreferencesTable();
      
      const userId = await getUserIdFromSessionOrEmail(req);
      if (!userId) {
        return res.status(401).json({ 
          error: "Authentication required",
          errorCode: "UNAUTHORIZED"
        });
      }

      const widgetPreferencesTable = getWidgetPreferencesTable();
      const preferences = await db
        .select()
        .from(widgetPreferencesTable)
        .where(eq(widgetPreferencesTable.userId, userId))
        .limit(1);

      if (preferences.length === 0) {
        // Return default preferences if none exist
        const defaultPreferences = {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          clockType: 'digital' as const,
          enableWeather: false,
          enableTides: false,
          enableMoonPhase: false,
          enableNavigation: false,
          enableAis: false,
          weatherAlertsEnabled: true,
          tideAlertsEnabled: true,
        };
        return res.json(defaultPreferences);
      }

      res.json(preferences[0]);
    } catch (error: any) {
      console.error("Error fetching widget preferences:", error);
      res.status(500).json({ 
        error: "Failed to fetch widget preferences",
        errorCode: "PREFERENCES_FETCH_ERROR",
        details: error?.message
      });
    }
  });

  app.post("/api/widgets/preferences", async (req, res) => {
    try {
      await ensureWidgetPreferencesTable();
      
      const userId = await getUserIdFromSessionOrEmail(req);
      if (!userId) {
        return res.status(401).json({ 
          error: "Authentication required",
          errorCode: "UNAUTHORIZED"
        });
      }

      const {
        timezone,
        clockType,
        enableWeather,
        enableTides,
        enableMoonPhase,
        enableNavigation,
        enableAis,
        weatherAlertsEnabled,
        tideAlertsEnabled,
      } = req.body;

      const widgetPreferencesTable = getWidgetPreferencesTable();
      
      // Check if preferences already exist
      const existing = await db
        .select()
        .from(widgetPreferencesTable)
        .where(eq(widgetPreferencesTable.userId, userId))
        .limit(1);

      const preferencesData = {
        userId,
        timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        clockType: clockType || 'digital',
        enableWeather: enableWeather ?? false,
        enableTides: enableTides ?? false,
        enableMoonPhase: enableMoonPhase ?? false,
        enableNavigation: enableNavigation ?? false,
        enableAis: enableAis ?? false,
        weatherAlertsEnabled: weatherAlertsEnabled ?? true,
        tideAlertsEnabled: tideAlertsEnabled ?? true,
        updatedAt: new Date(),
      };

      let result;
      if (existing.length > 0) {
        // Update existing preferences
        const updateResult = await db
          .update(widgetPreferencesTable)
          .set(preferencesData)
          .where(eq(widgetPreferencesTable.userId, userId))
          .returning();
        result = updateResult[0];
      } else {
        // Create new preferences
        const insertResult = await db
          .insert(widgetPreferencesTable)
          .values(preferencesData)
          .returning();
        result = insertResult[0];
      }

      res.json(result);
    } catch (error: any) {
      console.error("Error saving widget preferences:", error);
      res.status(500).json({ 
        error: "Failed to save widget preferences",
        errorCode: "PREFERENCES_SAVE_ERROR",
        details: error?.message
      });
    }
  });

  // Unified Environment API endpoint (XC Weather App + Tide Times App)
  app.get("/api/widgets/environment", async (req, res) => {
    try {
      let lat = parseFloat(req.query.lat as string);
      let lon = parseFloat(req.query.lon as string);
      const timezone = (req.query.timezone as string) || 'UTC';

      // Try to get user ID from session or email
      const userId = await getUserIdFromSessionOrEmail(req);

      // If coordinates not provided, try to get from saved location
      if ((isNaN(lat) || isNaN(lon)) && userId) {
        try {
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
    } catch (error) {
          console.error("Error fetching saved location:", error);
        }
      }

      // Validate coordinates or convert from timezone
      let finalLat = lat;
      let finalLon = lon;

      if (isNaN(lat) || isNaN(lon)) {
        const coords = weatherTimezoneToCoordinates(timezone) || tidesTimezoneToCoordinates(timezone);
        if (coords) {
          finalLat = coords.lat;
          finalLon = coords.lon;
        } else {
          return res.status(400).json({ 
            error: "Latitude and longitude are required, or provide a valid timezone, or set a widget location",
            errorCode: "MISSING_COORDINATES"
          });
        }
      }

      // Fetch both weather and tide data in parallel
      const [weatherData, tideData] = await Promise.allSettled([
        getWeatherData(finalLat, finalLon, timezone),
        getTideData(finalLat, finalLon, timezone),
      ]);

      const response: any = {
        location: {
          latitude: finalLat,
          longitude: finalLon,
          timezone,
        },
        weather: weatherData.status === 'fulfilled' ? weatherData.value : null,
        tides: tideData.status === 'fulfilled' ? tideData.value : null,
      };

      // Add error information if any requests failed
      if (weatherData.status === 'rejected') {
        response.weatherError = {
          error: "Failed to fetch weather data",
          errorCode: "WEATHER_FETCH_ERROR",
          details: weatherData.reason?.message || "Unknown error",
        };
      }

      if (tideData.status === 'rejected') {
        response.tideError = {
          error: "Failed to fetch tide data",
          errorCode: "TIDE_FETCH_ERROR",
          details: tideData.reason?.message || "Unknown error",
        };
      }

      // Return 200 even if one service fails, but include error info
      const statusCode = (!response.weather && !response.tides) ? 503 : 200;
      res.status(statusCode).json(response);
    } catch (error: any) {
      console.error("Error in unified environment endpoint:", error);
      res.status(500).json({ 
        error: "Failed to fetch environment data",
        errorCode: "ENVIRONMENT_FETCH_ERROR",
        details: error?.message || "Unknown error occurred"
      });
    }
  });

  // Clear tides cache endpoint (for debugging/restarting)
  app.post("/api/tides/clear-cache", async (req, res) => {
    try {
      const { lat, lon } = req.body;
      
      if (lat !== undefined && lon !== undefined) {
        clearTidesCache(lat, lon);
        res.json({ 
          success: true, 
          message: `Cache cleared for location ${lat}, ${lon}` 
        });
      } else {
        clearTidesCache(); // Clear all cache
        res.json({ 
          success: true, 
          message: 'All tide cache cleared' 
        });
      }
    } catch (error: any) {
      console.error("Error clearing tide cache:", error);
      res.status(500).json({ 
        error: "Failed to clear cache",
        details: error?.message 
      });
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
      const id = req.query.id as string;
      const region = req.query.region as string;
      const type = req.query.type as 'Primary' | 'Secondary' | undefined;
      const search = req.query.search as string;
      const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
      const lon = req.query.lon ? parseFloat(req.query.lon as string) : undefined;
      const radiusKm = req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : 100;

      let ports;

      // If ID is provided, search for that specific port
      if (id) {
        const allPorts = await getPorts({});
        // Try to find by ID first, then by name (case-insensitive)
        const port = allPorts.find((p: any) => 
          p.id === id || 
          p.id === id.replace('port:', '') ||
          p.name?.toLowerCase() === id.toLowerCase() ||
          p.name?.toLowerCase() === id.replace('port:', '').toLowerCase()
        );
        if (port) {
          console.log('Port found:', { id, portId: port.id, name: port.name, lat: port.latitude, lon: port.longitude });
          return res.json([port]); // Return as array to match expected format
        } else {
          console.log('Port not found:', { id, availablePorts: allPorts.slice(0, 5).map((p: any) => ({ id: p.id, name: p.name })) });
          return res.status(404).json({ error: "Port not found" });
        }
      }

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

  // Reverse Geocoding - Find nearest location from GPS coordinates
  app.get("/api/geocode/reverse", async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: "Valid latitude and longitude required" });
      }

      // First, try to find nearest port/harbor/marina
      const portsResponse = await getPortsNearLocation(lat, lon, 50);
      if (portsResponse && portsResponse.length > 0) {
        const nearest = portsResponse[0];
        return res.json({
          type: 'port',
          name: nearest.name,
          city: nearest.city,
          country: nearest.country,
          latitude: nearest.latitude,
          longitude: nearest.longitude,
          distance: nearest.distance,
        });
      }

      // Fallback: Use a geocoding service (OpenStreetMap Nominatim - free, no API key needed)
      try {
        const geocodeUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
        const geocodeResponse = await fetch(geocodeUrl, {
          headers: {
            'User-Agent': 'Diver-Well-Training-App/1.0', // Required by Nominatim
          },
        });

        if (geocodeResponse.ok) {
          const data = await geocodeResponse.json();
          const address = data.address || {};
          
          return res.json({
            type: address.city ? 'city' : address.town ? 'town' : 'location',
            name: address.city || address.town || address.village || address.county || 'Unknown',
            city: address.city || address.town,
            country: address.country,
            latitude: parseFloat(data.lat),
            longitude: parseFloat(data.lon),
            fullAddress: data.display_name,
          });
        }
      } catch (geocodeError) {
        console.error('Geocoding error:', geocodeError);
      }

      // Final fallback
      res.json({
        type: 'location',
        name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        latitude: lat,
        longitude: lon,
      });
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      res.status(500).json({ error: "Failed to reverse geocode location" });
    }
  });

  // Enhanced location info endpoint - combines GPS + nearest locations
  app.get("/api/location/info", async (req, res) => {
    try {
      const email = req.query.email as string;
      const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
      const lon = req.query.lon ? parseFloat(req.query.lon as string) : undefined;

      let finalLat = lat;
      let finalLon = lon;

      // If no coordinates provided, get from saved location
      if ((!finalLat || !finalLon) && email) {
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
              finalLat = locations[0].latitude;
              finalLon = locations[0].longitude;
            }
          }
        } catch (error) {
          console.error("Error fetching saved location:", error);
        }
      }

      if (!finalLat || !finalLon) {
        return res.status(400).json({ error: "Location coordinates required" });
      }

      // Get nearest port
      const ports = await getPortsNearLocation(finalLat, finalLon, 50);
      const nearestPort = ports && ports.length > 0 ? ports[0] : null;

      // Get reverse geocoding info (use internal function instead of HTTP call)
      let locationInfo = null;
      try {
        // First try ports
        const ports = await getPortsNearLocation(finalLat, finalLon, 50);
        if (ports && ports.length > 0) {
          const nearest = ports[0];
          locationInfo = {
            type: 'port',
            name: nearest.name,
            city: nearest.city,
            country: nearest.country,
            latitude: nearest.latitude,
            longitude: nearest.longitude,
            distance: nearest.distance,
          };
        } else {
          // Fallback to OpenStreetMap Nominatim
          const geocodeUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${finalLat}&lon=${finalLon}&zoom=10&addressdetails=1`;
          const geocodeResponse = await fetch(geocodeUrl, {
            headers: {
              'User-Agent': 'Diver-Well-Training-App/1.0',
            },
          });
          if (geocodeResponse.ok) {
            const data = await geocodeResponse.json();
            const address = data.address || {};
            locationInfo = {
              type: address.city ? 'city' : address.town ? 'town' : 'location',
              name: address.city || address.town || address.village || address.county || 'Unknown',
              city: address.city || address.town,
              country: address.country,
              latitude: parseFloat(data.lat),
              longitude: parseFloat(data.lon),
              fullAddress: data.display_name,
            };
          }
        }
      } catch (error) {
        console.error('Error getting location info:', error);
      }

      res.json({
        coordinates: {
          latitude: finalLat,
          longitude: finalLon,
        },
        nearestPort: nearestPort ? {
          name: nearestPort.name,
          type: nearestPort.type,
          distance: nearestPort.distance,
          latitude: nearestPort.latitude,
          longitude: nearestPort.longitude,
        } : null,
        locationInfo,
      });
    } catch (error) {
      console.error("Location info error:", error);
      res.status(500).json({ error: "Failed to get location info" });
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

  // ============================================================================
  // DIVE SUPERVISOR CONTROL ROUTES
  // ============================================================================

  // Helper function to get user ID from email
  async function getUserIdFromEmailForDiveSupervisor(email: string): Promise<string | null> {
    try {
      const userTable = users;
      const result = await db
        .select({ id: userTable.id })
        .from(userTable)
        .where(eq(userTable.email, email))
        .limit(1);
      return result.length > 0 ? result[0].id : null;
    } catch (error) {
      console.error("Error getting user ID:", error);
      return null;
    }
  }

  // Team Members CRUD
  app.get("/api/dive-supervisor/team-members", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }

      const userId = await getUserIdFromEmailForDiveSupervisor(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const members = await db
        .select()
        .from(diveTeamMembers)
        .where(eq(diveTeamMembers.userId, userId));

      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  app.post("/api/dive-supervisor/team-members", async (req, res) => {
    try {
      const email = (req.body.email as string) || (req.headers['x-user-email'] as string);
      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }

      const userId = await getUserIdFromEmailForDiveSupervisor(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const { name, role, age, experienceYears, phone, email: memberEmail, certifications, medicalRunoutDates, competencies, emergencyContact, notes } = req.body;

      const [member] = await db
        .insert(diveTeamMembers)
        .values({
          userId,
          name,
          role: role || "DIVER",
          age,
          experienceYears,
          phone,
          email: memberEmail,
          certifications: certifications || [],
          medicalRunoutDates: medicalRunoutDates || [],
          competencies: competencies || [],
          emergencyContact: emergencyContact || {},
          notes,
        })
        .returning();

      res.json(member);
    } catch (error) {
      console.error("Error creating team member:", error);
      res.status(500).json({ error: "Failed to create team member" });
    }
  });

  app.put("/api/dive-supervisor/team-members/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const email = (req.body.email as string) || (req.headers['x-user-email'] as string);
      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }

      const userId = await getUserIdFromEmailForDiveSupervisor(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const { name, role, age, experienceYears, phone, email: memberEmail, certifications, medicalRunoutDates, competencies, emergencyContact, notes } = req.body;

      const [member] = await db
        .update(diveTeamMembers)
        .set({
          name,
          role,
          age,
          experienceYears,
          phone,
          email: memberEmail,
          certifications: certifications || [],
          medicalRunoutDates: medicalRunoutDates || [],
          competencies: competencies || [],
          emergencyContact: emergencyContact || {},
          notes,
          updatedAt: new Date(),
        })
        .where(and(eq(diveTeamMembers.id, id), eq(diveTeamMembers.userId, userId)))
        .returning();

      if (!member) {
        return res.status(404).json({ error: "Team member not found" });
      }

      res.json(member);
    } catch (error) {
      console.error("Error updating team member:", error);
      res.status(500).json({ error: "Failed to update team member" });
    }
  });

  app.delete("/api/dive-supervisor/team-members/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }

      const userId = await getUserIdFromEmailForDiveSupervisor(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      await db
        .delete(diveTeamMembers)
        .where(and(eq(diveTeamMembers.id, id), eq(diveTeamMembers.userId, userId)));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting team member:", error);
      res.status(500).json({ error: "Failed to delete team member" });
    }
  });

  // Operations CRUD
  app.get("/api/dive-supervisor/operations", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }

      const userId = await getUserIdFromEmailForDiveSupervisor(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const operations = await db
        .select()
        .from(diveOperations)
        .where(eq(diveOperations.userId, userId))
        .orderBy(desc(diveOperations.createdAt));

      res.json(operations);
    } catch (error) {
      console.error("Error fetching operations:", error);
      res.status(500).json({ error: "Failed to fetch operations" });
    }
  });

  app.post("/api/dive-supervisor/operations", async (req, res) => {
    try {
      const email = (req.body.email as string) || (req.headers['x-user-email'] as string);
      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }

      const userId = await getUserIdFromEmailForDiveSupervisor(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const { title, clientId, location, plannedDate, status, supervisorId } = req.body;

      const [operation] = await db
        .insert(diveOperations)
        .values({
          userId,
          title,
          clientId,
          location,
          plannedDate: plannedDate ? new Date(plannedDate) : null,
          status: status || "PLANNED",
          supervisorId,
        })
        .returning();

      res.json(operation);
    } catch (error) {
      console.error("Error creating operation:", error);
      res.status(500).json({ error: "Failed to create operation" });
    }
  });

  // Contacts CRUD
  app.get("/api/dive-supervisor/contacts", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const operationId = req.query.operationId as string;

      if (!email || !operationId) {
        return res.status(400).json({ error: "Email and operationId required" });
      }

      const contacts = await db
        .select()
        .from(diveOperationContacts)
        .where(eq(diveOperationContacts.operationId, operationId));

      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  app.post("/api/dive-supervisor/contacts", async (req, res) => {
    try {
      const { operationId, contactType, name, organization, phone, email: contactEmail, vhfChannel, notes } = req.body;

      if (!operationId || !contactType || !name) {
        return res.status(400).json({ error: "operationId, contactType, and name required" });
      }

      const [contact] = await db
        .insert(diveOperationContacts)
        .values({
          operationId,
          contactType,
          name,
          organization,
          phone,
          email: contactEmail,
          vhfChannel,
          notes,
        })
        .returning();

      res.json(contact);
    } catch (error) {
      console.error("Error creating contact:", error);
      res.status(500).json({ error: "Failed to create contact" });
    }
  });

  app.put("/api/dive-supervisor/contacts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { contactType, name, organization, phone, email: contactEmail, vhfChannel, notes } = req.body;

      const [contact] = await db
        .update(diveOperationContacts)
        .set({
          contactType,
          name,
          organization,
          phone,
          email: contactEmail,
          vhfChannel,
          notes,
          updatedAt: new Date(),
        })
        .where(eq(diveOperationContacts.id, id))
        .returning();

      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      res.json(contact);
    } catch (error) {
      console.error("Error updating contact:", error);
      res.status(500).json({ error: "Failed to update contact" });
    }
  });

  app.delete("/api/dive-supervisor/contacts/:id", async (req, res) => {
    try {
      const { id } = req.params;

      await db
        .delete(diveOperationContacts)
        .where(eq(diveOperationContacts.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ error: "Failed to delete contact" });
    }
  });

  // Permits CRUD
  app.get("/api/dive-supervisor/permits", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const operationId = req.query.operationId as string;

      if (!email || !operationId) {
        return res.status(400).json({ error: "Email and operationId required" });
      }

      const permits = await db
        .select()
        .from(diveOperationPermits)
        .where(eq(diveOperationPermits.operationId, operationId));

      res.json(permits);
    } catch (error) {
      console.error("Error fetching permits:", error);
      res.status(500).json({ error: "Failed to fetch permits" });
    }
  });

  app.post("/api/dive-supervisor/permits", async (req, res) => {
    try {
      const { operationId, permitType, permitNumber, issuedBy, issueDate, expiryDate, status, notes } = req.body;

      if (!operationId || !permitType) {
        return res.status(400).json({ error: "operationId and permitType required" });
      }

      const [permit] = await db
        .insert(diveOperationPermits)
        .values({
          operationId,
          permitType,
          permitNumber,
          issuedBy,
          issueDate: issueDate ? new Date(issueDate) : null,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          status: status || "PENDING",
          notes,
        })
        .returning();

      res.json(permit);
    } catch (error) {
      console.error("Error creating permit:", error);
      res.status(500).json({ error: "Failed to create permit" });
    }
  });

  app.put("/api/dive-supervisor/permits/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { permitType, permitNumber, issuedBy, issueDate, expiryDate, status, notes } = req.body;

      const [permit] = await db
        .update(diveOperationPermits)
        .set({
          permitType,
          permitNumber,
          issuedBy,
          issueDate: issueDate ? new Date(issueDate) : null,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          status,
          notes,
          updatedAt: new Date(),
        })
        .where(eq(diveOperationPermits.id, id))
        .returning();

      if (!permit) {
        return res.status(404).json({ error: "Permit not found" });
      }

      res.json(permit);
    } catch (error) {
      console.error("Error updating permit:", error);
      res.status(500).json({ error: "Failed to update permit" });
    }
  });

  app.delete("/api/dive-supervisor/permits/:id", async (req, res) => {
    try {
      const { id } = req.params;

      await db
        .delete(diveOperationPermits)
        .where(eq(diveOperationPermits.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting permit:", error);
      res.status(500).json({ error: "Failed to delete permit" });
    }
  });

  // Rosters CRUD
  app.get("/api/dive-supervisor/rosters", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const operationId = req.query.operationId as string;

      if (!email || !operationId) {
        return res.status(400).json({ error: "Email and operationId required" });
      }

      const rosters = await db
        .select()
        .from(diveTeamRosters)
        .where(eq(diveTeamRosters.operationId, operationId));

      // Join with team members to get names
      const rostersWithNames = await Promise.all(
        rosters.map(async (roster: any) => {
          if (roster.teamMemberId) {
            const [member] = await db
              .select()
              .from(diveTeamMembers)
              .where(eq(diveTeamMembers.id, roster.teamMemberId))
              .limit(1);
            return { ...roster, teamMemberName: member?.name };
          }
          return roster;
        })
      );

      res.json(rostersWithNames);
    } catch (error) {
      console.error("Error fetching rosters:", error);
      res.status(500).json({ error: "Failed to fetch rosters" });
    }
  });

  app.post("/api/dive-supervisor/rosters", async (req, res) => {
    try {
      const { operationId, phase, diverRole, teamMemberId, notes } = req.body;

      if (!operationId || !phase || !diverRole) {
        return res.status(400).json({ error: "operationId, phase, and diverRole required" });
      }

      const [roster] = await db
        .insert(diveTeamRosters)
        .values({
          operationId,
          phase,
          diverRole,
          teamMemberId,
          notes,
        })
        .returning();

      res.json(roster);
    } catch (error) {
      console.error("Error creating roster:", error);
      res.status(500).json({ error: "Failed to create roster" });
    }
  });

  app.delete("/api/dive-supervisor/rosters/:id", async (req, res) => {
    try {
      const { id } = req.params;

      await db
        .delete(diveTeamRosters)
        .where(eq(diveTeamRosters.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting roster:", error);
      res.status(500).json({ error: "Failed to delete roster" });
    }
  });

  // Dive Plans CRUD
  app.get("/api/dive-supervisor/dive-plans", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const operationId = req.query.operationId as string;

      if (!email || !operationId) {
        return res.status(400).json({ error: "Email and operationId required" });
      }

      const [plan] = await db
        .select()
        .from(divePlans)
        .where(eq(divePlans.operationId, operationId))
        .limit(1);

      res.json(plan || null);
    } catch (error) {
      console.error("Error fetching dive plan:", error);
      res.status(500).json({ error: "Failed to fetch dive plan" });
    }
  });

  app.post("/api/dive-supervisor/dive-plans", async (req, res) => {
    try {
      const { operationId, maxDepth, bottomTime, decompressionProfile, gasMixtures, equipment, riskAssessment } = req.body;

      if (!operationId) {
        return res.status(400).json({ error: "operationId required" });
      }

      const [plan] = await db
        .insert(divePlans)
        .values({
          operationId,
          maxDepth,
          bottomTime,
          decompressionProfile: decompressionProfile || [],
          gasMixtures: gasMixtures || [],
          equipment: equipment || [],
          riskAssessment: riskAssessment || {},
        })
        .returning();

      res.json(plan);
    } catch (error) {
      console.error("Error creating dive plan:", error);
      res.status(500).json({ error: "Failed to create dive plan" });
    }
  });

  app.put("/api/dive-supervisor/dive-plans/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { maxDepth, bottomTime, decompressionProfile, gasMixtures, equipment, riskAssessment } = req.body;

      const [plan] = await db
        .update(divePlans)
        .set({
          maxDepth,
          bottomTime,
          decompressionProfile: decompressionProfile || [],
          gasMixtures: gasMixtures || [],
          equipment: equipment || [],
          riskAssessment: riskAssessment || {},
          updatedAt: new Date(),
        })
        .where(eq(divePlans.id, id))
        .returning();

      if (!plan) {
        return res.status(404).json({ error: "Dive plan not found" });
      }

      res.json(plan);
    } catch (error) {
      console.error("Error updating dive plan:", error);
      res.status(500).json({ error: "Failed to update dive plan" });
    }
  });

  // DPRs CRUD
  app.get("/api/dive-supervisor/dprs", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const operationId = req.query.operationId as string;

      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }

      const userId = await getUserIdFromEmailForDiveSupervisor(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      let whereConditions = [eq(dailyProjectReports.createdBy, userId)];
      if (operationId) {
        whereConditions.push(eq(dailyProjectReports.operationId, operationId));
      }

      const dprs = await db
        .select({
          id: dailyProjectReports.id,
          operationId: dailyProjectReports.operationId,
          reportDate: dailyProjectReports.reportDate,
          reportData: dailyProjectReports.reportData,
          createdBy: dailyProjectReports.createdBy,
          createdAt: dailyProjectReports.createdAt,
          updatedAt: dailyProjectReports.updatedAt,
          operationTitle: diveOperations.title,
        })
        .from(dailyProjectReports)
        .leftJoin(diveOperations, eq(dailyProjectReports.operationId, diveOperations.id))
        .where(and(...whereConditions))
        .orderBy(desc(dailyProjectReports.reportDate));

      res.json(dprs);
    } catch (error) {
      console.error("Error fetching DPRs:", error);
      res.status(500).json({ error: "Failed to fetch DPRs" });
    }
  });

  app.post("/api/dive-supervisor/dprs", async (req, res) => {
    try {
      const email = (req.body.email as string) || (req.headers['x-user-email'] as string);
      const { operationId, reportDate, reportData } = req.body;

      if (!email || !operationId || !reportDate || !reportData) {
        return res.status(400).json({ error: "Email, operationId, reportDate, and reportData required" });
      }

      const userId = await getUserIdFromEmailForDiveSupervisor(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const [dpr] = await db
        .insert(dailyProjectReports)
        .values({
          operationId,
          reportDate: new Date(reportDate),
          reportData,
          createdBy: userId,
        })
        .returning();

      res.json(dpr);
    } catch (error) {
      console.error("Error creating DPR:", error);
      res.status(500).json({ error: "Failed to create DPR" });
    }
  });

  app.put("/api/dive-supervisor/dprs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const email = (req.body.email as string) || (req.headers['x-user-email'] as string);
      const { reportDate, reportData } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }

      const userId = await getUserIdFromEmailForDiveSupervisor(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const [dpr] = await db
        .update(dailyProjectReports)
        .set({
          reportDate: reportDate ? new Date(reportDate) : undefined,
          reportData,
          updatedAt: new Date(),
        })
        .where(and(eq(dailyProjectReports.id, id), eq(dailyProjectReports.createdBy, userId)))
        .returning();

      if (!dpr) {
        return res.status(404).json({ error: "DPR not found" });
      }

      res.json(dpr);
    } catch (error) {
      console.error("Error updating DPR:", error);
      res.status(500).json({ error: "Failed to update DPR" });
    }
  });

  // DPR Export endpoints (placeholder - will be implemented with PDF/DOCX services)
  app.post("/api/dive-supervisor/dprs/:id/export-pdf", async (req, res) => {
    try {
      const { id } = req.params;
      // TODO: Implement PDF export using PDFExportService
      res.status(501).json({ error: "PDF export not yet implemented" });
    } catch (error) {
      console.error("Error exporting DPR to PDF:", error);
      res.status(500).json({ error: "Failed to export DPR to PDF" });
    }
  });

  app.post("/api/dive-supervisor/dprs/:id/export-docx", async (req, res) => {
    try {
      const { id } = req.params;
      // TODO: Implement DOCX export using DOCXExportService
      res.status(501).json({ error: "DOCX export not yet implemented" });
    } catch (error) {
      console.error("Error exporting DPR to DOCX:", error);
      res.status(500).json({ error: "Failed to export DPR to DOCX" });
    }
  });

  app.post("/api/dive-supervisor/dprs/import", async (req, res) => {
    try {
      // TODO: Implement DPR import from PDF/DOCX
      res.status(501).json({ error: "DPR import not yet implemented" });
    } catch (error) {
      console.error("Error importing DPR:", error);
      res.status(500).json({ error: "Failed to import DPR" });
    }
  });

  // ============================================================================
  // ENHANCED DIVE SUPERVISOR CONTROL ROUTES
  // ============================================================================

  // CasEvac Drills CRUD
  app.get("/api/dive-supervisor/cas-evac-drills", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const operationId = req.query.operationId as string;

      if (!email || !operationId) {
        return res.status(400).json({ error: "Email and operationId required" });
      }

      const drills = await db
        .select()
        .from(casEvacDrills)
        .where(eq(casEvacDrills.operationId, operationId))
        .orderBy(desc(casEvacDrills.drillDate));

      res.json(drills);
    } catch (error) {
      console.error("Error fetching CasEvac drills:", error);
      res.status(500).json({ error: "Failed to fetch drills" });
    }
  });

  app.post("/api/dive-supervisor/cas-evac-drills", async (req, res) => {
    try {
      const { operationId, drillDate, scenario, participants, outcomes, notes } = req.body;

      if (!operationId || !drillDate || !scenario) {
        return res.status(400).json({ error: "operationId, drillDate, and scenario required" });
      }

      const [drill] = await db
        .insert(casEvacDrills)
        .values({
          operationId,
          drillDate: new Date(drillDate),
          scenario,
          participants: participants || [],
          outcomes,
          notes,
        })
        .returning();

      res.json(drill);
    } catch (error) {
      console.error("Error creating CasEvac drill:", error);
      res.status(500).json({ error: "Failed to create drill" });
    }
  });

  app.put("/api/dive-supervisor/cas-evac-drills/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { drillDate, scenario, participants, outcomes, notes } = req.body;

      const [drill] = await db
        .update(casEvacDrills)
        .set({
          drillDate: drillDate ? new Date(drillDate) : undefined,
          scenario,
          participants: participants || [],
          outcomes,
          notes,
          updatedAt: new Date(),
        })
        .where(eq(casEvacDrills.id, id))
        .returning();

      if (!drill) {
        return res.status(404).json({ error: "Drill not found" });
      }

      res.json(drill);
    } catch (error) {
      console.error("Error updating CasEvac drill:", error);
      res.status(500).json({ error: "Failed to update drill" });
    }
  });

  app.delete("/api/dive-supervisor/cas-evac-drills/:id", async (req, res) => {
    try {
      const { id } = req.params;

      await db
        .delete(casEvacDrills)
        .where(eq(casEvacDrills.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting CasEvac drill:", error);
      res.status(500).json({ error: "Failed to delete drill" });
    }
  });

  // Tool Box Talks CRUD
  app.get("/api/dive-supervisor/toolbox-talks", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const operationId = req.query.operationId as string;

      if (!email || !operationId) {
        return res.status(400).json({ error: "Email and operationId required" });
      }

      const talks = await db
        .select()
        .from(toolBoxTalks)
        .where(eq(toolBoxTalks.operationId, operationId))
        .orderBy(desc(toolBoxTalks.talkDate));

      res.json(talks);
    } catch (error) {
      console.error("Error fetching toolbox talks:", error);
      res.status(500).json({ error: "Failed to fetch toolbox talks" });
    }
  });

  app.post("/api/dive-supervisor/toolbox-talks", async (req, res) => {
    try {
      const { operationId, talkDate, topics, attendees, presenter, signOffs, notes } = req.body;

      if (!operationId || !talkDate || !presenter) {
        return res.status(400).json({ error: "operationId, talkDate, and presenter required" });
      }

      const [talk] = await db
        .insert(toolBoxTalks)
        .values({
          operationId,
          talkDate: new Date(talkDate),
          topics: topics || [],
          attendees: attendees || [],
          presenter,
          signOffs: signOffs || [],
          notes,
        })
        .returning();

      res.json(talk);
    } catch (error) {
      console.error("Error creating toolbox talk:", error);
      res.status(500).json({ error: "Failed to create toolbox talk" });
    }
  });

  app.put("/api/dive-supervisor/toolbox-talks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { talkDate, topics, attendees, presenter, signOffs, notes } = req.body;

      const [talk] = await db
        .update(toolBoxTalks)
        .set({
          talkDate: talkDate ? new Date(talkDate) : undefined,
          topics: topics || [],
          attendees: attendees || [],
          presenter,
          signOffs: signOffs || [],
          notes,
          updatedAt: new Date(),
        })
        .where(eq(toolBoxTalks.id, id))
        .returning();

      if (!talk) {
        return res.status(404).json({ error: "Toolbox talk not found" });
      }

      res.json(talk);
    } catch (error) {
      console.error("Error updating toolbox talk:", error);
      res.status(500).json({ error: "Failed to update toolbox talk" });
    }
  });

  app.delete("/api/dive-supervisor/toolbox-talks/:id", async (req, res) => {
    try {
      const { id } = req.params;

      await db
        .delete(toolBoxTalks)
        .where(eq(toolBoxTalks.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting toolbox talk:", error);
      res.status(500).json({ error: "Failed to delete toolbox talk" });
    }
  });

  // Hazards CRUD
  app.get("/api/dive-supervisor/hazards", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const operationId = req.query.operationId as string;

      if (!email || !operationId) {
        return res.status(400).json({ error: "Email and operationId required" });
      }

      const hazards = await db
        .select()
        .from(diveOperationHazards)
        .where(eq(diveOperationHazards.operationId, operationId))
        .orderBy(desc(diveOperationHazards.createdAt));

      res.json(hazards);
    } catch (error) {
      console.error("Error fetching hazards:", error);
      res.status(500).json({ error: "Failed to fetch hazards" });
    }
  });

  app.post("/api/dive-supervisor/hazards", async (req, res) => {
    try {
      const { operationId, hazardType, description, severity, likelihood, mitigation, status } = req.body;

      if (!operationId || !hazardType || !description || !severity || !likelihood) {
        return res.status(400).json({ error: "operationId, hazardType, description, severity, and likelihood required" });
      }

      const [hazard] = await db
        .insert(diveOperationHazards)
        .values({
          operationId,
          hazardType,
          description,
          severity,
          likelihood,
          mitigation,
          status: status || "IDENTIFIED",
        })
        .returning();

      res.json(hazard);
    } catch (error) {
      console.error("Error creating hazard:", error);
      res.status(500).json({ error: "Failed to create hazard" });
    }
  });

  app.put("/api/dive-supervisor/hazards/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { hazardType, description, severity, likelihood, mitigation, status } = req.body;

      const [hazard] = await db
        .update(diveOperationHazards)
        .set({
          hazardType,
          description,
          severity,
          likelihood,
          mitigation,
          status,
          updatedAt: new Date(),
        })
        .where(eq(diveOperationHazards.id, id))
        .returning();

      if (!hazard) {
        return res.status(404).json({ error: "Hazard not found" });
      }

      res.json(hazard);
    } catch (error) {
      console.error("Error updating hazard:", error);
      res.status(500).json({ error: "Failed to update hazard" });
    }
  });

  app.delete("/api/dive-supervisor/hazards/:id", async (req, res) => {
    try {
      const { id } = req.params;

      await db
        .delete(diveOperationHazards)
        .where(eq(diveOperationHazards.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting hazard:", error);
      res.status(500).json({ error: "Failed to delete hazard" });
    }
  });

  // Welfare Records CRUD
  app.get("/api/dive-supervisor/welfare", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const operationId = req.query.operationId as string;

      if (!email || !operationId) {
        return res.status(400).json({ error: "Email and operationId required" });
      }

      const records = await db
        .select()
        .from(welfareRecords)
        .where(eq(welfareRecords.operationId, operationId))
        .orderBy(desc(welfareRecords.recordDate));

      res.json(records);
    } catch (error) {
      console.error("Error fetching welfare records:", error);
      res.status(500).json({ error: "Failed to fetch welfare records" });
    }
  });

  app.post("/api/dive-supervisor/welfare", async (req, res) => {
    try {
      const { operationId, recordDate, accommodation, meals, restPeriods, healthNotes } = req.body;

      if (!operationId || !recordDate) {
        return res.status(400).json({ error: "operationId and recordDate required" });
      }

      const [record] = await db
        .insert(welfareRecords)
        .values({
          operationId,
          recordDate: new Date(recordDate),
          accommodation: accommodation || {},
          meals: meals || {},
          restPeriods: restPeriods || [],
          healthNotes,
        })
        .returning();

      res.json(record);
    } catch (error) {
      console.error("Error creating welfare record:", error);
      res.status(500).json({ error: "Failed to create welfare record" });
    }
  });

  app.put("/api/dive-supervisor/welfare/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { recordDate, accommodation, meals, restPeriods, healthNotes } = req.body;

      const [record] = await db
        .update(welfareRecords)
        .set({
          recordDate: recordDate ? new Date(recordDate) : undefined,
          accommodation: accommodation || {},
          meals: meals || {},
          restPeriods: restPeriods || [],
          healthNotes,
          updatedAt: new Date(),
        })
        .where(eq(welfareRecords.id, id))
        .returning();

      if (!record) {
        return res.status(404).json({ error: "Welfare record not found" });
      }

      res.json(record);
    } catch (error) {
      console.error("Error updating welfare record:", error);
      res.status(500).json({ error: "Failed to update welfare record" });
    }
  });

  app.delete("/api/dive-supervisor/welfare/:id", async (req, res) => {
    try {
      const { id } = req.params;

      await db
        .delete(welfareRecords)
        .where(eq(welfareRecords.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting welfare record:", error);
      res.status(500).json({ error: "Failed to delete welfare record" });
    }
  });

  // Shipping Info CRUD
  app.get("/api/dive-supervisor/shipping", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const operationId = req.query.operationId as string;

      if (!email || !operationId) {
        return res.status(400).json({ error: "Email and operationId required" });
      }

      const info = await db
        .select()
        .from(shippingInfo)
        .where(eq(shippingInfo.operationId, operationId))
        .orderBy(desc(shippingInfo.createdAt));

      res.json(info);
    } catch (error) {
      console.error("Error fetching shipping info:", error);
      res.status(500).json({ error: "Failed to fetch shipping info" });
    }
  });

  app.post("/api/dive-supervisor/shipping", async (req, res) => {
    try {
      const { operationId, vesselName, vesselType, eta, etd, contact, notes } = req.body;

      if (!operationId) {
        return res.status(400).json({ error: "operationId required" });
      }

      const [info] = await db
        .insert(shippingInfo)
        .values({
          operationId,
          vesselName,
          vesselType,
          eta: eta ? new Date(eta) : null,
          etd: etd ? new Date(etd) : null,
          contact: contact || {},
          notes,
        })
        .returning();

      res.json(info);
    } catch (error) {
      console.error("Error creating shipping info:", error);
      res.status(500).json({ error: "Failed to create shipping info" });
    }
  });

  app.put("/api/dive-supervisor/shipping/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { vesselName, vesselType, eta, etd, contact, notes } = req.body;

      const [info] = await db
        .update(shippingInfo)
        .set({
          vesselName,
          vesselType,
          eta: eta ? new Date(eta) : null,
          etd: etd ? new Date(etd) : null,
          contact: contact || {},
          notes,
          updatedAt: new Date(),
        })
        .where(eq(shippingInfo.id, id))
        .returning();

      if (!info) {
        return res.status(404).json({ error: "Shipping info not found" });
      }

      res.json(info);
    } catch (error) {
      console.error("Error updating shipping info:", error);
      res.status(500).json({ error: "Failed to update shipping info" });
    }
  });

  app.delete("/api/dive-supervisor/shipping/:id", async (req, res) => {
    try {
      const { id } = req.params;

      await db
        .delete(shippingInfo)
        .where(eq(shippingInfo.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting shipping info:", error);
      res.status(500).json({ error: "Failed to delete shipping info" });
    }
  });

  // Environmental Data endpoint
  app.get("/api/dive-supervisor/environmental-data", async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      const timezone = (req.query.timezone as string) || "UTC";

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: "Valid latitude and longitude required" });
      }

      // Use existing services
      const [weatherData, tideData] = await Promise.all([
        getWeatherData(lat, lon, timezone),
        getTideData(lat, lon, timezone),
      ]);

      res.json({
        weather: weatherData,
        tides: tideData,
      });
    } catch (error) {
      console.error("Error fetching environmental data:", error);
      res.status(500).json({ error: "Failed to fetch environmental data" });
    }
  });

  // Notices to Mariners endpoint
  app.get("/api/dive-supervisor/notices-to-mariners", async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      const radiusKm = parseFloat(req.query.radiusKm as string) || 50;

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: "Valid latitude and longitude required" });
      }

      const notices = await getNoticesToMariners(lat, lon, radiusKm);

      res.json(notices);
    } catch (error) {
      console.error("Error fetching notices to mariners:", error);
      res.status(500).json({ error: "Failed to fetch notices to mariners" });
    }
  });

  // RAMS Documents CRUD
  app.get("/api/dive-supervisor/rams", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const operationId = req.query.operationId as string;

      if (!email || !operationId) {
        return res.status(400).json({ error: "Email and operationId required" });
      }

      const rams = await db
        .select()
        .from(ramsDocuments)
        .where(eq(ramsDocuments.operationId, operationId))
        .orderBy(desc(ramsDocuments.createdAt));

      res.json(rams);
    } catch (error) {
      console.error("Error fetching RAMS documents:", error);
      res.status(500).json({ error: "Failed to fetch RAMS documents" });
    }
  });

  app.post("/api/dive-supervisor/rams", async (req, res) => {
    try {
      const { operationId, title, documentData, linkedHazardIds, signatures } = req.body;
      const email = (req.body.email as string) || (req.headers['x-user-email'] as string);

      if (!operationId || !title || !documentData) {
        return res.status(400).json({ error: "operationId, title, and documentData required" });
      }

      // Get user ID from email
      const userId = await getUserIdFromEmailForDiveSupervisor(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const [rams] = await db
        .insert(ramsDocuments)
        .values({
          operationId,
          title,
          documentData,
          linkedHazardIds: linkedHazardIds || [],
          signatures: signatures || [],
          createdBy: userId,
        })
        .returning();

      res.json(rams);
    } catch (error) {
      console.error("Error creating RAMS document:", error);
      res.status(500).json({ error: "Failed to create RAMS document" });
    }
  });

  app.put("/api/dive-supervisor/rams/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { title, documentData, linkedHazardIds, signatures } = req.body;

      const [rams] = await db
        .update(ramsDocuments)
        .set({
          title,
          documentData,
          linkedHazardIds: linkedHazardIds || [],
          signatures: signatures || [],
          updatedAt: new Date(),
        })
        .where(eq(ramsDocuments.id, id))
        .returning();

      if (!rams) {
        return res.status(404).json({ error: "RAMS document not found" });
      }

      res.json(rams);
    } catch (error) {
      console.error("Error updating RAMS document:", error);
      res.status(500).json({ error: "Failed to update RAMS document" });
    }
  });

  app.delete("/api/dive-supervisor/rams/:id", async (req, res) => {
    try {
      const { id } = req.params;

      await db
        .delete(ramsDocuments)
        .where(eq(ramsDocuments.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting RAMS document:", error);
      res.status(500).json({ error: "Failed to delete RAMS document" });
    }
  });

  app.post("/api/dive-supervisor/rams/:id/sign", async (req, res) => {
    try {
      const { id } = req.params;
      const { teamMemberId, signature } = req.body;

      if (!teamMemberId || !signature) {
        return res.status(400).json({ error: "teamMemberId and signature required" });
      }

      const [rams] = await db
        .select()
        .from(ramsDocuments)
        .where(eq(ramsDocuments.id, id))
        .limit(1);

      if (!rams) {
        return res.status(404).json({ error: "RAMS document not found" });
      }

      const signatures = (rams.signatures as any[]) || [];
      const signatureIndex = signatures.findIndex((s: any) => s.teamMemberId === teamMemberId);
      
      const newSignature = {
        teamMemberId,
        name: signatures[signatureIndex]?.name || "",
        signature,
        date: new Date().toISOString(),
        status: "SIGNED" as const,
      };

      if (signatureIndex >= 0) {
        signatures[signatureIndex] = newSignature;
      } else {
        signatures.push(newSignature);
      }

      const [updated] = await db
        .update(ramsDocuments)
        .set({
          signatures,
          updatedAt: new Date(),
        })
        .where(eq(ramsDocuments.id, id))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Error signing RAMS document:", error);
      res.status(500).json({ error: "Failed to sign RAMS document" });
    }
  });

  app.get("/api/dive-supervisor/rams/:id/export-pdf", async (req, res) => {
    try {
      const { id } = req.params;

      const [rams] = await db
        .select()
        .from(ramsDocuments)
        .where(eq(ramsDocuments.id, id))
        .limit(1);

      if (!rams) {
        return res.status(404).json({ error: "RAMS document not found" });
      }

      // TODO: Generate PDF using jsPDF or similar
      // For now, return a placeholder
      res.status(501).json({ error: "PDF export not yet implemented" });
    } catch (error) {
      console.error("Error exporting RAMS PDF:", error);
      res.status(500).json({ error: "Failed to export PDF" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
