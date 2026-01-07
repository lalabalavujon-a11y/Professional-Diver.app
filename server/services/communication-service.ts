/**
 * Communication Service
 * Manages all client communication history and logging
 */

import { db } from "../db";
import { communications, type InsertCommunication } from "@shared/schema-sqlite";
import { eq, desc, and } from "drizzle-orm";
import { emailMarketing } from "../email-marketing";

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
    direction: "inbound" | "outbound";
    duration?: number;
    status: "answered" | "missed" | "failed";
    notes?: string;
    phoneNumber?: string;
    createdBy?: string;
  }): Promise<any> {
    return await this.logCommunication({
      clientId: data.clientId,
      type: "phone",
      direction: data.direction,
      content: data.notes || `${data.direction === "inbound" ? "Incoming" : "Outgoing"} phone call`,
      status: data.status,
      duration: data.duration,
      metadata: {
        phoneNumber: data.phoneNumber,
      },
      createdBy: data.createdBy,
    });
  }

  /**
   * Log SMS
   */
  async logSMS(data: {
    clientId: string;
    direction: "inbound" | "outbound";
    content: string;
    phoneNumber?: string;
    status?: "sent" | "delivered" | "failed";
    createdBy?: string;
  }): Promise<any> {
    return await this.logCommunication({
      clientId: data.clientId,
      type: "sms",
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
}

export const communicationService = new CommunicationService();

