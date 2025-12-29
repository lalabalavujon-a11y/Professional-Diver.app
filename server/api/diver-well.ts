import { Request, Response } from 'express';
import DiverWellService from '../diver-well-service';

// Initialize Diver Well service
const diverWell = DiverWellService.getInstance();

/**
 * Chat with Diver Well Consultant - Main interface (Available to all users)
 */
export async function chatWithDiverWell(req: Request, res: Response) {
  try {
    const { message, sessionId, userContext } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    const result = await diverWell.chatWithConsultant(message, sessionId, userContext);

    res.json({
      success: true,
      response: result.response,
      actions: result.actions,
      timestamp: result.timestamp,
      consultant: {
        name: "Diver Well",
        role: "Commercial Diving Operations AI Consultant",
        capabilities: diverWell.getConsultantInfo().capabilities
      }
    });

  } catch (error) {
    console.error('❌ Error in chatWithDiverWell:', error);
    res.status(500).json({
      error: 'Failed to process Diver Well request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Learn from diving operations objectives via LangSmith
 */
export async function learnFromObjectives(req: Request, res: Response) {
  try {
    const { objectives } = req.body;

    if (!objectives || !Array.isArray(objectives)) {
      return res.status(400).json({
        error: 'Objectives array is required'
      });
    }

    await diverWell.learnFromObjectives(objectives);

    res.json({
      success: true,
      message: 'Diver Well learned from diving operations objectives',
      objectivesCount: objectives.length,
      timestamp: new Date().toISOString(),
      consultant: {
        name: "Diver Well",
        role: "Commercial Diving Operations AI Consultant"
      }
    });

  } catch (error) {
    console.error('❌ Error learning from objectives:', error);
    res.status(500).json({
      error: 'Failed to learn from objectives',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Generate voice response for Diver Well Consultant
 */
export async function generateVoiceResponse(req: Request, res: Response) {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Text is required for voice generation'
      });
    }

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OpenAI API key not found, voice generation disabled');
      return res.status(503).json({
        error: 'Voice service unavailable',
        message: 'OpenAI API key is not configured. Please contact the administrator.',
        requiresApiKey: true
      });
    }

    const audioBuffer = await diverWell.generateVoiceResponse(text);

    if (!audioBuffer) {
      return res.status(500).json({
        error: 'Failed to generate voice response',
        message: 'Voice generation returned null. Check OpenAI API key and service status.',
        requiresApiKey: true
      });
    }

    // Set appropriate headers for audio response
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    res.send(audioBuffer);

  } catch (error) {
    console.error('❌ Error generating voice response:', error);
    res.status(500).json({
      error: 'Failed to generate voice response',
      message: error instanceof Error ? error.message : 'Unknown error',
      requiresApiKey: true
    });
  }
}

/**
 * Get Diver Well Consultant information and capabilities
 */
export async function getDiverWellInfo(req: Request, res: Response) {
  try {
    const consultantInfo = diverWell.getConsultantInfo();

    res.json({
      success: true,
      consultant: consultantInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting Diver Well info:', error);
    res.status(500).json({
      error: 'Failed to get Diver Well information',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}





