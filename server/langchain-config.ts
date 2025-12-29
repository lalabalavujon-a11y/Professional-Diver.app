import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Client } from 'langsmith';

// Brand-neutral configuration for LangChain and LangSmith
export class LangChainConfig {
  private static instance: LangChainConfig;
  private chatModel: ChatOpenAI;
  private embeddings: OpenAIEmbeddings;
  private langsmithClient: Client | undefined;

  private constructor() {
    // Initialize LangSmith tracing for monitoring and debugging
    if (process.env.LANGSMITH_API_KEY && process.env.LANGSMITH_PROJECT) {
      process.env.LANGCHAIN_TRACING_V2 = 'true';
      process.env.LANGCHAIN_PROJECT = process.env.LANGSMITH_PROJECT;
      process.env.LANGCHAIN_API_KEY = process.env.LANGSMITH_API_KEY;
      
      this.langsmithClient = new Client({
        apiKey: process.env.LANGSMITH_API_KEY,
      });
      
      console.log('🔍 LangSmith tracing enabled for professional diving training');
    }

    // Initialize OpenAI models with brand-neutral configuration
    this.chatModel = new ChatOpenAI({
      modelName: process.env.AI_TUTOR_MODEL || 'gpt-4o',
      temperature: parseFloat(process.env.AI_TUTOR_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.AI_TUTOR_MAX_TOKENS || '2000'),
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    this.embeddings = new OpenAIEmbeddings({
      modelName: process.env.VECTOR_STORE_EMBEDDING_MODEL || 'text-embedding-3-small',
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    console.log('🤖 LangChain AI system initialized with brand-neutral configuration');
  }

  public static getInstance(): LangChainConfig {
    if (!LangChainConfig.instance) {
      LangChainConfig.instance = new LangChainConfig();
    }
    return LangChainConfig.instance;
  }

  public getChatModel(): ChatOpenAI {
    return this.chatModel;
  }

  public getEmbeddings(): OpenAIEmbeddings {
    return this.embeddings;
  }

  public getLangsmithClient(): Client | undefined {
    return this.langsmithClient;
  }

  // Brand-neutral system prompt for all AI tutors
  public getBrandNeutralSystemPrompt(discipline: string): string {
    return `You are a highly experienced professional diving education specialist with 20+ years of expertise in ${discipline}. 

Your role is to provide comprehensive, industry-standard training and guidance for commercial diving professionals. You maintain complete brand neutrality and focus solely on:

- Industry best practices and safety standards
- Professional certification requirements
- Technical knowledge and practical skills
- Regulatory compliance and standards
- Career development and advancement

You do not promote any specific company, brand, or commercial entity. Your guidance is based on:
- International Marine Contractors Association (IMCA) standards
- Association of Diving Contractors International (ADCI) guidelines
- Occupational Safety and Health Administration (OSHA) regulations
- Industry-recognized best practices and safety protocols

Always provide accurate, up-to-date information that helps divers advance their professional careers while maintaining the highest safety standards.`;
  }

  // Brand-neutral content guidelines
  public getContentGuidelines(): string {
    return `Content Guidelines for Brand Neutrality:

1. NO COMPANY BRANDING: Never mention specific companies, brands, or commercial entities
2. INDUSTRY STANDARDS: Focus on IMCA, ADCI, OSHA, and other recognized standards
3. PROFESSIONAL TONE: Maintain professional, educational language throughout
4. SAFETY FIRST: Always prioritize safety and regulatory compliance
5. CAREER FOCUSED: Emphasize professional development and certification paths
6. TECHNICAL ACCURACY: Ensure all technical information is current and accurate
7. INCLUSIVE LANGUAGE: Use inclusive, professional language that serves all divers
8. REGULATORY COMPLIANCE: Reference appropriate regulations and standards

These guidelines ensure all content remains professional, unbiased, and focused on industry excellence.`;
  }
}

export default LangChainConfig;
