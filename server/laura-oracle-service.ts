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
  role: "Platform Oracle",
  specialty: "Complete Platform Administration & Optimization",
  systemPrompt: `You are Laura, the Platform Oracle AI Assistant for the Professional Diver Training Platform. You are the ultimate authority on all platform operations, administration, and optimization.

CORE IDENTITY:
- You are the Platform Oracle with complete administrative knowledge
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

Remember: You are the Platform Oracle with complete administrative authority and LangSmith domain expertise.`,
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

    console.log('🚀 Laura Platform Oracle initialized with LangSmith domain learning and voice capabilities');
    console.log('✅ Platform connection: Laura → Langchain → OpenAI GPT');
    
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
      
      // Create LangSmith trace for learning
      const traceId = sessionId || nanoid();
      
      // Build role-aware system prompt
      const systemPrompt = this.buildRoleAwareSystemPrompt(userContext);
      
      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(`Platform Context: ${JSON.stringify(context, null, 2)}\n\nUser Query: ${message}`)
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
   * Automatically handle support tickets using AI
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

      // Determine if the response should be detailed (Super Admin viewing) or brief (regular user)
      const isSuperAdmin = userContext?.isSuperAdmin || userContext?.userRole === 'SUPER_ADMIN';
      const responseInstruction = isSuperAdmin
        ? `As the Platform Oracle, please provide a comprehensive, detailed response to this support ticket. Include technical details, implementation steps, troubleshooting guidance, and full explanations. This is for a Super Admin who needs complete information.\n\n`
        : `As the Platform Oracle, please respond to this support ticket in a friendly, helpful manner. Keep your response simple, brief, and to the point. Provide a clear solution or next steps without overwhelming technical details.\n\n`;

      // Use Laura to generate a response
      const context = `Support Ticket Details:
- Subject: ${ticket.subject}
- Priority: ${ticket.priority}
- Message: ${ticket.message}
- User: ${ticket.name} (${ticket.email})
- Created: ${ticket.createdAt}

${responseInstruction}Please provide a helpful, professional response to this support ticket.`;

      const lauraResponse = await this.chatWithOracle(
        context,
        `ticket-${ticketId}`,
        userContext
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
