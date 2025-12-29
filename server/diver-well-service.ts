#!/usr/bin/env tsx

/**
 * 🤿 DIVER WELL AI CONSULTANT SERVICE
 * 
 * Diver Well is the specialized Commercial Diving Operations AI Consultant
 * that provides expert guidance on dive planning, safety protocols, equipment
 * selection, and operational best practices. It operates using LangChain,
 * LangSmith, and OpenAI for comprehensive diving expertise.
 * 
 * Capabilities:
 * - Commercial diving operations guidance
 * - Dive planning and risk assessment
 * - Safety protocol recommendations
 * - Equipment selection and maintenance
 * - Operational best practices
 * - LangSmith domain learning for diving expertise
 * - Voice-to-voice communication
 * 
 * @author AI Assistant
 * @version 1.0.0 - Commercial Diving AI Consultant
 * @date 2025
 */

import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Client as LangSmithClient } from 'langsmith';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import OpenAI from 'openai';
import { nanoid } from 'nanoid';

// ============================================================================
// 🎯 DIVER WELL CONFIGURATION
// ============================================================================

interface DiverWellConfig {
  name: string;
  role: string;
  specialty: string;
  systemPrompt: string;
  capabilities: string[];
  langsmithProject: string;
  adminAccess: boolean;
}

const DIVER_WELL_CONFIG: DiverWellConfig = {
  name: "Diver Well",
  role: "Commercial Diving Operations AI Consultant",
  specialty: "Commercial Diving Operations, Safety, and Best Practices",
  systemPrompt: `You are Diver Well, the specialized Commercial Diving Operations AI Consultant for the Professional Diver Training Platform. You are an expert in commercial diving operations, safety protocols, and industry best practices.

CORE IDENTITY:
- You are the premier commercial diving operations consultant with deep industry expertise
- You operate from the LangSmith domain, continuously learning from diving operations and safety protocols
- You have comprehensive knowledge of commercial diving operations, safety standards, equipment, and regulations
- You provide expert guidance on dive planning, risk assessment, safety procedures, and operational best practices
- You have a professional, knowledgeable, and safety-focused communication style
- You prioritize safety above all else in all recommendations

COMMERCIAL DIVING EXPERTISE:
- Dive planning and risk assessment methodologies
- Safety protocols and emergency procedures
- Equipment selection, maintenance, and inspection
- Commercial diving operations best practices
- Industry regulations and compliance standards
- Underwater welding and NDT operations
- Life support systems and hyperbaric operations
- Dive supervisor responsibilities and protocols
- Team communication and coordination
- Hazard identification and mitigation

SAFETY-FIRST APPROACH:
- Always prioritize diver safety in all recommendations
- Provide clear, actionable safety protocols
- Identify potential hazards and risks
- Recommend proper equipment and procedures
- Emphasize compliance with industry standards
- Suggest emergency response procedures when relevant

LANGSMITH DOMAIN EXPERTISE:
- Continuous learning from diving operations and safety protocols
- Understanding of commercial diving industry standards
- Optimization of dive planning and safety procedures
- Real-time adaptation to operational needs
- Knowledge accumulation from industry best practices

COMMUNICATION STYLE:
- Professional, knowledgeable, and authoritative
- Safety-focused and detail-oriented
- Clear and actionable guidance
- Practical and industry-relevant recommendations
- Confident in commercial diving expertise
- Always emphasize safety and compliance

Remember: You are the Commercial Diving Operations AI Consultant with comprehensive expertise in commercial diving operations, safety protocols, and industry best practices. Always prioritize safety and provide practical, actionable guidance.`,
  capabilities: [
    "Dive Planning & Risk Assessment",
    "Safety Protocols & Emergency Procedures",
    "Equipment Selection & Maintenance",
    "Commercial Diving Operations",
    "Industry Regulations & Compliance",
    "Underwater Welding & NDT Operations",
    "Life Support Systems",
    "Hyperbaric Operations",
    "Dive Supervisor Guidance",
    "Team Communication & Coordination",
    "Hazard Identification & Mitigation",
    "LangSmith Domain Learning",
    "Voice Communication & Audio Responses"
  ],
  langsmithProject: process.env.LANGSMITH_PROJECT || "professional-diver-training-app",
  adminAccess: false // Available to all users, not just admins
};

// ============================================================================
// 🎯 DIVER WELL SERVICE CLASS
// ============================================================================

export class DiverWellService {
  private static instance: DiverWellService;
  private chatModel: ChatOpenAI;
  private embeddings: OpenAIEmbeddings;
  private langsmithClient: LangSmithClient;
  private openai: OpenAI;
  private config: DiverWellConfig;

  private constructor() {
    this.config = DIVER_WELL_CONFIG;
    
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
      this.openai = null as any;
    }

    // Initialize AI models (conditional)
    if (process.env.OPENAI_API_KEY) {
      this.chatModel = new ChatOpenAI({
        modelName: 'gpt-4o',
        temperature: 0.4, // Slightly higher for more natural diving expertise
        maxTokens: 3000,
        openAIApiKey: process.env.OPENAI_API_KEY,
      });
    } else {
      console.warn('⚠️ OPENAI_API_KEY not found - Diver Well will use mock responses');
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

    console.log('🤿 Diver Well AI Consultant initialized with LangSmith domain learning and voice capabilities');
  }

  public static getInstance(): DiverWellService {
    if (!DiverWellService.instance) {
      DiverWellService.instance = new DiverWellService();
    }
    return DiverWellService.instance;
  }

  // ============================================================================
  // 🎯 CORE CONSULTANT FUNCTIONALITY
  // ============================================================================

  /**
   * Main chat interface for Diver Well Consultant
   */
  async chatWithConsultant(
    message: string,
    sessionId?: string,
    userContext?: any
  ): Promise<{
    response: string;
    actions?: string[];
    timestamp: string;
  }> {
    try {
      // Check if OpenAI is available and reinitialize if needed
      if (!process.env.OPENAI_API_KEY) {
        return {
          response: "Hello! I'm Diver Well, your Commercial Diving Operations AI Consultant. I'd love to help you with dive planning, safety protocols, and operational guidance, but I need an OpenAI API key to be fully functional. Please contact the administrator to enable this service.",
          timestamp: new Date().toISOString()
        };
      }

      // Reinitialize chatModel if it's null but API key is available
      if (!this.chatModel && process.env.OPENAI_API_KEY) {
        this.chatModel = new ChatOpenAI({
          modelName: 'gpt-4o',
          temperature: 0.4,
          maxTokens: 3000,
          openAIApiKey: process.env.OPENAI_API_KEY,
        });
        console.log('🔄 Diver Well chatModel reinitialized with OpenAI API key');
      }

      // Build context for Diver Well
      const context = await this.buildConsultantContext(userContext);
      
      // Create LangSmith trace for learning
      const traceId = sessionId || nanoid();
      
      const messages = [
        new SystemMessage(this.config.systemPrompt),
        new HumanMessage(`User Query: ${message}

Context:
${JSON.stringify(context, null, 2)}

Provide expert commercial diving operations guidance, focusing on safety, best practices, and practical recommendations.`)
      ];

      const response = await this.chatModel.invoke(messages);
      
      // Log interaction to LangSmith for domain learning
      await this.logToLangSmith(traceId, message, response.content as string, context);

      // Determine if any actions should be executed
      const actions = this.extractActionsFromResponse(response.content as string);

      return {
        response: response.content as string,
        actions,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Diver Well chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
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
      
      return {
        response: `I apologize, but I'm experiencing a technical issue: ${errorMessage}. Please try again or contact support if this persists.`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Build comprehensive context for Diver Well Consultant
   */
  private async buildConsultantContext(userContext?: any): Promise<any> {
    return {
      platform: {
        name: "Professional Diver Training Platform",
        version: "2.0.0",
        environment: process.env.NODE_ENV || "development",
        domain: "diverwell.com"
      },
      capabilities: this.config.capabilities,
      userContext: userContext || {},
      timestamp: new Date().toISOString(),
      langsmithProject: this.config.langsmithProject,
      focus: "Commercial diving operations, safety protocols, and best practices"
    };
  }

  /**
   * Log interactions to LangSmith for domain learning
   */
  private async logToLangSmith(
    traceId: string,
    userMessage: string,
    consultantResponse: string,
    context: any
  ): Promise<void> {
    try {
      if (process.env.LANGSMITH_API_KEY && process.env.LANGSMITH_PROJECT) {
        // Create a trace for this interaction
        await this.langsmithClient.createRun({
          name: "diver-well-consultant-interaction",
          runType: "chain",
          inputs: {
            user_message: userMessage,
            context: context
          },
          outputs: {
            consultant_response: consultantResponse,
            actions: this.extractActionsFromResponse(consultantResponse)
          },
          projectName: this.config.langsmithProject,
          tags: ["diver-well", "commercial-diving", "safety", "langsmith-domain"]
        });

        console.log('📊 Diver Well interaction logged to LangSmith for domain learning');
      }
    } catch (error) {
      console.error('❌ Error logging to LangSmith:', error);
    }
  }

  /**
   * Extract actionable items from Diver Well's response
   */
  private extractActionsFromResponse(response: string): string[] {
    const actions: string[] = [];
    
    // Look for action keywords in the response
    if (response.includes('I recommend') || response.includes('You should') || response.includes('Consider')) {
      actions.push('recommendation_provided');
    }
    
    if (response.includes('safety') || response.includes('protocol')) {
      actions.push('safety_guidance_provided');
    }
    
    if (response.includes('equipment') || response.includes('gear')) {
      actions.push('equipment_guidance_provided');
    }
    
    if (response.includes('plan') || response.includes('planning')) {
      actions.push('dive_planning_guidance_provided');
    }
    
    return actions;
  }

  /**
   * Generate voice audio for Diver Well's response using OpenAI TTS
   */
  async generateVoiceResponse(text: string): Promise<Buffer | null> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️ OpenAI API key not found, voice generation disabled');
        return null;
      }

      // Use Alloy voice - professional and clear
      const response = await this.openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy", // Professional, clear voice
        input: text,
        response_format: "mp3",
        speed: 1.0, // Normal speed for clear communication
      });

      const audioBuffer = Buffer.from(await response.arrayBuffer());
      console.log('🎤 Diver Well voice response generated successfully');
      return audioBuffer;

    } catch (error) {
      console.error('❌ Error generating Diver Well voice response:', error);
      return null;
    }
  }

  /**
   * Get Diver Well's current knowledge and capabilities
   */
  getConsultantInfo(): DiverWellConfig {
    return this.config;
  }

  /**
   * Learn from diving operations objectives via LangSmith
   */
  async learnFromObjectives(objectives: any[]): Promise<void> {
    try {
      // Log objectives to LangSmith for learning
      for (const objective of objectives) {
        await this.langsmithClient.createRun({
          name: "diving-operations-objective-learning",
          runType: "chain",
          inputs: { objective },
          outputs: { learned: true, timestamp: new Date().toISOString() },
          projectName: this.config.langsmithProject,
          tags: ["diver-well", "objective-learning", "langsmith-domain"]
        });
      }
      
      console.log('🧠 Diver Well learned from diving operations objectives via LangSmith');
    } catch (error) {
      console.error('❌ Error learning from objectives:', error);
    }
  }
}

export default DiverWellService;





