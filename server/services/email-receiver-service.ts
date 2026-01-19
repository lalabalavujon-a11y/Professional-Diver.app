/**
 * Email Receiver Service
 * Polls IMAP mailbox for new emails and processes them into CRM
 */

import Imap from "imap";
import { simpleParser, ParsedMail } from "mailparser";
import { db } from "../db";
import { clients } from "@shared/schema-sqlite";
import { eq } from "drizzle-orm";
import { communicationService } from "./communication-service";
import { crmAdapter } from "../crm-adapter";
import dotenv from "dotenv";

dotenv.config();

interface EmailMessage {
  uid: number;
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  date: Date;
  messageId: string;
  inReplyTo?: string;
  references?: string;
}

export class EmailReceiverService {
  private isPolling: boolean = false;
  private pollInterval: NodeJS.Timeout | null = null;
  private processedUids: Set<number> = new Set();

  /**
   * Initialize IMAP connection
   */
  private initializeImap(): Imap {
    const IMAP_HOST = process.env.IMAP_HOST || 'imap.gmail.com';
    const IMAP_PORT = parseInt(process.env.IMAP_PORT || '993');
    const IMAP_USER = process.env.IMAP_USER || process.env.SMTP_USER;
    const IMAP_PASSWORD = process.env.IMAP_PASSWORD || process.env.SMTP_PASSWORD;

    if (!IMAP_USER || !IMAP_PASSWORD) {
      throw new Error('IMAP credentials are required. Set IMAP_USER and IMAP_PASSWORD in environment variables.');
    }

    return new Imap({
      user: IMAP_USER.trim(),
      password: IMAP_PASSWORD.trim(),
      host: IMAP_HOST,
      port: IMAP_PORT,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });
  }

  /**
   * Find or create client by email
   */
  private async findOrCreateClient(email: string, name?: string): Promise<string> {
    try {
      // Try to find existing client by email using Drizzle ORM
      const existingClients = await db
        .select({ id: clients.id })
        .from(clients)
        .where(eq(clients.email, email.toLowerCase()))
        .limit(1);

      if (existingClients.length > 0) {
        return existingClients[0].id;
      }

      // Create new client
      const clientData = {
        name: name || email.split('@')[0] || 'Email Sender',
        email: email.toLowerCase(),
        subscriptionType: 'TRIAL',
        status: 'ACTIVE',
        notes: 'Auto-created from inbound email'
      };

      const client = await crmAdapter.createClient(clientData);
      return client.id;
    } catch (error) {
      console.error('Error finding/creating client:', error);
      throw error;
    }
  }

  /**
   * Process a single email message
   */
  private async processEmail(message: EmailMessage): Promise<void> {
    try {
      // Find or create client
      const clientId = await this.findOrCreateClient(message.from, this.extractNameFromEmail(message.from));

      // Log as inbound communication
      await communicationService.logCommunication({
        clientId,
        type: "email",
        direction: "inbound",
        subject: message.subject,
        content: message.text || message.html || '',
        status: "delivered",
        metadata: {
          from: message.from,
          to: message.to,
          messageId: message.messageId,
          inReplyTo: message.inReplyTo,
          references: message.references,
          html: message.html
        }
      });

      console.log(`✅ Processed inbound email from ${message.from} to client ${clientId}`);
    } catch (error) {
      console.error('Error processing email:', error);
      throw error;
    }
  }

  /**
   * Extract name from email address
   */
  private extractNameFromEmail(email: string): string {
    // Try to extract name from "Name <email@domain.com>" format
    const match = email.match(/^(.+?)\s*<(.+?)>$/);
    if (match) {
      return match[1].trim().replace(/['"]/g, '');
    }
    // Otherwise use email username
    return email.split('@')[0];
  }

  /**
   * Extract email address from parsed mail from field
   */
  private extractEmailAddress(from: ParsedMail['from']): string {
    if (!from) return '';
    if (typeof from === 'string') return from;
    if (Array.isArray(from.value) && from.value.length > 0) {
      return from.value[0].address || '';
    }
    return from.text || '';
  }

  /**
   * Poll IMAP mailbox for new emails
   */
  async pollForNewEmails(): Promise<void> {
    if (this.isPolling) {
      console.log('⏳ Email polling already in progress, skipping...');
      return;
    }

    this.isPolling = true;

    try {
      const imap = this.initializeImap();
      const IMAP_MAILBOX = process.env.IMAP_MAILBOX || 'INBOX';

      await new Promise<void>((resolve, reject) => {
        imap.once('ready', () => {
          imap.openBox(IMAP_MAILBOX, false, (err, box) => {
            if (err) {
              reject(err);
              return;
            }

            // Search for unseen emails
            imap.search(['UNSEEN'], (err, results) => {
              if (err) {
                reject(err);
                return;
              }

              if (!results || results.length === 0) {
                console.log('📧 No new emails found');
                imap.end();
                resolve();
                return;
              }

              console.log(`📧 Found ${results.length} new email(s)`);

              // Fetch emails
              const fetch = imap.fetch(results, {
                bodies: '',
                struct: true
              });

              const emails: EmailMessage[] = [];
              const emailPromises: Promise<void>[] = [];

              fetch.on('message', (msg, seqno) => {
                let uid: number | null = null;
                let buffer = Buffer.alloc(0);

                msg.on('body', (stream, info) => {
                  stream.on('data', (chunk: Buffer) => {
                    buffer = Buffer.concat([buffer, chunk]);
                  });
                });

                msg.once('attributes', (attrs) => {
                  uid = attrs.uid;
                });

                msg.once('end', async () => {
                  if (uid !== null && buffer.length > 0) {
                    const parsePromise = simpleParser(buffer)
                      .then(async (parsed) => {
                        const fromAddress = this.extractEmailAddress(parsed.from);
                        if (fromAddress) {
                          const toAddress = this.extractEmailAddress(parsed.to);
                          
                          emails.push({
                            uid,
                            from: fromAddress,
                            to: toAddress,
                            subject: parsed.subject || '',
                            text: parsed.text || '',
                            html: parsed.html || '',
                            date: parsed.date || new Date(),
                            messageId: parsed.messageId || '',
                            inReplyTo: parsed.inReplyTo,
                            references: parsed.references
                          });
                        }
                      })
                      .catch((err) => {
                        console.error('Error parsing email:', err);
                      });
                    
                    emailPromises.push(parsePromise);
                  }
                });
              });

              fetch.once('end', async () => {
                try {
                  // Wait for all email parsing to complete
                  await Promise.all(emailPromises);

                  // Process all emails (only process unseen ones to avoid duplicates)
                  const unseenResults: number[] = [];
                  for (const email of emails) {
                    if (!this.processedUids.has(email.uid)) {
                      // Check if email is unseen before processing
                      // We'll process it and mark as seen
                      await this.processEmail(email);
                      this.processedUids.add(email.uid);
                      unseenResults.push(email.uid);
                    }
                  }

                  // Mark processed emails as seen
                  if (unseenResults.length > 0) {
                    imap.addFlags(unseenResults, '\\Seen', (err) => {
                      if (err) {
                        console.error('Error marking emails as seen:', err);
                      }
                    });
                  }

                  imap.end();
                  resolve();
                } catch (error) {
                  imap.end();
                  reject(error);
                }
              });

              fetch.once('error', (err) => {
                imap.end();
                reject(err);
              });
            });
          });
        });

        imap.once('error', (err) => {
          reject(err);
        });

        imap.connect();
      });
    } catch (error) {
      console.error('Error polling emails:', error);
      throw error;
    } finally {
      this.isPolling = false;
    }
  }

  /**
   * Start background polling
   */
  startPolling(): void {
    const POLL_INTERVAL = parseInt(process.env.EMAIL_POLL_INTERVAL || '600000'); // Default 10 minutes

    if (this.pollInterval) {
      console.log('⚠️ Email polling already started');
      return;
    }

    console.log(`📧 Starting email polling (interval: ${POLL_INTERVAL / 1000}s)`);

    // Poll immediately
    this.pollForNewEmails().catch(err => {
      console.error('Error in initial email poll:', err);
    });

    // Then poll at intervals
    this.pollInterval = setInterval(() => {
      this.pollForNewEmails().catch(err => {
        console.error('Error in scheduled email poll:', err);
      });
    }, POLL_INTERVAL);
  }

  /**
   * Stop background polling
   */
  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      console.log('📧 Stopped email polling');
    }
  }
}

export const emailReceiverService = new EmailReceiverService();
