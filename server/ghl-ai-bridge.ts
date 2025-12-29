/**
 * 🤖 GHL AI Agent Bridge Service
 * 
 * Connects LangChain AI agents with GoHighLevel AI agents for seamless
 * bi-directional communication and intelligent automation workflows.
 * 
 * Features:
 * - Laura Oracle integration with GHL AI agents
 * - Intelligent lead qualification and scoring
 * - Automated course recommendations
 * - Real-time student support bridging
 * - Bi-directional conversation handling
 * 
 * @author AI Assistant
 * @version 1.0.0 - GHL AI Bridge
 * @date 2025
 */

import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { LauraOracleService } from './laura-oracle-service';
import { GHLIntegrationService, GHLContact, GHLOpportunity } from './ghl-integration';
import { DivingTutorManager } from './ai-tutors';
import { db } from './db';
import { users, userProgress, tracks, lessons } from '../shared/schema-sqlite';
import { eq, and, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// ============================================================================
// 🎯 INTERFACES AND TYPES
// ============================================================================

export interface LeadQualification {
  score: number; // 0-100
  category: 'hot' | 'warm' | 'cold' | 'unqualified';
  recommendedCourses: string[];
  followUpStrategy: string;
  estimatedValue: number;
  tags: string[];
  nextActions: string[];
  reasoning: string;
}

export interface StudentContext {
  userId: string;
  email: string;
  currentCourses: string[];
  completedCourses: string[];
  progressPercentage: number;
  lastActivity: string;
  subscriptionType: string;
  engagementLevel: 'high' | 'medium' | 'low';
  riskLevel: 'none' | 'low' | 'medium' | 'high';
}

export interface AIConversationContext {
  contactId: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    message: string;
    timestamp: string;
  }>;
  studentContext?: StudentContext;
  currentTopic?: string;
  intent?: string;
}

export interface GHLAIResponse {
  message: string;
  actions: string[];
  tags: string[];
  followUp?: {
    delay: number; // minutes
    message: string;
  };
  escalate?: boolean;
  updateOpportunity?: Partial<GHLOpportunity>;
}

// ============================================================================
// 🎯 GHL AI AGENT BRIDGE SERVICE
// ============================================================================

export class GHLAIBridgeService {
  private static instance: GHLAIBridgeService;
  private lauraOracle: LauraOracleService;
  private ghlService: GHLIntegrationService | null;
  private tutorManager: DivingTutorManager;
  private chatModel: ChatOpenAI;

  private constructor() {
    this.lauraOracle = LauraOracleService.getInstance();
    this.ghlService = null; // Will be injected
    this.tutorManager = DivingTutorManager.getInstance();
    
    if (process.env.OPENAI_API_KEY) {
      this.chatModel = new ChatOpenAI({
        modelName: 'gpt-4o',
        temperature: 0.4,
        maxTokens: 2000,
        openAIApiKey: process.env.OPENAI_API_KEY,
      });
    } else {
      console.warn('⚠️ OPENAI_API_KEY not found - GHL AI Bridge will use mock responses');
      this.chatModel = null as any;
    }

    console.log('🤖 GHL AI Bridge Service initialized');
  }

  public static getInstance(): GHLAIBridgeService {
    if (!GHLAIBridgeService.instance) {
      GHLAIBridgeService.instance = new GHLAIBridgeService();
    }
    return GHLAIBridgeService.instance;
  }

  public setGHLService(ghlService: GHLIntegrationService): void {
    this.ghlService = ghlService;
  }

  // ============================================================================
  // 🎯 LEAD QUALIFICATION WITH AI
  // ============================================================================

  /**
   * Qualify leads using Laura Oracle's intelligence
   */
  async qualifyLeadWithLaura(contactData: GHLContact): Promise<LeadQualification> {
    try {
      // Check if AI is available and reinitialize if needed
      if (!process.env.OPENAI_API_KEY) {
        return this.getMockQualification(contactData);
      }

      // Reinitialize chatModel if it's null but API key is available
      if (!this.chatModel && process.env.OPENAI_API_KEY) {
        this.chatModel = new ChatOpenAI({
          modelName: 'gpt-4o',
          temperature: 0.4,
          maxTokens: 2000,
          openAIApiKey: process.env.OPENAI_API_KEY,
        });
        console.log('🔄 GHL AI Bridge chatModel reinitialized with OpenAI API key');
      }

      const qualificationPrompt = `
LEAD QUALIFICATION ANALYSIS

Contact Information:
- Name: ${contactData.firstName} ${contactData.lastName || ''}
- Email: ${contactData.email}
- Phone: ${contactData.phone || 'Not provided'}
- Source: ${contactData.source || 'Unknown'}
- Tags: ${contactData.tags?.join(', ') || 'None'}
- Custom Fields: ${JSON.stringify(contactData.customFields || {}, null, 2)}

As the Super Platform Oracle for Professional Diver Training, analyze this lead and provide:

1. QUALIFICATION SCORE (0-100): Based on diving industry indicators
2. CATEGORY: hot/warm/cold/unqualified
3. RECOMMENDED COURSES: Specific diving courses they should take
4. FOLLOW-UP STRATEGY: Detailed approach for engagement
5. ESTIMATED VALUE: Potential lifetime value in USD
6. TAGS: Relevant tags for GHL organization
7. NEXT ACTIONS: Immediate steps to take
8. REASONING: Why you scored them this way

Consider factors like:
- Industry experience indicators
- Geographic location (diving opportunities)
- Communication responsiveness
- Budget indicators
- Career stage and goals
- Safety compliance awareness

Respond in JSON format with all fields populated.`;

      const response = await this.lauraOracle.chatWithOracle(qualificationPrompt);
      
      // Parse Laura's response and structure it
      const qualification = this.parseQualificationResponse(response.response);
      
      // Update GHL with qualification results
      if (this.ghlService && contactData.id) {
        await this.ghlService.addTagsToContact(contactData.id, qualification.tags);
        
        // Create opportunity for qualified leads
        if (qualification.score >= 60) {
          await this.createQualifiedOpportunity(contactData, qualification);
        }
      }

      console.log('✅ Lead qualified with Laura Oracle:', qualification.category, qualification.score);
      return qualification;

    } catch (error) {
      console.error('❌ Error qualifying lead with Laura:', error);
      return this.getDefaultQualification();
    }
  }

  /**
   * Batch qualify multiple leads
   */
  async batchQualifyLeads(contacts: GHLContact[]): Promise<LeadQualification[]> {
    const qualifications: LeadQualification[] = [];
    
    for (const contact of contacts) {
      try {
        const qualification = await this.qualifyLeadWithLaura(contact);
        qualifications.push(qualification);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error qualifying contact:', contact.email, error);
        qualifications.push(this.getDefaultQualification());
      }
    }

    return qualifications;
  }

  // ============================================================================
  // 🎯 INTELLIGENT COURSE RECOMMENDATIONS
  // ============================================================================

  /**
   * Generate AI-powered course recommendations
   */
  async generateCourseRecommendations(
    contactId: string, 
    studentContext?: StudentContext
  ): Promise<{
    recommendations: Array<{
      courseId: string;
      courseName: string;
      priority: 'high' | 'medium' | 'low';
      reasoning: string;
      estimatedDuration: string;
      prerequisites: string[];
    }>;
    learningPath: string;
    marketingMessage: string;
  }> {
    try {
      const context = studentContext || await this.getStudentContext(contactId);
      
      const recommendationPrompt = `
COURSE RECOMMENDATION ANALYSIS

Student Context:
${JSON.stringify(context, null, 2)}

Available Courses:
- NDT (Non-Destructive Testing)
- LST (Life Support Technician)
- ALST (Advanced Life Support Technician)
- DMT (Dive Medical Technician)
- Commercial Dive Supervisor
- Hyperbaric Operations
- Underwater Welding
- Offshore Operations

As the Super Platform Oracle, recommend the optimal learning path considering:
- Current skill level and experience
- Career goals and progression
- Industry demand and opportunities
- Prerequisites and logical sequence
- Time investment and ROI

Provide detailed recommendations with priority levels and reasoning.
Include a personalized marketing message for GHL follow-up.

Respond in JSON format.`;

      const response = await this.lauraOracle.chatWithOracle(recommendationPrompt);
      return this.parseCourseRecommendations(response.response);

    } catch (error) {
      console.error('❌ Error generating course recommendations:', error);
      return this.getDefaultRecommendations();
    }
  }

  // ============================================================================
  // 🎯 BI-DIRECTIONAL CONVERSATION HANDLING
  // ============================================================================

  /**
   * Handle GHL conversation with appropriate AI tutor
   */
  async handleGHLConversation(
    message: string,
    conversationContext: AIConversationContext
  ): Promise<GHLAIResponse> {
    try {
      const studentContext = conversationContext.studentContext || 
                           await this.getStudentContext(conversationContext.contactId);

      // Determine intent and select appropriate AI agent
      const intent = await this.analyzeIntent(message, conversationContext);
      
      let response: string;
      let actions: string[] = [];
      let tags: string[] = [];

      switch (intent) {
        case 'administrative':
          // Use Laura Oracle for admin queries
          const lauraResponse = await this.lauraOracle.chatWithOracle(
            `Student query: ${message}\nContext: ${JSON.stringify(studentContext, null, 2)}`
          );
          response = lauraResponse.response;
          actions = lauraResponse.actions || [];
          break;

        case 'technical_support':
          // Use appropriate diving tutor
          const tutor = this.selectTutorForStudent(studentContext);
          response = await tutor.generateResponse(message, {
            studentContext,
            conversationHistory: conversationContext.conversationHistory
          });
          tags.push('Technical Support', tutor.specialty);
          break;

        case 'course_inquiry':
          // Generate course recommendations
          const recommendations = await this.generateCourseRecommendations(
            conversationContext.contactId, 
            studentContext
          );
          response = recommendations.marketingMessage;
          actions.push('Send Course Brochure', 'Schedule Consultation');
          tags.push('Course Interest', 'Sales Opportunity');
          break;

        default:
          // General support with Laura Oracle
          const generalResponse = await this.lauraOracle.chatWithOracle(message);
          response = generalResponse.response;
      }

      // Determine follow-up actions
      const followUp = await this.determineFollowUp(message, response, studentContext);
      
      return {
        message: response,
        actions,
        tags,
        followUp,
        escalate: this.shouldEscalate(message, studentContext),
        updateOpportunity: await this.getOpportunityUpdate(conversationContext.contactId, intent)
      };

    } catch (error) {
      console.error('❌ Error handling GHL conversation:', error);
      return {
        message: "I apologize for the technical difficulty. Let me connect you with our support team for immediate assistance.",
        actions: ['Escalate to Human Support'],
        tags: ['Technical Issue'],
        escalate: true
      };
    }
  }

  /**
   * Automated student engagement monitoring
   */
  async monitorStudentEngagement(): Promise<void> {
    try {
      // Get all active students
      const activeStudents = await this.getActiveStudents();
      
      for (const student of activeStudents) {
        const context = await this.getStudentContext(student.email);
        
        // Check for engagement issues
        if (context.riskLevel === 'high' || context.engagementLevel === 'low') {
          await this.triggerRetentionWorkflow(student, context);
        }
        
        // Check for upsell opportunities
        if (context.progressPercentage > 80 && context.engagementLevel === 'high') {
          await this.triggerUpsellWorkflow(student, context);
        }
      }

      console.log('✅ Student engagement monitoring completed');
    } catch (error) {
      console.error('❌ Error monitoring student engagement:', error);
    }
  }

  // ============================================================================
  // 🎯 HELPER METHODS
  // ============================================================================

  private parseQualificationResponse(response: string): LeadQualification {
    try {
      // Extract JSON from response if it's wrapped in text
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback parsing logic
      return this.extractQualificationFromText(response);
    } catch (error) {
      console.error('Error parsing qualification response:', error);
      return this.getDefaultQualification();
    }
  }

  private extractQualificationFromText(response: string): LeadQualification {
    // Simple text parsing fallback
    const scoreMatch = response.match(/score[:\s]*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;
    
    let category: 'hot' | 'warm' | 'cold' | 'unqualified' = 'warm';
    if (score >= 80) category = 'hot';
    else if (score >= 60) category = 'warm';
    else if (score >= 30) category = 'cold';
    else category = 'unqualified';

    return {
      score,
      category,
      recommendedCourses: ['NDT', 'LST'],
      followUpStrategy: 'Standard follow-up sequence',
      estimatedValue: score * 50,
      tags: [`Score: ${score}`, category],
      nextActions: ['Send welcome email', 'Schedule consultation'],
      reasoning: 'Automated qualification based on available data'
    };
  }

  private getDefaultQualification(): LeadQualification {
    return {
      score: 50,
      category: 'warm',
      recommendedCourses: ['NDT'],
      followUpStrategy: 'Standard nurture sequence',
      estimatedValue: 2500,
      tags: ['Unqualified', 'Needs Review'],
      nextActions: ['Manual review required'],
      reasoning: 'Default qualification due to processing error'
    };
  }

  private async createQualifiedOpportunity(
    contact: GHLContact, 
    qualification: LeadQualification
  ): Promise<void> {
    if (!this.ghlService || !contact.id) return;

    try {
      await this.ghlService.createOpportunity({
        contactId: contact.id,
        pipelineId: 'professional-diving-pipeline',
        stageId: qualification.category === 'hot' ? 'ready-to-close' : 'qualified-lead',
        name: `${contact.firstName} ${contact.lastName} - Professional Diving Training`,
        monetaryValue: qualification.estimatedValue,
        status: 'open',
        source: 'AI Qualification'
      });
    } catch (error) {
      console.error('Error creating qualified opportunity:', error);
    }
  }

  private async getStudentContext(identifier: string): Promise<StudentContext> {
    try {
      // Try to find user by email or contact ID
      const user = await db.select()
        .from(users)
        .where(eq(users.email, identifier))
        .limit(1);

      if (user.length === 0) {
        return this.getDefaultStudentContext(identifier);
      }

      const userData = user[0];
      
      // Get progress data
      const progress = await db.select()
        .from(userProgress)
        .where(eq(userProgress.userId, userData.id));

      const currentCourses = progress
        .filter(p => p.completedAt === null)
        .map(p => p.trackId);

      const completedCourses = progress
        .filter(p => p.completedAt !== null)
        .map(p => p.trackId);

      const avgProgress = progress.length > 0 
        ? progress.reduce((sum, p) => sum + (p.progressPercentage || 0), 0) / progress.length
        : 0;

      return {
        userId: userData.id,
        email: userData.email,
        currentCourses,
        completedCourses,
        progressPercentage: avgProgress,
        lastActivity: userData.lastLoginAt?.toISOString() || 'Never',
        subscriptionType: userData.subscriptionType || 'TRIAL',
        engagementLevel: this.calculateEngagementLevel(userData, progress),
        riskLevel: this.calculateRiskLevel(userData, progress)
      };

    } catch (error) {
      console.error('Error getting student context:', error);
      return this.getDefaultStudentContext(identifier);
    }
  }

  private getDefaultStudentContext(identifier: string): StudentContext {
    return {
      userId: 'unknown',
      email: identifier,
      currentCourses: [],
      completedCourses: [],
      progressPercentage: 0,
      lastActivity: 'Unknown',
      subscriptionType: 'TRIAL',
      engagementLevel: 'medium',
      riskLevel: 'low'
    };
  }

  private calculateEngagementLevel(userData: any, progress: any[]): 'high' | 'medium' | 'low' {
    const daysSinceLogin = userData.lastLoginAt 
      ? Math.floor((Date.now() - new Date(userData.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const avgProgress = progress.length > 0 
      ? progress.reduce((sum, p) => sum + (p.progressPercentage || 0), 0) / progress.length
      : 0;

    if (daysSinceLogin <= 3 && avgProgress > 50) return 'high';
    if (daysSinceLogin <= 7 && avgProgress > 20) return 'medium';
    return 'low';
  }

  private calculateRiskLevel(userData: any, progress: any[]): 'none' | 'low' | 'medium' | 'high' {
    const daysSinceLogin = userData.lastLoginAt 
      ? Math.floor((Date.now() - new Date(userData.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const hasActiveProgress = progress.some(p => p.completedAt === null && (p.progressPercentage || 0) > 0);

    if (daysSinceLogin > 30 && !hasActiveProgress) return 'high';
    if (daysSinceLogin > 14 && !hasActiveProgress) return 'medium';
    if (daysSinceLogin > 7) return 'low';
    return 'none';
  }

  private async analyzeIntent(message: string, context: AIConversationContext): Promise<string> {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('course') || lowerMessage.includes('training') || lowerMessage.includes('certification')) {
      return 'course_inquiry';
    }
    
    if (lowerMessage.includes('technical') || lowerMessage.includes('help') || lowerMessage.includes('problem')) {
      return 'technical_support';
    }
    
    if (lowerMessage.includes('account') || lowerMessage.includes('billing') || lowerMessage.includes('subscription')) {
      return 'administrative';
    }
    
    return 'general';
  }

  private selectTutorForStudent(context: StudentContext): any {
    // Select tutor based on current courses or default to NDT
    if (context.currentCourses.includes('ndt')) {
      return this.tutorManager.getTutor('ndt');
    }
    if (context.currentCourses.includes('lst')) {
      return this.tutorManager.getTutor('lst');
    }
    if (context.currentCourses.includes('alst')) {
      return this.tutorManager.getTutor('alst');
    }
    
    // Default to NDT tutor
    return this.tutorManager.getTutor('ndt');
  }

  private parseCourseRecommendations(response: string): any {
    // Implementation for parsing course recommendations
    return this.getDefaultRecommendations();
  }

  private getDefaultRecommendations(): any {
    return {
      recommendations: [
        {
          courseId: 'ndt',
          courseName: 'Non-Destructive Testing',
          priority: 'high' as const,
          reasoning: 'Foundation course for commercial diving',
          estimatedDuration: '4-6 weeks',
          prerequisites: []
        }
      ],
      learningPath: 'Professional Diving Certification Path',
      marketingMessage: 'Based on your profile, I recommend starting with our NDT certification course.'
    };
  }

  private async determineFollowUp(message: string, response: string, context: StudentContext): Promise<any> {
    // Logic to determine follow-up timing and message
    return undefined;
  }

  private shouldEscalate(message: string, context: StudentContext): boolean {
    const escalationKeywords = ['complaint', 'refund', 'cancel', 'angry', 'frustrated'];
    return escalationKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  private async getOpportunityUpdate(contactId: string, intent: string): Promise<any> {
    // Logic to update opportunity based on conversation
    return undefined;
  }

  private async getActiveStudents(): Promise<any[]> {
    try {
      return await db.select()
        .from(users)
        .where(eq(users.subscriptionType, 'ACTIVE'));
    } catch (error) {
      console.error('Error getting active students:', error);
      return [];
    }
  }

  private async triggerRetentionWorkflow(student: any, context: StudentContext): Promise<void> {
    if (!this.ghlService) return;

    try {
      const contact = await this.ghlService.findContactByEmail(student.email);
      if (contact) {
        await this.ghlService.addTagsToContact(contact.id, ['At Risk', 'Retention Campaign']);
        console.log('✅ Triggered retention workflow for:', student.email);
      }
    } catch (error) {
      console.error('Error triggering retention workflow:', error);
    }
  }

  private async triggerUpsellWorkflow(student: any, context: StudentContext): Promise<void> {
    if (!this.ghlService) return;

    try {
      const contact = await this.ghlService.findContactByEmail(student.email);
      if (contact) {
        await this.ghlService.addTagsToContact(contact.id, ['Upsell Opportunity', 'High Engagement']);
        console.log('✅ Triggered upsell workflow for:', student.email);
      }
    } catch (error) {
      console.error('Error triggering upsell workflow:', error);
    }
  }

  private getMockQualification(contactData: GHLContact): LeadQualification {
    // Generate a mock qualification for demo purposes
    const emailDomain = contactData.email.split('@')[1] || '';
    const hasPhone = !!contactData.phone;
    const hasBusinessEmail = !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(emailDomain.toLowerCase());
    
    let score = 50; // Base score
    if (hasBusinessEmail) score += 20;
    if (hasPhone) score += 15;
    if (contactData.source?.toLowerCase().includes('referral')) score += 15;
    
    let category: 'hot' | 'warm' | 'cold' | 'unqualified' = 'warm';
    if (score >= 80) category = 'hot';
    else if (score >= 60) category = 'warm';
    else if (score >= 30) category = 'cold';
    else category = 'unqualified';

    return {
      score,
      category,
      recommendedCourses: ['NDT', 'LST'],
      followUpStrategy: `${category} lead - follow up within ${category === 'hot' ? '24 hours' : category === 'warm' ? '3 days' : '1 week'}`,
      estimatedValue: score * 50,
      tags: [`Score: ${score}`, category, 'Mock Qualification'],
      nextActions: ['Send welcome email', 'Schedule consultation'],
      reasoning: `Mock qualification: ${hasBusinessEmail ? 'Business email (+20), ' : ''}${hasPhone ? 'Phone provided (+15), ' : ''}Base score: 50`
    };
  }
}

// Export singleton instance
export default GHLAIBridgeService;
