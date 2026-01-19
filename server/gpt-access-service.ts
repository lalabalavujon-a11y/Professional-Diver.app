import { db } from "./db";
import { gptAccessTokens, users } from "../shared/schema-sqlite";
import { eq, and, gt, lte } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * GPT Access Service
 * Manages time-limited access tokens for Diver Well GPT access
 * Tokens are automatically revoked when subscriptions end or are cancelled
 * 
 * Required Environment Variables:
 * - GPT_ID: OpenAI GPT ID (optional, if not provided, uses custom base URL)
 * - GPT_ACCESS_BASE_URL: Custom base URL for GPT access links (default: https://diverwell.app/gpt-access)
 */
export class GptAccessService {
  /**
   * Calculate token expiration date based on subscription type
   */
  private getExpirationDate(subscriptionType: string): Date {
    const now = new Date();
    const expiration = new Date(now);

    switch (subscriptionType) {
      case "TRIAL":
        expiration.setDate(now.getDate() + 7); // 7 days
        break;
      case "MONTHLY":
        expiration.setDate(now.getDate() + 30); // 30 days
        break;
      case "ANNUAL":
        expiration.setDate(now.getDate() + 365); // 365 days
        break;
      case "LIFETIME":
        expiration.setFullYear(now.getFullYear() + 10); // 10 years (effectively permanent)
        break;
      default:
        expiration.setDate(now.getDate() + 7); // Default to 7 days
    }

    return expiration;
  }

  /**
   * Check if user has active subscription
   */
  private async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userResult.length === 0) {
        return false;
      }

      const user = userResult[0];

      // Check if subscription is active
      if (user.subscriptionStatus !== "ACTIVE") {
        return false;
      }

      // For TRIAL subscriptions, check if trial has expired
      if (user.subscriptionType === "TRIAL" && user.trialExpiresAt) {
        const trialExpiresAt = user.trialExpiresAt instanceof Date 
          ? user.trialExpiresAt 
          : new Date(user.trialExpiresAt);
        
        if (trialExpiresAt < new Date()) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Error checking subscription status:", error);
      return false;
    }
  }

  /**
   * Generate a new access token for an active subscriber
   * Revokes any existing active tokens for the user
   */
  async generateAccessToken(userId: string): Promise<{
    token: string;
    expiresAt: Date;
    accessLink: string;
  }> {
    try {
      // Check if user has active subscription
      const hasActive = await this.hasActiveSubscription(userId);
      if (!hasActive) {
        throw new Error("User does not have an active subscription");
      }

      // Get user to determine subscription type
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userResult.length === 0) {
        throw new Error("User not found");
      }

      const user = userResult[0];

      // Revoke any existing active tokens for this user
      await this.revokeUserTokens(userId, "New token generated");

      // Generate new secure token (32 characters)
      const token = nanoid(32);

      // Calculate expiration date
      const expiresAt = this.getExpirationDate(user.subscriptionType);

      // Create token record
      const tokenId = nanoid();
      await db.insert(gptAccessTokens).values({
        id: tokenId,
        userId: userId,
        token: token,
        expiresAt: expiresAt,
        isRevoked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Generate access link
      const gptId = process.env.GPT_ID || "";
      const baseUrl = process.env.GPT_ACCESS_BASE_URL || "https://diverwell.app/gpt-access";
      const accessLink = gptId 
        ? `https://chat.openai.com/g/${gptId}?token=${token}`
        : `${baseUrl}?token=${token}`;

      return {
        token,
        expiresAt,
        accessLink,
      };
    } catch (error) {
      console.error("Error generating access token:", error);
      throw error;
    }
  }

  /**
   * Validate a token and check if it's still valid
   */
  async validateToken(token: string): Promise<{
    valid: boolean;
    userId?: string;
    reason?: string;
  }> {
    try {
      // Find token
      const tokenResult = await db
        .select()
        .from(gptAccessTokens)
        .where(eq(gptAccessTokens.token, token))
        .limit(1);

      if (tokenResult.length === 0) {
        return { valid: false, reason: "Token not found" };
      }

      const tokenRecord = tokenResult[0];

      // Check if token is revoked
      if (tokenRecord.isRevoked) {
        return { valid: false, reason: "Token has been revoked" };
      }

      // Check if token is expired
      const expiresAt = tokenRecord.expiresAt instanceof Date
        ? tokenRecord.expiresAt
        : new Date(tokenRecord.expiresAt);

      if (expiresAt < new Date()) {
        return { valid: false, reason: "Token has expired" };
      }

      // Verify user still has active subscription
      const hasActive = await this.hasActiveSubscription(tokenRecord.userId);
      if (!hasActive) {
        // Auto-revoke token if subscription is no longer active
        await this.revokeToken(token, "Subscription no longer active");
        return { valid: false, reason: "User subscription is not active" };
      }

      return { valid: true, userId: tokenRecord.userId };
    } catch (error) {
      console.error("Error validating token:", error);
      return { valid: false, reason: "Validation error" };
    }
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeUserTokens(userId: string, reason: string): Promise<void> {
    try {
      const now = new Date();
      await db
        .update(gptAccessTokens)
        .set({
          isRevoked: true,
          revokedAt: now,
          revokedReason: reason,
          updatedAt: now,
        })
        .where(
          and(
            eq(gptAccessTokens.userId, userId),
            eq(gptAccessTokens.isRevoked, false)
          )
        );
    } catch (error) {
      console.error("Error revoking user tokens:", error);
      throw error;
    }
  }

  /**
   * Revoke a specific token
   */
  async revokeToken(token: string, reason: string): Promise<void> {
    try {
      const now = new Date();
      await db
        .update(gptAccessTokens)
        .set({
          isRevoked: true,
          revokedAt: now,
          revokedReason: reason,
          updatedAt: now,
        })
        .where(eq(gptAccessTokens.token, token));
    } catch (error) {
      console.error("Error revoking token:", error);
      throw error;
    }
  }

  /**
   * Get user's current active token
   */
  async getUserActiveToken(userId: string): Promise<{
    token: string;
    expiresAt: Date;
    accessLink: string;
  } | null> {
    try {
      const now = new Date();
      const tokenResult = await db
        .select()
        .from(gptAccessTokens)
        .where(
          and(
            eq(gptAccessTokens.userId, userId),
            eq(gptAccessTokens.isRevoked, false),
            gt(gptAccessTokens.expiresAt, now)
          )
        )
        .orderBy(gptAccessTokens.createdAt)
        .limit(1);

      if (tokenResult.length === 0) {
        return null;
      }

      const tokenRecord = tokenResult[0];
      const expiresAt = tokenRecord.expiresAt instanceof Date
        ? tokenRecord.expiresAt
        : new Date(tokenRecord.expiresAt);

      // Generate access link
      const gptId = process.env.GPT_ID || "";
      const baseUrl = process.env.GPT_ACCESS_BASE_URL || "https://diverwell.app/gpt-access";
      const accessLink = gptId 
        ? `https://chat.openai.com/g/${gptId}?token=${tokenRecord.token}`
        : `${baseUrl}?token=${tokenRecord.token}`;

      return {
        token: tokenRecord.token,
        expiresAt,
        accessLink,
      };
    } catch (error) {
      console.error("Error getting user active token:", error);
      return null;
    }
  }

  /**
   * Cleanup expired tokens (background job)
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const now = new Date();
      const result = await db
        .update(gptAccessTokens)
        .set({
          isRevoked: true,
          revokedAt: now,
          revokedReason: "Token expired",
          updatedAt: now,
        })
        .where(
          and(
            eq(gptAccessTokens.isRevoked, false),
            lte(gptAccessTokens.expiresAt, now)
          )
        );

      // Return count of updated tokens (approximate)
      return result.changes || 0;
    } catch (error) {
      console.error("Error cleaning up expired tokens:", error);
      return 0;
    }
  }
}

export const gptAccessService = new GptAccessService();
