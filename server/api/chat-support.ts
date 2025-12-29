import { Request, Response } from 'express';
import LauraOracleService from '../laura-oracle-service';

/**
 * User Support Chat API - No admin access required
 * Provides basic chat functionality for regular users
 */

interface SupportChatRequest {
  message: string;
  sessionId?: string;
  userContext?: any;
}

/**
 * Generate a helpful response for user support chat
 */
function generateSupportResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  // Course and platform information
  if (lowerMessage.includes('course') || lowerMessage.includes('track') || lowerMessage.includes('lesson')) {
    return "Our Professional Diver Training Platform offers comprehensive courses including Commercial Diving, Underwater Welding, NDT Inspection, and specialized certifications. You can access your learning tracks from the dashboard, track your progress, and take practice exams. Each course is designed by industry experts with real-world applications. Would you like me to guide you to a specific course or help you understand the learning path?";
  }

  // Technical support
  if (lowerMessage.includes('problem') || lowerMessage.includes('issue') || lowerMessage.includes('error') || lowerMessage.includes('bug')) {
    return "I'm here to help with any technical issues! Common solutions include: refreshing your browser, clearing cache, checking your internet connection, or trying a different browser. If you're having trouble with course access, quiz submissions, or video playback, I can guide you through troubleshooting steps. For persistent issues, I can also connect you with our technical support team. What specific problem are you experiencing?";
  }

  // Account and subscription
  if (lowerMessage.includes('account') || lowerMessage.includes('subscription') || lowerMessage.includes('billing') || lowerMessage.includes('payment')) {
    return "For account and subscription questions, I can help you understand our pricing tiers, upgrade options, and billing cycles. We offer Trial, Monthly, Annual, and Lifetime subscriptions with different access levels. If you need to update payment information or have billing concerns, I can direct you to the appropriate resources or schedule a consultation with our admin team. What account assistance do you need?";
  }

  // Affiliate program
  if (lowerMessage.includes('affiliate') || lowerMessage.includes('commission') || lowerMessage.includes('referral') || lowerMessage.includes('earn')) {
    return "Excellent! Our affiliate program offers 50% commission on all referrals - it's one of the most lucrative programs in the diving education industry! You can earn substantial income by referring students to our professional diving courses. I can guide you through the signup process, explain commission structures, and help you access marketing materials. Would you like me to walk you through getting started with our affiliate program?";
  }

  // Certification and career
  if (lowerMessage.includes('certification') || lowerMessage.includes('career') || lowerMessage.includes('job') || lowerMessage.includes('employment')) {
    return "Our certifications are industry-recognized and designed to advance your diving career! We offer pathways for Commercial Diving, Underwater Welding, NDT Inspection, and specialized roles like Dive Supervisor and Life Support Technician. Many of our graduates find employment with offshore companies, marine construction firms, and inspection services. I can help you understand which certifications align with your career goals. What type of diving career interests you most?";
  }

  // Admin consultation
  if (lowerMessage.includes('admin') || lowerMessage.includes('consultation') || lowerMessage.includes('meeting') || 
      lowerMessage.includes('speak to') || lowerMessage.includes('talk to')) {
    return "I can absolutely help you schedule a consultation with our admin team! For complex account issues, business partnerships, custom training programs, or detailed career guidance, our administrators provide personalized support. Please let me know your preferred date/time and the nature of your inquiry, and I'll coordinate with our admin team to schedule your consultation. You can also reach out directly to 1pull@professionaldiver.app for immediate admin assistance.";
  }

  // Diving operations questions
  if (lowerMessage.includes('diving') || lowerMessage.includes('underwater') || lowerMessage.includes('safety') || 
      lowerMessage.includes('equipment') || lowerMessage.includes('operation')) {
    return "For specific diving operations, safety protocols, and technical diving questions, I can connect you with our exclusive Diver Well AI Consultant - a specialized system designed for commercial diving operations. This consultant provides expert guidance on dive planning, safety procedures, equipment selection, and operational best practices. Would you like me to direct you to the Diver Well AI Consultant for detailed diving operations support?";
  }

  // Greetings
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey') || lowerMessage.includes('good')) {
    return "Hello! I'm Laura, your friendly AI assistant for Professional Diver Training Platform. I'm here to help you with platform navigation, course information, technical support, and answer any questions about your diving education journey. I can also help you connect with our affiliate program or schedule consultations with our admin team. How can I assist you today?";
  }

  // Default helpful response
  return `Hello! I'm here to help you with anything related to Professional Diver Training Platform. I can assist with:

• Course information and navigation
• Technical support and troubleshooting  
• Account and subscription questions
• Our 50% commission affiliate program
• Career guidance and certifications
• Scheduling admin consultations
• Connecting you with specialized diving operations support

What would you like help with today? Feel free to ask me anything!`;
}

/**
 * Chat with Laura Support Assistant - Available to all users
 */
export async function chatWithSupport(req: Request, res: Response) {
  try {
    const { message, sessionId, userContext }: SupportChatRequest = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    // Generate response using support logic
    const response = generateSupportResponse(message);

    res.json({
      success: true,
      response,
      timestamp: new Date().toISOString(),
      assistant: {
        name: "Laura",
        role: "Support Assistant",
        type: "user_support"
      }
    });

  } catch (error) {
    console.error('❌ Error in chatWithSupport:', error);
    res.status(500).json({
      error: 'Failed to process support chat request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Generate voice response for support chat - Available to all users
 */
export async function generateSupportVoiceResponse(req: Request, res: Response) {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Text is required for voice generation'
      });
    }

    // Use Laura Oracle service for voice generation (same voice AI as admin chat)
    try {
      const lauraOracle = LauraOracleService.getInstance();
      const audioBuffer = await lauraOracle.generateVoiceResponse(text);

      if (audioBuffer) {
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', audioBuffer.length);
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        return res.send(audioBuffer);
      }
    } catch (voiceError) {
      console.error('❌ Voice generation error:', voiceError);
      // Fall through to error response
    }

    // Fallback: return text response if voice generation fails
    res.json({
      success: false,
      error: 'Voice generation not available',
      message: 'Text-to-speech is currently unavailable. Please read the text response.',
      text: text
    });

  } catch (error) {
    console.error('❌ Error generating support voice response:', error);
    res.status(500).json({
      error: 'Failed to generate voice response',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}


