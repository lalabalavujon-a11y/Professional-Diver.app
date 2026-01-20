import { crmService } from "./crm-service";
import { highlevelService } from "./highlevel-service";
import { db } from "./db";
import { clients } from "@shared/schema-sqlite";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import type { ExtractedBookingData } from "./calendly-service";

/**
 * CRM Adapter
 * Routes CRM operations to local CRM and optionally HighLevel
 * Provides unified interface that works with or without HighLevel
 */
export class CRMAdapter {
  /**
   * Create client in local CRM and optionally sync to HighLevel
   */
  async createClient(data: {
    name: string;
    email: string;
    phone?: string;
    subscriptionType?: string;
    status?: string;
    userId?: string;
  }): Promise<any> {
    // Always create in local CRM first
    let localClient;

    if (data.userId) {
      // If user ID provided, sync from user
      localClient = await crmService.syncUserToClient(data.userId);
    } else {
      // Create standalone client
      const clientId = await this.createLocalClient(data);
      const result = await db.execute(
        'SELECT * FROM clients WHERE id = $1',
        [clientId]
      );
      localClient = result.rows[0];
    }

    // Optionally sync to HighLevel if available
    if (highlevelService.isHighLevelAvailable()) {
      try {
        const highlevelContactId = await highlevelService.syncToHighLevel(
          localClient.id,
          localClient
        );

        if (highlevelContactId) {
          // Update local client with HighLevel contact ID
          await db
            .update(clients)
            .set({ highlevelContactId: highlevelContactId as any })
            .where(eq(clients.id, localClient.id));
          localClient.highlevel_contact_id = highlevelContactId;
        }
      } catch (error) {
        console.error("Error syncing to HighLevel (non-fatal):", error);
        // Continue even if HighLevel sync fails
      }
    }

    return localClient;
  }

  /**
   * Update client in local CRM and optionally sync to HighLevel
   */
  async updateClient(clientId: string, updates: any): Promise<any> {
    // Always update local CRM first
    await db.execute(`
      UPDATE clients 
      SET 
        name = COALESCE($2, name),
        email = COALESCE($3, email),
        subscription_type = COALESCE($4, subscription_type),
        status = COALESCE($5, status),
        monthly_revenue = COALESCE($6, monthly_revenue),
        partner_status = COALESCE($7, partner_status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [
      clientId,
      updates.name,
      updates.email,
      updates.subscriptionType,
      updates.status,
      updates.monthlyRevenue,
      updates.partnerStatus
    ]);

    const updatedResult = await db.execute(
      'SELECT * FROM clients WHERE id = $1',
      [clientId]
    );
    const localClient = updatedResult.rows[0];

    // Optionally sync to HighLevel if available
    if (highlevelService.isHighLevelAvailable() && localClient.highlevel_contact_id) {
      try {
        await highlevelService.updateContact(localClient.highlevel_contact_id, {
          email: localClient.email,
          firstName: localClient.name?.split(" ")[0],
          lastName: localClient.name?.split(" ").slice(1).join(" "),
        });
      } catch (error) {
        console.error("Error syncing update to HighLevel (non-fatal):", error);
        // Continue even if HighLevel sync fails
      }
    }

    return localClient;
  }

  /**
   * Delete client from local CRM and optionally HighLevel
   */
  async deleteClient(clientId: string): Promise<void> {
    // Get client before deletion to check for HighLevel contact ID
    const clientResult = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    // Delete from local CRM
    await db
      .delete(clients)
      .where(eq(clients.id, clientId));

    // Optionally delete from HighLevel if available
    if (
      highlevelService.isHighLevelAvailable() &&
      clientResult.rows[0]?.highlevel_contact_id
    ) {
      try {
        // Note: HighLevel API may not support direct deletion
        // You might want to archive or tag as deleted instead
        console.log(
          `HighLevel contact ${clientResult[0].highlevel_contact_id} should be archived/deleted manually`
        );
      } catch (error) {
        console.error("Error handling HighLevel deletion (non-fatal):", error);
      }
    }
  }

  /**
   * Get client by ID (from local CRM, optionally enriched with HighLevel data)
   */
  async getClient(clientId: string): Promise<any | null> {
    const result = await db.execute(
      'SELECT * FROM clients WHERE id = $1',
      [clientId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const localClient = result.rows[0];

    // Optionally enrich with HighLevel data if available
    if (
      highlevelService.isHighLevelAvailable() &&
      localClient.highlevel_contact_id
    ) {
      try {
        const highlevelData = await highlevelService.syncFromHighLevel(
          localClient.highlevel_contact_id
        );
        if (highlevelData) {
          return {
            ...localClient,
            highlevelData,
          };
        }
      } catch (error) {
        console.error("Error fetching HighLevel data (non-fatal):", error);
      }
    }

    return localClient;
  }

  /**
   * Handle Calendly booking - create or update client from booking data
   */
  async handleCalendlyBooking(bookingData: ExtractedBookingData & { isCanceled: boolean }): Promise<any> {
    try {
      // Check if client exists by email
      const existingClientResult = await db.execute(
        'SELECT * FROM clients WHERE email = $1',
        [bookingData.email]
      );

      const bookingTime = new Date(bookingData.startTime);
      const bookingNote = this.formatBookingNote(bookingData);

      if (existingClientResult.rows.length > 0) {
        // Update existing client
        const existingClient = existingClientResult.rows[0];
        const currentBookingCount = existingClient.booking_count || 0;
        const newBookingCount = bookingData.isCanceled ? currentBookingCount : currentBookingCount + 1;

        // Update partner status if booking indicates sponsor/partner
        const partnerStatus = bookingData.partnerStatus !== "NONE" 
          ? bookingData.partnerStatus 
          : existingClient.partner_status;

        // Append booking note to existing notes
        const updatedNotes = existingClient.notes 
          ? `${existingClient.notes}\n\n${bookingNote}`
          : bookingNote;

        await db.execute(`
          UPDATE clients 
          SET 
            name = COALESCE($2, name),
            phone = COALESCE($3, phone),
            partner_status = COALESCE($4, partner_status),
            calendly_event_uri = COALESCE($5, calendly_event_uri),
            last_booking_time = COALESCE($6, last_booking_time),
            booking_count = $7,
            notes = $8,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [
          existingClient.id,
          bookingData.name,
          bookingData.phone,
          partnerStatus,
          bookingData.eventUri,
          bookingData.isCanceled ? existingClient.last_booking_time : bookingTime.toISOString(),
          newBookingCount,
          updatedNotes,
        ]);

        const updatedResult = await db.execute(
          'SELECT * FROM clients WHERE id = $1',
          [existingClient.id]
        );
        const updatedClient = updatedResult.rows[0];

        // Sync to HighLevel if configured
        if (highlevelService.isHighLevelAvailable()) {
          try {
            await highlevelService.syncToHighLevel(updatedClient.id, {
              ...updatedClient,
              partnerStatus,
            });
          } catch (error) {
            console.error("Error syncing Calendly booking to HighLevel (non-fatal):", error);
          }
        }

        return updatedClient;
      } else {
        // Create new client from booking
        const clientId = nanoid();
        const subscriptionRevenue = 0; // New booking, no subscription yet

        await db.execute(`
          INSERT INTO clients (
            id, name, email, phone, subscription_type, status, 
            subscription_date, monthly_revenue, partner_status, 
            calendly_event_uri, last_booking_time, booking_count, notes,
            created_at, updated_at
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          clientId,
          bookingData.name,
          bookingData.email,
          bookingData.phone,
          "TRIAL", // New booking, default to trial
          "ACTIVE",
          new Date().toISOString(),
          subscriptionRevenue,
          bookingData.partnerStatus,
          bookingData.eventUri,
          bookingData.isCanceled ? null : bookingTime.toISOString(),
          bookingData.isCanceled ? 0 : 1,
          bookingNote,
        ]);

        const newClientResult = await db.execute(
          'SELECT * FROM clients WHERE id = $1',
          [clientId]
        );
        const newClient = newClientResult.rows[0];

        // Sync to HighLevel if configured
        if (highlevelService.isHighLevelAvailable()) {
          try {
            const highlevelContactId = await highlevelService.syncToHighLevel(newClient.id, {
              ...newClient,
              partnerStatus: bookingData.partnerStatus,
            });

            if (highlevelContactId) {
              await db.execute(
                'UPDATE clients SET highlevel_contact_id = $1 WHERE id = $2',
                [highlevelContactId, newClient.id]
              );
              newClient.highlevel_contact_id = highlevelContactId;
            }
          } catch (error) {
            console.error("Error syncing new Calendly booking to HighLevel (non-fatal):", error);
          }
        }

        return newClient;
      }
    } catch (error) {
      console.error("Error handling Calendly booking:", error);
      throw error;
    }
  }

  /**
   * Format booking note for storage in client notes
   */
  private formatBookingNote(bookingData: ExtractedBookingData & { isCanceled: boolean }): string {
    const bookingTime = new Date(bookingData.startTime);
    const status = bookingData.isCanceled ? "CANCELED" : "BOOKED";
    const eventType = bookingData.contactType;

    let note = `[Calendly ${status}] ${bookingTime.toLocaleString()}\n`;
    note += `Event: ${bookingData.eventName}\n`;
    note += `Type: ${eventType}`;

    if (bookingData.isCanceled && bookingData.cancelReason) {
      note += `\nCancel Reason: ${bookingData.cancelReason}`;
    }

    if (bookingData.questionsAndAnswers && bookingData.questionsAndAnswers.length > 0) {
      note += `\n\nQuestions:\n`;
      bookingData.questionsAndAnswers.forEach((qa) => {
        note += `- ${qa.question}: ${qa.answer}\n`;
      });
    }

    return note;
  }

  /**
   * Create standalone local client (helper method)
   */
  private async createLocalClient(data: any): Promise<string> {
    const { nanoid } = await import("nanoid");
    const clientId = nanoid();

    const subscriptionRevenue =
      data.subscriptionType === "MONTHLY"
        ? 2500
        : data.subscriptionType === "ANNUAL"
        ? 2083
        : 0;

    await db.execute(`
      INSERT INTO clients (
        id, name, email, subscription_type, status, 
        subscription_date, monthly_revenue, partner_status, created_at, updated_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      clientId,
      data.name,
      data.email,
      data.subscriptionType || "TRIAL",
      data.status || "ACTIVE",
      new Date().toISOString(),
      subscriptionRevenue,
      "NONE",
    ]);

    return clientId;
  }
}

export const crmAdapter = new CRMAdapter();








