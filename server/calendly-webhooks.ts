/**
 * Calendly Webhook Handlers
 * Handles incoming webhooks from Calendly
 * Processes invitee.created and invitee.canceled events
 */

import { Request, Response } from "express";
import { calendlyService, type CalendlyWebhookPayload } from "./calendly-service";
import { crmAdapter } from "./crm-adapter";
import { unifiedCalendarService } from "./services/unified-calendar-service";
import { calendarAgentOrchestrator } from "./agents/calendar-agent-orchestrator";

/**
 * Main webhook handler for Calendly events
 */
export async function handleCalendlyWebhook(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Get raw body for signature verification
    const rawBody = (req as any).rawBody as Buffer;
    if (!rawBody) {
      res.status(400).json({ error: "Raw body required for signature verification" });
      return;
    }

    // Verify webhook signature
    const signatureHeader = req.headers["calendly-webhook-signature"] as string;
    if (!calendlyService.verifySignature(signatureHeader, rawBody)) {
      console.error("Invalid Calendly webhook signature");
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    // Parse webhook payload
    let payload: CalendlyWebhookPayload;
    try {
      payload = JSON.parse(rawBody.toString("utf8"));
    } catch (error) {
      console.error("Error parsing Calendly webhook payload:", error);
      res.status(400).json({ error: "Invalid JSON payload" });
      return;
    }

    // Check if event is supported
    if (!calendlyService.isSupportedEvent(payload.event)) {
      console.log(`Unsupported Calendly event: ${payload.event}`);
      res.status(200).json({ success: true, message: "Event not handled" });
      return;
    }

    // Route to appropriate handler
    if (payload.event === "invitee.created") {
      await handleInviteeCreated(payload);
    } else if (payload.event === "invitee.canceled") {
      await handleInviteeCanceled(payload);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error handling Calendly webhook:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
}

/**
 * Handle invitee.created event - new booking
 */
async function handleInviteeCreated(payload: CalendlyWebhookPayload): Promise<void> {
  try {
    const bookingData = calendlyService.extractBookingData(payload);

    console.log(`Processing Calendly booking: ${bookingData.email} - ${bookingData.eventName}`);

    // Create or update client in CRM
    const client = await crmAdapter.handleCalendlyBooking({
      ...bookingData,
      isCanceled: false,
    });

    // Normalize to unified calendar event
    const unifiedEvent = unifiedCalendarService.normalizeCalendlyEvent(bookingData, client?.id);

    // Trigger real-time agent monitoring
    try {
      await calendarAgentOrchestrator.handleNewEvent(unifiedEvent);
    } catch (error) {
      console.error("Error in real-time agent monitoring:", error);
      // Non-fatal - continue
    }

    console.log(`Successfully processed Calendly booking for ${bookingData.email}`);
  } catch (error) {
    console.error("Error handling invitee.created:", error);
    throw error;
  }
}

/**
 * Handle invitee.canceled event - booking cancellation
 */
async function handleInviteeCanceled(payload: CalendlyWebhookPayload): Promise<void> {
  try {
    const bookingData = calendlyService.extractBookingData(payload);

    console.log(`Processing Calendly cancellation: ${bookingData.email} - ${bookingData.eventName}`);

    // Update client in CRM with cancellation info
    await crmAdapter.handleCalendlyBooking({
      ...bookingData,
      isCanceled: true,
    });

    console.log(`Successfully processed Calendly cancellation for ${bookingData.email}`);
  } catch (error) {
    console.error("Error handling invitee.canceled:", error);
    throw error;
  }
}
