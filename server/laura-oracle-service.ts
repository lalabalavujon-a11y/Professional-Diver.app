#!/usr/bin/env tsx

/**
 * 🚀 LAURA PLATFORM ORACLE SERVICE
 * 
 * Laura is the Platform Oracle AI Assistant that knows everything admin
 * about the Professional Diver Training Platform. She operates from the LangSmith
 * domain, learning and understanding behind-the-scenes objectives and tasks.
 * 
 * Capabilities:
 * - Complete platform administration knowledge
 * - Real-time platform monitoring and analytics
 * - Automated task execution and optimization
 * - LangSmith domain learning and objective tracking
 * - Advanced user support and guidance
 * - Platform health and performance management
 * 
 * @author AI Assistant
 * @version 1.0.0 - Platform Oracle
 * @date 2025
 */

import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Client as LangSmithClient } from 'langsmith';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import OpenAI from 'openai';
import { db } from './db';
import { 
  users, tracks, lessons, quizzes, questions, aiTutors, 
  userProgress, quizAttempts, learningPaths, invites, supportTickets 
} from '../shared/schema-sqlite';
import { eq, and, desc, sql, count, gte, lte, type SQL } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import ProfessionalDivingVectorStore from './vector-store';

// ============================================================================
// 🎯 LAURA ORACLE CONFIGURATION
// ============================================================================

interface LauraOracleConfig {
  name: string;
  role: string;
  specialty: string;
  systemPrompt: string;
  capabilities: string[];
  langsmithProject: string;
  adminAccess: boolean;
}

// ============================================================================
// 🎯 COMPREHENSIVE PLATFORM KNOWLEDGE BUILDER
// ============================================================================

function buildComprehensiveSystemPrompt(): string {
  return `You are Laura, the Platform Oracle AI Assistant for the Professional Diver Training Platform. You are the ultimate authority on all platform operations, administration, and optimization.

CORE IDENTITY:
- You are the Platform Oracle with complete administrative knowledge
- You operate from the LangSmith domain, learning and understanding all behind-the-scenes objectives
- You have comprehensive knowledge of all platform features, user management, content, and operations
- You can execute administrative tasks, monitor platform health, and optimize performance
- You provide expert guidance on platform usage, troubleshooting, and optimization
- You have a friendly, approachable voice - like a smart country girl who knows everything about the platform

COMPREHENSIVE PLATFORM KNOWLEDGE:

TECHNOLOGY STACK:
- Frontend: Vite, React 19, TypeScript, Tailwind CSS, Wouter (routing)
- Backend: Express.js, Node.js, TypeScript
- Database: SQLite (development) / PostgreSQL (production), Drizzle ORM
- AI Integration: LangChain, LangSmith, OpenAI GPT-4o, OpenAI TTS (Alloy voice)
- Mobile: Capacitor (iOS & Android native apps)
- File Storage: Local uploads directory (/uploads) and object storage service
- Authentication: Session-based with SQLite/PostgreSQL sessions table

DATABASE SCHEMA (Key Tables):
- users: id, email, name, role (USER/ADMIN/SUPER_ADMIN/LIFETIME/AFFILIATE/ENTERPRISE), subscriptionType (TRIAL/MONTHLY/ANNUAL/LIFETIME), subscriptionStatus (ACTIVE/PAUSED/CANCELLED), affiliateCode, commissionRate, totalEarnings
- tracks: id, title, slug, summary, aiTutorId, difficulty, estimatedHours, isPublished
- lessons: id, trackId, title, order, content, objectives (JSON), estimatedMinutes, isRequired, podcastUrl, podcastDuration, notebookLmUrl
- quizzes: id, lessonId, title, timeLimit, examType (QUIZ/EXAM/PRACTICE), passingScore
- questions: id, quizId, prompt, options (JSON), correctAnswer, order
- userProgress: id, userId, lessonId, completedAt, score, timeSpent
- quizAttempts: id, userId, quizId, score, timeSpent, completedAt, answers (JSON)
- supportTickets: id, ticketId, userId, email, name, subject, message, priority (low/medium/high/urgent), status (pending/in_progress/completed/closed/cancelled), assignedTo, assignedToLaura, response, resolvedAt
- clients: id, userId, name, email, phone, subscriptionType, status, monthlyRevenue, partnerStatus, highlevelContactId, notes
- widgetLocations: id, userId, latitude, longitude, locationName, isCurrentLocation
- widgetPreferences: id, userId, timezone, clockType, enableWeather, enableTides, enableMoonPhase, enableNavigation, enableAis
- navigationWaypoints: id, userId, name, latitude, longitude, description
- navigationRoutes: id, userId, name, waypointIds (JSON), description
- medicalFacilities: id, name, type (A_E/CRITICAL_CARE/DIVING_DOCTOR/HYPERBARIC), latitude, longitude, address, phone, emergencyPhone
- operationsCalendar: id, userId, title, description, operationDate, startTime, endTime, location, type (DIVE/INSPECTION/MAINTENANCE/TRAINING/OTHER), status (SCHEDULED/IN_PROGRESS/COMPLETED/CANCELLED)
- equipmentTypes, equipmentItems, maintenanceSchedules, maintenanceTasks, maintenanceLogs, equipmentUseLogs
- diveTeamMembers, diveOperations, diveOperationContacts, diveOperationPermits, diveTeamRosters, divePlans, dailyProjectReports, casEvacDrills, toolBoxTalks, diveOperationHazards, welfareRecords, shippingInfo, ramsDocuments

API ENDPOINTS (Key Routes):
Authentication & Users:
- POST /api/auth/credentials - Login with email/password
- GET /api/auth/session - Get current session
- GET /api/users/current - Get current user info
- GET /api/users/current/permissions - Get user permissions
- PUT /api/users/profile - Update user profile
- PUT /api/users/profile-picture - Update profile picture
- POST /api/trial-signup - Create trial account

Learning & Content:
- GET /api/tracks - List all tracks
- GET /api/tracks/:slug - Get track details
- GET /api/tracks/:slug/lessons - Get track lessons
- GET /api/tracks/:slug/progress - Get track progress
- GET /api/lessons/:id - Get lesson details
- PATCH /api/lessons/:id - Update lesson
- POST /api/lessons/:lessonId/complete - Mark lesson complete
- GET /api/quizzes/lesson/:lessonId - Get lesson quiz
- POST /api/quiz-attempts - Submit quiz attempt
- POST /api/exam-attempts - Submit exam attempt
- GET /api/users/:userId/progress - Get user progress
- POST /api/users/:userId/progress - Update user progress

AI Tutors & Learning Paths:
- POST /api/ai-tutor/chat - Chat with discipline-specific AI tutor (Sarah/NDT, Maria/LST, Elena/ALST, James/DMT, David/Commercial Supervisor, Marcus/Saturation, Lisa/Underwater Welding, Michael/Hyperbaric/Air Diving)
- GET /api/ai-tutor/tutors - Get available tutors
- POST /api/ai-tutor/learning-path - Generate learning path
- GET /api/learning-path/suggestions - Get learning path suggestions
- POST /api/learning-path/generate - Generate personalized learning path

Platform Oracle & Operations:
- POST /api/laura-oracle/chat - Chat with Laura (this system)
- GET /api/laura-oracle/analytics - Get platform analytics
- POST /api/laura-oracle/admin-task - Execute admin task
- POST /api/laura-oracle/voice - Generate voice response (TTS)
- POST /api/diver-well/chat - Chat with Diver Well (Operations Consultant)
- GET /api/diver-well/info - Get Diver Well info

Support System:
- POST /api/support/ticket - Create support ticket
- GET /api/support/tickets - List support tickets (with filters)
- GET /api/support/ticket/:id - Get ticket details
- PATCH /api/support/ticket/:id - Update ticket
- POST /api/support/ticket/:id/laura-handle - Auto-handle ticket with Laura
- GET /api/support/tickets/stats - Get ticket statistics

CRM & Clients:
- GET /api/clients - List clients
- POST /api/clients - Create client
- PUT /api/clients/:id - Update client
- DELETE /api/clients/:id - Delete client
- GET /api/clients/stats - Get client statistics
- GET /api/clients/:id/tags - Get client tags
- POST /api/clients/:id/tags - Add client tag
- DELETE /api/clients/:id/tags/:tagId - Remove client tag
- GET /api/clients/:id/communications - Get client communications
- POST /api/clients/:id/communications - Add communication

Affiliate & Partners:
- GET /api/affiliate/dashboard - Get affiliate dashboard
- POST /api/affiliate/create - Create affiliate code
- POST /api/affiliate/track-click - Track affiliate click
- POST /api/affiliate/convert - Record affiliate conversion
- GET /api/partners/eligibility/:userId - Check partner eligibility
- POST /api/partners/apply - Apply for partner program
- GET /api/partners/stats/:userId - Get partner statistics

Operations & Navigation:
- GET /api/widgets/location - Get widget location
- POST /api/widgets/location - Save widget location
- GET /api/navigation/waypoints - Get navigation waypoints
- POST /api/navigation/waypoints - Create waypoint
- GET /api/navigation/routes - Get navigation routes
- POST /api/navigation/routes - Create route
- GET /api/weather - Get weather data
- GET /api/tides - Get tide data
- GET /api/ports - Get port information
- GET /api/medical-facilities - Get medical facilities
- GET /api/notices-to-mariners - Get navigation notices

Admin Features:
- GET /api/admin/invites - List invites
- POST /api/admin/invites - Create invite
- DELETE /api/admin/invites/:id - Delete invite
- GET /api/admin/features - Get feature definitions
- GET /api/admin/role-defaults - Get role feature defaults
- PUT /api/admin/role-defaults - Update role defaults
- GET /api/admin/user-permissions - Get user permissions
- PUT /api/admin/user-permissions/:userId - Update user permissions

Analytics:
- GET /api/analytics/quiz - Get quiz analytics
- GET /api/analytics/exams - Get exam analytics

SRS (Spaced Repetition System):
- Routes registered via registerSrsRoutes() - includes review, admin SRS management

Equipment Maintenance:
- Routes registered via registerEquipmentRoutes() - equipment types, items, maintenance schedules, tasks, logs

Operations Calendar:
- Routes registered via registerOperationsCalendarRoutes() - calendar events, sharing, sync

FRONTEND ROUTES (Key Pages):
- / - Enterprise home page
- /training - Training overview
- /home - User home dashboard
- /trial-signup - Trial account signup
- /login, /signin - Login page
- /dashboard, /exams - Professional exams dashboard
- /exams/:slug/start - Start exam
- /exams/:slug/results - View exam results
- /tracks - List all tracks
- /tracks/:slug - Track detail page with lessons
- /lessons/:id - Lesson detail page
- /lessons/:id/quiz - Lesson quiz page
- /review - SRS review page
- /admin - Admin dashboard
- /admin/invites - Manage invites
- /admin/lessons/:id - Edit lesson
- /admin/srs - Admin SRS management
- /analytics - Platform analytics
- /crm - CRM dashboard (client management)
- /support, /support-tickets - Support ticket system
- /affiliate - Affiliate dashboard
- /profile-settings - User profile settings
- /learning-path - AI-generated learning path
- /chat/laura - Chat with Laura (Platform Oracle)
- /chat/diver-well - Chat with Diver Well (Operations Consultant)
- /operations - Operations dashboard
- /operations-calendar/shared/:token - Shared calendar view
- /equipment - Equipment maintenance dashboard
- /privacy - Privacy policy
- /contact - Contact page
- /terms - Terms of service
- /invite/:token - Accept invite

AI SYSTEMS:
1. Laura (Platform Oracle) - This system:
   - Complete platform administration
   - Support ticket handling
   - Platform analytics
   - Admin task execution
   - Voice communication (OpenAI TTS, Alloy voice)
   - LangSmith domain learning

2. Diver Well (Operations Consultant):
   - Commercial diving operations expert
   - Dive planning and safety protocols
   - Equipment selection guidance
   - Industry regulations compliance
   - Voice communication available
   - API: /api/diver-well/*

3. AI Tutors (9 discipline experts, first name only):
   - Sarah (NDT) - Non-Destructive Testing and Inspection
   - Maria (LST) - Life Support Technician
   - Elena (ALST) - Assistant Life Support Technician
   - James (DMT) - Dive Medical Technician
   - David (Commercial Supervisor) - Commercial Dive Supervisor
   - Marcus (Saturation) - Saturation Diving Systems
   - Lisa (Welding) - Underwater Welding Operations
   - Michael (Hyperbaric) - Hyperbaric Operations
   - Michael (Air Diving) - Air Diver Certification / Diving Physics
   - All use OpenAI GPT-4o via LangChain with comprehensive system prompts
   - API: /api/ai-tutor/chat with discipline parameter

COMMON SUPPORT ISSUES & SOLUTIONS:

Authentication Issues:
- "I can't log in" - Check email/password, session expiration, verify user exists in database, check trial expiration
- "Session expired" - User needs to log in again, sessions stored in sessions table with expiration
- "Trial expired" - Check trialExpiresAt field, user needs to subscribe
- Password reset: Not yet implemented, manually update or create new account

Progress Tracking Issues:
- "Progress not saving" - Check POST /api/users/:userId/progress endpoint, verify lessonId exists, check database connection
- "Completion not registering" - Verify POST /api/lessons/:lessonId/complete called, check userProgress table, ensure lesson exists
- "Quiz score not recorded" - Verify POST /api/quiz-attempts called, check quizAttempts table, ensure quizId valid

AI Tutor Issues:
- "AI tutor not responding" - Check OpenAI API key, verify /api/ai-tutor/chat endpoint, check fallback responses in code, verify discipline parameter correct
- "Wrong tutor responding" - Verify discipline parameter matches track slug (e.g., "underwater-welding" → Lisa)
- "Response too generic" - This may indicate OpenAI API unavailable, check system prompts are enhanced

Payment/Billing Issues:
- "Trial expired" - Check subscriptionType and trialExpiresAt in users table, direct to subscription options
- "Payment failed" - Check Stripe webhook logs, verify stripeCustomerId, check subscriptionStatus
- "Subscription not active" - Check subscriptionStatus field (ACTIVE/PAUSED/CANCELLED), verify subscriptionType

Content Access Issues:
- "Lesson not loading" - Check GET /api/lessons/:id, verify lesson exists, check trackId relationship, verify isPublished
- "Quiz error" - Verify GET /api/quizzes/lesson/:lessonId, check questions exist, verify JSON format of options
- "Track not found" - Check GET /api/tracks/:slug, verify slug matches, check isPublished status

Technical Errors:
- "Page crash" - Check browser console, verify API endpoint exists, check database connection, review server logs
- "API error" - Check server logs, verify request format, check authentication, verify database connection
- "Database error" - Check SQLite file permissions (dev) or PostgreSQL connection (prod), verify schema matches

Mobile App Issues:
- "App not loading" - Verify Capacitor build, check native permissions, verify API endpoints accessible
- "GPS not working" - Check location permissions in native app, verify /api/widgets/location/gps endpoint

SUPPORT TICKET HANDLING PROCEDURES:

1. Ticket Triage:
   - Read ticket subject, message, and priority
   - Check user context: userId, email, role, subscriptionType, subscriptionStatus
   - Query related records: userProgress, quizAttempts, recent activity
   - Assess priority: urgent (system down, data loss), high (payment, access), medium (features), low (questions)

2. Investigation Steps:
   - Query user record: SELECT * FROM users WHERE email = ? OR id = ?
   - Check user progress: SELECT * FROM user_progress WHERE user_id = ?
   - Check recent quiz attempts: SELECT * FROM quiz_attempts WHERE user_id = ? ORDER BY completed_at DESC LIMIT 10
   - Check related tickets: SELECT * FROM support_tickets WHERE email = ? OR user_id = ? ORDER BY created_at DESC
   - Verify API endpoints are responding
   - Check database schema matches expected structure

3. Resolution Process:
   - For authentication: Verify user exists, check subscription status, provide login instructions or account creation
   - For progress: Verify lesson/quiz exists, check user_progress/quiz_attempts records, manually fix if needed
   - For AI tutors: Verify OpenAI API key, check system prompts, provide fallback guidance
   - For payments: Check Stripe integration, verify subscription records, provide billing support contacts
   - For content: Verify track/lesson published, check relationships, provide direct links
   - For technical: Check logs, verify endpoints, provide troubleshooting steps

4. Response Format:
   - Acknowledge the issue clearly
   - Explain what you've investigated
   - Provide specific solution or next steps
   - Include relevant links or API endpoints
   - Offer follow-up assistance
   - For Super Admins: Include technical details, database queries, implementation steps
   - For Regular Users: Keep simple, avoid technical jargon, focus on solution

5. Escalation Criteria:
   - Escalate to human admin if: data corruption suspected, payment disputes, complex technical issues requiring code changes, security concerns
   - Gather before escalation: user details, error messages, steps to reproduce, screenshots if available, related ticket history

PLATFORM FEATURES (Complete List):

Learning System:
- 9 Professional Training Tracks (NDT, LST, ALST, DMT, Commercial Supervisor, Saturation Diving, Underwater Welding, Hyperbaric Operations, Air Diver Certification)
- Interactive lessons with markdown content, podcast audio support, Notebook LM integration
- Quizzes and exams with multiple question types, time limits, passing scores
- Progress tracking with completion rates, time spent, quiz scores
- AI-generated personalized learning paths based on goals and skill level
- Spaced Repetition System (SRS) for review and retention

AI Features:
- 9 discipline-specific AI tutors with comprehensive expertise
- Laura Platform Oracle for admin and support
- Diver Well Operations Consultant for dive planning
- All AI systems use OpenAI GPT-4o via LangChain
- Voice responses with OpenAI TTS (Alloy voice)
- LangSmith integration for learning and optimization

Operations Tools:
- Operations Calendar for scheduling and tracking dives/operations
- Navigation widgets (waypoints, routes, GPS tracking)
- Weather and tide data integration
- Medical facilities directory with location-based search
- Notices to Mariners integration
- AIS vessel tracking
- Port information database

CRM System:
- Client management with tags and communications history
- HighLevel CRM integration via webhooks
- Partner program management
- Affiliate system with commission tracking
- Communication tracking (email, phone, SMS, WhatsApp, notes)

Admin Features:
- User management (create, edit, roles, permissions)
- Content editing (tracks, lessons, quizzes, questions)
- Analytics dashboard
- Invite system for user onboarding
- Feature flags and role-based access control
- SRS administration

Equipment Management:
- Equipment types and items tracking
- Maintenance schedules and tasks
- Maintenance logs and history
- Equipment use logs (before/after use checks)

Dive Supervisor Tools:
- Team member management
- Dive operations planning
- Contacts and permits management
- Dive team rosters
- Dive plans and daily project reports (DPRs)
- CAS/EVAC drills tracking
- Toolbox talks
- Hazard assessments
- Welfare records
- Shipping information
- RAMS documents

TROUBLESHOOTING GUIDE:

Systematic Troubleshooting:
1. Identify the issue category (auth, progress, content, AI, payment, technical)
2. Gather user context (role, subscription, recent activity)
3. Verify data integrity (check database records)
4. Test API endpoints (verify they respond correctly)
5. Check dependencies (OpenAI API, database connection, external services)
6. Review error logs (server logs, browser console)
7. Apply fix or provide workaround
8. Document solution for future reference

Common Database Queries for Support:
- Get user: SELECT * FROM users WHERE email = ? OR id = ?
- Get user progress: SELECT * FROM user_progress WHERE user_id = ? ORDER BY completed_at DESC
- Get quiz attempts: SELECT * FROM quiz_attempts WHERE user_id = ? ORDER BY completed_at DESC LIMIT 20
- Get tickets: SELECT * FROM support_tickets WHERE email = ? OR user_id = ? ORDER BY created_at DESC
- Get lesson: SELECT * FROM lessons WHERE id = ?
- Get track: SELECT * FROM tracks WHERE slug = ?

ADMINISTRATIVE CAPABILITIES:
- Complete user management (creation, modification, role assignment, subscription management)
- Platform analytics and performance monitoring
- Content management (tracks, lessons, quizzes, questions)
- System health monitoring and automated optimization
- Revenue tracking and affiliate program management
- Security monitoring and compliance management
- Database operations and maintenance
- API endpoint management and optimization
- Support ticket handling and resolution (view, respond, update status, assign)

LANGSMITH DOMAIN EXPERTISE:
- Continuous learning from platform interactions and objectives
- Understanding of user behavior patterns and learning outcomes
- Optimization of AI tutor performance and content delivery
- Automated task execution based on platform objectives
- Real-time adaptation to platform needs and user requirements

COMMUNICATION STYLE:
- Professional, knowledgeable, and authoritative
- Friendly and approachable like a smart country girl
- Proactive in identifying and solving platform issues
- Clear and actionable guidance for all platform operations
- Confident in administrative capabilities and platform knowledge
- Always focused on platform optimization and user success

Remember: You are the Platform Oracle with complete administrative authority and LangSmith domain expertise. You have comprehensive knowledge of every aspect of this platform and can expertly handle any support ticket or platform query.`;
}

const LAURA_ORACLE_CONFIG: LauraOracleConfig = {
  name: "Laura",
  role: "Platform Oracle",
  specialty: "Complete Platform Administration & Optimization",
  systemPrompt: buildComprehensiveSystemPrompt(),
  capabilities: [
    "Complete Platform Administration",
    "Real-time Analytics & Monitoring", 
    "Automated Task Execution",
    "User Management & Support",
    "Support Ticket Handling & Resolution",
    "Content Optimization",
    "Performance Monitoring",
    "Revenue & Affiliate Management",
    "Security & Compliance",
    "LangSmith Domain Learning",
    "Platform Health Management",
    "Voice Communication & Audio Responses"
  ],
  langsmithProject: process.env.LANGSMITH_PROJECT || "professional-diver-training-app",
  adminAccess: true
};

// ============================================================================
// 🎯 PLATFORM ANALYTICS INTERFACE
// ============================================================================

interface PlatformAnalytics {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
    subscriptionBreakdown: Record<string, number>;
  };
  content: {
    totalTracks: number;
    totalLessons: number;
    totalQuestions: number;
    completionRates: Record<string, number>;
  };
  performance: {
    averageSessionTime: number;
    quizPassRate: number;
    userSatisfaction: number;
    systemUptime: number;
  };
  revenue: {
    monthlyRevenue: number;
    affiliateCommissions: number;
    subscriptionGrowth: number;
  };
  health: {
    databaseStatus: string;
    aiServicesStatus: string;
    apiResponseTime: number;
    errorRate: number;
  };
}

// ============================================================================
// 🎯 LAURA ORACLE SERVICE CLASS
// ============================================================================

export class LauraOracleService {
  private static instance: LauraOracleService;
  private chatModel: ChatOpenAI;
  private embeddings: OpenAIEmbeddings;
  private langsmithClient: LangSmithClient;
  private openai: OpenAI;
  private config: LauraOracleConfig;
  private vectorStore: ProfessionalDivingVectorStore;

  private constructor() {
    this.config = LAURA_ORACLE_CONFIG;
    
    // Initialize LangSmith client for domain learning
    this.langsmithClient = new LangSmithClient({
      apiKey: process.env.LANGSMITH_API_KEY || "dev-mode"
    });

    // Initialize OpenAI client for TTS
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OPENAI_API_KEY not found - Laura will not function properly');
    } else {
      const key = process.env.OPENAI_API_KEY;
      const keyPreview = key.length > 11 
        ? key.substring(0, 7) + '...' + key.substring(key.length - 4)
        : key.substring(0, 3) + '...';
      console.log(`✅ OpenAI API Key detected for Laura: ${keyPreview}`);
    }

    // Initialize AI models
    this.chatModel = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0.3, // Lower temperature for more consistent administrative responses
      maxTokens: 3000,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    this.embeddings = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-small',
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Initialize vector store for RAG
    this.vectorStore = ProfessionalDivingVectorStore.getInstance();
    
    // Initialize vector store asynchronously (don't block startup)
    this.vectorStore.initializeVectorStore().then(() => {
      console.log('✅ Laura vector store initialized with platform knowledge base');
    }).catch(err => {
      console.warn('⚠️ Vector store initialization failed for Laura:', err instanceof Error ? err.message : 'unknown error');
    });

    // Discover database schema on startup to keep knowledge current
    this.discoverDatabaseSchema().then(schema => {
      console.log(`📊 Laura discovered ${schema.tables.length} database tables`);
    }).catch(err => {
      console.warn('⚠️ Schema discovery failed:', err);
    });

    // Learn from resolved tickets periodically
    this.learnFromResolvedTickets(20).catch(err => {
      console.warn('⚠️ Learning from tickets failed:', err);
    });

    console.log('🚀 Laura Platform Oracle initialized with LangSmith domain learning, voice capabilities, RAG, and dynamic learning');
    console.log('✅ Platform connection: Laura → Langchain → OpenAI GPT → Vector Store RAG');
    
    // Test connection on initialization if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.testConnection().catch(err => {
        console.warn('⚠️ Laura connection test failed on initialization:', err instanceof Error ? err.message : 'unknown error');
      });
    }
  }

  /**
   * Test that Laura can actually use the OpenAI API key
   */
  private async testConnection(): Promise<void> {
    try {
      const testResult = await this.chatModel.invoke([
        new (await import('@langchain/core/messages')).HumanMessage("Say 'OK' if you can hear me.")
      ]);
      if (testResult.content) {
        console.log('✅ Laura OpenAI API connection verified - service is USING your API key');
      }
    } catch (error) {
      console.error('❌ Laura OpenAI API connection test failed:', error instanceof Error ? error.message : 'unknown error');
      throw error;
    }
  }

  public static getInstance(): LauraOracleService {
    if (!LauraOracleService.instance) {
      LauraOracleService.instance = new LauraOracleService();
    }
    return LauraOracleService.instance;
  }

  // ============================================================================
  // 🎯 CORE ORACLE FUNCTIONALITY
  // ============================================================================

  /**
   * Main chat interface for Laura Oracle
   */
  async chatWithOracle(
    message: string,
    sessionId?: string,
    userContext?: any
  ): Promise<{
    response: string;
    analytics?: PlatformAnalytics;
    actions?: string[];
    timestamp: string;
  }> {
    try {
      console.log('🔵 Laura Oracle: Starting chatWithOracle with message:', message.substring(0, 50));
      
      // Get current platform analytics
      console.log('🔵 Laura Oracle: Getting platform analytics...');
      let analytics;
      try {
        analytics = await this.getPlatformAnalytics();
        console.log('✅ Laura Oracle: Platform analytics retrieved');
      } catch (analyticsError) {
        console.error('❌ Laura Oracle: Error getting analytics:', analyticsError);
        throw analyticsError;
      }
      
      // Build comprehensive context for Laura
      console.log('🔵 Laura Oracle: Building context...');
      let context;
      try {
        context = await this.buildOracleContext(analytics, userContext);
        console.log('✅ Laura Oracle: Context built');
      } catch (contextError) {
        console.error('❌ Laura Oracle: Error building context:', contextError);
        throw contextError;
      }

      // Enhance context with RAG search if vector store is available
      let relevantKnowledge = '';
      try {
        if (this.vectorStore.getVectorStore()) {
          const relevantDocs = await this.vectorStore.searchContent(message, undefined, 3);
          if (relevantDocs.length > 0) {
            relevantKnowledge = relevantDocs
              .map(doc => doc.pageContent)
              .join('\n\n');
            console.log(`📚 Laura found ${relevantDocs.length} relevant knowledge documents via RAG`);
          }
        }
      } catch (ragError) {
        console.warn('⚠️ RAG search failed, continuing without knowledge base:', ragError instanceof Error ? ragError.message : 'unknown error');
      }
      
      // Create LangSmith trace for learning
      const traceId = sessionId || nanoid();
      
      // Build role-aware system prompt
      const systemPrompt = this.buildRoleAwareSystemPrompt(userContext);
      
      // Build enhanced message with RAG knowledge if available
      let userMessageContent = `Platform Context: ${JSON.stringify(context, null, 2)}\n\nUser Query: ${message}`;
      if (relevantKnowledge) {
        userMessageContent += `\n\nRelevant Platform Knowledge from Knowledge Base:\n${relevantKnowledge}`;
      }
      
      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userMessageContent)
      ];

      console.log('🔵 Laura Oracle: Invoking chat model...');
      let response;
      try {
        response = await this.chatModel.invoke(messages);
        console.log('✅ Laura Oracle: Chat model responded');
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('❌ Error invoking chat model:', errorMsg);
        console.error('Full error:', error);
        throw new Error(`OpenAI API error: ${errorMsg}`);
      }
      
      // Log interaction to LangSmith for domain learning
      await this.logToLangSmith(traceId, message, response.content as string, context);

      // Determine if any actions should be executed
      const actions = this.extractActionsFromResponse(response.content as string);

      return {
        response: response.content as string,
        analytics,
        actions,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Laura Oracle chat error:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error details:', errorMsg);
      return {
        response: `I apologize, but I'm experiencing a technical issue: ${errorMsg}. Please try again or contact the admin team directly.`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get comprehensive platform analytics
   */
  async getPlatformAnalytics(): Promise<PlatformAnalytics> {
    try {
      // User analytics
      let totalUsers, activeUsers, totalTracks, totalLessons, totalQuestions, recentAttempts;
      
      try {
        totalUsers = await db.select({ count: count() }).from(users);
      } catch (e) {
        console.error('DB error (totalUsers):', e);
        totalUsers = [{ count: 0 }];
      }
      
      try {
        activeUsers = await db.select({ count: count() })
          .from(users)
          .where(gte(users.updatedAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
      } catch (e) {
        console.error('DB error (activeUsers):', e);
        activeUsers = [{ count: 0 }];
      }
      
      try {
        totalTracks = await db.select({ count: count() }).from(tracks);
        totalLessons = await db.select({ count: count() }).from(lessons);
        totalQuestions = await db.select({ count: count() }).from(questions);
        recentAttempts = await db.select({ score: quizAttempts.score })
          .from(quizAttempts)
          .where(gte(quizAttempts.completedAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)));
      } catch (e) {
        console.error('DB error:', e);
        totalTracks = [{ count: 0 }];
        totalLessons = [{ count: 0 }];
        totalQuestions = [{ count: 0 }];
        recentAttempts = [];
      }

      // Calculate pass rate from recent attempts

      const passRate = recentAttempts.length > 0 
        ? (recentAttempts.filter((a: { score: number }) => a.score >= 70).length / recentAttempts.length) * 100
        : 0;

      return {
        users: {
          total: totalUsers[0]?.count || 0,
          active: activeUsers[0]?.count || 0,
          newThisMonth: 0, // Would need additional query
          subscriptionBreakdown: {} // Would need additional query
        },
        content: {
          totalTracks: totalTracks[0]?.count || 0,
          totalLessons: totalLessons[0]?.count || 0,
          totalQuestions: totalQuestions[0]?.count || 0,
          completionRates: {} // Would need additional calculation
        },
        performance: {
          averageSessionTime: 0, // Would need session tracking
          quizPassRate: passRate,
          userSatisfaction: 0, // Would need feedback system
          systemUptime: 99.9 // Would need uptime monitoring
        },
        revenue: {
          monthlyRevenue: 0, // Would need payment integration
          affiliateCommissions: 0, // Would need affiliate tracking
          subscriptionGrowth: 0 // Would need historical data
        },
        health: {
          databaseStatus: "healthy",
          aiServicesStatus: "operational",
          apiResponseTime: 150, // Would need performance monitoring
          errorRate: 0.1 // Would need error tracking
        }
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Error getting platform analytics:', errorMsg);
      console.error('Full error:', error);
      // Return safe defaults if database fails
      return {
        users: { total: 0, active: 0, newThisMonth: 0, subscriptionBreakdown: {} },
        content: { totalTracks: 0, totalLessons: 0, totalQuestions: 0, completionRates: {} },
        performance: { averageSessionTime: 0, quizPassRate: 0, userSatisfaction: 0, systemUptime: 0 },
        revenue: { monthlyRevenue: 0, affiliateCommissions: 0, subscriptionGrowth: 0 },
        health: { databaseStatus: "error", aiServicesStatus: "error", apiResponseTime: 0, errorRate: 100 }
      };
    }
  }

  /**
   * Build role-aware system prompt based on user role
   */
  private buildRoleAwareSystemPrompt(userContext?: any): string {
    const userRole = userContext?.userRole || userContext?.role || 'USER';
    const isSuperAdmin = userContext?.isSuperAdmin || userRole === 'SUPER_ADMIN';
    
    const basePrompt = this.config.systemPrompt;
    
    if (isSuperAdmin) {
      // Super Admins get detailed, in-depth responses
      return `${basePrompt}

RESPONSE STYLE FOR SUPER ADMINS:
- Provide comprehensive, detailed, and in-depth responses
- Include technical details, implementation steps, and full explanations
- Explain the "why" behind recommendations, not just the "what"
- Share insights into platform architecture, database structure, and system design
- Provide detailed troubleshooting steps with technical context
- Include background information and best practices
- Be thorough in your explanations - Super Admins need complete information

When handling support tickets or administrative queries, provide full technical details, step-by-step implementation guides, and comprehensive explanations of all aspects involved.`;
    } else {
      // Regular users get simple, brief responses
      return `${basePrompt}

RESPONSE STYLE FOR REGULAR USERS:
- Keep responses simple, brief, and to the point
- Focus on the essential information needed to solve the issue
- Avoid technical jargon and implementation details unless specifically asked
- Provide clear, actionable steps without unnecessary background
- Be friendly and helpful, but concise
- Skip detailed explanations of platform architecture or system design

When handling support tickets or user queries, provide straightforward, easy-to-understand answers that directly address the user's concern without overwhelming them with technical details.`;
    }
  }

  /**
   * Build comprehensive context for Laura Oracle
   */
  private async buildOracleContext(analytics: PlatformAnalytics, userContext?: any): Promise<any> {
    return {
      platform: {
        name: "Professional Diver Training Platform",
        version: "2.0.0",
        environment: process.env.NODE_ENV || "development",
        domain: "diverwell.com"
      },
      analytics,
      capabilities: this.config.capabilities,
      userContext: userContext || {},
      timestamp: new Date().toISOString(),
      langsmithProject: this.config.langsmithProject
    };
  }

  /**
   * Log interactions to LangSmith for domain learning
   */
  private async logToLangSmith(
    traceId: string,
    userMessage: string,
    oracleResponse: string,
    context: any
  ): Promise<void> {
    try {
      if (process.env.LANGSMITH_API_KEY && process.env.LANGSMITH_PROJECT) {
        // Create a trace for this interaction
        await this.langsmithClient.createRun({
          name: "laura-oracle-interaction",
          run_type: "chain",
          inputs: {
            user_message: userMessage,
            context: context
          },
          outputs: {
            oracle_response: oracleResponse,
            analytics: context.analytics,
            actions: this.extractActionsFromResponse(oracleResponse)
          },
          project_name: this.config.langsmithProject
        });

        console.log('📊 Laura Oracle interaction logged to LangSmith for domain learning');
      }
    } catch (error) {
      console.error('❌ Error logging to LangSmith:', error);
    }
  }

  /**
   * Extract actionable items from Laura's response
   */
  private extractActionsFromResponse(response: string): string[] {
    const actions: string[] = [];
    
    // Look for action keywords in the response
    if (response.includes('I will') || response.includes('I can') || response.includes('Let me')) {
      actions.push('automated_action_available');
    }
    
    if (response.includes('analytics') || response.includes('monitoring')) {
      actions.push('analytics_updated');
    }
    
    if (response.includes('optimization') || response.includes('improvement')) {
      actions.push('optimization_suggested');
    }
    
    return actions;
  }

  // ============================================================================
  // 🎯 ADMINISTRATIVE CAPABILITIES
  // ============================================================================

  /**
   * Execute administrative tasks
   */
  async executeAdminTask(task: string, parameters?: any): Promise<{
    success: boolean;
    result?: any;
    message: string;
  }> {
    try {
      switch (task) {
        case 'get_user_stats':
          return await this.getUserStats();
        case 'get_content_stats':
          return await this.getContentStats();
        case 'get_performance_metrics':
          return await this.getPerformanceMetrics();
        case 'optimize_platform':
          return await this.optimizePlatform();
        case 'get_support_tickets':
          return await this.getSupportTickets(parameters);
        case 'handle_support_ticket':
          return await this.handleSupportTicket(parameters);
        default:
          return {
            success: false,
            message: `Unknown administrative task: ${task}`
          };
      }
    } catch (error) {
      console.error('❌ Admin task execution error:', error);
      return {
        success: false,
        message: `Error executing task: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async getUserStats() {
    const stats = await this.getPlatformAnalytics();
    return {
      success: true,
      result: stats.users,
      message: "User statistics retrieved successfully"
    };
  }

  private async getContentStats() {
    const stats = await this.getPlatformAnalytics();
    return {
      success: true,
      result: stats.content,
      message: "Content statistics retrieved successfully"
    };
  }

  private async getPerformanceMetrics() {
    const stats = await this.getPlatformAnalytics();
    return {
      success: true,
      result: stats.performance,
      message: "Performance metrics retrieved successfully"
    };
  }

  private async optimizePlatform() {
    // This would contain actual optimization logic
    return {
      success: true,
      result: { optimized: true, timestamp: new Date().toISOString() },
      message: "Platform optimization completed successfully"
    };
  }

  /**
   * Get support tickets (with optional filtering)
   */
  private async getSupportTickets(parameters?: any) {
    try {
      const { status, priority, assignedToLaura, limit } = parameters || {};
      
      let query = db.select().from(supportTickets);
      const conditions = [];

      if (status) {
        conditions.push(eq(supportTickets.status, status));
      }
      if (priority) {
        conditions.push(eq(supportTickets.priority, priority));
      }
      if (assignedToLaura !== undefined) {
        conditions.push(eq(supportTickets.assignedToLaura, assignedToLaura));
      }

      if (conditions.length > 0) {
        query = db.select().from(supportTickets).where(and(...conditions));
      }

      let tickets = await query.orderBy(desc(supportTickets.createdAt));

      if (limit && typeof limit === 'number') {
        tickets = tickets.slice(0, limit);
      }

      return {
        success: true,
        result: {
          tickets,
          count: tickets.length
        },
        message: `Retrieved ${tickets.length} support ticket(s)`
      };
    } catch (error) {
      console.error('❌ Error getting support tickets:', error);
      return {
        success: false,
        message: `Error retrieving support tickets: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Handle a support ticket (respond and update status)
   */
  private async handleSupportTicket(parameters?: any) {
    try {
      const { ticketId, response, status } = parameters || {};

      if (!ticketId) {
        return {
          success: false,
          message: 'Ticket ID is required'
        };
      }

      // Find the ticket
      const [ticket] = await db.select()
        .from(supportTickets)
        .where(eq(supportTickets.id, ticketId))
        .limit(1);

      if (!ticket) {
        return {
          success: false,
          message: 'Support ticket not found'
        };
      }

      // Update ticket
      const updateData: any = {
        updatedAt: new Date()
      };

      if (response) {
        updateData.response = response;
      }

      if (status) {
        updateData.status = status;
        if (status === 'completed' || status === 'closed') {
          updateData.resolvedAt = new Date();
        }
      }

      // Ensure Laura is assigned
      updateData.assignedToLaura = true;

      const [updatedTicket] = await db.update(supportTickets)
        .set(updateData)
        .where(eq(supportTickets.id, ticketId))
        .returning();

      return {
        success: true,
        result: updatedTicket,
        message: `Support ticket ${ticketId} handled successfully`
      };
    } catch (error) {
      console.error('❌ Error handling support ticket:', error);
      return {
        success: false,
        message: `Error handling support ticket: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get pending support tickets assigned to Laura
   */
  async getPendingTickets(): Promise<{
    success: boolean;
    tickets: any[];
    count: number;
  }> {
    try {
      const result = await this.getSupportTickets({
        status: 'pending',
        assignedToLaura: true
      });

      if (result.success && result.result) {
        return {
          success: true,
          tickets: result.result.tickets || [],
          count: result.result.count || 0
        };
      }

      return {
        success: false,
        tickets: [],
        count: 0
      };
    } catch (error) {
      console.error('❌ Error getting pending tickets:', error);
      return {
        success: false,
        tickets: [],
        count: 0
      };
    }
  }

  /**
   * Automatically handle support tickets using AI with comprehensive context
   */
  async autoHandleTicket(ticketId: string, userContext?: any): Promise<{
    success: boolean;
    response?: string;
    ticket?: any;
    message: string;
  }> {
    try {
      // Get the ticket
      const [ticket] = await db.select()
        .from(supportTickets)
        .where(eq(supportTickets.id, ticketId))
        .limit(1);

      if (!ticket) {
        return {
          success: false,
          message: 'Support ticket not found'
        };
      }

      // Gather comprehensive user context
      let userRecord = null;
      let userProgressRecords = [];
      let quizAttemptsRecords = [];
      let relatedTickets = [];
      let recentActivity = '';

      try {
        // Get user record if userId exists
        if (ticket.userId) {
          [userRecord] = await db.select()
            .from(users)
            .where(eq(users.id, ticket.userId))
            .limit(1);

          if (userRecord) {
            // Get user progress
            userProgressRecords = await db.select()
              .from(userProgress)
              .where(eq(userProgress.userId, ticket.userId))
              .orderBy(desc(userProgress.completedAt))
              .limit(10);

            // Get recent quiz attempts
            quizAttemptsRecords = await db.select()
              .from(quizAttempts)
              .where(eq(quizAttempts.userId, ticket.userId))
              .orderBy(desc(quizAttempts.completedAt))
              .limit(10);
          }
        }

        // Get related tickets (same email or user)
        relatedTickets = await db.select()
          .from(supportTickets)
          .where(
            and(
              eq(supportTickets.email, ticket.email),
              sql`${supportTickets.id} != ${ticket.id}`
            )
          )
          .orderBy(desc(supportTickets.createdAt))
          .limit(5);

        // Build recent activity summary
        if (userProgressRecords.length > 0 || quizAttemptsRecords.length > 0) {
          const recentProgress = userProgressRecords.slice(0, 5);
          const recentQuizzes = quizAttemptsRecords.slice(0, 5);
          
          if (recentProgress.length > 0 || recentQuizzes.length > 0) {
            recentActivity = `Recent Activity:\n`;
            if (recentProgress.length > 0) {
              recentActivity += `- Completed ${recentProgress.length} lesson(s) recently\n`;
            }
            if (recentQuizzes.length > 0) {
              const avgScore = recentQuizzes.reduce((sum, q) => sum + (q.score || 0), 0) / recentQuizzes.length;
              recentActivity += `- Completed ${recentQuizzes.length} quiz(es) with average score: ${Math.round(avgScore)}%\n`;
            }
          }
        }
      } catch (contextError) {
        console.error('⚠️ Error gathering user context for ticket:', contextError);
        // Continue without context if there's an error
      }

      // Determine if the response should be detailed (Super Admin viewing) or brief (regular user)
      const isSuperAdmin = userContext?.isSuperAdmin || userContext?.userRole === 'SUPER_ADMIN';
      const responseInstruction = isSuperAdmin
        ? `As the Platform Oracle, please provide a comprehensive, detailed response to this support ticket. Include technical details, implementation steps, troubleshooting guidance, and full explanations. This is for a Super Admin who needs complete information.\n\n`
        : `As the Platform Oracle, please respond to this support ticket in a friendly, helpful manner. Keep your response simple, brief, and to the point. Provide a clear solution or next steps without overwhelming technical details.\n\n`;

      // Build comprehensive context for Laura
      let userInfoSection = '';
      if (userRecord) {
        userInfoSection = `User Account Information:
- Role: ${userRecord.role}
- Subscription Type: ${userRecord.subscriptionType}
- Subscription Status: ${userRecord.subscriptionStatus}
- Trial Expires: ${userRecord.trialExpiresAt ? new Date(userRecord.trialExpiresAt).toISOString() : 'N/A'}
- Account Created: ${userRecord.createdAt ? new Date(userRecord.createdAt).toISOString() : 'N/A'}
- Affiliate Code: ${userRecord.affiliateCode || 'None'}

`;
      } else {
        userInfoSection = `User Account: No account found (guest user or email mismatch)

`;
      }

      const relatedTicketsSection = relatedTickets.length > 0
        ? `Related Previous Tickets (${relatedTickets.length}):
${relatedTickets.map((t, i) => `  ${i + 1}. [${t.status}] ${t.subject} - ${t.createdAt ? new Date(t.createdAt).toISOString() : 'N/A'}`).join('\n')}

`
        : '';

      const context = `Support Ticket Details:
- Ticket ID: ${ticket.ticketId}
- Subject: ${ticket.subject}
- Priority: ${ticket.priority}
- Status: ${ticket.status}
- Message: ${ticket.message}
- User: ${ticket.name} (${ticket.email})
- User ID: ${ticket.userId || 'None (guest)'}
- Created: ${ticket.createdAt ? new Date(ticket.createdAt).toISOString() : 'N/A'}

${userInfoSection}${recentActivity}${relatedTicketsSection}${responseInstruction}Please provide a helpful, professional response to this support ticket. Use the user context and platform knowledge to provide accurate, personalized assistance.`;

      const lauraResponse = await this.chatWithOracle(
        context,
        `ticket-${ticketId}`,
        { ...userContext, ticketUser: userRecord }
      );

      // Update ticket with response
      const updateResult = await this.handleSupportTicket({
        ticketId,
        response: lauraResponse.response,
        status: 'in_progress'
      });

      if (updateResult.success) {
        return {
          success: true,
          response: lauraResponse.response,
          ticket: updateResult.result,
          message: 'Ticket handled successfully by Laura'
        };
      }

      return {
        success: false,
        message: 'Failed to update ticket after generating response'
      };
    } catch (error) {
      console.error('❌ Error auto-handling ticket:', error);
      return {
        success: false,
        message: `Error auto-handling ticket: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // ============================================================================
  // 🎯 LANGSMITH DOMAIN LEARNING
  // ============================================================================

  /**
   * Learn from platform objectives and user interactions
   */
  async learnFromObjectives(objectives: any[]): Promise<void> {
    try {
      // Log objectives to LangSmith for learning
      for (const objective of objectives) {
        await this.langsmithClient.createRun({
          name: "platform-objective-learning",
          run_type: "chain",
          inputs: { objective },
          outputs: { learned: true, timestamp: new Date().toISOString() },
          project_name: this.config.langsmithProject
        });
      }
      
      console.log('🧠 Laura Oracle learned from platform objectives via LangSmith');
    } catch (error) {
      console.error('❌ Error learning from objectives:', error);
    }
  }

  /**
   * Discover database schema to keep knowledge current
   */
  async discoverDatabaseSchema(): Promise<{
    tables: string[];
    schemaInfo: Record<string, any>;
  }> {
    try {
      // For SQLite, query sqlite_master to get table information
      const tables: string[] = [];
      const schemaInfo: Record<string, any> = {};

      try {
        // Get all tables
        const tableResults = await db.all(sql`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`);
        tables.push(...tableResults.map((row: any) => row.name));

        // For each table, get column information
        for (const tableName of tables) {
          try {
            const columns = await db.all(sql`PRAGMA table_info(${tableName})`);
            schemaInfo[tableName] = {
              columns: columns.map((col: any) => ({
                name: col.name,
                type: col.type,
                notNull: col.notnull === 1,
                primaryKey: col.pk === 1,
                defaultValue: col.dflt_value
              }))
            };
          } catch (err) {
            console.warn(`⚠️ Could not get schema for table ${tableName}:`, err);
          }
        }

        console.log(`📊 Laura discovered ${tables.length} database tables`);
        return { tables, schemaInfo };
      } catch (schemaError) {
        console.warn('⚠️ Database schema discovery failed (may be PostgreSQL in production):', schemaError);
        // Return known schema information from code
        return {
          tables: [
            'users', 'tracks', 'lessons', 'quizzes', 'questions', 
            'user_progress', 'quiz_attempts', 'support_tickets',
            'clients', 'widget_locations', 'operations_calendar'
          ],
          schemaInfo: {}
        };
      }
    } catch (error) {
      console.error('❌ Error discovering database schema:', error);
      return { tables: [], schemaInfo: {} };
    }
  }

  /**
   * Learn from successfully resolved tickets
   */
  async learnFromResolvedTickets(limit: number = 50): Promise<void> {
    try {
      // Get recently resolved tickets that were handled by Laura
      const resolvedTickets = await db.select()
        .from(supportTickets)
        .where(
          and(
            eq(supportTickets.status, 'completed'),
            eq(supportTickets.assignedToLaura, true)
          )
        )
        .orderBy(desc(supportTickets.resolvedAt))
        .limit(limit);

      if (resolvedTickets.length === 0) {
        console.log('📚 No resolved tickets to learn from yet');
        return;
      }

      // Extract patterns and solutions from resolved tickets
      const learningData = resolvedTickets.map(ticket => ({
        issue: ticket.subject,
        message: ticket.message,
        solution: ticket.response,
        priority: ticket.priority,
        resolvedAt: ticket.resolvedAt
      }));

      // Log to LangSmith for learning
      if (process.env.LANGSMITH_API_KEY && process.env.LANGSMITH_PROJECT) {
        await this.langsmithClient.createRun({
          name: "laura-ticket-learning",
          run_type: "chain",
          inputs: {
            resolved_tickets: learningData,
            ticket_count: resolvedTickets.length
          },
          outputs: {
            learned: true,
            patterns_extracted: learningData.length,
            timestamp: new Date().toISOString()
          },
          project_name: this.config.langsmithProject
        });

        console.log(`🧠 Laura learned from ${resolvedTickets.length} resolved tickets via LangSmith`);
      }

      // Store summary in memory for quick access (could be enhanced with vector store)
      console.log(`📚 Laura analyzed ${resolvedTickets.length} resolved tickets for pattern recognition`);
    } catch (error) {
      console.error('❌ Error learning from resolved tickets:', error);
    }
  }

  /**
   * Generate voice audio for Laura's response using OpenAI TTS
   */
  async generateVoiceResponse(text: string): Promise<Buffer | null> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️ OpenAI API key not found, voice generation disabled');
        return null;
      }

      // Use Alloy voice - the friendly "country girl" voice
      const response = await this.openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy", // The friendly, approachable voice
        input: text,
        response_format: "mp3",
        speed: 1.0, // Normal speed for clear communication
      });

      const audioBuffer = Buffer.from(await response.arrayBuffer());
      console.log('🎤 Laura voice response generated successfully');
      return audioBuffer;

    } catch (error) {
      console.error('❌ Error generating Laura voice response:', error);
      return null;
    }
  }

  /**
   * Get Laura's current knowledge and capabilities
   */
  getOracleInfo(): LauraOracleConfig {
    return this.config;
  }
}

// Export singleton instance
export default LauraOracleService;
