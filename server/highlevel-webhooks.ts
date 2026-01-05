import { Request, Response } from "express";
import { db } from "./db";
import { crmAdapter } from "./crm-adapter";

/**
 * HighLevel Webhook Handlers
 * Handles incoming webhooks from GoHighLevel CRM
 * Syncs changes back to local CRM
 */

/**
 * Handle contact creation/update webhook from HighLevel
 */
export async function handleHighLevelContactWebhook(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const webhookData = req.body;

    // Verify webhook (add signature verification if needed)
    if (!webhookData.contact) {
      res.status(400).json({ error: "Invalid webhook data" });
      return;
    }

    const contact = webhookData.contact;
    const eventType = webhookData.type || "contact.updated"; // contact.created, contact.updated, etc.

    // Find local client by HighLevel contact ID or email
    let clientResult = await db.execute(
      'SELECT * FROM clients WHERE highlevel_contact_id = $1',
      [contact.id]
    );

    if (clientResult.rows.length === 0 && contact.email) {
      // Try to find by email
      clientResult = await db.execute(
        'SELECT * FROM clients WHERE email = $1',
        [contact.email]
      );
    }

    if (clientResult.rows.length > 0) {
      // Update existing client
      const localClient = clientResult.rows[0];

      // Extract subscription type from tags or custom fields
      const subscriptionType = extractSubscriptionType(contact);
      const status = extractStatus(contact);
      const partnerStatus = extractPartnerStatus(contact);

      await db.execute(`
        UPDATE clients 
        SET 
          name = COALESCE($1, name),
          email = COALESCE($2, email),
          subscription_type = COALESCE($3, subscription_type),
          status = COALESCE($4, status),
          partner_status = COALESCE($5, partner_status),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
      `, [
        `${contact.firstName || ""} ${contact.lastName || ""}`.trim() ||
          contact.email,
        contact.email || localClient.email,
        subscriptionType,
        status,
        partnerStatus,
        localClient.id,
      ]);

      console.log(`Synced HighLevel contact ${contact.id} to local client ${localClient.id}`);
    } else {
      // Create new client from HighLevel contact
      const subscriptionType = extractSubscriptionType(contact) || "TRIAL";
      const status = extractStatus(contact) || "ACTIVE";
      const partnerStatus = extractPartnerStatus(contact) || "NONE";

      await crmAdapter.createClient({
        name: `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || contact.email,
        email: contact.email,
        phone: contact.phone,
        subscriptionType,
        status,
        userId: undefined, // No user link for HighLevel-originated contacts
      });

      // Update with HighLevel contact ID
      await db.execute(
        'UPDATE clients SET highlevel_contact_id = $1 WHERE email = $2',
        [contact.id, contact.email]
      );

      console.log(`Created local client from HighLevel contact ${contact.id}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error handling HighLevel webhook:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
}

/**
 * Handle tag changes from HighLevel
 */
export async function handleHighLevelTagWebhook(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const webhookData = req.body;
    const contact = webhookData.contact;
    const tags = contact.tags || [];

    // Find local client
    const clientResult = await db.execute(
      'SELECT * FROM clients WHERE highlevel_contact_id = $1',
      [contact.id]
    );

    if (clientResult.rows.length > 0) {
      const localClient = clientResult.rows[0];

      // Extract data from tags
      const subscriptionType = extractSubscriptionTypeFromTags(tags);
      const status = extractStatusFromTags(tags);
      const partnerStatus = extractPartnerStatusFromTags(tags);

      if (subscriptionType || status || partnerStatus) {
        await db.execute(`
          UPDATE clients 
          SET 
            subscription_type = COALESCE($1, subscription_type),
            status = COALESCE($2, status),
            partner_status = COALESCE($3, partner_status),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
        `, [subscriptionType, status, partnerStatus, localClient.id]);

        console.log(`Updated client ${localClient.id} from HighLevel tags`);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error handling HighLevel tag webhook:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
}

/**
 * Extract subscription type from HighLevel contact
 */
function extractSubscriptionType(contact: any): string | null {
  // Check custom fields
  if (contact.customField && contact.customField.subscriptionType) {
    return contact.customField.subscriptionType;
  }

  // Check tags
  if (contact.tags) {
    return extractSubscriptionTypeFromTags(contact.tags);
  }

  return null;
}

/**
 * Extract subscription type from tags
 */
function extractSubscriptionTypeFromTags(tags: string[]): string | null {
  const tag = tags.find((t) => t.startsWith("Subscription:"));
  if (tag) {
    return tag.replace("Subscription:", "").toUpperCase();
  }
  return null;
}

/**
 * Extract status from HighLevel contact
 */
function extractStatus(contact: any): string | null {
  // Check custom fields
  if (contact.customField && contact.customField.subscriptionStatus) {
    return contact.customField.subscriptionStatus;
  }

  // Check tags
  if (contact.tags) {
    return extractStatusFromTags(contact.tags);
  }

  return null;
}

/**
 * Extract status from tags
 */
function extractStatusFromTags(tags: string[]): string | null {
  const tag = tags.find((t) => t.startsWith("Status:"));
  if (tag) {
    return tag.replace("Status:", "").toUpperCase();
  }
  return null;
}

/**
 * Extract partner status from HighLevel contact
 */
function extractPartnerStatus(contact: any): string | null {
  // Check custom fields
  if (contact.customField && contact.customField.partnerStatus) {
    return contact.customField.partnerStatus;
  }

  // Check tags
  if (contact.tags) {
    return extractPartnerStatusFromTags(contact.tags);
  }

  return null;
}

/**
 * Extract partner status from tags
 */
function extractPartnerStatusFromTags(tags: string[]): string | null {
  const tag = tags.find((t) => t.startsWith("Partner:"));
  if (tag) {
    return tag.replace("Partner:", "").toUpperCase();
  }
  return null;
}
