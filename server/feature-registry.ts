/**
 * Feature Registry
 * 
 * Central registry of all platform features organized by category.
 * Features are defined in code for type safety and version control.
 * 
 * To add a new feature:
 * 1. Add it to the appropriate category below
 * 2. Run the feature seeding function to add it to the database
 * 3. The feature will automatically appear in the admin UI
 */

export interface FeatureDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
}

export const FEATURE_REGISTRY: Record<string, FeatureDefinition[]> = {
  operations: [
    {
      id: "operations_center",
      name: "Operations Center",
      description: "Access to the Operations Center dashboard for managing dive operations",
      category: "Operations",
    },
    {
      id: "dive_supervisor",
      name: "Dive Supervisor Tools",
      description: "Access to dive supervisor control app and tools",
      category: "Operations",
    },
  ],
  admin: [
    {
      id: "admin_dashboard",
      name: "Admin Dashboard",
      description: "Access to the main admin dashboard",
      category: "Admin",
    },
    {
      id: "crm",
      name: "CRM",
      description: "Access to Customer Relationship Management features",
      category: "Admin",
    },
    {
      id: "analytics",
      name: "Analytics",
      description: "Access to analytics and reporting features",
      category: "Admin",
    },
    {
      id: "content_editor",
      name: "Content Editor",
      description: "Access to content editing and management tools (Markdown Editor)",
      category: "Admin",
    },
    {
      id: "srs_admin",
      name: "SRS Admin",
      description: "Access to Spaced Repetition System administration",
      category: "Admin",
    },
  ],
  integrations: [
    {
      id: "ghl_integration",
      name: "GoHighLevel Integration",
      description: "Access to GoHighLevel CRM integration features",
      category: "Integrations",
    },
  ],
  platform: [
    {
      id: "enterprise_features",
      name: "Enterprise Features",
      description: "Access to Enterprise operations platform features",
      category: "Platform",
    },
    {
      id: "dive_connection_network",
      name: "Dive Connection Network",
      description: "Access to Dive Connection Network - connecting divers, companies, and service providers",
      category: "Platform",
    },
  ],
};

/**
 * Get all features as a flat array
 */
export function getAllFeatures(): FeatureDefinition[] {
  return Object.values(FEATURE_REGISTRY).flat();
}

/**
 * Get features by category
 */
export function getFeaturesByCategory(category: string): FeatureDefinition[] {
  return FEATURE_REGISTRY[category] || [];
}

/**
 * Get all categories
 */
export function getAllCategories(): string[] {
  return Object.keys(FEATURE_REGISTRY);
}

/**
 * Get feature by ID
 */
export function getFeatureById(id: string): FeatureDefinition | undefined {
  return getAllFeatures().find((feature) => feature.id === id);
}

