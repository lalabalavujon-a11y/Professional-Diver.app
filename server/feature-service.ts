/**
 * Feature Service
 * 
 * Handles feature permission resolution logic:
 * - Merges role defaults with individual user overrides
 * - Provides helper functions for checking permissions
 */

import { db } from "./db";
import { featureDefinitions, roleFeatureDefaults, userFeatureOverrides, users, globalFeatureFlags } from "@shared/schema";
import { featureDefinitions as featureDefinitionsSQLite, roleFeatureDefaults as roleFeatureDefaultsSQLite, userFeatureOverrides as userFeatureOverridesSQLite, users as usersSQLite, globalFeatureFlags as globalFeatureFlagsSQLite } from "@shared/schema-sqlite";
import { eq, and } from "drizzle-orm";
import { FEATURE_REGISTRY, getAllFeatures } from "./feature-registry";

const isSQLiteDev = () => process.env.NODE_ENV === "development";

/**
 * Resolve user permissions by merging role defaults with user overrides
 * Global feature flags are checked first (SUPER_ADMIN exempt)
 */
export async function resolveUserPermissions(
  userId: string,
  userRole: string
): Promise<Record<string, boolean>> {
  try {
    // Get all features
    const allFeatures = getAllFeatures();
    const permissions: Record<string, boolean> = {};

    // Check if user is SUPER_ADMIN (exempt from global flags)
    const isSuperAdmin = userRole === 'SUPER_ADMIN';

    // Get global feature flags (only if not SUPER_ADMIN)
    const globalFlags = isSuperAdmin ? {} : await getGlobalFeatureFlags();

    // Get role defaults for this user's role
    const roleDefaults = await getRoleDefaults(userRole);

    // Get user overrides
    const userOverrides = await getUserOverrides(userId);

    // Merge: global flag > override > default
    for (const feature of allFeatures) {
      // Check global flag first (unless SUPER_ADMIN)
      if (!isSuperAdmin && globalFlags[feature.id] === false) {
        // Globally disabled - user cannot access regardless of role/user permissions
        permissions[feature.id] = false;
        continue;
      }

      // If globally enabled (or SUPER_ADMIN), check user overrides and role defaults
      const override = userOverrides.find((o) => o.featureId === feature.id);
      
      if (override && override.enabled !== null) {
        // User has an override
        permissions[feature.id] = override.enabled;
      } else {
        // Use role default
        const defaultPerm = roleDefaults.find((d) => d.featureId === feature.id);
        permissions[feature.id] = defaultPerm?.enabled ?? false;
      }
    }

    return permissions;
  } catch (error) {
    console.error("Error resolving user permissions:", error);
    throw error;
  }
}

/**
 * Get role default permissions
 */
export async function getRoleDefaults(role: string) {
  if (isSQLiteDev()) {
    return await db
      .select()
      .from(roleFeatureDefaultsSQLite)
      .where(eq(roleFeatureDefaultsSQLite.role, role));
  } else {
    return await db
      .select()
      .from(roleFeatureDefaults)
      .where(eq(roleFeatureDefaults.role, role));
  }
}

/**
 * Get user feature overrides
 */
export async function getUserOverrides(userId: string) {
  if (isSQLiteDev()) {
    return await db
      .select()
      .from(userFeatureOverridesSQLite)
      .where(eq(userFeatureOverridesSQLite.userId, userId));
  } else {
    return await db
      .select()
      .from(userFeatureOverrides)
      .where(eq(userFeatureOverrides.userId, userId));
  }
}

/**
 * Get all role defaults (for all roles)
 */
export async function getAllRoleDefaults() {
  if (isSQLiteDev()) {
    return await db.select().from(roleFeatureDefaultsSQLite);
  } else {
    return await db.select().from(roleFeatureDefaults);
  }
}

/**
 * Update role default for a specific feature
 */
export async function updateRoleDefault(
  role: string,
  featureId: string,
  enabled: boolean
) {
  if (isSQLiteDev()) {
    // Check if exists
    const existing = await db
      .select()
      .from(roleFeatureDefaultsSQLite)
      .where(
        and(
          eq(roleFeatureDefaultsSQLite.role, role),
          eq(roleFeatureDefaultsSQLite.featureId, featureId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update
      await db
        .update(roleFeatureDefaultsSQLite)
        .set({ enabled, updatedAt: new Date() })
        .where(
          and(
            eq(roleFeatureDefaultsSQLite.role, role),
            eq(roleFeatureDefaultsSQLite.featureId, featureId)
          )
        );
    } else {
      // Insert
      const { nanoid } = await import("nanoid");
      await db.insert(roleFeatureDefaultsSQLite).values({
        id: nanoid(),
        role,
        featureId,
        enabled,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  } else {
    // PostgreSQL
    const existing = await db
      .select()
      .from(roleFeatureDefaults)
      .where(
        and(
          eq(roleFeatureDefaults.role, role),
          eq(roleFeatureDefaults.featureId, featureId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(roleFeatureDefaults)
        .set({ enabled, updatedAt: new Date() })
        .where(
          and(
            eq(roleFeatureDefaults.role, role),
            eq(roleFeatureDefaults.featureId, featureId)
          )
        );
    } else {
      await db.insert(roleFeatureDefaults).values({
        role,
        featureId,
        enabled,
      });
    }
  }
}

/**
 * Update user feature override
 */
export async function updateUserOverride(
  userId: string,
  featureId: string,
  enabled: boolean | null // null = reset to role default
) {
  if (isSQLiteDev()) {
    const existing = await db
      .select()
      .from(userFeatureOverridesSQLite)
      .where(
        and(
          eq(userFeatureOverridesSQLite.userId, userId),
          eq(userFeatureOverridesSQLite.featureId, featureId)
        )
      )
      .limit(1);

    if (enabled === null) {
      // Delete override to use role default
      if (existing.length > 0) {
        await db
          .delete(userFeatureOverridesSQLite)
          .where(
            and(
              eq(userFeatureOverridesSQLite.userId, userId),
              eq(userFeatureOverridesSQLite.featureId, featureId)
            )
          );
      }
    } else {
      if (existing.length > 0) {
        await db
          .update(userFeatureOverridesSQLite)
          .set({ enabled, updatedAt: new Date() })
          .where(
            and(
              eq(userFeatureOverridesSQLite.userId, userId),
              eq(userFeatureOverridesSQLite.featureId, featureId)
            )
          );
      } else {
        const { nanoid } = await import("nanoid");
        await db.insert(userFeatureOverridesSQLite).values({
          id: nanoid(),
          userId,
          featureId,
          enabled,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  } else {
    // PostgreSQL
    const existing = await db
      .select()
      .from(userFeatureOverrides)
      .where(
        and(
          eq(userFeatureOverrides.userId, userId),
          eq(userFeatureOverrides.featureId, featureId)
        )
      )
      .limit(1);

    if (enabled === null) {
      if (existing.length > 0) {
        await db
          .delete(userFeatureOverrides)
          .where(
            and(
              eq(userFeatureOverrides.userId, userId),
              eq(userFeatureOverrides.featureId, featureId)
            )
          );
      }
    } else {
      if (existing.length > 0) {
        await db
          .update(userFeatureOverrides)
          .set({ enabled, updatedAt: new Date() })
          .where(
            and(
              eq(userFeatureOverrides.userId, userId),
              eq(userFeatureOverrides.featureId, featureId)
            )
          );
      } else {
        await db.insert(userFeatureOverrides).values({
          userId,
          featureId,
          enabled,
        });
      }
    }
  }
}

/**
 * Reset user to role defaults (delete all overrides)
 */
export async function resetUserToRoleDefaults(userId: string) {
  if (isSQLiteDev()) {
    await db
      .delete(userFeatureOverridesSQLite)
      .where(eq(userFeatureOverridesSQLite.userId, userId));
  } else {
    await db
      .delete(userFeatureOverrides)
      .where(eq(userFeatureOverrides.userId, userId));
  }
}

/**
 * Check if user has a specific feature enabled
 */
export async function hasFeature(
  userId: string,
  userRole: string,
  featureId: string
): Promise<boolean> {
  const permissions = await resolveUserPermissions(userId, userRole);
  return permissions[featureId] ?? false;
}

/**
 * Get all global feature flags
 * Returns flat object: { [featureId: string]: boolean }
 * Defaults to true for features not in database
 */
export async function getGlobalFeatureFlags(): Promise<Record<string, boolean>> {
  try {
    const allFeatures = getAllFeatures();
    const flags: Record<string, boolean> = {};

    if (isSQLiteDev()) {
      const dbFlags = await db.select().from(globalFeatureFlagsSQLite);
      
      // Build map of featureId -> enabled
      const flagMap = new Map(dbFlags.map(f => [f.featureId, f.enabled]));
      
      // Set flags for all features (default to true if not in database)
      allFeatures.forEach(feature => {
        flags[feature.id] = flagMap.get(feature.id) ?? true;
      });
    } else {
      const dbFlags = await db.select().from(globalFeatureFlags);
      
      // Build map of featureId -> enabled
      const flagMap = new Map(dbFlags.map(f => [f.featureId, f.enabled]));
      
      // Set flags for all features (default to true if not in database)
      allFeatures.forEach(feature => {
        flags[feature.id] = flagMap.get(feature.id) ?? true;
      });
    }

    return flags;
  } catch (error) {
    console.error("Error getting global feature flags:", error);
    // Return all enabled on error (fail open)
    const allFeatures = getAllFeatures();
    const flags: Record<string, boolean> = {};
    allFeatures.forEach(feature => {
      flags[feature.id] = true;
    });
    return flags;
  }
}

/**
 * Get global feature flag for a specific feature
 * Returns true if not set (default enabled)
 */
export async function getGlobalFeatureFlag(featureId: string): Promise<boolean> {
  try {
    if (isSQLiteDev()) {
      const flags = await db
        .select()
        .from(globalFeatureFlagsSQLite)
        .where(eq(globalFeatureFlagsSQLite.featureId, featureId))
        .limit(1);
      
      return flags.length > 0 ? flags[0].enabled : true;
    } else {
      const flags = await db
        .select()
        .from(globalFeatureFlags)
        .where(eq(globalFeatureFlags.featureId, featureId))
        .limit(1);
      
      return flags.length > 0 ? flags[0].enabled : true;
    }
  } catch (error) {
    console.error(`Error getting global feature flag for ${featureId}:`, error);
    return true; // Default to enabled on error
  }
}

/**
 * Update global feature flag
 * Upserts flag in database
 */
export async function updateGlobalFeatureFlag(
  featureId: string,
  enabled: boolean,
  updatedBy: string
): Promise<void> {
  try {
    if (isSQLiteDev()) {
      const existing = await db
        .select()
        .from(globalFeatureFlagsSQLite)
        .where(eq(globalFeatureFlagsSQLite.featureId, featureId))
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        await db
          .update(globalFeatureFlagsSQLite)
          .set({ enabled, updatedBy, updatedAt: new Date() })
          .where(eq(globalFeatureFlagsSQLite.featureId, featureId));
      } else {
        // Insert new
        const { nanoid } = await import("nanoid");
        await db.insert(globalFeatureFlagsSQLite).values({
          id: nanoid(),
          featureId,
          enabled,
          updatedBy,
          updatedAt: new Date(),
        });
      }
    } else {
      // PostgreSQL - check if exists first, then update or insert
      const existing = await db
        .select()
        .from(globalFeatureFlags)
        .where(eq(globalFeatureFlags.featureId, featureId))
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        await db
          .update(globalFeatureFlags)
          .set({ enabled, updatedBy, updatedAt: new Date() })
          .where(eq(globalFeatureFlags.featureId, featureId));
      } else {
        // Insert new
        await db.insert(globalFeatureFlags).values({
          featureId,
          enabled,
          updatedBy,
          updatedAt: new Date(),
        });
      }
    }
  } catch (error) {
    console.error(`Error updating global feature flag for ${featureId}:`, error);
    throw error;
  }
}

/**
 * Initialize global feature flags for all features from FEATURE_REGISTRY
 * Only creates entries for features not in database
 * Sets all features to enabled: true by default
 */
export async function initializeGlobalFeatureFlags(): Promise<void> {
  try {
    const allFeatures = getAllFeatures();
    const existingFlags = await (isSQLiteDev() 
      ? db.select().from(globalFeatureFlagsSQLite)
      : db.select().from(globalFeatureFlags));

    const existingFeatureIds = new Set(existingFlags.map(f => f.featureId));
    
    // Find features that don't have global flags yet
    const featuresToInitialize = allFeatures.filter(f => !existingFeatureIds.has(f.id));

    if (featuresToInitialize.length === 0) {
      console.log('[initializeGlobalFeatureFlags] All features already have global flags');
      return;
    }

    console.log(`[initializeGlobalFeatureFlags] Initializing ${featuresToInitialize.length} features`);

    if (isSQLiteDev()) {
      const { nanoid } = await import("nanoid");
      const values = featuresToInitialize.map(feature => ({
        id: nanoid(),
        featureId: feature.id,
        enabled: true,
        description: feature.description || null,
        updatedBy: 'system',
        updatedAt: new Date(),
      }));

      // Insert in batches if needed (SQLite might have limits)
      for (const value of values) {
        await db.insert(globalFeatureFlagsSQLite).values(value).catch(err => {
          // Ignore duplicate errors (race condition)
          if (!err.message?.includes('UNIQUE constraint')) {
            console.error(`Error initializing global flag for ${value.featureId}:`, err);
          }
        });
      }
    } else {
      // PostgreSQL - bulk insert
      const values = featuresToInitialize.map(feature => ({
        featureId: feature.id,
        enabled: true,
        description: feature.description || null,
        updatedBy: 'system',
        updatedAt: new Date(),
      }));

      // Insert each value individually to handle conflicts
      for (const value of values) {
        try {
          await db.insert(globalFeatureFlags).values(value);
        } catch (err: any) {
          // Ignore duplicate errors (might have been created between check and insert)
          if (!err.message?.includes('duplicate key') && !err.message?.includes('UNIQUE constraint')) {
            console.error(`Error initializing global flag for ${value.featureId}:`, err);
          }
        }
      }
    }

    console.log(`[initializeGlobalFeatureFlags] Successfully initialized ${featuresToInitialize.length} global feature flags`);
  } catch (error) {
    console.error('[initializeGlobalFeatureFlags] Error initializing global feature flags:', error);
    // Don't throw - allow server to start even if initialization fails
  }
}



