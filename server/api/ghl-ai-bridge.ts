/**
 * 🤖 GHL AI Bridge API Routes
 * 
 * API endpoints for GHL AI Agent integration with LangChain
 * Provides intelligent lead qualification, course recommendations,
 * and bi-directional conversation handling.
 */

import { Request, Response } from 'express';
import { GHLAIBridgeService } from '../ghl-ai-bridge';
import { LauraOracleService } from '../laura-oracle-service';
import { getGHLService } from '../ghl-integration';

// Initialize services
const ghlAIBridge = GHLAIBridgeService.getInstance();
const lauraOracle = LauraOracleService.getInstance();

// Connect services
const ghlService = getGHLService();
if (ghlService) {
  ghlAIBridge.setGHLService(ghlService);
  lauraOracle.setGHLService(ghlService);
}

/**
 * Qualify a lead using Laura Oracle's intelligence
 */
export async function qualifyLead(req: Request, res: Response) {
  try {
    const { contactData } = req.body;

    if (!contactData || !contactData.email) {
      return res.status(400).json({
        error: 'Contact data with email is required'
      });
    }

    const qualification = await ghlAIBridge.qualifyLeadWithLaura(contactData);

    res.json({
      success: true,
      qualification,
      timestamp: new Date().toISOString(),
      qualifiedBy: 'Laura Oracle AI'
    });

  } catch (error) {
    console.error('❌ Error in qualifyLead:', error);
    res.status(500).json({
      error: 'Failed to qualify lead',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Batch qualify multiple leads
 */
export async function batchQualifyLeads(req: Request, res: Response) {
  try {
    const { contacts } = req.body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({
        error: 'Array of contacts is required'
      });
    }

    if (contacts.length > 50) {
      return res.status(400).json({
        error: 'Maximum 50 contacts per batch'
      });
    }

    const qualifications = await ghlAIBridge.batchQualifyLeads(contacts);

    res.json({
      success: true,
      qualifications,
      totalProcessed: qualifications.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in batchQualifyLeads:', error);
    res.status(500).json({
      error: 'Failed to batch qualify leads',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Generate course recommendations for a GHL contact
 */
export async function recommendCourses(req: Request, res: Response) {
  try {
    const { contactId, studentContext } = req.body;

    if (!contactId) {
      return res.status(400).json({
        error: 'Contact ID is required'
      });
    }

    const recommendations = await ghlAIBridge.generateCourseRecommendations(
      contactId, 
      studentContext
    );

    res.json({
      success: true,
      recommendations,
      contactId,
      timestamp: new Date().toISOString(),
      generatedBy: 'Laura Oracle AI'
    });

  } catch (error) {
    console.error('❌ Error in recommendCourses:', error);
    res.status(500).json({
      error: 'Failed to generate course recommendations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Handle GHL conversation with AI agents
 */
export async function handleConversation(req: Request, res: Response) {
  try {
    const { message, conversationContext } = req.body;

    if (!message || !conversationContext || !conversationContext.contactId) {
      return res.status(400).json({
        error: 'Message and conversation context with contactId are required'
      });
    }

    const aiResponse = await ghlAIBridge.handleGHLConversation(
      message,
      conversationContext
    );

    res.json({
      success: true,
      aiResponse,
      conversationId: conversationContext.contactId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in handleConversation:', error);
    res.status(500).json({
      error: 'Failed to handle conversation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Laura Oracle direct GHL lead qualification
 */
export async function lauraQualifyLead(req: Request, res: Response) {
  try {
    const { contactData } = req.body;

    if (!contactData || !contactData.email) {
      return res.status(400).json({
        error: 'Contact data with email is required'
      });
    }

    const qualification = await lauraOracle.qualifyGHLLead(contactData);

    res.json({
      success: true,
      qualification,
      oracle: {
        name: 'Laura',
        role: 'Super Platform Oracle',
        confidence: qualification.score >= 70 ? 'high' : qualification.score >= 40 ? 'medium' : 'low'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in lauraQualifyLead:', error);
    res.status(500).json({
      error: 'Failed to qualify lead with Laura',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Laura Oracle course recommendations for GHL contact
 */
export async function lauraRecommendCourses(req: Request, res: Response) {
  try {
    const { contactData } = req.body;

    if (!contactData || !contactData.email) {
      return res.status(400).json({
        error: 'Contact data with email is required'
      });
    }

    const recommendations = await lauraOracle.recommendCoursesForGHLContact(contactData);

    res.json({
      success: true,
      recommendations,
      oracle: {
        name: 'Laura',
        role: 'Super Platform Oracle',
        expertise: 'Professional Diving Education'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in lauraRecommendCourses:', error);
    res.status(500).json({
      error: 'Failed to get course recommendations from Laura',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Laura Oracle GHL conversation handling
 */
export async function lauraHandleConversation(req: Request, res: Response) {
  try {
    const { message, contactData, conversationHistory } = req.body;

    if (!message || !contactData) {
      return res.status(400).json({
        error: 'Message and contact data are required'
      });
    }

    const conversationResponse = await lauraOracle.chatWithOracle(
      message,
      undefined,
      { contactData, conversationHistory }
    );

    res.json({
      success: true,
      response: conversationResponse.response,
      actions: conversationResponse.actions || [],
      tags: ['Laura Oracle', 'AI Conversation'],
      escalate: false,
      oracle: {
        name: 'Laura',
        personality: 'Friendly, knowledgeable country girl',
        expertise: 'Complete platform administration'
      },
      timestamp: conversationResponse.timestamp
    });

  } catch (error) {
    console.error('❌ Error in lauraHandleConversation:', error);
    res.status(500).json({
      error: 'Failed to handle conversation with Laura',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Monitor student engagement and trigger GHL workflows
 */
export async function monitorEngagement(req: Request, res: Response) {
  try {
    await ghlAIBridge.monitorStudentEngagement();

    res.json({
      success: true,
      message: 'Student engagement monitoring completed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in monitorEngagement:', error);
    res.status(500).json({
      error: 'Failed to monitor student engagement',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get GHL workflow optimization recommendations from Laura
 */
export async function optimizeWorkflows(req: Request, res: Response) {
  try {
    const optimization = await lauraOracle.optimizeGHLWorkflows();

    res.json({
      success: true,
      optimization,
      oracle: {
        name: 'Laura',
        role: 'Super Platform Oracle',
        focus: 'Workflow optimization and automation'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in optimizeWorkflows:', error);
    res.status(500).json({
      error: 'Failed to get workflow optimization recommendations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Test GHL AI Bridge connection and capabilities
 */
export async function testConnection(req: Request, res: Response) {
  try {
    const ghlService = getGHLService();
    const ghlConnected = ghlService ? await ghlService.testConnection() : false;

    res.json({
      success: true,
      status: {
        ghlAIBridge: 'Connected',
        lauraOracle: 'Connected',
        ghlService: ghlConnected ? 'Connected' : 'Disconnected',
        capabilities: [
          'Lead Qualification',
          'Course Recommendations', 
          'Bi-directional Conversations',
          'Student Engagement Monitoring',
          'Workflow Optimization'
        ]
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in testConnection:', error);
    res.status(500).json({
      error: 'Failed to test GHL AI Bridge connection',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
