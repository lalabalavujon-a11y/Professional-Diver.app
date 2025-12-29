import { Request, Response } from 'express';
import LauraOracleService from '../laura-oracle-service';
import { db } from '../db';
import { users } from '../../shared/schema-sqlite';
import { eq } from 'drizzle-orm';

// Initialize Laura Oracle service
const lauraOracle = LauraOracleService.getInstance();

/**
 * Middleware to check if user has admin access
 */
async function requireAdminAccess(req: Request, res: Response, next: Function) {
  try {
    // Get user email from query params or headers
    const userEmail = req.query.email as string || req.headers['x-user-email'] as string || 'lalabalavu.jon@gmail.com';
    
    // Check if user exists and has admin role
    const user = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
    
    if (!user.length) {
      return res.status(401).json({
        error: 'User not found',
        message: 'Authentication required'
      });
    }

    const currentUser = user[0];
    const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'PARTNER_ADMIN';

    if (!isAdmin) {
      return res.status(403).json({
        error: 'Admin access required',
        message: 'Laura Oracle is restricted to administrators only'
      });
    }

    // Add user to request for use in handlers
    (req as any).user = currentUser;
    next();
  } catch (error) {
    console.error('❌ Error checking admin access:', error);
    res.status(500).json({
      error: 'Authentication error',
      message: 'Failed to verify admin access'
    });
  }
}

/**
 * Chat with Laura Oracle - Main interface (Admin Only)
 */
export async function chatWithLauraOracle(req: Request, res: Response) {
  // Check admin access first
  return requireAdminAccess(req, res, async () => {
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
    res.status(500).json({
      error: 'Failed to process Laura Oracle request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  });
}

/**
 * Get platform analytics from Laura Oracle (Admin Only)
 */
export async function getPlatformAnalytics(req: Request, res: Response) {
  // Check admin access first
  return requireAdminAccess(req, res, async () => {
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
  });
}

/**
 * Execute administrative tasks through Laura Oracle (Admin Only)
 */
export async function executeAdminTask(req: Request, res: Response) {
  // Check admin access first
  return requireAdminAccess(req, res, async () => {
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
  });
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

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OpenAI API key not found, voice generation disabled');
      return res.status(503).json({
        error: 'Voice service unavailable',
        message: 'OpenAI API key is not configured. Please contact the administrator.',
        requiresApiKey: true
      });
    }

    const audioBuffer = await lauraOracle.generateVoiceResponse(text);

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
 * Chat with Laura for user support (Available to all users)
 */
export async function chatForUserSupport(req: Request, res: Response) {
  try {
    const { message, sessionId, userContext } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    const result = await lauraOracle.chatForUserSupport(message, sessionId, userContext);

    res.json({
      success: true,
      response: result.response,
      timestamp: result.timestamp,
      mode: result.mode,
      assistant: {
        name: "Laura",
        role: "AI Assistant",
        mode: "user-support"
      }
    });

  } catch (error) {
    console.error('❌ Error in chatForUserSupport:', error);
    res.status(500).json({
      error: 'Failed to process user support request',
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
