/**
 * Feature Service
 * 
 * Handles feature permission resolution logic:
 * - Merges role defaults with individual user overrides
 * - Provides helper functions for checking permissions
 */

import { db } from "./db";
import { featureDefinitions, roleFeatureDefaults, userFeatureOverrides, users } from "@shared/schema";
import { featureDefinitions as featureDefinitionsSQLite, roleFeatureDefaults as roleFeatureDefaultsSQLite, userFeatureOverrides as userFeatureOverridesSQLite, users as usersSQLite } from "@shared/schema-sqlite";
import { eq, and } from "drizzle-orm";
import { FEATURE_REGISTRY, getAllFeatures } from "./feature-registry";

const isSQLiteDev = () => process.env.NODE_ENV === "development";

/**
 * Resolve user permissions by merging role defaults with user overrides
 */
export async function resolveUserPermissions(
  userId: string,
  userRole: string
): Promise<Record<string, boolean>> {
  try {
    // Get all features
    const allFeatures = getAllFeatures();
    const permissions: Record<string, boolean> = {};

    // Get role defaults for this user's role
    const roleDefaults = await getRoleDefaults(userRole);

    // Get user overrides
    const userOverrides = await getUserOverrides(userId);

    // Merge: override > default
    for (const feature of allFeatures) {
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

