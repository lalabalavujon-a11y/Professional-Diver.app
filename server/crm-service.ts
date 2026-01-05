import { db } from "./db";
import { clients, users } from "@shared/schema-sqlite";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * Unified CRM Service
 * Handles synchronization between users and clients
 * Provides single source of truth for CRM data
 */
export class CRMService {
  /**
   * Syncs user data to client record
   * Creates client if doesn't exist, updates if it does
   */
  async syncUserToClient(userId: string): Promise<any> {
    try {
      // Get user data
      const userResult = await db.execute(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error(`User not found: ${userId}`);
      }

      const user = userResult.rows[0];

      // Check if client already exists for this user
      const existingClientResult = await db.execute(
        'SELECT * FROM clients WHERE user_id = $1 OR email = $2',
        [userId, user.email]
      );

      const subscriptionRevenue = this.calculateMonthlyRevenue(user.subscription_type);

      if (existingClientResult.rows.length > 0) {
        // Update existing client
        const existingClient = existingClientResult.rows[0];
        const clientId = existingClient.id;

        await db.execute(`
          UPDATE clients 
          SET 
            user_id = $1,
            name = $2,
            email = $3,
            subscription_type = $4,
            status = $5,
            monthly_revenue = $6,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $7
        `, [
          userId,
          user.name || user.email,
          user.email,
          user.subscription_type,
          user.subscription_status,
          subscriptionRevenue,
          clientId
        ]);

        const updatedResult = await db.execute(
          'SELECT * FROM clients WHERE id = $1',
          [clientId]
        );
        return updatedResult.rows[0];
      } else {
        // Create new client
        const clientId = nanoid();
        await db.execute(`
          INSERT INTO clients (
            id, user_id, name, email, subscription_type, status, 
            subscription_date, monthly_revenue, partner_status, created_at, updated_at
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          clientId,
          userId,
          user.name || user.email,
          user.email,
          user.subscription_type,
          user.subscription_status,
          new Date().toISOString(),
          subscriptionRevenue,
          user.role === 'AFFILIATE' ? 'ACTIVE' : 'NONE'
        ]);

        const newClientResult = await db.execute(
          'SELECT * FROM clients WHERE id = $1',
          [clientId]
        );
        return newClientResult.rows[0];
      }
    } catch (error) {
      console.error('Error syncing user to client:', error);
      throw error;
    }
  }

  /**
   * Handles trial signup - creates both user and client
   */
  async handleTrialSignup(userData: { name: string; email: string }): Promise<{ user: any; client: any }> {
    try {
      // Check if user already exists
      const existingUserResult = await db.execute(
        'SELECT * FROM users WHERE email = $1',
        [userData.email]
      );

      if (existingUserResult.rows.length > 0) {
        throw new Error("User already exists with this email");
      }

      // Create 24-hour trial expiration
      const trialExpiration = new Date();
      trialExpiration.setHours(trialExpiration.getHours() + 24);

      // Create user
      const userId = nanoid();
      await db.execute(`
        INSERT INTO users (id, email, name, subscription_type, trial_expires_at, subscription_status) 
        VALUES ($1, $2, $3, 'TRIAL', $4, 'ACTIVE')
      `, [userId, userData.email, userData.name, trialExpiration.toISOString()]);

      // Create corresponding client
      const client = await this.syncUserToClient(userId);

      const userResult = await db.execute(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      return {
        user: userResult.rows[0],
        client
      };
    } catch (error) {
      console.error('Error handling trial signup:', error);
      throw error;
    }
  }

  /**
   * Handles purchase - updates user subscription and syncs to client
   */
  async handlePurchase(userId: string, subscriptionType: "MONTHLY" | "ANNUAL" | "LIFETIME"): Promise<{ user: any; client: any }> {
    try {
      // Update user subscription
      await db.execute(`
        UPDATE users 
        SET 
          subscription_type = $1,
          subscription_status = 'ACTIVE',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [subscriptionType, userId]);

      // Sync to client
      const client = await this.syncUserToClient(userId);

      const userResult = await db.execute(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      return {
        user: userResult.rows[0],
        client
      };
    } catch (error) {
      console.error('Error handling purchase:', error);
      throw error;
    }
  }

  /**
   * Converts user to partner - updates role and client partner status
   */
  async convertToPartner(userId: string): Promise<{ user: any; client: any }> {
    try {
      // Update user role to AFFILIATE
      await db.execute(`
        UPDATE users 
        SET 
          role = 'AFFILIATE',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [userId]);

      // Update client partner status
      const clientResult = await db.execute(
        'SELECT * FROM clients WHERE user_id = $1',
        [userId]
      );

      if (clientResult.rows.length > 0) {
        await db.execute(`
          UPDATE clients 
          SET 
            partner_status = 'ACTIVE',
            conversion_date = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $1
        `, [userId]);
      } else {
        // Create client if doesn't exist
        await this.syncUserToClient(userId);
        await db.execute(`
          UPDATE clients 
          SET 
            partner_status = 'ACTIVE',
            conversion_date = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $1
        `, [userId]);
      }

      const userResult = await db.execute(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      const updatedClientResult = await db.execute(
        'SELECT * FROM clients WHERE user_id = $1',
        [userId]
      );

      return {
        user: userResult.rows[0],
        client: updatedClientResult.rows[0]
      };
    } catch (error) {
      console.error('Error converting to partner:', error);
      throw error;
    }
  }

  /**
   * Calculate monthly revenue based on subscription type
   */
  private calculateMonthlyRevenue(subscriptionType: string): number {
    switch (subscriptionType) {
      case "MONTHLY":
        return 2500; // $25.00 in cents
      case "ANNUAL":
        return 2083; // $250 / 12 months ≈ $20.83 per month in cents
      case "LIFETIME":
        return 0; // One-time payment, no monthly revenue
      case "TRIAL":
      default:
        return 0;
    }
  }

  /**
   * Get client by user ID
   */
  async getClientByUserId(userId: string): Promise<any | null> {
    try {
      const result = await db.execute(
        'SELECT * FROM clients WHERE user_id = $1',
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting client by user ID:', error);
      return null;
    }
  }

  /**
   * Get client by email
   */
  async getClientByEmail(email: string): Promise<any | null> {
    try {
      const result = await db.execute(
        'SELECT * FROM clients WHERE email = $1',
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting client by email:', error);
      return null;
    }
  }
}

export const crmService = new CRMService();


