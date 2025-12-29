import { Request, Response } from 'express';
import DivingTutorManager from '../ai-tutors';
import ProfessionalDivingVectorStore from '../vector-store';

// Initialize managers
const tutorManager = DivingTutorManager.getInstance();
const vectorStore = ProfessionalDivingVectorStore.getInstance();

// Chat with AI tutor
export async function chatWithTutor(req: Request, res: Response) {
  try {
    const { discipline, message, sessionId } = req.body;

    if (!discipline || !message) {
      return res.status(400).json({
        error: 'Discipline and message are required'
      });
    }

    const result = await tutorManager.chatWithTutor(discipline, message, sessionId);

    res.json({
      success: true,
      response: result.response,
      tutor: result.tutor,
      relevantContent: result.relevantContent?.map(doc => ({
        content: doc.pageContent.substring(0, 200) + '...',
        metadata: doc.metadata
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in chatWithTutor:', error);
    res.status(500).json({
      error: 'Failed to process chat request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Get available tutors
export async function getAvailableTutors(req: Request, res: Response) {
  try {
    const tutors = tutorManager.getAvailableTutors();

    res.json({
      success: true,
      tutors: tutors.map(tutor => ({
        id: tutor.id,
        name: tutor.name,
        discipline: tutor.discipline,
        specialty: tutor.specialty,
        avatar: tutor.avatar,
        background: tutor.background,
        traits: tutor.traits
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in getAvailableTutors:', error);
    res.status(500).json({
      error: 'Failed to get available tutors',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Generate learning path
export async function generateLearningPath(req: Request, res: Response) {
  try {
    const { discipline, userLevel, goals } = req.body;

    if (!discipline || !userLevel || !goals) {
      return res.status(400).json({
        error: 'Discipline, userLevel, and goals are required'
      });
    }

    const result = await tutorManager.generateLearningPath(discipline, userLevel, goals);

    res.json({
      success: true,
      learningPath: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in generateLearningPath:', error);
    res.status(500).json({
      error: 'Failed to generate learning path',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Generate assessment questions
export async function generateAssessmentQuestions(req: Request, res: Response) {
  try {
    const { discipline, difficulty, topic, count } = req.body;

    if (!discipline || !difficulty || !topic) {
      return res.status(400).json({
        error: 'Discipline, difficulty, and topic are required'
      });
    }

    const result = await tutorManager.generateAssessmentQuestions(
      discipline,
      difficulty,
      topic,
      count || 5
    );

    res.json({
      success: true,
      questions: result.questions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in generateAssessmentQuestions:', error);
    res.status(500).json({
      error: 'Failed to generate assessment questions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Search content
export async function searchContent(req: Request, res: Response) {
  try {
    const { query, discipline, limit } = req.query;

    if (!query) {
      return res.status(400).json({
        error: 'Query parameter is required'
      });
    }

    const results = await vectorStore.searchContent(
      query as string,
      discipline as string,
      parseInt(limit as string) || 5
    );

    res.json({
      success: true,
      results: results.map(doc => ({
        content: doc.pageContent,
        metadata: doc.metadata
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in searchContent:', error);
    res.status(500).json({
      error: 'Failed to search content',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Get content by discipline
export async function getContentByDiscipline(req: Request, res: Response) {
  try {
    const { discipline } = req.params;

    if (!discipline) {
      return res.status(400).json({
        error: 'Discipline parameter is required'
      });
    }

    const results = await vectorStore.getContentByDiscipline(discipline);

    res.json({
      success: true,
      discipline,
      content: results.map(doc => ({
        content: doc.pageContent,
        metadata: doc.metadata
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in getContentByDiscipline:', error);
    res.status(500).json({
      error: 'Failed to get content by discipline',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Initialize vector store
export async function initializeVectorStore(req: Request, res: Response) {
  try {
    await vectorStore.initializeVectorStore();

    res.json({
      success: true,
      message: 'Vector store initialized successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in initializeVectorStore:', error);
    res.status(500).json({
      error: 'Failed to initialize vector store',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Get system status
export async function getSystemStatus(req: Request, res: Response) {
  try {
    const vectorStoreStatus = vectorStore.getVectorStore() ? 'initialized' : 'not initialized';
    const tutors = tutorManager.getAvailableTutors();

    res.json({
      success: true,
      status: {
        vectorStore: vectorStoreStatus,
        availableTutors: tutors.length,
        disciplines: tutors.map(tutor => tutor.discipline),
        brandNeutrality: 'enforced',
        industryStandards: ['IMCA', 'ADCI', 'OSHA', 'ASTM']
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in getSystemStatus:', error);
    res.status(500).json({
      error: 'Failed to get system status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Get session history (placeholder for future implementation)
export async function getSessionHistory(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;

    // This would be implemented with a proper session storage system
    res.json({
      success: true,
      sessionId,
      history: [],
      message: 'Session history not yet implemented',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in getSessionHistory:', error);
    res.status(500).json({
      error: 'Failed to get session history',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
