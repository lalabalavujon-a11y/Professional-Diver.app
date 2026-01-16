/**
 * Subscription Tier Service
 * 
 * Manages tier-based subscriptions and cross-platform access between
 * Professional Diver Training and Dive Connection Network platforms.
 */

import { db } from "./db";
import { users } from "@shared/schema";
import { users as usersSQLite } from "@shared/schema-sqlite";
import { eq } from "drizzle-orm";

const isSQLiteDev = () => process.env.NODE_ENV === "development";

export type SubscriptionTier = "DIVER" | "COMPANY" | "SERVICE_PROVIDER";
export type EntityType = "INDIVIDUAL" | "COMPANY" | "SERVICE_PROVIDER";
export type SubscriptionType = "TRIAL" | "MONTHLY" | "ANNUAL" | "LIFETIME";

/**
 * Pricing configuration for each tier
 */
export const TIER_PRICING = {
  DIVER: {
    monthly: 1999, // $19.99 in cents
    annual: 19900, // $199.00 in cents (17% discount)
  },
  COMPANY: {
    monthly: 4999, // $49.99 in cents
    annual: 49900, // $499.00 in cents (17% discount)
  },
  SERVICE_PROVIDER: {
    monthly: 7999, // $79.99 in cents
    annual: 79900, // $799.00 in cents (17% discount)
  },
} as const;

/**
 * Map subscription type to default tier
 * Legacy subscriptions default to DIVER tier
 */
export function mapSubscriptionTypeToTier(
  subscriptionType: SubscriptionType,
  entityType?: EntityType
): SubscriptionTier {
  // If user is a company or service provider entity, use that tier
  if (entityType === "COMPANY") {
    return "COMPANY";
  }
  if (entityType === "SERVICE_PROVIDER") {
    return "SERVICE_PROVIDER";
  }
  
  // Default: all legacy subscriptions map to DIVER tier
  // This maintains backward compatibility
  return "DIVER";
}

/**
 * Determine subscription tier from user data
 */
export function determineSubscriptionTier(
  subscriptionType: SubscriptionType,
  entityType: EntityType,
  existingTier?: SubscriptionTier | null
): SubscriptionTier {
  // If tier already exists, use it
  if (existingTier) {
    return existingTier;
  }
  
  // Map based on entity type and subscription type
  return mapSubscriptionTypeToTier(subscriptionType, entityType);
}

/**
 * Get platform access based on subscription tier
 */
export function getPlatformAccess(tier: SubscriptionTier | null): {
  training: boolean;
  network: boolean;
} {
  // All tiers get training access
  // Network access depends on global feature flag (checked separately)
  return {
    training: tier !== null,
    network: tier !== null, // Will be filtered by global feature flag
  };
}

/**
 * Update user's subscription tier and sync network access
 */
export async function updateUserSubscriptionTier(
  userId: string,
  tier: SubscriptionTier,
  entityType?: EntityType
): Promise<void> {
  try {
    const platformAccess = getPlatformAccess(tier);
    
    if (isSQLiteDev()) {
      await db
        .update(usersSQLite)
        .set({
          subscriptionTier: tier,
          networkAccessTier: tier, // Sync network access tier
          platformAccess: platformAccess,
          updatedAt: new Date(),
          ...(entityType && { entityType }),
        })
        .where(eq(usersSQLite.id, userId));
    } else {
      await db
        .update(users)
        .set({
          subscriptionTier: tier,
          networkAccessTier: tier, // Sync network access tier
          platformAccess: platformAccess,
          updatedAt: new Date(),
          ...(entityType && { entityType }),
        })
        .where(eq(users.id, userId));
    }
    
    console.log(`[SubscriptionTierService] Updated user ${userId} to tier ${tier}`);
  } catch (error) {
    console.error(`[SubscriptionTierService] Error updating tier for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Sync network access tier when subscription changes
 */
export async function syncNetworkAccessTier(userId: string): Promise<void> {
  try {
    const user = isSQLiteDev()
      ? await db.select().from(usersSQLite).where(eq(usersSQLite.id, userId)).limit(1)
      : await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (user.length === 0) {
      throw new Error(`User ${userId} not found`);
    }
    
    const userData = user[0];
    const tier = (userData as any).subscriptionTier as SubscriptionTier | null;
    
    if (tier) {
      // Sync network access tier to match subscription tier
      if (isSQLiteDev()) {
        await db
          .update(usersSQLite)
          .set({
            networkAccessTier: tier,
            platformAccess: getPlatformAccess(tier),
            updatedAt: new Date(),
          })
          .where(eq(usersSQLite.id, userId));
      } else {
        await db
          .update(users)
          .set({
            networkAccessTier: tier,
            platformAccess: getPlatformAccess(tier),
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      }
      
      console.log(`[SubscriptionTierService] Synced network access tier for user ${userId}: ${tier}`);
    }
  } catch (error) {
    console.error(`[SubscriptionTierService] Error syncing network access for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get user's network access tier
 */
export async function getUserNetworkAccessTier(
  userId: string
): Promise<SubscriptionTier | null> {
  try {
    const user = isSQLiteDev()
      ? await db.select().from(usersSQLite).where(eq(usersSQLite.id, userId)).limit(1)
      : await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (user.length === 0) {
      return null;
    }
    
    return (user[0] as any).networkAccessTier as SubscriptionTier | null;
  } catch (error) {
    console.error(`[SubscriptionTierService] Error getting network access tier for user ${userId}:`, error);
    return null;
  }
}

/**
 * Check if user has access to a specific tier or higher
 */
export function hasTierAccess(
  userTier: SubscriptionTier | null,
  requiredTier: SubscriptionTier
): boolean {
  if (!userTier) {
    return false;
  }
  
  const tierHierarchy: Record<SubscriptionTier, number> = {
    DIVER: 1,
    COMPANY: 2,
    SERVICE_PROVIDER: 3,
  };
  
  return tierHierarchy[userTier] >= tierHierarchy[requiredTier];
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: SubscriptionTier): string {
  const names: Record<SubscriptionTier, string> = {
    DIVER: "Diver",
    COMPANY: "Company",
    SERVICE_PROVIDER: "Service Provider",
  };
  
  return names[tier];
}

/**
 * Get tier price in cents
 */
export function getTierPrice(tier: SubscriptionTier, billingCycle: "monthly" | "annual"): number {
  return TIER_PRICING[tier][billingCycle];
}

/**
 * Get tier price in dollars (formatted)
 */
export function getTierPriceFormatted(tier: SubscriptionTier, billingCycle: "monthly" | "annual"): string {
  const price = getTierPrice(tier, billingCycle);
  return `$${(price / 100).toFixed(2)}`;
}

/**
 * Initialize subscription tier for existing users
 * Called during migration to set default tiers
 */
export async function initializeSubscriptionTiers(): Promise<void> {
  try {
    console.log("[SubscriptionTierService] Initializing subscription tiers for existing users...");
    
    const allUsers = isSQLiteDev()
      ? await db.select().from(usersSQLite)
      : await db.select().from(users);
    
    let updated = 0;
    
    for (const user of allUsers) {
      const userData = user as any;
      
      // Skip if tier already set
      if (userData.subscriptionTier) {
        continue;
      }
      
      // Determine tier from existing data
      const tier = determineSubscriptionTier(
        userData.subscriptionType,
        userData.entityType || "INDIVIDUAL",
        userData.subscriptionTier
      );
      
      // Update user with tier
      await updateUserSubscriptionTier(
        userData.id,
        tier,
        userData.entityType || "INDIVIDUAL"
      );
      
      updated++;
    }
    
    console.log(`[SubscriptionTierService] Initialized tiers for ${updated} users`);
  } catch (error) {
    console.error("[SubscriptionTierService] Error initializing subscription tiers:", error);
    throw error;
  }
}
