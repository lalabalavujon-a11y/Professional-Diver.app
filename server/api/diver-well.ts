import { Request, Response } from 'express';
import DiverWellService from '../diver-well-service';

// Initialize Diver Well service
const diverWell = DiverWellService.getInstance();

/**
 * Chat with Diver Well Consultant - Main interface
 */
export async function chatWithDiverWell(req: Request, res: Response) {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    const result = await diverWell.chatWithConsultant(message, sessionId);

    res.json({
      success: true,
      response: result.response,
      timestamp: result.timestamp,
      consultant: {
        name: "Diver Well",
        role: "Commercial Diving AI Consultant",
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
 * Generate voice response for Diver Well
 */
export async function generateVoiceResponse(req: Request, res: Response) {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Text is required for voice generation'
      });
    }

    const audioBuffer = await diverWell.generateVoiceResponse(text);

    if (!audioBuffer) {
      return res.status(500).json({
        error: 'Failed to generate voice response'
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
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get Diver Well information and capabilities
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

