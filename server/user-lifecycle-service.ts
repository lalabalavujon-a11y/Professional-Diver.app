import { db } from "./db";
import { crmService } from "./crm-service";
import { crmAdapter } from "./crm-adapter";

/**
 * User Lifecycle Service
 * Handles automated transitions in user lifecycle
 * Trial → Purchase → Partner
 */
export class UserLifecycleService {
  /**
   * Monitor and handle trial expiration
   */
  async handleTrialExpiration(): Promise<void> {
    try {
      // Find all users with expired trials
      const expiredTrials = await db.execute(`
        SELECT * FROM users 
        WHERE subscription_type = 'TRIAL' 
        AND subscription_status = 'ACTIVE'
        AND trial_expires_at < CURRENT_TIMESTAMP
      `);

      for (const user of expiredTrials.rows) {
        // Update user status to paused/cancelled
        await db.execute(`
          UPDATE users 
          SET subscription_status = 'PAUSED',
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [user.id]);

        // Sync to client
        await crmService.syncUserToClient(user.id);
      }

      console.log(`Processed ${expiredTrials.rows.length} expired trials`);
    } catch (error) {
      console.error("Error handling trial expiration:", error);
      throw error;
    }
  }

  /**
   * Handle purchase event (from payment webhook)
   * 
   * TODO: Integrate with Stripe/PayPal webhook handlers when payment processing is implemented
   * This method should be called from webhook handlers in routes.ts
   */
  async handlePurchaseEvent(data: {
    userId: string;
    subscriptionType: "MONTHLY" | "ANNUAL" | "LIFETIME";
    stripeCustomerId?: string;
    amount?: number;
  }): Promise<{ user: any; client: any }> {
    try {
      // Update user subscription
      await db.execute(`
        UPDATE users 
        SET 
          subscription_type = $1,
          subscription_status = 'ACTIVE',
          stripe_customer_id = COALESCE($2, stripe_customer_id),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [data.subscriptionType, data.stripeCustomerId, data.userId]);

      // Sync to CRM
      const result = await crmService.handlePurchase(
        data.userId,
        data.subscriptionType
      );

      // Optionally sync to HighLevel via adapter
      if (result.client) {
        await crmAdapter.updateClient(result.client.id, {
          subscriptionType: data.subscriptionType,
          status: "ACTIVE",
        });
      }

      return result;
    } catch (error) {
      console.error("Error handling purchase event:", error);
      throw error;
    }
  }

  /**
   * Check partner eligibility and trigger conversion if eligible
   */
  async checkPartnerEligibility(userId: string): Promise<{
    eligible: boolean;
    reason?: string;
  }> {
    try {
      const userResult = await db.execute(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return { eligible: false, reason: "User not found" };
      }

      const user = userResult.rows[0];

      // Must be a paid subscriber
      if (
        user.subscription_type === "TRIAL" ||
        user.subscription_status !== "ACTIVE"
      ) {
        return {
          eligible: false,
          reason: "Must be an active paid subscriber",
        };
      }

      // Already a partner
      if (user.role === "AFFILIATE") {
        return { eligible: false, reason: "Already a partner" };
      }

      return { eligible: true };
    } catch (error) {
      console.error("Error checking partner eligibility:", error);
      return { eligible: false, reason: "Error checking eligibility" };
    }
  }

  /**
   * Automated status updates based on subscription changes
   */
  async updateSubscriptionStatus(
    userId: string,
    status: "ACTIVE" | "PAUSED" | "CANCELLED"
  ): Promise<void> {
    try {
      // Update user
      await db.execute(`
        UPDATE users 
        SET subscription_status = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [status, userId]);

      // Sync to client
      const client = await crmService.getClientByUserId(userId);
      if (client) {
        await crmAdapter.updateClient(client.id, { status });
      }
    } catch (error) {
      console.error("Error updating subscription status:", error);
      throw error;
    }
  }

  /**
   * Get user lifecycle stage
   */
  async getUserLifecycleStage(userId: string): Promise<{
    stage: "TRIAL" | "PAID" | "PARTNER" | "INACTIVE";
    details: any;
  }> {
    try {
      const userResult = await db.execute(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return { stage: "INACTIVE", details: null };
      }

      const user = userResult.rows[0];

      if (user.role === "AFFILIATE") {
        return { stage: "PARTNER", details: user };
      }

      if (
        user.subscription_type !== "TRIAL" &&
        user.subscription_status === "ACTIVE"
      ) {
        return { stage: "PAID", details: user };
      }

      if (user.subscription_type === "TRIAL") {
        return { stage: "TRIAL", details: user };
      }

      return { stage: "INACTIVE", details: user };
    } catch (error) {
      console.error("Error getting user lifecycle stage:", error);
      return { stage: "INACTIVE", details: null };
    }
  }
}

export const userLifecycleService = new UserLifecycleService();



