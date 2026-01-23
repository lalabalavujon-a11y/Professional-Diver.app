/**
 * Communication Service
 * Manages all client communication history and logging
 */

import { db } from "../db";
import { communications, type InsertCommunication } from "@shared/schema-sqlite";
import { eq, desc, and } from "drizzle-orm";
import { emailMarketing } from "../email-marketing";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export interface CommunicationData {
  clientId: string;
  type: "email" | "phone" | "sms" | "whatsapp" | "note";
  direction: "inbound" | "outbound";
  subject?: string;
  content: string;
  status?: "sent" | "delivered" | "read" | "failed" | "answered" | "missed";
  duration?: number; // For phone calls in seconds
  metadata?: Record<string, any>;
  createdBy?: string;
}

export class CommunicationService {
  /**
   * Log a communication
   */
  async logCommunication(data: CommunicationData): Promise<any> {
    const commData: InsertCommunication = {
      clientId: data.clientId,
      type: data.type,
      direction: data.direction,
      subject: data.subject || null,
      content: data.content,
      status: data.status || "sent",
      duration: data.duration || null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      createdBy: data.createdBy || null,
    };

    const [communication] = await db.insert(communications).values(commData).returning();
    return communication;
  }

  /**
   * Get all communications for a client
   */
  async getClientCommunications(clientId: string, limit?: number): Promise<any[]> {
    let query = db
      .select()
      .from(communications)
      .where(eq(communications.clientId, clientId))
      .orderBy(desc(communications.createdAt));

    if (limit) {
      // Note: Drizzle doesn't have .limit() directly on query builder in this version
      // We'll handle this in the application layer if needed
      const results = await query;
      return results.slice(0, limit);
    }

    return await query;
  }

  /**
   * Get communication by ID
   */
  async getCommunicationById(id: string): Promise<any | null> {
    const results = await db
      .select()
      .from(communications)
      .where(eq(communications.id, id))
      .limit(1);

    return results.length > 0 ? results[0] : null;
  }

  /**
   * Update communication status
   */
  async updateStatus(id: string, status: string): Promise<boolean> {
    const result = await db
      .update(communications)
      .set({ status: status as any })
      .where(eq(communications.id, id))
      .returning();

    return result.length > 0;
  }

  /**
   * Send email and log it
   */
  async sendEmail(data: {
    clientId: string;
    to: string;
    subject: string;
    content: string;
    htmlContent?: string;
    createdBy?: string;
  }): Promise<any> {
    try {
      // For now, just log the email - actual sending can be implemented with SendGrid
      // This logs the intent to send, actual sending will be handled separately
      
      // Log the communication
      const communication = await this.logCommunication({
        clientId: data.clientId,
        type: "email",
        direction: "outbound",
        subject: data.subject,
        content: data.content,
        status: "sent", // Will be updated when actual email service is integrated
        metadata: {
          to: data.to,
          htmlContent: data.htmlContent,
        },
        createdBy: data.createdBy,
      });

      // TODO: Integrate with actual email service (SendGrid) here
      // For now, return the logged communication

      return communication;
    } catch (error) {
      // Log failed communication
      await this.logCommunication({
        clientId: data.clientId,
        type: "email",
        direction: "outbound",
        subject: data.subject,
        content: data.content,
        status: "failed",
        metadata: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        createdBy: data.createdBy,
      });

      throw error;
    }
  }

  /**
   * Log phone call
   */
  async logPhoneCall(data: {
    clientId: string;
    to: string;
    subject: string;
    content: string;
    htmlContent?: string;
    createdBy?: string;
  }): Promise<any> {
    let communication;
    let emailSent = false;

    try {
      // Get email configuration
      const FROM_EMAIL = process.env.EMAIL_FROM || process.env.SENDGRID_FROM_EMAIL || 'noreply@professionaldiver.app';
      const FROM_NAME = process.env.EMAIL_FROM_NAME || process.env.SENDGRID_FROM_NAME || 'Diver Well Training - Professional Diver App';

      // Convert content to HTML if htmlContent not provided
      const htmlContent = data.htmlContent || this.textToHtml(data.content);

      // Create HTML email with footer
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          ${htmlContent}
          <div class="footer">
            <p><strong>Professional Diver App</strong></p>
            <p>jon@professionaldiver.app | +447448320513</p>
            <p>Diver Well Training - Professional Diver App</p>
          </div>
        </body>
        </html>
      `;

      // Send email using nodemailer
      const transporter = this.getEmailTransporter();
      const mailOptions = {
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: data.to,
        subject: data.subject,
        text: data.content,
        html: html
      };

      const info = await transporter.sendMail(mailOptions);
      emailSent = true;

      // Log successful communication
      communication = await this.logCommunication({
        clientId: data.clientId,
        type: "email",
        direction: "outbound",
        subject: data.subject,
        content: data.content,
        status: "sent",
        metadata: {
          to: data.to,
          htmlContent: data.htmlContent,
          messageId: info.messageId,
        },
        createdBy: data.createdBy,
      });

      return communication;
    } catch (error) {
      // Log failed communication
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      try {
        communication = await this.logCommunication({
          clientId: data.clientId,
          type: "email",
          direction: "outbound",
          subject: data.subject,
          content: data.content,
          status: "failed",
          metadata: {
            to: data.to,
            htmlContent: data.htmlContent,
            error: errorMessage,
          },
          createdBy: data.createdBy,
        });
      } catch (logError) {
        console.error('Failed to log communication error:', logError);
      }

      throw new Error(`Failed to send email: ${errorMessage}`);
    }
  }

  /**
   * Log WhatsApp message
   */
  async logWhatsApp(data: {
    clientId: string;
    direction: "inbound" | "outbound";
    content: string;
    phoneNumber?: string;
    status?: "sent" | "delivered" | "read" | "failed";
    createdBy?: string;
  }): Promise<any> {
    return await this.logCommunication({
      clientId: data.clientId,
      type: "whatsapp",
      direction: data.direction,
      content: data.content,
      status: data.status || "sent",
      metadata: {
        phoneNumber: data.phoneNumber,
      },
      createdBy: data.createdBy,
    });
  }

  /**
   * Add a note
   */
  async addNote(data: {
    clientId: string;
    content: string;
    createdBy?: string;
  }): Promise<any> {
    return await this.logCommunication({
      clientId: data.clientId,
      type: "note",
      direction: "outbound", // Notes are always outbound (created by user)
      content: data.content,
      status: "sent",
      createdBy: data.createdBy,
    });
  }

  /**
   * Get communication statistics for a client
   */
  async getCommunicationStats(clientId: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byDirection: Record<string, number>;
    lastCommunication?: Date;
  }> {
    const all = await this.getClientCommunications(clientId);
    
    const byType: Record<string, number> = {};
    const byDirection: Record<string, number> = {};
    
    all.forEach((comm) => {
      byType[comm.type] = (byType[comm.type] || 0) + 1;
      byDirection[comm.direction] = (byDirection[comm.direction] || 0) + 1;
    });

    return {
      total: all.length,
      byType,
      byDirection,
      lastCommunication: all.length > 0 ? new Date(all[0].createdAt) : undefined,
    };
  }

  /**
   * Send WhatsApp message and log it
   */
  async sendWhatsApp(data: {
    clientId: string;
    to: string; // Phone number in format: +[country][number]
    content: string;
    createdBy?: string;
  }): Promise<any> {
    let communication;

    try {
      const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

      if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
        throw new Error('WhatsApp Business API credentials not configured. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in environment variables.');
      }

      // Format phone number
      let formattedPhone = data.to.replace(/[^\d+]/g, '');
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
      }
      
      // Handle UK numbers: Remove leading 0 after +44
      // Example: +4407448320513 → +447448320513
      if (formattedPhone.startsWith('+44') && formattedPhone.length > 3 && formattedPhone[3] === '0') {
        formattedPhone = '+44' + formattedPhone.substring(4);
      }

      // Send message via WhatsApp Business API
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'text',
            text: {
              body: data.content
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`WhatsApp API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      const messageId = result.messages?.[0]?.id;

      // Log successful communication
      communication = await this.logCommunication({
        clientId: data.clientId,
        type: "whatsapp",
        direction: "outbound",
        content: data.content,
        status: "sent",
        metadata: {
          to: formattedPhone,
          messageId: messageId,
          whatsappPhoneNumberId: WHATSAPP_PHONE_NUMBER_ID
        },
        createdBy: data.createdBy,
      });

      return communication;
    } catch (error) {
      // Log failed communication
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      try {
        communication = await this.logCommunication({
          clientId: data.clientId,
          type: "whatsapp",
          direction: "outbound",
          content: data.content,
          status: "failed",
          metadata: {
            to: data.to,
            error: errorMessage,
          },
          createdBy: data.createdBy,
        });
      } catch (logError) {
        console.error('Failed to log communication error:', logError);
      }

      throw new Error(`Failed to send WhatsApp message: ${errorMessage}`);
    }
  }

  /**
   * Log WhatsApp message (for inbound messages)
   */
  async logInboundWhatsApp(data: {
    clientId: string;
    from: string; // Phone number
    content: string;
    messageId?: string;
  }): Promise<any> {
    return await this.logCommunication({
      clientId: data.clientId,
      type: "whatsapp",
      direction: "inbound",
      content: data.content,
      status: "delivered",
      metadata: {
        from: data.from,
        messageId: data.messageId,
      },
    });
  }
}

export const communicationService = new CommunicationService();

