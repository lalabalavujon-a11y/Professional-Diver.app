/**
 * HighLevel Service
 * Abstraction layer for GoHighLevel CRM integration
 * Works when HighLevel is available, gracefully degrades when not
 */

interface HighLevelContact {
  id?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

interface HighLevelConfig {
  apiKey?: string;
  locationId?: string;
}

export class HighLevelService {
  private config: HighLevelConfig;
  private baseUrl = "https://rest.gohighlevel.com/v1";

  constructor() {
    this.config = {
      apiKey: process.env.GHL_API_KEY,
      locationId: process.env.GHL_LOCATION_ID,
    };
  }

  /**
   * Check if HighLevel is available (API key configured)
   */
  isHighLevelAvailable(): boolean {
    return !!this.config.apiKey && !!this.config.locationId;
  }

  /**
   * Create contact in HighLevel
   */
  async createContact(clientData: {
    name: string;
    email: string;
    phone?: string;
    subscriptionType?: string;
    status?: string;
    partnerStatus?: string;
  }): Promise<HighLevelContact | null> {
    if (!this.isHighLevelAvailable()) {
      console.log("HighLevel not available, skipping contact creation");
      return null;
    }

    try {
      const [firstName, ...lastNameParts] = (clientData.name || "").split(" ");
      const lastName = lastNameParts.join(" ") || "";

      const contactData: any = {
        firstName: firstName || clientData.email.split("@")[0],
        lastName: lastName,
        email: clientData.email,
        phone: clientData.phone || "",
        tags: this.buildTags(clientData),
        customFields: this.buildCustomFields(clientData),
      };

      const response = await fetch(`${this.baseUrl}/contacts/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
          "Version": "2021-07-28",
        },
        body: JSON.stringify(contactData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("HighLevel API error:", errorText);
        throw new Error(`HighLevel API error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return {
        id: result.contact?.id,
        email: result.contact?.email,
        firstName: result.contact?.firstName,
        lastName: result.contact?.lastName,
      };
    } catch (error) {
      console.error("Error creating HighLevel contact:", error);
      // Don't throw - gracefully degrade
      return null;
    }
  }

  /**
   * Update contact in HighLevel
   */
  async updateContact(
    contactId: string,
    updates: Partial<HighLevelContact>
  ): Promise<HighLevelContact | null> {
    if (!this.isHighLevelAvailable()) {
      console.log("HighLevel not available, skipping contact update");
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/contacts/${contactId}`,
        {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
            "Version": "2021-07-28",
          },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("HighLevel API error:", errorText);
        throw new Error(`HighLevel API error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return result.contact;
    } catch (error) {
      console.error("Error updating HighLevel contact:", error);
      // Don't throw - gracefully degrade
      return null;
    }
  }

  /**
   * Sync local client to HighLevel
   */
  async syncToHighLevel(clientId: string, clientData: any): Promise<string | null> {
    if (!this.isHighLevelAvailable()) {
      return null;
    }

    try {
      // Check if client already has HighLevel contact ID
      const existingContactId = clientData.highlevel_contact_id;

      if (existingContactId) {
        // Update existing contact
        await this.updateContact(existingContactId, {
          email: clientData.email,
          firstName: clientData.name?.split(" ")[0],
          lastName: clientData.name?.split(" ").slice(1).join(" "),
          tags: this.buildTags(clientData),
          customFields: this.buildCustomFields(clientData),
        });
        return existingContactId;
      } else {
        // Create new contact
        const contact = await this.createContact(clientData);
        return contact?.id || null;
      }
    } catch (error) {
      console.error("Error syncing to HighLevel:", error);
      return null;
    }
  }

  /**
   * Sync HighLevel contact to local CRM
   */
  async syncFromHighLevel(contactId: string): Promise<any | null> {
    if (!this.isHighLevelAvailable()) {
      return null;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/contacts/${contactId}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${this.config.apiKey}`,
            "Version": "2021-07-28",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HighLevel API error: ${response.status}`);
      }

      const result = await response.json();
      return result.contact;
    } catch (error) {
      console.error("Error syncing from HighLevel:", error);
      return null;
    }
  }

  /**
   * Build tags for HighLevel contact based on client data
   */
  private buildTags(clientData: any): string[] {
    const tags: string[] = [];

    if (clientData.subscriptionType) {
      tags.push(`Subscription:${clientData.subscriptionType}`);
    }

    if (clientData.status) {
      tags.push(`Status:${clientData.status}`);
    }

    if (clientData.partnerStatus && clientData.partnerStatus !== "NONE") {
      tags.push(`Partner:${clientData.partnerStatus}`);
    }

    return tags;
  }

  /**
   * Build custom fields for HighLevel contact
   */
  private buildCustomFields(clientData: any): Record<string, any> {
    return {
      subscriptionType: clientData.subscriptionType || "",
      subscriptionStatus: clientData.status || "",
      partnerStatus: clientData.partnerStatus || "NONE",
      monthlyRevenue: clientData.monthly_revenue || 0,
    };
  }
}

export const highlevelService = new HighLevelService();




