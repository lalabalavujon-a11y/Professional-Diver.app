import { Request, Response } from 'express';
import LauraOracleService from '../laura-oracle-service';

// Initialize Laura Oracle service
const lauraOracle = LauraOracleService.getInstance();

/**
 * Chat with Laura Oracle - Main interface
 */
export async function chatWithLauraOracle(req: Request, res: Response) {
  try {
    const { message, sessionId, userContext } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    const result = await lauraOracle.chatWithOracle(message, sessionId, userContext);

    res.json({
      success: true,
      response: result.response,
      analytics: result.analytics,
      actions: result.actions,
      timestamp: result.timestamp,
      oracle: {
        name: "Laura",
        role: "Super Platform Oracle",
        capabilities: lauraOracle.getOracleInfo().capabilities
      }
    });

  } catch (error) {
    console.error('❌ Error in chatWithLauraOracle:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Full error:', errorMsg, errorStack);
    res.status(500).json({
      error: 'Failed to process Laura Oracle request',
      message: errorMsg,
      details: process.env.NODE_ENV === 'development' ? errorStack : undefined
    });
  }
}

/**
 * Get platform analytics from Laura Oracle
 */
export async function getPlatformAnalytics(req: Request, res: Response) {
  try {
    const analytics = await lauraOracle.getPlatformAnalytics();

    res.json({
      success: true,
      analytics,
      timestamp: new Date().toISOString(),
      oracle: {
        name: "Laura",
        role: "Super Platform Oracle"
      }
    });

  } catch (error) {
    console.error('❌ Error getting platform analytics:', error);
    res.status(500).json({
      error: 'Failed to get platform analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Execute administrative tasks through Laura Oracle
 */
export async function executeAdminTask(req: Request, res: Response) {
  try {
    const { task, parameters } = req.body;

    if (!task) {
      return res.status(400).json({
        error: 'Task is required'
      });
    }

    const result = await lauraOracle.executeAdminTask(task, parameters);

    res.json({
      success: result.success,
      result: result.result,
      message: result.message,
      timestamp: new Date().toISOString(),
      oracle: {
        name: "Laura",
        role: "Super Platform Oracle"
      }
    });

  } catch (error) {
    console.error('❌ Error executing admin task:', error);
    res.status(500).json({
      error: 'Failed to execute admin task',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Learn from platform objectives via LangSmith
 */
export async function learnFromObjectives(req: Request, res: Response) {
  try {
    const { objectives } = req.body;

    if (!objectives || !Array.isArray(objectives)) {
      return res.status(400).json({
        error: 'Objectives array is required'
      });
    }

    await lauraOracle.learnFromObjectives(objectives);

    res.json({
      success: true,
      message: 'Laura Oracle learned from platform objectives',
      objectivesCount: objectives.length,
      timestamp: new Date().toISOString(),
      oracle: {
        name: "Laura",
        role: "Super Platform Oracle"
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
 * Generate voice response for Laura Oracle
 */
export async function generateVoiceResponse(req: Request, res: Response) {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Text is required for voice generation'
      });
    }

    const audioBuffer = await lauraOracle.generateVoiceResponse(text);

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
 * Get Laura Oracle information and capabilities
 */
export async function getLauraOracleInfo(req: Request, res: Response) {
  try {
    const oracleInfo = lauraOracle.getOracleInfo();

    res.json({
      success: true,
      oracle: oracleInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting Laura Oracle info:', error);
    res.status(500).json({
      error: 'Failed to get Laura Oracle information',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
