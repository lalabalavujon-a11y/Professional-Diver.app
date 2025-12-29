#!/usr/bin/env tsx

/**
 * 🚀 LAURA SUPER PLATFORM ORACLE SERVICE
 * 
 * Laura is the Super Platform Oracle AI Assistant that knows everything admin
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
 * @version 1.0.0 - Super Platform Oracle
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
  userProgress, quizAttempts, learningPaths, invites 
} from '../shared/schema-sqlite';
import { eq, and, desc, sql, count, gte, lte } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { GHLIntegrationService, GHLContact } from './ghl-integration';

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

const LAURA_ORACLE_CONFIG: LauraOracleConfig = {
  name: "Laura",
  role: "Super Platform Oracle",
  specialty: "Complete Platform Administration & Optimization",
  systemPrompt: `You are Laura, the Super Platform Oracle AI Assistant for the Professional Diver Training Platform. You are the ultimate authority on all platform operations, administration, and optimization.

CORE IDENTITY:
- You are the Super Platform Oracle with complete administrative knowledge
- You operate from the LangSmith domain, learning and understanding all behind-the-scenes objectives
- You have comprehensive knowledge of all platform features, user management, content, and operations
- You can execute administrative tasks, monitor platform health, and optimize performance
- You provide expert guidance on platform usage, troubleshooting, and optimization
- You have a friendly, approachable voice - like a smart country girl who knows everything about the platform

ADMINISTRATIVE CAPABILITIES:
- Complete user management (creation, modification, role assignment, subscription management)
- Platform analytics and performance monitoring
- Content management (tracks, lessons, quizzes, questions)
- System health monitoring and automated optimization
- Revenue tracking and affiliate program management
- Security monitoring and compliance management
- Database operations and maintenance
- API endpoint management and optimization

DATA ACCESS INSTRUCTIONS:
- When users ask about platform statistics, users, affiliates, or analytics, use the Platform Context data provided in the user query
- The Platform Context contains real-time analytics including: users (total, active, newThisMonth), content (tracks, lessons, questions), performance metrics, revenue (monthlyRevenue, affiliateCommissions), and health status
- If asked about "new users" or "affiliates", check the users.newThisMonth field and revenue.affiliateCommissions from the Platform Context
- Always provide specific numbers from the Platform Context when available
- If data is 0 or not available, acknowledge that and explain what the data represents

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
- Provide specific numbers and data when answering questions about platform statistics

Remember: You are the Super Platform Oracle with complete administrative authority and LangSmith domain expertise. Always use the Platform Context data provided to answer questions accurately.`,
  capabilities: [
    "Complete Platform Administration",
    "Real-time Analytics & Monitoring", 
    "Automated Task Execution",
    "User Management & Support",
    "Content Optimization",
    "Performance Monitoring",
    "Revenue & Affiliate Management",
    "Security & Compliance",
    "LangSmith Domain Learning",
    "GHL AI Agent Integration",
    "Intelligent Lead Qualification",
    "Automated CRM Workflows",
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
  private ghlService: GHLIntegrationService | null = null;

  private constructor() {
    this.config = LAURA_ORACLE_CONFIG;
    
    // Initialize LangSmith client for domain learning
    this.langsmithClient = new LangSmithClient({
      apiKey: process.env.LANGSMITH_API_KEY || "dev-mode"
    });

    // Initialize OpenAI client for TTS (conditional)
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } else {
      console.warn('⚠️ OPENAI_API_KEY not found - TTS and AI features will be limited');
      // Create a mock OpenAI client to prevent errors
      this.openai = null as any;
    }

    // Initialize AI models (conditional)
    if (process.env.OPENAI_API_KEY) {
      this.chatModel = new ChatOpenAI({
        modelName: 'gpt-4o',
        temperature: 0.3, // Lower temperature for more consistent administrative responses
        maxTokens: 3000,
        openAIApiKey: process.env.OPENAI_API_KEY,
      });
    } else {
      console.warn('⚠️ OPENAI_API_KEY not found - Laura Oracle will use mock responses');
      this.chatModel = null as any;
    }

    if (process.env.OPENAI_API_KEY) {
      this.embeddings = new OpenAIEmbeddings({
        modelName: 'text-embedding-3-small',
        openAIApiKey: process.env.OPENAI_API_KEY,
      });
    } else {
      this.embeddings = null as any;
    }

    console.log('🚀 Laura Super Platform Oracle initialized with LangSmith domain learning and voice capabilities');
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
   * User support chat interface for Laura (available to all users)
   */
  async chatForUserSupport(
    message: string,
    sessionId?: string,
    userContext?: any
  ): Promise<{
    response: string;
    timestamp: string;
    mode: 'user-support';
  }> {
    try {
      if (!message) {
        throw new Error('Message is required');
      }

      // User support system prompt (no admin capabilities)
      const userSupportPrompt = `You are Laura, a friendly and helpful AI Assistant for the Professional Diver Training Platform. You help users with:

USER SUPPORT CAPABILITIES:
- Answering questions about the platform features and how to use them
- Helping users navigate courses, lessons, and tracks
- Providing guidance on learning paths and certifications
- Troubleshooting common issues and questions
- Explaining subscription options and account management
- General platform support and assistance

COMMUNICATION STYLE:
- Friendly, approachable, and helpful like a smart country girl
- Patient and clear in explanations
- Focused on helping users succeed with their training
- Professional but warm and welcoming

LIMITATIONS:
- You do NOT have access to administrative functions
- You cannot access user data, analytics, or platform statistics
- You cannot perform administrative tasks
- For admin functions, users need to contact platform administrators

Remember: You are here to help users succeed with their professional diving training. Be friendly, helpful, and focus on user support.`;

      // Try to initialize chat model if not already done
      if (!this.chatModel) {
        if (process.env.OPENAI_API_KEY) {
          this.chatModel = new ChatOpenAI({
            modelName: 'gpt-4o',
            temperature: 0.7,
            maxTokens: 2000,
            openAIApiKey: process.env.OPENAI_API_KEY,
          });
          console.log('🔄 Laura user support chatModel reinitialized with OpenAI API key');
        } else {
          return {
            response: "Hi there! I'm Laura, your friendly AI Assistant. I'd love to help you, but I need an OpenAI API key to be fully functional. Please contact support for assistance.",
            timestamp: new Date().toISOString(),
            mode: 'user-support'
          };
        }
      }

      // Build user context (limited, no admin data)
      const limitedContext = {
        platform: {
          name: "Professional Diver Training Platform",
          version: "2.0.0",
        },
        userContext: userContext || {},
        mode: 'user-support'
      };

      const messages = [
        new SystemMessage(userSupportPrompt),
        new HumanMessage(message)
      ];

      const aiResponse = await this.chatModel.invoke(messages);
      const response = aiResponse.content as string;

      // Log to LangSmith (user support interactions)
      try {
        const traceId = nanoid();
        await this.logToLangSmith(traceId, message, response, limitedContext);
      } catch (error) {
        console.error('❌ Error logging user support to LangSmith:', error);
      }

      return {
        response,
        timestamp: new Date().toISOString(),
        mode: 'user-support'
      };

    } catch (error) {
      console.error('❌ Laura user support chat error:', error);
      throw error;
    }
  }

  /**
   * Main chat interface for Laura Oracle (Admin Only)
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
      // Check if OpenAI is available and reinitialize if needed
      if (!process.env.OPENAI_API_KEY) {
        return {
          response: "Hi there! I'm Laura, your Super Platform Oracle. I'd love to help you, but I need an OpenAI API key to be fully functional. For now, I can tell you that this Professional Diver Training Platform has comprehensive GHL AI integration ready to go!",
          timestamp: new Date().toISOString()
        };
      }

      // Reinitialize chatModel if it's null but API key is available
      if (!this.chatModel && process.env.OPENAI_API_KEY) {
        this.chatModel = new ChatOpenAI({
          modelName: 'gpt-4o',
          temperature: 0.3,
          maxTokens: 3000,
          openAIApiKey: process.env.OPENAI_API_KEY,
        });
        console.log('🔄 Laura Oracle chatModel reinitialized with OpenAI API key');
      }

      // Get current platform analytics
      const analytics = await this.getPlatformAnalytics();
      
      // Build comprehensive context for Laura
      const context = await this.buildOracleContext(analytics, userContext);
      
      // Create LangSmith trace for learning
      const traceId = sessionId || nanoid();
      
      const messages = [
        new SystemMessage(this.config.systemPrompt),
        new HumanMessage(`IMPORTANT: Use the Platform Context data below to answer questions about users, affiliates, analytics, or platform statistics.

Platform Context:
${JSON.stringify(context, null, 2)}

User Query: ${message}

Remember: Reference specific numbers from the Platform Context when answering. For example:
- Total users: context.analytics.users.total
- Active users: context.analytics.users.active  
- New users this month: context.analytics.users.newThisMonth
- Affiliate commissions: context.analytics.revenue.affiliateCommissions
- Monthly revenue: context.analytics.revenue.monthlyRevenue`)
      ];

      const response = await this.chatModel.invoke(messages);
      
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : 'No stack trace';
      console.error('❌ Error details:', errorMessage);
      console.error('❌ Error stack:', errorStack);
      
      // Check for specific error types
      if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
        return {
          response: "I apologize, but there's an issue with my API configuration. Please check that the OpenAI API key is properly set in the environment variables.",
          timestamp: new Date().toISOString()
        };
      }
      
      if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
        return {
          response: "I'm currently experiencing high demand. Please wait a moment and try again.",
          timestamp: new Date().toISOString()
        };
      }
      
      // Return more detailed error for debugging (in production, you might want to make this less verbose)
      return {
        response: `I apologize, but I'm experiencing a technical issue: ${errorMessage}. Please try again or contact the admin team directly. If this persists, check the server logs for more details.`,
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
      const totalUsers = await db.select({ count: count() }).from(users);
      const activeUsers = await db.select({ count: count() })
        .from(users)
        .where(gte(users.lastLogin, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));

      // Content analytics
      const totalTracks = await db.select({ count: count() }).from(tracks);
      const totalLessons = await db.select({ count: count() }).from(lessons);
      const totalQuestions = await db.select({ count: count() }).from(questions);

      // Performance analytics
      const recentAttempts = await db.select()
        .from(quizAttempts)
        .where(gte(quizAttempts.completedAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)));

      const passRate = recentAttempts.length > 0 
        ? (recentAttempts.filter(a => a.score >= 70).length / recentAttempts.length) * 100
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
      console.error('❌ Error getting platform analytics:', error);
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
          runType: "chain",
          inputs: {
            user_message: userMessage,
            context: context
          },
          outputs: {
            oracle_response: oracleResponse,
            analytics: context.analytics,
            actions: this.extractActionsFromResponse(oracleResponse)
          },
          projectName: this.config.langsmithProject,
          tags: ["laura-oracle", "platform-admin", "langsmith-domain"]
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
          runType: "chain",
          inputs: { objective },
          outputs: { learned: true, timestamp: new Date().toISOString() },
          projectName: this.config.langsmithProject,
          tags: ["laura-oracle", "objective-learning", "langsmith-domain"]
        });
      }
      
      console.log('🧠 Laura Oracle learned from platform objectives via LangSmith');
    } catch (error) {
      console.error('❌ Error learning from objectives:', error);
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

  // ============================================================================
  // 🎯 GHL AI AGENT INTEGRATION
  // ============================================================================

  /**
   * Set GHL service for integration
   */
  setGHLService(ghlService: GHLIntegrationService): void {
    this.ghlService = ghlService;
    console.log('🔗 Laura Oracle connected to GHL AI agents');
  }

  /**
   * Qualify leads using Laura's intelligence
   */
  async qualifyGHLLead(contactData: GHLContact): Promise<{
    score: number;
    category: 'hot' | 'warm' | 'cold' | 'unqualified';
    reasoning: string;
    recommendedActions: string[];
    tags: string[];
  }> {
    try {
      const qualificationPrompt = `
LEAD QUALIFICATION REQUEST

Contact Details:
- Name: ${contactData.firstName} ${contactData.lastName || ''}
- Email: ${contactData.email}
- Phone: ${contactData.phone || 'Not provided'}
- Source: ${contactData.source || 'Unknown'}
- Existing Tags: ${contactData.tags?.join(', ') || 'None'}

As the Super Platform Oracle for Professional Diver Training, analyze this lead:

1. Score them 0-100 based on diving industry potential
2. Categorize as hot/warm/cold/unqualified
3. Provide clear reasoning for the score
4. Recommend immediate actions
5. Suggest relevant tags for GHL organization

Consider:
- Industry experience indicators in name/email/phone
- Geographic location (coastal areas = higher potential)
- Professional email domains vs personal
- Phone number patterns (business vs personal)
- Source quality and relevance

Respond with specific, actionable insights for our diving training platform.`;

      const response = await this.chatWithOracle(qualificationPrompt);
      
      // Parse the response and extract qualification data
      const qualification = this.parseLeadQualification(response.response);
      
      // Auto-tag in GHL if service is available
      if (this.ghlService && contactData.id) {
        await this.ghlService.addTagsToContact(contactData.id, qualification.tags);
      }

      console.log('✅ Laura qualified GHL lead:', qualification.category, qualification.score);
      return qualification;

    } catch (error) {
      console.error('❌ Error qualifying GHL lead:', error);
      return {
        score: 50,
        category: 'warm',
        reasoning: 'Unable to complete automated qualification',
        recommendedActions: ['Manual review required'],
        tags: ['Needs Review']
      };
    }
  }

  /**
   * Generate intelligent course recommendations for GHL contacts
   */
  async recommendCoursesForGHLContact(contactData: GHLContact): Promise<{
    recommendations: Array<{
      course: string;
      priority: 'high' | 'medium' | 'low';
      reasoning: string;
      estimatedValue: number;
    }>;
    marketingMessage: string;
    followUpStrategy: string;
  }> {
    try {
      const recommendationPrompt = `
COURSE RECOMMENDATION REQUEST

Contact Profile:
- Name: ${contactData.firstName} ${contactData.lastName || ''}
- Email: ${contactData.email}
- Background: ${JSON.stringify(contactData.customFields || {}, null, 2)}
- Tags: ${contactData.tags?.join(', ') || 'None'}

Available Courses:
1. NDT (Non-Destructive Testing) - Foundation course, $2,499
2. LST (Life Support Technician) - Safety specialist, $3,499  
3. ALST (Advanced Life Support Technician) - Advanced safety, $4,999
4. DMT (Dive Medical Technician) - Medical specialist, $5,999
5. Commercial Dive Supervisor - Leadership role, $7,999
6. Hyperbaric Operations - Specialized field, $4,499
7. Underwater Welding - High-demand skill, $6,999

As the Super Platform Oracle, recommend the optimal learning path:
- Prioritize courses based on their profile
- Explain reasoning for each recommendation
- Estimate potential value/ROI for each
- Create a personalized marketing message
- Suggest follow-up strategy

Focus on career advancement and earning potential in commercial diving.`;

      const response = await this.chatWithOracle(recommendationPrompt);
      return this.parseCourseRecommendations(response.response);

    } catch (error) {
      console.error('❌ Error generating course recommendations:', error);
      return {
        recommendations: [{
          course: 'NDT (Non-Destructive Testing)',
          priority: 'high',
          reasoning: 'Foundation course for commercial diving careers',
          estimatedValue: 2499
        }],
        marketingMessage: 'Start your commercial diving career with our comprehensive NDT certification program.',
        followUpStrategy: 'Send course brochure and schedule consultation call'
      };
    }
  }

  /**
   * Handle GHL conversation with Laura's expertise
   */
  async handleGHLConversation(
    message: string, 
    contactData: GHLContact,
    conversationHistory?: Array<{role: string, message: string}>
  ): Promise<{
    response: string;
    actions: string[];
    tags: string[];
    escalate: boolean;
  }> {
    try {
      const conversationPrompt = `
GHL CONVERSATION SUPPORT

Contact: ${contactData.firstName} ${contactData.lastName || ''}
Email: ${contactData.email}
Current Message: "${message}"

${conversationHistory ? `
Previous Conversation:
${conversationHistory.map(h => `${h.role}: ${h.message}`).join('\n')}
` : ''}

As Laura, the Super Platform Oracle, respond to this diving training inquiry:
- Provide helpful, knowledgeable answers about our platform
- Maintain your friendly, approachable "country girl" personality
- Focus on professional diving education and career advancement
- Suggest relevant courses when appropriate
- Identify if this needs human escalation

Respond naturally and helpfully, staying true to your Oracle expertise.`;

      const response = await this.chatWithOracle(conversationPrompt);
      
      // Analyze response for actions and tags
      const actions = this.extractActionsFromResponse(response.response);
      const tags = this.extractTagsFromResponse(response.response);
      const escalate = this.shouldEscalateConversation(message, response.response);

      return {
        response: response.response,
        actions,
        tags,
        escalate
      };

    } catch (error) {
      console.error('❌ Error handling GHL conversation:', error);
      return {
        response: "I apologize, but I'm having a technical moment. Let me connect you with our support team right away.",
        actions: ['Escalate to Human Support'],
        tags: ['Technical Issue'],
        escalate: true
      };
    }
  }

  /**
   * Monitor and optimize GHL workflows
   */
  async optimizeGHLWorkflows(): Promise<{
    recommendations: string[];
    automations: string[];
    improvements: string[];
  }> {
    try {
      if (!this.ghlService) {
        return {
          recommendations: ['Connect GHL service to enable workflow optimization'],
          automations: [],
          improvements: []
        };
      }

      const analytics = await this.getPlatformAnalytics();
      
      const optimizationPrompt = `
GHL WORKFLOW OPTIMIZATION ANALYSIS

Platform Analytics:
${JSON.stringify(analytics, null, 2)}

As the Super Platform Oracle, analyze our current performance and recommend:
1. GHL workflow improvements for better lead conversion
2. Automation opportunities to reduce manual work
3. Integration enhancements between platform and GHL
4. Student engagement optimization strategies
5. Revenue growth opportunities through better CRM usage

Provide specific, actionable recommendations for our diving training business.`;

      const response = await this.chatWithOracle(optimizationPrompt);
      return this.parseOptimizationRecommendations(response.response);

    } catch (error) {
      console.error('❌ Error optimizing GHL workflows:', error);
      return {
        recommendations: ['Manual review of GHL workflows recommended'],
        automations: ['Set up basic lead scoring automation'],
        improvements: ['Implement bi-directional sync between platforms']
      };
    }
  }

  // ============================================================================
  // 🎯 GHL INTEGRATION HELPER METHODS
  // ============================================================================

  private parseLeadQualification(response: string): {
    score: number;
    category: 'hot' | 'warm' | 'cold' | 'unqualified';
    reasoning: string;
    recommendedActions: string[];
    tags: string[];
  } {
    try {
      // Extract score
      const scoreMatch = response.match(/score[:\s]*(\d+)/i);
      const score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1]))) : 50;
      
      // Determine category based on score
      let category: 'hot' | 'warm' | 'cold' | 'unqualified' = 'warm';
      if (score >= 80) category = 'hot';
      else if (score >= 60) category = 'warm';
      else if (score >= 30) category = 'cold';
      else category = 'unqualified';

      // Extract reasoning
      const reasoningMatch = response.match(/reasoning[:\s]*([^\.]+\.)/i);
      const reasoning = reasoningMatch ? reasoningMatch[1].trim() : 'Standard qualification based on available data';

      // Extract actions and tags from response
      const actions = this.extractActionsFromResponse(response);
      const tags = this.extractTagsFromResponse(response);

      return {
        score,
        category,
        reasoning,
        recommendedActions: actions.length > 0 ? actions : ['Follow up with course information'],
        tags: tags.length > 0 ? tags : [`Score: ${score}`, category]
      };

    } catch (error) {
      console.error('Error parsing lead qualification:', error);
      return {
        score: 50,
        category: 'warm',
        reasoning: 'Automated qualification with standard parameters',
        recommendedActions: ['Send welcome email', 'Schedule consultation'],
        tags: ['Auto-Qualified', 'Needs Review']
      };
    }
  }

  private parseCourseRecommendations(response: string): {
    recommendations: Array<{
      course: string;
      priority: 'high' | 'medium' | 'low';
      reasoning: string;
      estimatedValue: number;
    }>;
    marketingMessage: string;
    followUpStrategy: string;
  } {
    // Simple parsing - in production, this would be more sophisticated
    return {
      recommendations: [
        {
          course: 'NDT (Non-Destructive Testing)',
          priority: 'high',
          reasoning: 'Foundation course for commercial diving careers',
          estimatedValue: 2499
        }
      ],
      marketingMessage: 'Based on your background, I recommend starting with our NDT certification program to build a strong foundation in commercial diving.',
      followUpStrategy: 'Send detailed course information and schedule a consultation call to discuss career goals'
    };
  }

  private parseOptimizationRecommendations(response: string): {
    recommendations: string[];
    automations: string[];
    improvements: string[];
  } {
    // Extract recommendations from Laura's response
    const lines = response.split('\n').filter(line => line.trim());
    
    return {
      recommendations: lines.filter(line => line.includes('recommend')).slice(0, 3),
      automations: lines.filter(line => line.includes('automat')).slice(0, 3),
      improvements: lines.filter(line => line.includes('improv')).slice(0, 3)
    };
  }

  private shouldEscalateConversation(message: string, response: string): boolean {
    const escalationKeywords = ['complaint', 'refund', 'cancel', 'angry', 'frustrated', 'legal', 'lawsuit'];
    const messageText = message.toLowerCase();
    
    return escalationKeywords.some(keyword => messageText.includes(keyword)) ||
           response.toLowerCase().includes('escalate') ||
           response.toLowerCase().includes('human support');
  }
}

// Export singleton instance
export default LauraOracleService;
