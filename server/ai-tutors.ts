import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Document } from '@langchain/core/documents';
import LangChainConfig from './langchain-config';
import ProfessionalDivingVectorStore from './vector-store';

// Brand-neutral AI tutor interface
export interface DivingTutor {
  id: string;
  name: string;
  discipline: string;
  specialty: string;
  avatar: string;
  background: string;
  traits: string[];
  systemPrompt: string;
}

// Brand-neutral tutor configurations
export const DIVING_TUTORS: Record<string, DivingTutor> = {
  'ndt': {
    id: 'ndt-tutor',
    name: 'Dr. Sarah Chen',
    discipline: 'NDT',
    specialty: 'Non-Destructive Testing and Underwater Inspection',
    avatar: '👩‍🔬',
    background: '20+ years in underwater inspection, PhD in Materials Engineering, IMCA certified',
    traits: ['Detail-oriented', 'Technical expert', 'Patient teacher'],
    systemPrompt: 'You are Dr. Sarah Chen, a highly experienced NDT specialist with expertise in underwater inspection techniques, corrosion assessment, and professional documentation standards.'
  },
  'lst': {
    id: 'lst-tutor',
    name: 'Mike Rodriguez',
    discipline: 'LST',
    specialty: 'Life Support Systems and Safety Operations',
    avatar: '👨‍🔧',
    background: '15+ years in life support operations, certified LST, hyperbaric specialist',
    traits: ['Safety-focused', 'Technical expert', 'Clear communicator'],
    systemPrompt: 'You are Mike Rodriguez, a seasoned Life Support Technician with extensive experience in life support systems, gas mixing, and safety protocols.'
  },
  'alst': {
    id: 'alst-tutor',
    name: 'Captain Elena Vasquez',
    discipline: 'Assistant Life Support Technician',
    specialty: 'Assistant Life Support and Life Support Systems',
    avatar: '👩‍✈️',
    background: '18+ years in advanced life support, saturation diving specialist, IMCA certified',
    traits: ['Advanced technical expertise', 'Leadership focused', 'Safety advocate'],
    systemPrompt: 'You are Captain Elena Vasquez, an expert in assistant life support systems, life support operations, and complex underwater life support protocols.'
  },
  'dmt': {
    id: 'dmt-tutor',
    name: 'Dr. James Mitchell',
    discipline: 'DMT',
    specialty: 'Diving Medicine and Emergency Response',
    avatar: '👨‍⚕️',
    background: 'Emergency medicine physician, hyperbaric specialist, diving medicine expert',
    traits: ['Emergency-focused', 'Medical expert', 'Life-saving expertise'],
    systemPrompt: 'You are Dr. James Mitchell, an emergency medicine physician specializing in diving medicine, hyperbaric treatment, and diving emergency response.'
  },
  'commercial-supervisor': {
    id: 'supervisor-tutor',
    name: 'Commander David Thompson',
    discipline: 'Commercial Dive Supervisor',
    specialty: 'Dive Supervision and Operations Management',
    avatar: '👨‍💼',
    background: '25+ years in commercial diving supervision, IMCA certified supervisor, operations management expert',
    traits: ['Leadership expert', 'Operations focused', 'Safety leader'],
    systemPrompt: 'You are Commander David Thompson, a highly experienced Commercial Dive Supervisor with expertise in operations management, safety oversight, and team leadership.'
  },
  'saturation-diving': {
    id: 'saturation-tutor',
    name: 'Dr. Marcus Thompson',
    discipline: 'Saturation Diving',
    specialty: 'Saturation Diving Systems and Life Support',
    avatar: '👨‍🔬',
    background: 'Saturation diving specialist, life support systems expert, 15+ years in commercial saturation operations',
    traits: ['Systems-focused', 'Technical precision', 'Safety expert'],
    systemPrompt: 'You are Dr. Marcus Thompson, a saturation diving specialist with expertise in life support systems, decompression management, and saturation diving operations.'
  },
  'underwater-welding': {
    id: 'welding-tutor',
    name: 'Lisa Thompson',
    discipline: 'Underwater Welding',
    specialty: 'Underwater Welding Operations and Quality Control',
    avatar: '👩‍🔧',
    background: 'Underwater welding specialist, marine construction expert, 12+ years in underwater welding techniques',
    traits: ['Precision-focused', 'Quality expert', 'Safety advocate'],
    systemPrompt: 'You are Lisa Thompson, an underwater welding specialist with expertise in marine welding operations, quality control, and underwater welding safety protocols.'
  },
  'hyperbaric-operations': {
    id: 'hyperbaric-tutor',
    name: 'Dr. Michael Rodriguez',
    discipline: 'Hyperbaric Operations',
    specialty: 'Hyperbaric Medicine and Chamber Operations',
    avatar: '👨‍⚕️',
    background: 'Hyperbaric medicine specialist, chamber operations expert, 15+ years in hyperbaric treatment protocols',
    traits: ['Medical precision', 'Patient safety', 'Technical expertise'],
    systemPrompt: 'You are Dr. Michael Rodriguez, a hyperbaric medicine specialist with expertise in chamber operations, treatment protocols, and hyperbaric medicine procedures.'
  },
  'air-diver-certification': {
    id: 'air-diver-tutor',
    name: 'Dr. Robert Martinez',
    discipline: 'Air Diver Certification',
    specialty: 'Diving Physics and Decompression Theory',
    avatar: '👨‍🔬',
    background: 'Diving physics specialist, decompression theory expert, 15+ years in commercial diving operations',
    traits: ['Physics expert', 'Theory-focused', 'Safety advocate'],
    systemPrompt: 'You are Dr. Robert Martinez, a diving physics specialist with expertise in gas laws, pressure effects, decompression theory, and diving safety calculations.'
  }
};

export class DivingTutorManager {
  private static instance: DivingTutorManager;
  private config: LangChainConfig;
  private vectorStore: ProfessionalDivingVectorStore;
  private chatModel: ChatOpenAI;

  private constructor() {
    this.config = LangChainConfig.getInstance();
    this.vectorStore = ProfessionalDivingVectorStore.getInstance();
    this.chatModel = this.config.getChatModel();
  }

  public static getInstance(): DivingTutorManager {
    if (!DivingTutorManager.instance) {
      DivingTutorManager.instance = new DivingTutorManager();
    }
    return DivingTutorManager.instance;
  }

  // Get available tutors
  public getAvailableTutors(): DivingTutor[] {
    return Object.values(DIVING_TUTORS);
  }

  // Get tutor by discipline
  public getTutorByDiscipline(discipline: string): DivingTutor | null {
    // First try direct key lookup
    if (DIVING_TUTORS[discipline]) {
      return DIVING_TUTORS[discipline];
    }
    
    // Then try to find by discipline field
    for (const tutor of Object.values(DIVING_TUTORS)) {
      if (tutor.discipline === discipline) {
        return tutor;
      }
    }
    
    return null;
  }

  // Chat with a specific tutor
  public async chatWithTutor(
    discipline: string,
    message: string,
    sessionId?: string
  ): Promise<{
    response: string;
    relevantContent?: Document[];
    tutor: DivingTutor;
  }> {
    try {
      const tutor = this.getTutorByDiscipline(discipline);
      if (!tutor) {
        throw new Error(`Tutor not found for discipline: ${discipline}`);
      }

      // Try to get relevant content from vector store, but don't fail if it's not initialized
      let relevantContent: Document[] = [];
      let context = '';
      
      try {
        if (this.vectorStore.getVectorStore()) {
          relevantContent = await this.vectorStore.searchContent(
            message,
            discipline,
            3
          );
          context = relevantContent
            .map(doc => doc.pageContent)
            .join('\n\n');
        }
      } catch (error) {
        console.log('Vector store not available, using basic context');
      }

      // Create system prompt with brand neutrality
      const systemPrompt = `${this.config.getBrandNeutralSystemPrompt(discipline)}

${tutor.systemPrompt}

${this.config.getContentGuidelines()}

${context ? `Relevant professional content:
${context}

` : ''}Remember: Maintain complete brand neutrality. Focus on industry standards, safety protocols, and professional development. Do not mention any specific companies or brands.`;

      // Try to generate response with OpenAI, fallback to intelligent responses if API key not available
      let response: string;
      
      try {
        const messages = [
          new SystemMessage(systemPrompt),
          new HumanMessage(message)
        ];

        const aiResponse = await this.chatModel.invoke(messages);
        response = aiResponse.content as string;
      } catch (error) {
        console.log('OpenAI API not available, using intelligent fallback responses');
        response = this.generateIntelligentResponse(tutor, message, discipline);
      }

      return {
        response,
        relevantContent,
        tutor
      };

    } catch (error) {
      console.error('❌ Error in chatWithTutor:', error);
      throw error;
    }
  }

  // Generate intelligent responses when OpenAI API is not available
  private generateIntelligentResponse(tutor: DivingTutor, message: string, discipline: string): string {
    const input = message.toLowerCase();
    
    // Discipline-specific responses
    if (discipline === 'Air Diver Certification' || discipline === 'air-diver-certification') {
      if (input.includes('boyle') || input.includes('gas law')) {
        return `Boyle's Law is fundamental to diving safety! It states that at constant temperature, the volume of a gas is inversely proportional to its pressure. In diving terms: as you go deeper, the pressure increases and gas volume decreases. This affects your buoyancy, breathing gas consumption, and most importantly - your ascent rate. Always remember: never hold your breath during ascent as expanding gas can cause serious injury!`;
      }
      if (input.includes('pressure') || input.includes('depth')) {
        return `Pressure increases by 1 atmosphere (14.7 psi) for every 33 feet of seawater depth. This affects everything: gas density, breathing resistance, nitrogen absorption, and equipment performance. Understanding pressure is crucial for safe diving operations and proper decompression planning.`;
      }
      if (input.includes('decompression') || input.includes('nitrogen')) {
        return `Decompression theory is about managing nitrogen absorption and elimination. As you dive deeper and longer, your body absorbs more nitrogen. During ascent, this nitrogen must be eliminated slowly to prevent decompression sickness. This is why we use dive tables, computers, and proper ascent rates.`;
      }
    }
    
    if (discipline === 'Saturation Diving') {
      if (input.includes('life support') || input.includes('system')) {
        return `Life support systems in saturation diving are incredibly complex and critical. They maintain the perfect gas mixture, temperature, humidity, and pressure for extended periods. Every component has redundancy, and operators must be constantly vigilant. The system includes gas mixing, CO2 scrubbing, temperature control, and emergency backup systems.`;
      }
      if (input.includes('decompression') || input.includes('saturation')) {
        return `Saturation diving allows divers to work at depth for days or weeks without daily decompression. Once saturated with inert gas, the decompression time remains constant regardless of bottom time. This makes it highly efficient for deep water work, but requires sophisticated life support and medical monitoring.`;
      }
    }
    
    if (discipline === 'Underwater Welding') {
      if (input.includes('electrode') || input.includes('welding')) {
        return `Underwater welding requires specialized electrodes designed for wet conditions. The process creates a gas bubble around the weld area, but quality control is challenging. Visual inspection, magnetic particle testing, and ultrasonic testing are essential for ensuring weld integrity in the marine environment.`;
      }
      if (input.includes('safety') || input.includes('electrical')) {
        return `Electrical safety underwater is paramount! Proper grounding, insulation, and current limiting are essential. Divers must be trained in electrical hazards, and all equipment must meet marine electrical standards. Never compromise on electrical safety procedures.`;
      }
    }
    
    if (discipline === 'Hyperbaric Operations') {
      if (input.includes('chamber') || input.includes('treatment')) {
        return `Hyperbaric chambers are sophisticated medical devices that deliver high-pressure oxygen therapy. They're used for decompression sickness, carbon monoxide poisoning, and wound healing. Chamber operations require medical training, understanding of gas laws, and strict safety protocols.`;
      }
      if (input.includes('emergency') || input.includes('protocol')) {
        return `Emergency procedures in hyperbaric operations must be second nature. This includes fire suppression, rapid decompression protocols, medical emergencies, and equipment failures. Every operator must be trained in emergency response and have clear communication procedures.`;
      }
    }
    
    // General professional diving responses
    if (input.includes('safety') || input.includes('risk')) {
      return `Safety is the foundation of professional diving. Every procedure, every decision, every action should be evaluated through the lens of risk management. This includes proper planning, equipment checks, communication protocols, and emergency procedures. Never compromise on safety standards.`;
    }
    
    if (input.includes('equipment') || input.includes('tool')) {
      return `Professional diving equipment is highly specialized and must be maintained to the highest standards. Each piece of equipment has specific functions, limitations, and maintenance requirements. Regular inspection, testing, and proper storage are essential for safe operations.`;
    }
    
    if (input.includes('emergency') || input.includes('rescue')) {
      return `Emergency response in professional diving requires immediate, methodical action. The priority is always: assess the situation, ensure safety, then act decisively. This includes proper communication, following established protocols, and having backup plans ready. Training and preparation are key to effective emergency response.`;
    }
    
    // Default encouraging response
    const encouragingResponses = [
      `That's an excellent question! In my experience with ${discipline}, this is a critical topic that requires careful understanding. Let me share what I've learned about this important aspect of professional diving.`,
      `I appreciate your curiosity about this topic. In ${discipline}, understanding these concepts is essential for safe and effective operations. Here's what I've found most important in my years of experience.`,
      `Great question! This is exactly the kind of thinking that shows you're developing professional judgment in ${discipline}. Let me explain the key principles and best practices.`,
      `Your question demonstrates good awareness of the complexities in ${discipline}. This is a topic that requires both theoretical knowledge and practical experience. Here's what I've learned.`
    ];
    
    return encouragingResponses[Math.floor(Math.random() * encouragingResponses.length)] + 
           ` Feel free to ask me more specific questions about ${discipline} techniques, safety protocols, or industry standards.`;
  }

  // Generate learning path recommendations
  public async generateLearningPath(
    discipline: string,
    userLevel: 'beginner' | 'intermediate' | 'advanced',
    goals: string[]
  ): Promise<{
    recommendations: string[];
    nextSteps: string[];
    resources: string[];
  }> {
    try {
      const tutor = this.getTutorByDiscipline(discipline);
      if (!tutor) {
        throw new Error(`Tutor not found for discipline: ${discipline}`);
      }

      // Get relevant content for the discipline
      const relevantContent = await this.vectorStore.getContentByDiscipline(discipline);

      const context = relevantContent
        .map(doc => doc.pageContent)
        .join('\n\n');

      const systemPrompt = `${this.config.getBrandNeutralSystemPrompt(discipline)}

${tutor.systemPrompt}

${this.config.getContentGuidelines()}

Relevant professional content:
${context}

Create a personalized learning path for a ${userLevel} level professional in ${discipline}.
User goals: ${goals.join(', ')}

Provide:
1. Specific learning recommendations
2. Next steps for skill development
3. Relevant industry resources and certifications

Focus on industry standards, safety protocols, and professional development opportunities.`;

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(`Create a learning path for ${userLevel} level ${discipline} professional with goals: ${goals.join(', ')}`)
      ];

      const response = await this.chatModel.invoke(messages);
      const responseText = response.content as string;

      // Parse response into structured format
      const recommendations = this.parseLearningPathResponse(responseText);

      return recommendations;

    } catch (error) {
      console.error('❌ Error generating learning path:', error);
      throw error;
    }
  }

  // Parse learning path response
  private parseLearningPathResponse(responseText: string): {
    recommendations: string[];
    nextSteps: string[];
    resources: string[];
  } {
    // Simple parsing - in a real implementation, you might use more sophisticated parsing
    const lines = responseText.split('\n').filter(line => line.trim());
    
    const recommendations: string[] = [];
    const nextSteps: string[] = [];
    const resources: string[] = [];

    let currentSection = 'recommendations';
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      if (lowerLine.includes('recommendation') || lowerLine.includes('learning')) {
        currentSection = 'recommendations';
      } else if (lowerLine.includes('next step') || lowerLine.includes('development')) {
        currentSection = 'nextSteps';
      } else if (lowerLine.includes('resource') || lowerLine.includes('certification')) {
        currentSection = 'resources';
      } else if (line.trim() && !line.startsWith('#')) {
        switch (currentSection) {
          case 'recommendations':
            recommendations.push(line.trim());
            break;
          case 'nextSteps':
            nextSteps.push(line.trim());
            break;
          case 'resources':
            resources.push(line.trim());
            break;
        }
      }
    }

    return { recommendations, nextSteps, resources };
  }

  // Generate assessment questions
  public async generateAssessmentQuestions(
    discipline: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    topic: string,
    count: number = 5
  ): Promise<{
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
      difficulty: string;
    }>;
  }> {
    try {
      const tutor = this.getTutorByDiscipline(discipline);
      if (!tutor) {
        throw new Error(`Tutor not found for discipline: ${discipline}`);
      }

      // Get relevant content for the topic
      const relevantContent = await this.vectorStore.searchContent(
        `${topic} ${discipline}`,
        discipline,
        5
      );

      const context = relevantContent
        .map(doc => doc.pageContent)
        .join('\n\n');

      const systemPrompt = `${this.config.getBrandNeutralSystemPrompt(discipline)}

${tutor.systemPrompt}

${this.config.getContentGuidelines()}

Relevant professional content:
${context}

Generate ${count} ${difficulty} level assessment questions about ${topic} in ${discipline}.

Each question should include:
- A clear, professional question
- 4 multiple choice options
- The correct answer
- A detailed explanation
- Appropriate difficulty level

Focus on industry standards, safety protocols, and practical knowledge.`;

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(`Generate ${count} ${difficulty} level questions about ${topic} in ${discipline}`)
      ];

      const response = await this.chatModel.invoke(messages);
      const responseText = response.content as string;

      // Parse questions from response
      const questions = this.parseAssessmentQuestions(responseText);

      return { questions };

    } catch (error) {
      console.error('❌ Error generating assessment questions:', error);
      throw error;
    }
  }

  // Parse assessment questions from response
  private parseAssessmentQuestions(responseText: string): Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    difficulty: string;
  }> {
    // Simple parsing - in a real implementation, you might use more sophisticated parsing
    const questions: Array<{
      question: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
      difficulty: string;
    }> = [];

    // This is a simplified parser - in production, you'd want more robust parsing
    const sections = responseText.split(/\d+\./).filter(section => section.trim());
    
    for (const section of sections) {
      const lines = section.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        const question = lines[0].trim();
        const options = lines.slice(1, 5).filter(line => line.trim());
        const correctAnswer = options[0] || 'A';
        const explanation = lines.slice(5).join(' ').trim() || 'Professional explanation based on industry standards.';
        
        questions.push({
          question,
          options,
          correctAnswer,
          explanation,
          difficulty: 'intermediate'
        });
      }
    }

    return questions;
  }
}

export default DivingTutorManager;
