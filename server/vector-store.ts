import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from '@langchain/core/documents';
import { db } from './db';
import * as schema from '@shared/schema';
import LangChainConfig from './langchain-config';

export class ProfessionalDivingVectorStore {
  private static instance: ProfessionalDivingVectorStore;
  private vectorStore: MemoryVectorStore | null = null;
  private config: LangChainConfig;

  private constructor() {
    this.config = LangChainConfig.getInstance();
  }

  public static getInstance(): ProfessionalDivingVectorStore {
    if (!ProfessionalDivingVectorStore.instance) {
      ProfessionalDivingVectorStore.instance = new ProfessionalDivingVectorStore();
    }
    return ProfessionalDivingVectorStore.instance;
  }

  // Load all lessons from database and create brand-neutral content
  private async loadLessonsFromDatabase(): Promise<Document[]> {
    try {
      console.log('📚 Loading professional diving lessons from database...');
      
      // Load lessons from database (this would need to be adapted based on your actual schema)
      // For now, we'll create brand-neutral content based on the existing lesson structure
      
      const documents: Document[] = [];
      
      // NDT (Non-Destructive Testing) Content
      documents.push(new Document({
        pageContent: `Non-Destructive Testing (NDT) Fundamentals

NDT is a critical component of underwater inspection operations in commercial diving. This discipline focuses on evaluating the integrity of underwater structures without causing damage.

Key NDT Methods:
- Visual Inspection: Systematic examination of surfaces for defects
- Ultrasonic Testing: Using sound waves to detect internal flaws
- Magnetic Particle Testing: Detecting surface and near-surface cracks
- Dye Penetrant Testing: Identifying surface-breaking defects
- Eddy Current Testing: Detecting surface and subsurface flaws

Safety Protocols:
- Pre-dive safety briefings
- Equipment calibration and verification
- Emergency procedures and communication protocols
- Documentation standards for regulatory compliance

Industry Standards:
- IMCA guidelines for underwater inspection
- ADCI standards for commercial diving operations
- OSHA regulations for workplace safety
- ASTM standards for NDT procedures

Career Development:
- NDT Level I, II, and III certifications
- Specialized training in advanced NDT methods
- Continuing education requirements
- Professional development opportunities`,
        metadata: {
          discipline: 'NDT',
          category: 'inspection',
          difficulty: 'intermediate',
          certification: 'NDT Level I/II',
          industryStandards: ['IMCA', 'ADCI', 'OSHA', 'ASTM']
        }
      }));

      // LST (Life Support Technician) Content
      documents.push(new Document({
        pageContent: `Life Support Technician (LST) Training

LSTs are responsible for maintaining life support systems and ensuring diver safety during commercial diving operations.

Core Responsibilities:
- Life support system operation and maintenance
- Gas mixing and analysis
- Emergency response procedures
- Equipment troubleshooting and repair
- Safety monitoring and documentation

Technical Skills:
- Hyperbaric chamber operation
- Gas analysis and mixing procedures
- Emergency life support protocols
- Equipment maintenance and calibration
- Safety system monitoring

Safety Protocols:
- Emergency response procedures
- Gas contamination prevention
- Equipment failure protocols
- Communication systems maintenance
- Documentation and reporting

Industry Standards:
- IMCA guidelines for life support operations
- ADCI standards for commercial diving
- OSHA regulations for workplace safety
- Professional certification requirements

Career Path:
- LST certification programs
- Advanced life support training
- Supervisor certification opportunities
- Continuing education requirements`,
        metadata: {
          discipline: 'LST',
          category: 'life-support',
          difficulty: 'intermediate',
          certification: 'LST',
          industryStandards: ['IMCA', 'ADCI', 'OSHA']
        }
      }));

      // Assistant Life Support Technician Content
      documents.push(new Document({
        pageContent: `Assistant Life Support Technician Training

Assistant Life Support Technicians provide life support services for commercial diving operations, including life support systems and emergency response.

Advanced Responsibilities:
- Saturation diving life support
- Deep water operations support
- Complex gas mixing procedures
- Advanced emergency response
- Specialized equipment operation

Technical Expertise:
- Saturation diving systems
- Advanced gas analysis
- Hyperbaric medicine principles
- Emergency decompression procedures
- Complex life support systems

Safety Protocols:
- Saturation diving safety procedures
- Emergency decompression protocols
- Gas contamination prevention
- Equipment redundancy systems
- Advanced emergency response

Industry Standards:
- IMCA guidelines for saturation diving
- ADCI standards for advanced operations
- OSHA regulations for workplace safety
- Professional certification requirements

Career Advancement:
- Assistant Life Support Technician certification programs
- Life support system specialization
- Supervisor certification opportunities
- Advanced technical training`,
        metadata: {
          discipline: 'Assistant Life Support Technician',
          category: 'assistant-life-support',
          difficulty: 'intermediate',
          certification: 'Assistant Life Support Technician',
          industryStandards: ['IMCA', 'ADCI', 'OSHA']
        }
      }));

      // DMT (Dive Medical Technician) Content
      documents.push(new Document({
        pageContent: `Dive Medical Technician (DMT) Training

DMTs provide essential medical support for commercial diving operations, specializing in diving medicine and emergency response.

Medical Responsibilities:
- Diving medical examinations
- Emergency medical response
- Hyperbaric medicine applications
- Medical equipment operation
- Health and safety monitoring

Medical Knowledge:
- Diving physiology and medicine
- Decompression sickness treatment
- Hyperbaric oxygen therapy
- Emergency medical procedures
- Medical equipment maintenance

Safety Protocols:
- Medical emergency response
- Hyperbaric treatment procedures
- Medical equipment protocols
- Health monitoring procedures
- Documentation and reporting

Industry Standards:
- IMCA guidelines for diving medicine
- ADCI standards for medical support
- OSHA regulations for workplace safety
- Professional medical certification

Career Development:
- DMT certification programs
- Advanced medical training
- Hyperbaric medicine specialization
- Continuing medical education`,
        metadata: {
          discipline: 'DMT',
          category: 'diving-medicine',
          difficulty: 'advanced',
          certification: 'DMT',
          industryStandards: ['IMCA', 'ADCI', 'OSHA']
        }
      }));

      // Commercial Dive Supervisor Content
      documents.push(new Document({
        pageContent: `Commercial Dive Supervisor Training

Commercial Dive Supervisors oversee all aspects of commercial diving operations, ensuring safety, efficiency, and regulatory compliance.

Supervisory Responsibilities:
- Operation planning and coordination
- Safety oversight and compliance
- Team management and leadership
- Regulatory compliance monitoring
- Emergency response coordination

Leadership Skills:
- Team management and communication
- Safety leadership and culture
- Operational planning and execution
- Risk assessment and mitigation
- Regulatory compliance management

Safety Protocols:
- Comprehensive safety oversight
- Emergency response coordination
- Regulatory compliance monitoring
- Safety culture development
- Incident investigation and reporting

Industry Standards:
- IMCA guidelines for dive supervision
- ADCI standards for commercial operations
- OSHA regulations for workplace safety
- Professional certification requirements

Career Advancement:
- Commercial Dive Supervisor certification
- Advanced supervisory training
- Management and leadership development
- Continuing education requirements`,
        metadata: {
          discipline: 'Commercial Dive Supervisor',
          category: 'supervision',
          difficulty: 'expert',
          certification: 'Commercial Dive Supervisor',
          industryStandards: ['IMCA', 'ADCI', 'OSHA']
        }
      }));

      console.log(`✅ Loaded ${documents.length} brand-neutral professional diving lessons`);
      return documents;
      
    } catch (error) {
      console.error('❌ Error loading lessons from database:', error);
      throw error;
    }
  }

  // Create text splitter for chunking content
  private createTextSplitter(): RecursiveCharacterTextSplitter {
    return new RecursiveCharacterTextSplitter({
      chunkSize: parseInt(process.env.VECTOR_STORE_CHUNK_SIZE || '1000'),
      chunkOverlap: parseInt(process.env.VECTOR_STORE_CHUNK_OVERLAP || '200'),
      separators: ['\n\n', '\n', '. ', '! ', '? ', ' ', ''],
    });
  }

  // Initialize vector store with brand-neutral content
  public async initializeVectorStore(): Promise<void> {
    try {
      console.log('🚀 Initializing professional diving vector store...');
      
      // Load lessons and create documents
      const documents = await this.loadLessonsFromDatabase();
      
      // Create text splitter
      const textSplitter = this.createTextSplitter();
      
      // Split documents into chunks
      const splitDocuments = await textSplitter.splitDocuments(documents);
      
      // Create vector store with embeddings
      this.vectorStore = await MemoryVectorStore.fromDocuments(
        splitDocuments,
        this.config.getEmbeddings()
      );
      
      console.log(`✅ Vector store initialized with ${splitDocuments.length} document chunks`);
      console.log('🎯 All content is brand-neutral and industry-focused');
      
    } catch (error) {
      console.error('❌ Error initializing vector store:', error);
      throw error;
    }
  }

  // Get vector store instance
  public getVectorStore(): MemoryVectorStore | null {
    return this.vectorStore;
  }

  // Search for relevant content
  public async searchContent(query: string, discipline?: string, limit: number = 5): Promise<Document[]> {
    if (!this.vectorStore) {
      throw new Error('Vector store not initialized. Call initializeVectorStore() first.');
    }

    try {
      const results = await this.vectorStore.similaritySearch(query, limit);
      
      // Filter by discipline if specified
      if (discipline) {
        return results.filter(doc => 
          doc.metadata.discipline === discipline || 
          doc.metadata.category === discipline
        );
      }
      
      return results;
    } catch (error) {
      console.error('❌ Error searching vector store:', error);
      throw error;
    }
  }

  // Get content by discipline
  public async getContentByDiscipline(discipline: string): Promise<Document[]> {
    if (!this.vectorStore) {
      throw new Error('Vector store not initialized. Call initializeVectorStore() first.');
    }

    try {
      const results = await this.vectorStore.similaritySearch(
        `${discipline} training professional diving`,
        10
      );
      
      return results.filter(doc => 
        doc.metadata.discipline === discipline || 
        doc.metadata.category === discipline
      );
    } catch (error) {
      console.error('❌ Error getting content by discipline:', error);
      throw error;
    }
  }
}

export default ProfessionalDivingVectorStore;
