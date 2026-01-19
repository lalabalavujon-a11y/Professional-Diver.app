/**
 * WhatsApp Receiver Service
 * Handles incoming WhatsApp Business API webhooks and processes messages into CRM
 */

import crypto from "crypto";
import { db } from "../db";
import { clients } from "@shared/schema-sqlite";
import { eq } from "drizzle-orm";
import { communicationService } from "./communication-service";
import { crmAdapter } from "../crm-adapter";
import dotenv from "dotenv";

dotenv.config();

interface WhatsAppMessage {
  from: string; // Phone number in format: +[country][number]
  messageId: string;
  text?: string;
  type: string;
  timestamp: string;
  profileName?: string;
}

interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: {
            body: string;
          };
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export class WhatsAppReceiverService {
  /**
   * Verify webhook signature from Meta
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const APP_SECRET = process.env.WHATSAPP_APP_SECRET;

    if (!APP_SECRET) {
      console.warn('⚠️ WHATSAPP_APP_SECRET not set, skipping signature verification');
      return true; // Allow in development if secret not set
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', APP_SECRET)
        .update(payload)
        .digest('hex');

      // Compare signatures safely
      const signatureBuffer = Buffer.from(signature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');
      
      if (signatureBuffer.length !== expectedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Format phone number to standard format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    let formatted = phone.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +
    if (!formatted.startsWith('+')) {
      formatted = '+' + formatted;
    }
    
    // Handle UK numbers: Remove leading 0 after +44
    // Example: +4407448320513 → +447448320513
    if (formatted.startsWith('+44') && formatted.length > 3 && formatted[3] === '0') {
      formatted = '+44' + formatted.substring(4);
    }

    return formatted;
  }

  /**
   * Extract name from WhatsApp contact
   */
  private extractName(contacts: any[], phoneNumber: string): string {
    if (contacts && contacts.length > 0) {
      const contact = contacts.find(c => c.wa_id === phoneNumber);
      if (contact?.profile?.name) {
        return contact.profile.name;
      }
    }
    return 'WhatsApp User';
  }

  /**
   * Find or create client by phone number
   */
  private async findOrCreateClientByPhone(phone: string, name?: string): Promise<string> {
    try {
      const formattedPhone = this.formatPhoneNumber(phone);

      // Try to find existing client by phone using Drizzle ORM
      const existingClients = await db
        .select({ id: clients.id })
        .from(clients)
        .where(eq(clients.phone, formattedPhone))
        .limit(1);

      if (existingClients.length > 0) {
        return existingClients[0].id;
      }

      // Create new client
      const clientData = {
        name: name || 'WhatsApp User',
        email: `whatsapp-${formattedPhone.replace(/[^0-9]/g, '')}@whatsapp.local`, // Placeholder email
        phone: formattedPhone,
        subscriptionType: 'TRIAL',
        status: 'ACTIVE',
        notes: 'Auto-created from inbound WhatsApp message'
      };

      const client = await crmAdapter.createClient(clientData);
      return client.id;
    } catch (error) {
      console.error('Error finding/creating client by phone:', error);
      throw error;
    }
  }

  /**
   * Process a single WhatsApp message
   */
  private async processMessage(message: WhatsAppMessage, profileName?: string): Promise<void> {
    try {
      if (!message.text) {
        console.log(`⚠️ Skipping non-text WhatsApp message (type: ${message.type})`);
        return;
      }

      // Find or create client
      const clientId = await this.findOrCreateClientByPhone(message.from, profileName || message.profileName);

      // Log as inbound communication
      await communicationService.logCommunication({
        clientId,
        type: "whatsapp",
        direction: "inbound",
        content: message.text,
        status: "delivered",
        metadata: {
          from: message.from,
          messageId: message.messageId,
          timestamp: message.timestamp,
          type: message.type
        }
      });

      console.log(`✅ Processed inbound WhatsApp message from ${message.from} to client ${clientId}`);
    } catch (error) {
      console.error('Error processing WhatsApp message:', error);
      throw error;
    }
  }

  /**
   * Handle webhook verification (GET request from Meta)
   */
  handleVerification(mode: string, token: string, challenge: string): string | null {
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ WhatsApp webhook verified');
      return challenge;
    }

    console.error('❌ WhatsApp webhook verification failed');
    return null;
  }

  /**
   * Process webhook payload from Meta
   */
  async processWebhook(payload: WhatsAppWebhookPayload): Promise<void> {
    try {
      if (payload.object !== 'whatsapp_business_account') {
        console.log('⚠️ Ignoring non-WhatsApp webhook');
        return;
      }

      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          if (change.field !== 'messages') {
            continue; // Only process message changes
          }

          const value = change.value;

          // Process incoming messages
          if (value.messages) {
            for (const msg of value.messages) {
              // Only process text messages for now
              if (msg.type === 'text' && msg.text) {
                const message: WhatsAppMessage = {
                  from: msg.from,
                  messageId: msg.id,
                  text: msg.text.body,
                  type: msg.type,
                  timestamp: msg.timestamp,
                  profileName: value.contacts?.[0]?.profile?.name
                };

                await this.processMessage(message, value.contacts?.[0]?.profile?.name);
              }
            }
          }

          // Process status updates (optional - for tracking message delivery)
          if (value.statuses) {
            for (const status of value.statuses) {
              console.log(`📱 WhatsApp message ${status.id} status: ${status.status}`);
              // Could update communication status here if needed
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing WhatsApp webhook:', error);
      throw error;
    }
  }
}

export const whatsappReceiverService = new WhatsAppReceiverService();
