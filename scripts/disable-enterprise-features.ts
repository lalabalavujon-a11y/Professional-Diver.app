/**
 * Script to ensure Enterprise features and Dive Connection Network are disabled by default
 * 
 * This script:
 * 1. Initializes the features in the database if they don't exist
 * 2. Sets their global flags to disabled (enabled: false)
 * 3. Can be run to reset these features to disabled state
 * 
 * Usage:
 *   tsx scripts/disable-enterprise-features.ts
 */

import { db } from "../server/db";
import { featureDefinitions, globalFeatureFlags } from "@shared/schema";
import { featureDefinitions as featureDefinitionsSQLite, globalFeatureFlags as globalFeatureFlagsSQLite } from "@shared/schema-sqlite";
import { eq } from "drizzle-orm";
import { FEATURE_REGISTRY, getAllFeatures } from "../server/feature-registry";

const isSQLiteDev = () => process.env.NODE_ENV === "development";

async function disableEnterpriseFeatures() {
  try {
    console.log("🔧 Disabling Enterprise features and Dive Connection Network...\n");

    const allFeatures = getAllFeatures();
    const enterpriseFeature = allFeatures.find(f => f.id === "enterprise_features");
    const networkFeature = allFeatures.find(f => f.id === "dive_connection_network");

    if (!enterpriseFeature || !networkFeature) {
      console.error("❌ Error: enterprise_features or dive_connection_network not found in feature registry");
      console.log("   Make sure feature-registry.ts includes these features.");
      process.exit(1);
    }

    const featuresToDisable = [enterpriseFeature, networkFeature];

    // Ensure feature definitions exist
    console.log("📝 Ensuring feature definitions exist...");
    for (const feature of featuresToDisable) {
      if (isSQLiteDev()) {
        const existing = await db
          .select()
          .from(featureDefinitionsSQLite)
          .where(eq(featureDefinitionsSQLite.id, feature.id))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(featureDefinitionsSQLite).values({
            id: feature.id,
            name: feature.name,
            description: feature.description,
            category: feature.category,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          console.log(`   ✓ Created feature definition: ${feature.id}`);
        } else {
          console.log(`   ✓ Feature definition exists: ${feature.id}`);
        }
      } else {
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
            console.log(`   ✓ Created feature definition: ${feature.id}`);
          } else {
            console.log(`   ✓ Feature definition exists: ${feature.id}`);
          }
        } catch (error: any) {
          if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
            console.warn(`   ⚠️ Feature definitions table does not exist. Run migrations first.`);
            return;
          }
          throw error;
        }
      }
    }

    // Set global flags to disabled
    console.log("\n🚫 Setting global feature flags to disabled...");
    for (const feature of featuresToDisable) {
      if (isSQLiteDev()) {
        const existing = await db
          .select()
          .from(globalFeatureFlagsSQLite)
          .where(eq(globalFeatureFlagsSQLite.featureId, feature.id))
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(globalFeatureFlagsSQLite)
            .set({
              enabled: false,
              updatedBy: 'system',
              updatedAt: new Date(),
            })
            .where(eq(globalFeatureFlagsSQLite.featureId, feature.id));
          console.log(`   ✓ Updated ${feature.id}: disabled`);
        } else {
          const { nanoid } = await import("nanoid");
          await db.insert(globalFeatureFlagsSQLite).values({
            id: nanoid(),
            featureId: feature.id,
            enabled: false,
            description: feature.description || null,
            updatedBy: 'system',
            updatedAt: new Date(),
          });
          console.log(`   ✓ Created ${feature.id}: disabled`);
        }
      } else {
        try {
          const existing = await db
            .select()
            .from(globalFeatureFlags)
            .where(eq(globalFeatureFlags.featureId, feature.id))
            .limit(1);

          if (existing.length > 0) {
            await db
              .update(globalFeatureFlags)
              .set({
                enabled: false,
                updatedBy: 'system',
                updatedAt: new Date(),
              })
              .where(eq(globalFeatureFlags.featureId, feature.id));
            console.log(`   ✓ Updated ${feature.id}: disabled`);
          } else {
            await db.insert(globalFeatureFlags).values({
              featureId: feature.id,
              enabled: false,
              description: feature.description || null,
              updatedBy: 'system',
              updatedAt: new Date(),
            });
            console.log(`   ✓ Created ${feature.id}: disabled`);
          }
        } catch (error: any) {
          if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
            console.warn(`   ⚠️ Global feature flags table does not exist. Run migrations first.`);
            return;
          }
          throw error;
        }
      }
    }

    console.log("\n✅ Successfully disabled Enterprise features and Dive Connection Network");
    console.log("\n📌 Note: These features can be enabled via the Admin Dashboard > Feature Management");
    console.log("   SUPER_ADMIN users can always access these features regardless of flags.\n");
  } catch (error) {
    console.error("❌ Error disabling enterprise features:", error);
    process.exit(1);
  }
}

// Run the script
disableEnterpriseFeatures()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
