import { crmService } from "./crm-service";
import { highlevelService } from "./highlevel-service";
import { db } from "./db";

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
          await db.execute(
            'UPDATE clients SET highlevel_contact_id = $1 WHERE id = $2',
            [highlevelContactId, localClient.id]
          );
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
    const clientResult = await db.execute(
      'SELECT * FROM clients WHERE id = $1',
      [clientId]
    );

    // Delete from local CRM
    await db.execute('DELETE FROM clients WHERE id = $1', [clientId]);

    // Optionally delete from HighLevel if available
    if (
      highlevelService.isHighLevelAvailable() &&
      clientResult.rows[0]?.highlevel_contact_id
    ) {
      try {
        // Note: HighLevel API may not support direct deletion
        // You might want to archive or tag as deleted instead
        console.log(
          `HighLevel contact ${clientResult.rows[0].highlevel_contact_id} should be archived/deleted manually`
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


