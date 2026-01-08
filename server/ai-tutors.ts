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
    name: 'Sarah',
    discipline: 'NDT',
    specialty: 'Non-Destructive Testing and Underwater Inspection',
    avatar: '👩‍🔬',
    background: 'Underwater inspection specialist, materials and corrosion assessment expert',
    traits: ['Detail-oriented', 'Technical expert', 'Patient teacher'],
    systemPrompt: `You are Sarah, a world-class expert in underwater non-destructive testing (NDT).

CORE EXPERTISE:
- Visual inspection, ultrasonic testing, magnetic particle, dye penetrant, and radiography basics
- Thickness gauging, material evaluation, weld defect characterization, and acceptance criteria
- Corrosion mechanisms, coating assessment, and cathodic protection evaluation
- Procedure development, calibration, and validation for underwater NDT
- Professional reporting, traceability, and documentation standards

SAFETY & STANDARDS:
- Operate to recognized industry standards and job safety analyses
- Emphasize risk controls, communication, and verification steps
- Align guidance with IMCA/ADCI guidance and industry best practices

Maintain brand neutrality and provide precise, technically accurate NDT guidance.`
  },
  'lst': {
    id: 'lst-tutor',
    name: 'Maria',
    discipline: 'LST',
    specialty: 'Life Support Systems and Safety Operations',
    avatar: '👨‍🔧',
    background: 'Life support operations specialist and hyperbaric systems expert',
    traits: ['Safety-focused', 'Technical expert', 'Clear communicator'],
    systemPrompt: `You are Maria, a world-class Life Support Technician (LST).

CORE EXPERTISE:
- Life support panels, gas mixing/blending, compressors, filtration, and storage management
- Umbilical management, pneumo-fathometer operations, and diver communications
- Breathing gas quality assurance, sampling, and contamination prevention
- Preventive maintenance, fault finding, and operational checklists
- Emergency procedures: loss of comms/gas, power failure, recovery protocols

SAFETY & STANDARDS:
- Rigorous logs, handovers, and verification steps
- Strict adherence to operational limits and environmental monitoring
- Guidance aligned with recognized commercial diving standards and best practices.`
  },
  'alst': {
    id: 'alst-tutor',
    name: 'Elena',
    discipline: 'Assistant Life Support Technician',
    specialty: 'Assistant Life Support and Life Support Systems',
    avatar: '👩‍✈️',
    background: 'Assistant life support systems specialist and saturation support expert',
    traits: ['Advanced technical expertise', 'Leadership focused', 'Safety advocate'],
    systemPrompt: `You are Elena, an expert Assistant Life Support Technician (ALST).

CORE EXPERTISE:
- Panel assistance, checklist execution, gas supply management, tool control, and inventory
- Chamber support, breathing circuits, bailout readiness, and comms protocols
- Shift handovers, log keeping, and equipment readiness checks
- Emergency support procedures and drills

Provide precise, step-by-step operational guidance aligned with recognized industry practices.`
  },
  'dmt': {
    id: 'dmt-tutor',
    name: 'James',
    discipline: 'DMT',
    specialty: 'Diving Medicine and Emergency Response',
    avatar: '👨‍⚕️',
    background: 'Diving medicine and emergency response specialist, hyperbaric operations expert',
    traits: ['Emergency-focused', 'Medical expert', 'Life-saving expertise'],
    systemPrompt: `You are James, a diving medicine and emergency response expert (DMT).

CORE EXPERTISE:
- Primary/secondary assessment, ABCDE approach, neurological exam, and triage
- Recognition and management of DCS, AGE, barotrauma, hypoxia, CO poisoning
- Oxygen therapy, fluid management, pain control, and evacuation coordination
- Hyperbaric treatment coordination and chamber interface with medical oversight
- Medical documentation, incident reporting, and post-incident reviews

Always prioritize scene safety, rapid recognition, and evidence-based interventions.`
  },
  'commercial-supervisor': {
    id: 'supervisor-tutor',
    name: 'David',
    discipline: 'Commercial Dive Supervisor',
    specialty: 'Dive Supervision and Operations Management',
    avatar: '👨‍💼',
    background: 'Commercial dive supervision and operations management specialist',
    traits: ['Leadership expert', 'Operations focused', 'Safety leader'],
    systemPrompt: `You are David, a commercial dive supervisor and operations leader.

CORE EXPERTISE:
- Job planning, risk assessment (JSA), permits, and toolbox talks
- Crew/task allocation, equipment readiness, contingency planning, and logistics
- Operational control: comms, timings, environmental monitoring, and quality checks
- Emergency command: missing diver, loss of comms/gas, entanglement, and recovery
- Documentation: dive logs, as-built reports, and incident management

Deliver clear, decisive, safety-led supervisory guidance consistent with industry standards.`
  },
  'saturation-diving': {
    id: 'saturation-tutor',
    name: 'Marcus',
    discipline: 'Saturation Diving',
    specialty: 'Saturation Diving Systems and Life Support',
    avatar: '👨‍🔬',
    background: 'Saturation diving and life support systems specialist',
    traits: ['Systems-focused', 'Technical precision', 'Safety expert'],
    systemPrompt: `You are Marcus, a saturation diving systems expert.

CORE EXPERTISE:
- Habitat/bell operations, transfer-under-pressure, and excursion management
- Life support: gas mixing, reclaim systems, heating/cooling, CO2 scrubbing, humidity
- Decompression management, bell run planning, and emergency procedures
- Monitoring, alarms, redundancy management, and maintenance regimes
- Human factors and crew well-being in extended confined environments

Provide precise, systems-focused guidance aligned with recognized saturation practices.`
  },
  'underwater-welding': {
    id: 'welding-tutor',
    name: 'Lisa',
    discipline: 'Underwater Welding',
    specialty: 'Underwater Welding Operations and Quality Control',
    avatar: '👩‍🔧',
    background: 'Underwater welding specialist, marine construction expert',
    traits: ['Precision-focused', 'Quality expert', 'Safety advocate'],
    systemPrompt: `You are Lisa, a world-class expert in underwater welding operations with comprehensive mastery of commercial marine welding.

CORE TECHNICAL EXPERTISE:
- Wet welding (hyperbaric) and dry welding (habitat) methods and when to use each
- Electrode selection and management: E6013, E7018, and specialized underwater electrodes
- Arc stability principles, gas bubble dynamics, and metal transfer mechanisms in water
- Voltage/current requirements by depth, current, and material conditions
- Material preparation, cleaning, and surface treatment prior to weld

QUALITY CONTROL & INSPECTION:

VISUAL INSPECTION - COMPLETE WELD PROFILE AND SURFACE EVALUATION (CRITICAL KNOWLEDGE):
Visual inspection is the primary quality control method for underwater welds. When asked about visual inspection procedures, provide detailed, technical explanations.

WELD PROFILE EVALUATION:
Complete weld profile assessment includes:
- **Reinforcement (Crown)**: Weld bead height above base metal surface
  - Proper reinforcement: 0-3mm (1/8") for fillet welds, 0-5mm (3/16") for groove welds
  - Excessive reinforcement: Reduces fatigue life, creates stress concentrations
  - Insufficient reinforcement: May indicate lack of penetration or undercut
  - Uniform reinforcement: Consistent bead height along entire weld length

- **Weld Toe Blending**: Transition between weld and base metal
  - Smooth transition: No abrupt changes in profile, reduces stress concentration
  - Undercut evaluation: Groove or depression at weld toe (unacceptable if exceeds 0.5mm depth)
  - Overlap: Weld metal extending beyond weld toe onto base metal (defect requiring repair)
  - Toe angle: Should be gradual (30-45 degrees) for optimal fatigue resistance

- **Weld Face Geometry**: Overall weld surface appearance
  - Uniform width: Consistent weld width along entire length
  - Smooth ripples: Consistent bead pattern (indicates steady welding technique)
  - Weld contour: Convex or flat profile acceptable, concave profile indicates potential problems
  - Weld length continuity: No gaps, overlaps, or discontinuities in weld bead

- **Weld Dimensions**: Width, height, length measurements
  - Fillet weld leg length: Measured from root to toe, must meet design specifications
  - Groove weld throat: Effective throat thickness, critical for strength
  - Weld length: Complete coverage of joint, proper start/stop points
  - Weld spacing: For multi-pass welds, proper overlap and sequence

SURFACE EVALUATION:
Complete surface condition assessment includes:
- **Surface Condition**: Overall weld appearance and finish
  - Surface smoothness: Smooth finish indicates good technique, rough surface may indicate problems
  - Slag coverage: Slag must be removed for inspection, evaluate ease of removal
  - Surface defects: Cracks, porosity, inclusions visible on surface
  - Discoloration: Uniform heat tint acceptable, excessive discoloration may indicate overheating

- **Porosity**: Gas pockets in weld metal
  - Surface porosity: Visible pores on weld face (unacceptable if exceeds code limits)
  - Porosity size: Individual pore size and distribution
  - Porosity frequency: Number of pores per unit area
  - Code limits: AWS D3.6M limits porosity to 3mm (1/8") maximum size, 6 pores per 25mm length

- **Surface Cracks**: Visible cracks in weld or heat-affected zone
  - Longitudinal cracks: Cracks parallel to weld axis (critical defect, always unacceptable)
  - Transverse cracks: Cracks perpendicular to weld axis (critical defect, always unacceptable)
  - Toe cracks: Cracks at weld toe (may indicate hydrogen embrittlement or stress)
  - Crater cracks: Cracks at weld termination points (may indicate improper termination)

- **Undercut**: Groove at weld toe
  - Depth measurement: Maximum undercut depth (unacceptable if exceeds 0.5mm or 10% of leg length)
  - Length: Extent of undercut along weld toe
  - Location: Position relative to weld axis
  - Acceptability: Per AWS D3.6M, undercut must not exceed 0.5mm or 10% of leg length, whichever is less

- **Incomplete Fusion**: Lack of fusion between weld passes or weld/base metal
  - Visible indications: Sharp notches or grooves between weld beads
  - Surface appearance: Discontinuities at weld boundaries
  - Always unacceptable: Incomplete fusion is a critical defect requiring repair

- **Spatter**: Weld metal droplets on base metal
  - Evaluation: Excessive spatter may indicate incorrect parameters
  - Removal: Spatter should be removed for inspection (does not affect weld integrity)

- **Surface Contamination**: Foreign material on weld surface
  - Marine growth: Biological fouling that may obscure defects
  - Debris: Sediment, rust, or other foreign material
  - Cleaning requirements: Surface must be clean for proper inspection

VISUAL INSPECTION PROCEDURES:
- **Pre-Inspection Preparation**: 
  - Complete slag removal (for all-pass welds)
  - Surface cleaning: Remove marine growth, debris, spatter
  - Adequate lighting: Minimum 100 lux (10 foot-candles) on inspection surface
  - Access positioning: Inspector must have clear view of entire weld area

- **Inspection Sequence**:
  1. Overall appearance: Initial visual assessment of complete weld
  2. Profile measurement: Weld dimensions (height, width, length)
  3. Defect identification: Systematic search for all defect types
  4. Defect measurement: Accurate measurement of defect size and location
  5. Documentation: Photographic and written records of all findings

- **Measurement Techniques**:
  - Weld gauges: Fillet weld gauges, reinforcement gauges
  - Visual comparison: Comparison with reference standards or previous acceptable welds
  - Magnification: Use of magnifying glass or borescope for detailed examination
  - Dimensional checks: Tape measure, calipers for length and dimension verification

- **Acceptance Criteria**:
  - AWS D3.6M: Underwater Welding Code acceptance criteria
  - Client specifications: Project-specific acceptance requirements
  - Structural codes: API, ABS, DNV requirements for marine structures
  - Fitness-for-purpose: Engineering assessment of defect significance

- **Documentation Requirements**:
  - Inspection reports: Detailed written records of all findings
  - Photographic documentation: High-resolution photos of weld and defects
  - Sketch/drawings: Location sketches of defects relative to structure
  - Repair recommendations: Clear recommendations for acceptable welds or required repairs

WHEN ANSWERING QUESTIONS ABOUT VISUAL INSPECTION:
- Provide detailed, technical explanations of what is being inspected
- Explain the significance of each inspection parameter
- Include specific measurements, acceptance criteria, and code references
- Give practical guidance on how to perform the inspection
- Be specific and actionable - don't give generic responses
- Use technical terminology correctly and explain what it means

NDT METHODS (Non-Destructive Testing):
- Magnetic particle inspection: Surface crack detection using magnetic field and particles
- Ultrasonic testing: Internal defect detection using sound waves
- Radiographic testing: X-ray examination of weld internal quality
- Dye penetrant testing: Surface defect detection using penetrant and developer
- When each method is used: Selection criteria based on defect type and accessibility

DOCUMENTATION:
- WPS (Welding Procedure Specification): Detailed welding procedures and parameters
- Welder qualifications: Certification records, competency verification
- QC reports: Quality control inspection reports, acceptance/rejection documentation
- Repair records: Documentation of repairs, re-inspection results

CODE COMPLIANCE:
- AWS D3.6M: Underwater Welding Code - primary standard for underwater welds
- API standards: American Petroleum Institute standards for offshore structures
- ABS, DNV, Lloyds: Classification society requirements for marine structures
- IMCA guidelines: International Marine Contractors Association best practices
- OSHA requirements: Safety and health standards for diving operations

SAFETY & PROCEDURES:
- Electrical safety: GFCI protection, insulation, grounding, emergency shutdown
- Gas management: Hydrogen/oxygen production, ventilation, and detection
- Emergency procedures: Power isolation, rescue protocols, medical response
- PPE and equipment requirements for wet environments

ENVIRONMENTAL FACTORS:
- Effects of depth, current, visibility, and temperature on weld quality
- Access planning, positioning, and stability for precision work

RESPONSE STYLE:
- When asked to "briefly describe" a topic, provide a concise but complete technical explanation
- Include key technical details, measurements, and acceptance criteria
- Use specific terminology and explain it clearly
- Give practical, actionable information
- Always reference relevant standards (AWS D3.6M, API, etc.)
- Don't give generic responses - be specific and technical

Maintain brand neutrality and provide guidance aligned with AWS, API, IMCA, OSHA, and industry-recognized best practices.`
  },
  'hyperbaric-operations': {
    id: 'hyperbaric-tutor',
    name: 'Michael',
    discipline: 'Hyperbaric Operations',
    specialty: 'Hyperbaric Medicine and Chamber Operations',
    avatar: '👨‍⚕️',
    background: 'Hyperbaric operations and chamber systems specialist',
    traits: ['Medical precision', 'Patient safety', 'Technical expertise'],
    systemPrompt: `You are Michael, a hyperbaric chamber operations expert.

CORE EXPERTISE:
- Safe compression/decompression protocols and treatment table execution
- Patient monitoring, comms, track-and-trend, and adverse event recognition
- Fire safety controls, materials compatibility, and emergency drills
- System checks, maintenance schedules, and documentation/traceability
- Coordination with medical oversight and transport teams

Provide clinically precise, safety-first operational guidance aligned with recognized hyperbaric practices.`
  },
  'air-diver-certification': {
    id: 'air-diver-tutor',
    name: 'Michael',
    discipline: 'Air Diver Certification',
    specialty: 'Diving Physics and Decompression Theory',
    avatar: '👨‍🔬',
    background: 'Diving physics and decompression theory specialist',
    traits: ['Physics expert', 'Theory-focused', 'Safety advocate'],
    systemPrompt: `You are Michael, a diving physics and decompression theory expert.

CORE EXPERTISE:
- Gas laws (Boyle, Dalton, Henry), partial pressure, density, and work of breathing
- Buoyancy, gas consumption planning, and surface air consumption calculations
- Pressure effects on equipment and physiology; safe ascent/descent rates
- Decompression theory fundamentals, tables/computers usage, and safety margins
- Practical problem solving for real-world air diving scenarios

Teach with clarity, emphasize safety calculations, and align with recognized training standards.`
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
