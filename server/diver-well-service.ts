#!/usr/bin/env tsx

/**
 * 🌊 DIVER WELL COMMERCIAL DIVING AI CONSULTANT SERVICE
 * 
 * Diver Well is the Commercial Diving Operations AI Consultant, providing
 * expert guidance on dive planning, safety protocols, operational procedures,
 * and all commercial diving operations.
 * 
 * Capabilities:
 * - Dive planning and risk assessment
 * - Safety protocol guidance
 * - Operational procedures and best practices
 * - Equipment recommendations
 * - Emergency response procedures
 * - Commercial diving operations expertise
 * 
 * @author AI Assistant
 * @version 1.0.0 - Commercial Diving AI Consultant
 * @date 2025
 */

import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { Client as LangSmithClient } from 'langsmith';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import OpenAI from 'openai';
import { nanoid } from 'nanoid';
import LangChainConfig from './langchain-config';

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
}

const DIVER_WELL_CONFIG: DiverWellConfig = {
  name: "Diver Well",
  role: "Commercial Diving AI Consultant",
  specialty: "Commercial Diving Operations & Safety",
  systemPrompt: `You are Diver Well, the Commercial Diving AI Consultant for the Professional Diver Training Platform. You are an expert commercial diving operations specialist with extensive knowledge of diving operations, safety protocols, and industry best practices.

CORE IDENTITY:
- You are an expert commercial diving operations consultant
- You have extensive knowledge of commercial diving operations, safety protocols, and industry standards
- You provide expert guidance on dive planning, safety procedures, supervision, and operational diving queries
- You are knowledgeable about IMCA standards, ADCI guidelines, and industry best practices
- You have a professional, experienced voice - like a seasoned commercial diving professional

COMMERCIAL DIVING EXPERTISE:
- Dive planning and risk assessment
- Safety protocols and emergency procedures
- Operational procedures and best practices
- Equipment selection and maintenance
- Decompression procedures and dive tables
- Underwater inspection and NDT techniques
- Life support systems and hyperbaric operations
- Commercial diving supervision and management
- Industry regulations and compliance standards

COMMUNICATION STYLE:
- Professional, experienced, and authoritative
- Clear and practical guidance for diving operations
- Safety-first approach in all recommendations
- Focused on industry standards and best practices
- Helpful and supportive in addressing operational questions

Remember: You are the Commercial Diving AI Consultant with comprehensive knowledge of diving operations, safety protocols, and industry standards.`,
  capabilities: [
    "Dive Planning & Risk Assessment",
    "Safety Protocols & Procedures",
    "Operational Guidance",
    "Equipment Recommendations",
    "Emergency Response Procedures",
    "Commercial Diving Operations",
    "Industry Standards & Compliance",
    "Decompression Procedures"
  ],
  langsmithProject: process.env.LANGSMITH_PROJECT || "diver-well-consultant"
};

// ============================================================================
// 🎯 DIVER WELL SERVICE CLASS
// ============================================================================

export class DiverWellService {
  private static instance: DiverWellService;
  private chatModel: ChatOpenAI;
  private langsmithClient: LangSmithClient;
  private openai: OpenAI;
  private config: DiverWellConfig;

  private constructor() {
    this.config = DIVER_WELL_CONFIG;
    
    // Initialize LangSmith client
    this.langsmithClient = new LangSmithClient({
      apiKey: process.env.LANGSMITH_API_KEY || "dev-mode"
    });

    // Initialize OpenAI client for TTS
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Initialize AI models using LangChain config
    const langchainConfig = LangChainConfig.getInstance();
    this.chatModel = langchainConfig.getChatModel();

    console.log('🌊 Diver Well Commercial Diving AI Consultant initialized with LangChain and voice capabilities');
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
   * Main chat interface for Diver Well
   */
  async chatWithConsultant(
    message: string,
    sessionId?: string
  ): Promise<{
    response: string;
    timestamp: string;
  }> {
    try {
      // Create LangSmith trace for learning
      const traceId = sessionId || nanoid();
      
      const messages = [
        new SystemMessage(this.config.systemPrompt),
        new HumanMessage(message)
      ];

      const response = await this.chatModel.invoke(messages);
      
      // Log interaction to LangSmith for learning
      try {
        await this.langsmithClient.createRun({
          name: "diver-well-consultation",
          run_type: "chain",
          inputs: { message },
          outputs: { response: response.content as string },
          project_name: this.config.langsmithProject
        });
      } catch (error) {
        // Continue even if LangSmith logging fails
        console.log('⚠️ LangSmith logging failed, continuing...');
      }

      return {
        response: response.content as string,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Diver Well chat error:', error);
      return {
        response: "I apologize, but I'm experiencing a technical issue. Please try again or contact support.",
        timestamp: new Date().toISOString()
      };
    }
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
}

// Export singleton instance
export default DiverWellService;

