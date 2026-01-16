/**
 * Feature Initialization
 * 
 * Seeds feature definitions from registry and sets default role permissions.
 * Should be called on server startup or when new features are added.
 */

import { db } from "./db";
import { featureDefinitions, roleFeatureDefaults, globalFeatureFlags } from "@shared/schema";
import { featureDefinitions as featureDefinitionsSQLite, roleFeatureDefaults as roleFeatureDefaultsSQLite, globalFeatureFlags as globalFeatureFlagsSQLite } from "@shared/schema-sqlite";
import { eq, and } from "drizzle-orm";
import { FEATURE_REGISTRY, getAllFeatures } from "./feature-registry";

const isSQLiteDev = () => process.env.NODE_ENV === "development";

/**
 * Ensure feature definitions table exists and seed features from registry
 */
export async function ensureFeatureTables(): Promise<void> {
  if (isSQLiteDev()) {
    // SQLite: Create tables if they don't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS feature_definitions (
        id text PRIMARY KEY NOT NULL,
        name text NOT NULL,
        description text,
        category text NOT NULL,
        is_active integer NOT NULL DEFAULT 1,
        created_at integer NOT NULL,
        updated_at integer NOT NULL
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS role_feature_defaults (
        id text PRIMARY KEY NOT NULL,
        role text NOT NULL,
        feature_id text NOT NULL,
        enabled integer NOT NULL DEFAULT 0,
        created_at integer NOT NULL,
        updated_at integer NOT NULL,
        FOREIGN KEY (feature_id) REFERENCES feature_definitions(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_feature_overrides (
        id text PRIMARY KEY NOT NULL,
        user_id text NOT NULL,
        feature_id text NOT NULL,
        enabled integer,
        created_at integer NOT NULL,
        updated_at integer NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (feature_id) REFERENCES feature_definitions(id) ON DELETE CASCADE,
        UNIQUE(user_id, feature_id)
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS global_feature_flags (
        id text PRIMARY KEY NOT NULL,
        feature_id text NOT NULL UNIQUE,
        enabled integer NOT NULL DEFAULT 1,
        description text,
        updated_at integer NOT NULL,
        updated_by text,
        FOREIGN KEY (feature_id) REFERENCES feature_definitions(id) ON DELETE CASCADE
      );
    `);
  }
  // PostgreSQL tables are created via migrations
}

/**
 * Seed feature definitions from registry
 */
export async function seedFeatureDefinitions(): Promise<void> {
  try {
    const allFeatures = getAllFeatures();
    const now = new Date();

    for (const feature of allFeatures) {
      if (isSQLiteDev()) {
        // Check if exists
        const existing = await db
          .select()
          .from(featureDefinitionsSQLite)
          .where(eq(featureDefinitionsSQLite.id, feature.id))
          .limit(1);

        if (existing.length === 0) {
          // Insert new feature
          await db.insert(featureDefinitionsSQLite).values({
            id: feature.id,
            name: feature.name,
            description: feature.description,
            category: feature.category,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          });
        } else {
          // Update existing (in case description changed)
          await db
            .update(featureDefinitionsSQLite)
            .set({
              name: feature.name,
              description: feature.description,
              category: feature.category,
              updatedAt: now,
            })
            .where(eq(featureDefinitionsSQLite.id, feature.id));
        }
      } else {
        // PostgreSQL - check if table exists first
        try {
          const existing = await db
            .select()
            .from(featureDefinitions)
            .where(eq(featureDefinitions.id, feature.id))
            .limit(1);

          if (existing.length === 0) {
            await db.insert(featureDefinitions).values({
              id: feature.id,
              name: feature.name,
              description: feature.description,
              category: feature.category,
              isActive: true,
            });
          } else {
            await db
              .update(featureDefinitions)
              .set({
                name: feature.name,
                description: feature.description,
                category: feature.category,
                updatedAt: new Date(),
              })
              .where(eq(featureDefinitions.id, feature.id));
          }
        } catch (error: any) {
          // Table doesn't exist - skip seeding (migrations will create it)
          if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
            console.warn('⚠️ Feature definitions table does not exist yet. Skipping seed. Run migrations first.');
            return;
          }
          throw error;
        }
      }
    }
  } catch (error) {
    console.error('Error seeding feature definitions:', error);
    // Don't throw - allow server to continue
  }
}

/**
 * Initialize default role permissions
 * Sets sensible defaults for each role
 */
export async function initializeDefaultRolePermissions(): Promise<void> {
  try {
    const allFeatures = getAllFeatures();
    const now = new Date();

    // Default permissions by role
    const defaultPermissions: Record<string, Record<string, boolean>> = {
      AFFILIATE: {
        // Partner Admins: Most features enabled (except platform features controlled by global flags)
        operations_center: true,
        dive_supervisor: true,
        admin_dashboard: true,
        crm: true,
        analytics: true,
        content_editor: true,
        ghl_integration: true,
        enterprise_features: false, // Controlled by global flag
        dive_connection_network: false, // Controlled by global flag
      },
      ENTERPRISE: {
        // Enterprise Users: Operations + CRM enabled
        operations_center: true,
        dive_supervisor: true,
        admin_dashboard: false,
        crm: true,
        analytics: true,
        content_editor: false,
        ghl_integration: false,
        enterprise_features: false, // Controlled by global flag
        dive_connection_network: false, // Controlled by global flag
      },
      USER: {
        // Regular Users: Basic features only
        operations_center: false,
        dive_supervisor: false,
        admin_dashboard: false,
        crm: false,
        analytics: false,
        content_editor: false,
        ghl_integration: false,
        enterprise_features: false, // Controlled by global flag
        dive_connection_network: false, // Controlled by global flag
      },
      ADMIN: {
        // Admins: All features enabled (except platform features controlled by global flags)
        operations_center: true,
        dive_supervisor: true,
        admin_dashboard: true,
        crm: true,
        analytics: true,
        content_editor: true,
        ghl_integration: true,
        enterprise_features: false, // Controlled by global flag
        dive_connection_network: false, // Controlled by global flag
      },
    };

    const roles = ["AFFILIATE", "ENTERPRISE", "USER", "ADMIN"];

    for (const role of roles) {
      const roleDefaults = defaultPermissions[role] || {};

      for (const feature of allFeatures) {
        const enabled = roleDefaults[feature.id] ?? false;

        if (isSQLiteDev()) {
          const existing = await db
            .select()
            .from(roleFeatureDefaultsSQLite)
            .where(
              and(
                eq(roleFeatureDefaultsSQLite.role, role),
                eq(roleFeatureDefaultsSQLite.featureId, feature.id)
              )
            )
            .limit(1);

          if (existing.length === 0) {
            const { nanoid } = await import("nanoid");
            await db.insert(roleFeatureDefaultsSQLite).values({
              id: nanoid(),
              role,
              featureId: feature.id,
              enabled,
              createdAt: now,
              updatedAt: now,
            });
          }
        } else {
          // PostgreSQL - check if table exists first
          try {
            const existing = await db
              .select()
              .from(roleFeatureDefaults)
              .where(
                and(
                  eq(roleFeatureDefaults.role, role),
                  eq(roleFeatureDefaults.featureId, feature.id)
                )
              )
              .limit(1);

            if (existing.length === 0) {
              await db.insert(roleFeatureDefaults).values({
                role,
                featureId: feature.id,
                enabled,
              });
            }
          } catch (error: any) {
            // Table doesn't exist - skip (migrations will create it)
            if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
              console.warn('⚠️ Role feature defaults table does not exist yet. Skipping initialization.');
              return;
            }
            throw error;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error initializing default role permissions:', error);
    // Don't throw - allow server to continue
  }
}

/**
 * Initialize global feature flags
 * Creates default entries for all features with enabled: true
 */
export async function initializeGlobalFeatureFlags(): Promise<void> {
  try {
    const { initializeGlobalFeatureFlags: initGlobalFlags } = await import("./feature-service");
    await initGlobalFlags();
    console.log("✓ Global feature flags initialized");
  } catch (error: any) {
    console.error("⚠️ Warning: Global feature flags initialization failed:", error?.message || error);
    // Don't throw - allow server to continue
  }
}

/**
 * Initialize all feature management tables and data
 */
export async function initializeFeatureManagement(): Promise<void> {
  try {
    console.log("Initializing feature management system...");
    
    await ensureFeatureTables();
    console.log("✓ Feature tables ensured");
    
    await seedFeatureDefinitions();
    console.log("✓ Feature definitions seeded");
    
    await initializeDefaultRolePermissions();
    console.log("✓ Default role permissions initialized");
    
    await initializeGlobalFeatureFlags();
    console.log("✓ Global feature flags initialized");
    
    console.log("✅ Feature management system initialized successfully");
  } catch (error: any) {
    // Don't throw - log and continue. Server should start even if feature management fails
    console.error("⚠️ Warning: Feature management initialization failed:", error?.message || error);
    console.error("⚠️ Server will continue without feature management. Run migrations to fix.");
    // Don't throw - allow server to start
  }
}

