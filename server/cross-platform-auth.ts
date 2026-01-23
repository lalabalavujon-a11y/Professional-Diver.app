/**
 * Cross-Platform Authentication Service
 * 
 * Handles SSO (Single Sign-On) and subscription synchronization between
 * Professional Diver Training and Dive Connection Network platforms.
 */

import { db } from "./db";
import { users } from "@shared/schema";
import { users as usersSQLite } from "@shared/schema-sqlite";
import { eq } from "drizzle-orm";
import { getUserNetworkAccessTier, syncNetworkAccessTier, type SubscriptionTier } from "./subscription-tier-service";
import crypto from "crypto";

const isSQLiteDev = () => process.env.NODE_ENV === "development";

// SSO token configuration
const SSO_TOKEN_EXPIRY = 3600; // 1 hour in seconds

/**
 * Get SSO token secret from environment.
 * SECURITY: No default value - must be explicitly configured.
 * Throws an error if not configured to prevent insecure operation.
 */
function getSSOTokenSecret(): string {
  const secret = process.env.SSO_TOKEN_SECRET;
  if (!secret) {
    throw new Error(
      "[SECURITY] SSO_TOKEN_SECRET environment variable is not configured. " +
      "This is required for secure cross-platform authentication. " +
      "Please set a strong, random secret (at least 32 characters)."
    );
  }
  if (secret.length < 32) {
    console.warn(
      "[SECURITY WARNING] SSO_TOKEN_SECRET should be at least 32 characters for adequate security."
    );
  }
  return secret;
}

/**
 * Generate SSO token for cross-platform access
 */
export function generateSSOToken(
  userId: string,
  email: string,
  tier: SubscriptionTier | null
): string {
  const payload = {
    userId,
    email,
    tier,
    timestamp: Date.now(),
    expiresAt: Date.now() + (SSO_TOKEN_EXPIRY * 1000),
  };

  const payloadString = JSON.stringify(payload);
  const signature = crypto
    .createHmac("sha256", getSSOTokenSecret())
    .update(payloadString)
    .digest("hex");

  const token = Buffer.from(payloadString).toString("base64url");
  return `${token}.${signature}`;
}

/**
 * Verify and decode SSO token
 */
export function verifySSOToken(token: string): {
  userId: string;
  email: string;
  tier: SubscriptionTier | null;
  valid: boolean;
} | null {
  try {
    const [payloadBase64, signature] = token.split(".");
    
    if (!payloadBase64 || !signature) {
      return null;
    }

    const payloadString = Buffer.from(payloadBase64, "base64url").toString("utf-8");
    const payload = JSON.parse(payloadString);

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", getSSOTokenSecret())
      .update(payloadString)
      .digest("hex");

    if (signature !== expectedSignature) {
      return null;
    }

    // Check expiration
    if (Date.now() > payload.expiresAt) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      tier: payload.tier,
      valid: true,
    };
  } catch (error) {
    console.error("[CrossPlatformAuth] Error verifying SSO token:", error);
    return null;
  }
}

/**
 * Get user's Network access credentials
 * Returns SSO token and access information for Network app
 */
export async function getNetworkAccessCredentials(
  userId: string
): Promise<{
  ssoToken: string;
  email: string;
  tier: SubscriptionTier | null;
  hasAccess: boolean;
} | null> {
  try {
    const user = isSQLiteDev()
      ? await db.select().from(usersSQLite).where(eq(usersSQLite.id, userId)).limit(1)
      : await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (user.length === 0) {
      return null;
    }

    const userData = user[0] as any;
    const email = userData.email;
    const tier = userData.networkAccessTier || userData.subscriptionTier || null;
    const platformAccess = userData.platformAccess || { training: true, network: false };

    // Check if user has Network access
    const hasAccess = platformAccess.network && tier !== null;

    if (!hasAccess) {
      return {
        ssoToken: "",
        email,
        tier: null,
        hasAccess: false,
      };
    }

    // Generate SSO token
    const ssoToken = generateSSOToken(userId, email, tier);

    return {
      ssoToken,
      email,
      tier,
      hasAccess: true,
    };
  } catch (error) {
    console.error(`[CrossPlatformAuth] Error getting network access for user ${userId}:`, error);
    return null;
  }
}

/**
 * Verify user has valid Training subscription for Network access
 * Called by Network app to validate access
 */
export async function verifyTrainingSubscription(
  email: string
): Promise<{
  hasAccess: boolean;
  tier: SubscriptionTier | null;
  subscriptionStatus: string;
} | null> {
  try {
    const user = isSQLiteDev()
      ? await db.select().from(usersSQLite).where(eq(usersSQLite.email, email)).limit(1)
      : await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (user.length === 0) {
      return {
        hasAccess: false,
        tier: null,
        subscriptionStatus: "NOT_FOUND",
      };
    }

    const userData = user[0] as any;
    const subscriptionStatus = userData.subscriptionStatus || "CANCELLED";
    const tier = userData.networkAccessTier || userData.subscriptionTier || null;
    const platformAccess = userData.platformAccess || { training: true, network: false };

    // Check if subscription is active and Network access is enabled
    const hasAccess = 
      subscriptionStatus === "ACTIVE" &&
      tier !== null &&
      platformAccess.network === true;

    return {
      hasAccess,
      tier,
      subscriptionStatus,
    };
  } catch (error) {
    console.error(`[CrossPlatformAuth] Error verifying subscription for ${email}:`, error);
    return null;
  }
}

/**
 * Sync subscription changes to Network app
 * Called when Training subscription is updated
 */
export async function syncSubscriptionToNetwork(
  userId: string,
  tier: SubscriptionTier | null,
  subscriptionStatus: "ACTIVE" | "PAUSED" | "CANCELLED"
): Promise<void> {
  try {
    // Update Network access tier in Training app
    if (tier) {
      await syncNetworkAccessTier(userId);
    } else {
      // No tier = no Network access
      const platformAccess = { training: true, network: false };
      
      if (isSQLiteDev()) {
        await db
          .update(usersSQLite)
          .set({
            networkAccessTier: null,
            platformAccess: platformAccess,
            updatedAt: new Date(),
          })
          .where(eq(usersSQLite.id, userId));
      } else {
        await db
          .update(users)
          .set({
            networkAccessTier: null,
            platformAccess: platformAccess,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      }
    }

    // TODO: In the future, make API call to Network app to sync subscription
    // For now, Network app will validate on-demand via verifyTrainingSubscription
    
    console.log(`[CrossPlatformAuth] Synced subscription for user ${userId}: tier=${tier}, status=${subscriptionStatus}`);
  } catch (error) {
    console.error(`[CrossPlatformAuth] Error syncing subscription for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get Network app URL with SSO token
 */
export function getNetworkAppUrl(userId: string, email: string, tier: SubscriptionTier | null): string {
  const networkAppUrl = process.env.NETWORK_APP_URL || "https://dive-connection.app";
  const credentials = generateSSOToken(userId, email, tier);
  return `${networkAppUrl}?sso=${encodeURIComponent(credentials)}`;
}

/**
 * Validate user can access Network platform
 */
export async function canAccessNetwork(userId: string): Promise<boolean> {
  try {
    const tier = await getUserNetworkAccessTier(userId);
    
    if (!tier) {
      return false;
    }

    const user = isSQLiteDev()
      ? await db.select().from(usersSQLite).where(eq(usersSQLite.id, userId)).limit(1)
      : await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (user.length === 0) {
      return false;
    }

    const userData = user[0] as any;
    const subscriptionStatus = userData.subscriptionStatus;
    const platformAccess = userData.platformAccess || { training: true, network: false };

    return (
      subscriptionStatus === "ACTIVE" &&
      platformAccess.network === true &&
      tier !== null
    );
  } catch (error) {
    console.error(`[CrossPlatformAuth] Error checking network access for user ${userId}:`, error);
    return false;
  }
}
