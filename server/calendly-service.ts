/**
 * Calendly Service
 * Handles Calendly webhook signature verification and data extraction
 */

import { createHmac, timingSafeEqual } from "crypto";

export interface CalendlyWebhookPayload {
  event: string;
  time: string;
  payload: {
    event_type: {
      uri: string;
      name: string;
      active: boolean;
      slug: string;
      scheduling_url: string;
      duration: number;
      kind: string;
      pooling_type?: string;
      type: string;
    };
    event: {
      uri: string;
      name: string;
      event_guests?: Array<{
        email: string;
        created_at: string;
        updated_at: string;
      }>;
      start_time: string;
      end_time: string;
      created_at: string;
      updated_at: string;
      canceled: boolean;
      canceler_name?: string;
      cancel_reason?: string;
      canceled_at?: string;
    };
    invitee: {
      uri: string;
      name: string;
      email: string;
      text_reminder_number?: string;
      timezone: string;
      event_guests?: Array<{
        email: string;
        created_at: string;
        updated_at: string;
      }>;
      created_at: string;
      updated_at: string;
      canceled: boolean;
      canceler_name?: string;
      cancel_reason?: string;
      canceled_at?: string;
      payment?: {
        external_id: string;
        provider: string;
        amount: number;
        currency: string;
        terms: string;
        successful: boolean;
      };
      questions_and_answers?: Array<{
        question: string;
        answer: string;
        position: number;
      }>;
      tracking?: {
        utm_campaign?: string;
        utm_source?: string;
        utm_medium?: string;
        utm_content?: string;
        utm_term?: string;
        salesforce_uuid?: string;
      };
      rescheduled: boolean;
      old_invitee?: string;
      new_invitee?: string;
      cancel_url: string;
      reschedule_url: string;
    };
    questions_and_answers?: Array<{
      question: string;
      answer: string;
      position: number;
    }>;
    tracking?: {
      utm_campaign?: string;
      utm_source?: string;
      utm_medium?: string;
      utm_content?: string;
      utm_term?: string;
      salesforce_uuid?: string;
    };
    old_invitee?: string;
    new_invitee?: string;
    invitee_canceled?: boolean;
  };
}

export interface ExtractedBookingData {
  name: string;
  email: string;
  phone?: string;
  eventName: string;
  eventUri: string;
  startTime: string;
  endTime: string;
  timezone: string;
  canceled: boolean;
  canceledAt?: string;
  cancelReason?: string;
  contactType: "SPONSOR" | "PARTNER" | "CLIENT";
  partnerStatus: "ACTIVE" | "PENDING" | "NONE";
  questionsAndAnswers?: Array<{ question: string; answer: string }>;
  tracking?: {
    utm_campaign?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_content?: string;
    utm_term?: string;
  };
}

export class CalendlyService {
  private signingKey: string | undefined;

  constructor() {
    this.signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
  }

  /**
   * Verify Calendly webhook signature
   * @param signatureHeader - The Calendly-Webhook-Signature header value
   * @param rawBody - The raw request body as a Buffer
   * @returns true if signature is valid, false otherwise
   */
  verifySignature(signatureHeader: string, rawBody: Buffer): boolean {
    if (!this.signingKey) {
      console.warn("CALENDLY_WEBHOOK_SIGNING_KEY not configured, skipping signature verification");
      return true; // Allow in development, but warn
    }

    if (!signatureHeader) {
      return false;
    }

    // Parse header: "t=timestamp,v1=signature"
    const parts = signatureHeader.split(",");
    const timestampPart = parts.find((p) => p.startsWith("t="));
    const v1Part = parts.find((p) => p.startsWith("v1="));

    if (!timestampPart || !v1Part) {
      return false;
    }

    const timestamp = timestampPart.slice(2); // remove "t="
    const receivedSignature = v1Part.slice(3); // remove "v1="

    // Build signed payload: "timestamp.rawBody"
    const signedPayload = `${timestamp}.${rawBody.toString("utf8")}`;

    // Compute HMAC-SHA256
    const expectedSignature = createHmac("sha256", this.signingKey)
      .update(signedPayload, "utf8")
      .digest("hex");

    // Validate timestamp (prevent replay attacks)
    const now = Math.floor(Date.now() / 1000);
    const timestampInt = parseInt(timestamp, 10);
    const age = Math.abs(now - timestampInt);
    const maxAgeSeconds = 300; // 5 minutes

    if (age > maxAgeSeconds) {
      console.warn(`Calendly webhook timestamp out of range: ${age}s old`);
      return false;
    }

    // Constant-time comparison to prevent timing attacks
    try {
      return timingSafeEqual(
        Buffer.from(expectedSignature, "hex"),
        Buffer.from(receivedSignature, "hex")
      );
    } catch (error) {
      console.error("Error comparing signatures:", error);
      return false;
    }
  }

  /**
   * Extract booking data from Calendly webhook payload
   */
  extractBookingData(payload: CalendlyWebhookPayload): ExtractedBookingData {
    const { event, payload: webhookPayload } = payload;
    const { invitee, event: eventData, event_type } = webhookPayload;

    // Determine contact type based on event name
    const { contactType, partnerStatus } = this.determineContactType(
      event_type.name
    );

    // Extract phone number if available
    const phone = invitee.text_reminder_number || undefined;

    return {
      name: invitee.name,
      email: invitee.email,
      phone,
      eventName: event_type.name,
      eventUri: event_type.uri,
      startTime: eventData.start_time,
      endTime: eventData.end_time,
      timezone: invitee.timezone,
      canceled: invitee.canceled || eventData.canceled || false,
      canceledAt: invitee.canceled_at || eventData.canceled_at,
      cancelReason: invitee.cancel_reason || eventData.cancel_reason,
      contactType,
      partnerStatus,
      questionsAndAnswers: webhookPayload.questions_and_answers?.map((qa) => ({
        question: qa.question,
        answer: qa.answer,
      })),
      tracking: invitee.tracking
        ? {
            utm_campaign: invitee.tracking.utm_campaign,
            utm_source: invitee.tracking.utm_source,
            utm_medium: invitee.tracking.utm_medium,
            utm_content: invitee.tracking.utm_content,
            utm_term: invitee.tracking.utm_term,
          }
        : undefined,
    };
  }

  /**
   * Determine contact type and partner status based on event name
   */
  private determineContactType(eventName: string): {
    contactType: "SPONSOR" | "PARTNER" | "CLIENT";
    partnerStatus: "ACTIVE" | "PENDING" | "NONE";
  } {
    const name = eventName.toLowerCase();

    if (name.includes("sponsor")) {
      return { contactType: "SPONSOR", partnerStatus: "ACTIVE" };
    }

    if (name.includes("partner")) {
      return { contactType: "PARTNER", partnerStatus: "PENDING" };
    }

    return { contactType: "CLIENT", partnerStatus: "NONE" };
  }

  /**
   * Check if webhook event is supported
   */
  isSupportedEvent(event: string): boolean {
    return event === "invitee.created" || event === "invitee.canceled";
  }
}

export const calendlyService = new CalendlyService();
